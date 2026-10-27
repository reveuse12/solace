const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs')();
const { createApiClient } = load('src/lib/api-client.ts');
const { profileIsComplete, validateProfile } = load('src/lib/models.ts');
const { reminderPlan } = load('src/lib/reminder-plan.ts');
const { validateBackup } = load('src/lib/backup.ts');
const fullProfile = { display_name: 'A', location: 'Mumbai', focus: 'Confidence', practice_time: 'Evening', privacy_consent_at: '2026-10-25' };
const input = { displayName: ' A ', location: ' Mumbai ', focus: 'Confidence', practiceTime: 'Evening', privacyConsent: true };

test('consent completes onboarding even when all optional personalization is missing', () => {
  assert.equal(profileIsComplete(fullProfile), true);
  for (const key of ['display_name', 'location', 'focus', 'practice_time']) assert.equal(profileIsComplete({ ...fullProfile, [key]: null }), true);
  assert.equal(profileIsComplete({ ...fullProfile, privacy_consent_at: null }), false);
  assert.equal(profileIsComplete(null), false);
});
test('the name-only 1.0.1 profile still requires privacy consent', () => assert.equal(profileIsComplete({ name: 'A', onboardingComplete: true }), false));
test('optional profile answers can be blank, while consent and nonempty choices are validated', () => {
  const empty = { displayName: '', location: '', focus: '', practiceTime: '', privacyConsent: true };
  assert.equal(validateProfile(empty).displayName, '');
  assert.equal(validateProfile(input).location, 'Mumbai');
  assert.throws(() => validateProfile({ ...input, privacyConsent: false }));
  assert.throws(() => validateProfile({ ...input, focus: 'invalid' }));
});
test('authenticated requests get a fresh Clerk bearer token and use the shared profile endpoint', async () => {
  const calls=[];let number=0;
  const api=createApiClient('https://solace.example',async()=>`token-${++number}`,async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({profile:fullProfile})};});
  await api('/api/profile'); await api('/api/profile',{method:'POST',body:input});
  assert.equal(calls[0].url,'https://solace.example/api/profile');
  assert.equal(calls[1].options.headers.Authorization,'Bearer token-2');
  assert.equal(JSON.parse(calls[1].options.body).privacyConsent,true);
  assert.equal(calls[0].options.redirect,'error');
});
test('missing sessions cannot call an API or pretend a profile was saved', async()=>{
  let called=false;const api=createApiClient('https://solace.example',async()=>null,async()=>{called=true;});
  await assert.rejects(api('/api/profile'),e=>e.status===401);assert.equal(called,false);
});
test('profile server errors and malformed bodies are errors, not a null/new profile',async()=>{
  for(const response of [{ok:false,status:502,json:async()=>({error:'Profile lookup failed'})},{ok:true,status:200,json:async()=>null},{ok:false,status:500,json:async()=>{throw Error('html');}}]){
    const api=createApiClient('https://solace.example',async()=>'token',async()=>response);
    await assert.rejects(api('/api/profile'));
  }
});
test('network failures preserve retryable errors', async()=>{
  const api=createApiClient('https://solace.example',async()=>'token',async()=>{throw Error('offline');});
  await assert.rejects(api('/api/profile'),/Check your connection/);
});
test('a caller cancellation cancels the transport',async()=>{
  const controller=new AbortController();controller.abort();
  const api=createApiClient('https://solace.example',async()=>'token',async(_url,options)=>{assert.equal(options.signal.aborted,true);throw Error('abort');});
  await assert.rejects(api('/api/profile',{signal:controller.signal}),/interrupted/);
});
test('API URLs cannot send credentials to another host or arbitrary URL', async()=>{
  assert.throws(()=>createApiClient('http://example.com',async()=>'token'));
  assert.throws(()=>createApiClient('https://user:password@example.com',async()=>'token'));
  const api=createApiClient('https://solace.example',async()=>'token');
  for(const path of ['https://other.example/api/profile','//other.example/api/profile','/api/../profile','/api/profile?token=x']) await assert.rejects(api(path));
});
test('reminder identifiers use stored IDs and isolate accounts, never list indices',()=>{
  const reminders=[{id:'4',enabled:true,time_local:'08:30:00',days:[0,1,1],label:'A'},{id:'7',enabled:false,time_local:'09:00',days:[2],label:'B'}];
  const plan=reminderPlan('user_a',reminders);
  assert.equal(plan.length,2);assert.equal(plan[0].identifier,'solace:user_a:4:0');assert.equal(plan[0].weekday,1);assert.equal(plan[1].weekday,2);
  assert.notEqual(plan[0].identifier,reminderPlan('user_b',reminders)[0].identifier);
  assert.equal(reminderPlan('user_a',[{...reminders[0],enabled:false}]).length,0);
});
test('malformed reminder times/days never produce schedules',()=>{
  assert.equal(reminderPlan('a',[{id:'x',enabled:true,time_local:'30:90',days:[0],label:'X'}]).length,0);
  assert.equal(reminderPlan('a',[{id:'x',enabled:true,time_local:'09:00',days:[-1,9],label:'X'}]).length,0);
});
test('restore validates JSON structure before an API call and strips account ownership',()=>{
  for(const payload of [null,{}, {data:[]},{data:{profiles:'invalid'}},{data:{profiles:[null]}},{data:{profiles:[]}}]) assert.throws(()=>validateBackup(payload));
  const payload=validateBackup({data:{profiles:[{id:'x',clerk_user_id:'someone_else'}],secret_table:[{secret:true}]}});
  assert.equal(payload.data.profiles[0].clerk_user_id,undefined);assert.equal(payload.data.secret_table,undefined);
});
test('a stalled token request times out before transport and cannot send a late token',async()=>{
 let resolveToken;let called=0;const token=new Promise(resolve=>{resolveToken=resolve;});
 const api=createApiClient('https://solace.example',()=>token,async()=>{called++;return {ok:true,json:async()=>({ok:true})};},15);
 await assert.rejects(api('/api/profile'),/timed out/);resolveToken('late');await new Promise(resolve=>setTimeout(resolve,5));assert.equal(called,0);
});
test('a transport that ignores abort cannot keep a request waiting forever',async()=>{
 const api=createApiClient('https://solace.example',async()=>'token',()=>new Promise(()=>{}),15);
 await assert.rejects(api('/api/profile'),/timed out/);
});
