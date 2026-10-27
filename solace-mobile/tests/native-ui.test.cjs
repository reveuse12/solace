const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { create, act } = require('react-test-renderer');
const rawLoader = require('./load-ts.cjs');
const createLoader = (overrides, env) => rawLoader({ expo: { reloadAppAsync: async () => {} }, ...overrides }, env);
global.IS_REACT_ACT_ENVIRONMENT = true;
const native = {
  ...Object.fromEntries(['View','Text','TextInput','Pressable','ScrollView','Switch','KeyboardAvoidingView','ActivityIndicator','Image'].map(name=>[name,name])),
  StyleSheet:{create:value=>value},Platform:{OS:'android'},AppState:{addEventListener:()=>({remove(){}})},
  Alert:{alert(){}},Share:{share:async()=>({})},Linking:{openSettings:async()=>{}},
};
const safeArea = {SafeAreaView:'SafeAreaView',SafeAreaProvider:'SafeAreaProvider'};
const fullProfile={display_name:'Prayag',location:'Mumbai',focus:'Confidence',practice_time:'Evening',avatar_url:null,privacy_consent_at:'2026-10-25'};
const absolute=file=>path.resolve(file);
function text(node){if(node==null)return '';if(typeof node==='string'||typeof node==='number')return String(node);return (node.children||[]).map(text).join('');}
function press(root,label){const found=root.findAllByType('Pressable').find(node=>text(node)===label);assert.ok(found,`Button ${label} exists`);return found;}
async function click(renderer,label){await act(async()=>{await press(renderer.root,label).props.onPress();});}
function onboardingHarness({failProfile=false, failEntry=false, loseEntryResponse=false}={}) {
  const routes=[];const storage=new Map();const entries=[];const requests=[];let profileCalls=0;let permissionCalls=0;
  const server={failProfile,failEntry,loseEntryResponse};
  const overrides={
    'react-native':native,'react-native-safe-area-context':safeArea,'expo-status-bar':{StatusBar:'StatusBar'},
    'expo-router':{router:{replace:route=>routes.push(route)}},'expo-web-browser':{openBrowserAsync:async()=>{}},
    'expo-secure-store':{getItemAsync:async key=>storage.get(key)??null,setItemAsync:async(key,value)=>storage.set(key,value),deleteItemAsync:async key=>storage.delete(key)},
    [absolute('src/components/read-aloud.tsx')]:{ReadAloud:()=>null},
    [absolute('src/lib/setup-metrics.ts')]:{recordSetupEvent:async()=>{}},
    [absolute('src/lib/workspace.tsx')]:{useWorkspace:()=>({profile:null,userId:'user_a',refresh:async()=>{},enableReminders:async()=>{permissionCalls++;},saveProfile:async value=>{profileCalls++;if(server.failProfile)throw Error('Profile sync failed');},api:async(route,options)=>{
      requests.push({route,options});if(route==='/api/desires'&&!options)return {desires:entries};
      if(route==='/api/desires'){if(server.failEntry)throw Error('Entry sync failed');entries.push({id:'entry_1',body:options.body.body});if(server.loseEntryResponse){server.loseEntryResponse=false;throw Error('Connection interrupted');}return {desire:entries.at(-1)};}
      if(route==='/api/reminders'&&!options)return {reminders:[]};return {};
    }})},
  };
  const loader=createLoader(overrides,{EXPO_PUBLIC_API_URL:'https://solace.example'});
  return {Component:loader('src/app/(workspace)/onboarding.tsx').default,routes,server,storage,entries,requests,get profileCalls(){return profileCalls;},get permissionCalls(){return permissionCalls;}};
}
async function toFirstEntry(renderer){
  assert.equal(press(renderer.root,'Continue').props.disabled,true);
  await act(async()=>renderer.root.findByType('Switch').props.onValueChange(true));
  await click(renderer,'Continue');await click(renderer,'Skip for now');
  await act(async()=>renderer.root.findByType('TextInput').props.onChangeText('More room to breathe'));
}
test('short onboarding requires consent, allows optional answers, saves a real entry and makes reminders optional',async()=>{
 const h=onboardingHarness();let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});
 assert.match(text(renderer.toJSON()),/Step 1 of 3/);await toFirstEntry(renderer);
 await click(renderer,'Save my first manifestation');assert.equal(h.entries.length,1);assert.match(text(renderer.toJSON()),/Your first words are saved/);
 assert.equal(h.permissionCalls,0);await click(renderer,'Not now · Open my space');assert.equal(h.permissionCalls,0);
 assert.deepEqual(h.routes,['/(workspace)/(tabs)']);assert.equal(h.storage.size,0);await act(async()=>renderer.unmount());
});
test('failed profile sync keeps the entry and permits retry without creating an entry first',async()=>{
 const h=onboardingHarness({failProfile:true});let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});await toFirstEntry(renderer);await click(renderer,'Save my first manifestation');
 assert.match(text(renderer.toJSON()),/Profile sync failed/);assert.equal(renderer.root.findByType('TextInput').props.value,'More room to breathe');assert.equal(h.entries.length,0);assert.deepEqual(h.routes,[]);
 h.server.failProfile=false;await click(renderer,'Save my first manifestation');assert.equal(h.entries.length,1);assert.equal(h.profileCalls,2);await act(async()=>renderer.unmount());
});
test('a lost entry response is recovered on retry without duplicating the first manifestation',async()=>{
 const h=onboardingHarness({loseEntryResponse:true});let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});await toFirstEntry(renderer);await click(renderer,'Save my first manifestation');
 assert.match(text(renderer.toJSON()),/Connection interrupted/);assert.equal(h.entries.length,1);
 await click(renderer,'Save my first manifestation');assert.equal(h.entries.length,1);assert.match(text(renderer.toJSON()),/Your first words are saved/);await act(async()=>renderer.unmount());
});
test('closing and reopening resumes the persisted first-entry step and text',async()=>{
 const h=onboardingHarness();let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});await toFirstEntry(renderer);await act(async()=>renderer.unmount());
 await act(async()=>{renderer=create(React.createElement(h.Component));});assert.match(text(renderer.toJSON()),/Step 3 of 3/);assert.equal(renderer.root.findByType('TextInput').props.value,'More room to breathe');await act(async()=>renderer.unmount());
});
function workspaceHarness(profileResponse){
  let latest;let requests=[];const storage=new Map();
  const server={profile:profileResponse,failProfile:false};
  const originalFetch=global.fetch;
  global.fetch=async(url,options)=>{
    const pathname=new URL(url).pathname;requests.push({pathname,options});
    if(pathname==='/api/profile'&&server.failProfile)return {ok:false,status:502,json:async()=>({error:'Profile lookup failed'})};
    if(pathname==='/api/profile'&&options.method==='POST'){
      const p=JSON.parse(options.body);server.profile={display_name:p.displayName,location:p.location,focus:p.focus,practice_time:p.practiceTime,privacy_consent_at:p.privacyConsent?'2026-10-25':null};
    }
    const payload=pathname==='/api/profile'?{profile:server.profile}:{[pathname.split('/').at(-1)]:[]};
    return {ok:true,status:200,json:async()=>payload};
  };
  const getToken=async()=>'native-session-token';
  const loader=createLoader({
    'react-native':native,'@clerk/clerk-expo':{useAuth:()=>({getToken,signOut:async()=>{}})},
    '@react-native-async-storage/async-storage':{getItem:async key=>storage.get(key)||null,setItem:async(key,value)=>storage.set(key,value)},
    'expo-notifications':{addNotificationReceivedListener:()=>({remove(){}}),dismissAllNotificationsAsync:async()=>{}},
    [absolute('src/lib/notifications.ts')]:{reconcileReminders:async()=>true,enableNotifications:async()=>true,clearLocalReminders:async()=>{},prepareReminderAccount:async()=>{}},
  },{EXPO_PUBLIC_API_URL:'https://solace.example'});
  const workspace=loader('src/lib/workspace.tsx');
  function Probe(){latest=workspace.useWorkspace();return React.createElement('Text',null,latest.profile?.display_name||'no profile');}
  return {server,requests,get latest(){return latest;},Component:()=>React.createElement(workspace.WorkspaceProvider,{userId:'user_a'},React.createElement(Probe)),restore:()=>{global.fetch=originalFetch;}};
}
async function mountWorkspace(harness){let renderer;await act(async()=>{renderer=create(React.createElement(harness.Component));await new Promise(resolve=>setTimeout(resolve,20));});return renderer;}
test('an existing PWA profile hydrates from the shared authenticated API on a new native mount',async()=>{
  const h=workspaceHarness(fullProfile);let renderer;try{
    renderer=await mountWorkspace(h);assert.equal(h.latest.profileFetched,true);assert.equal(h.latest.profile.display_name,'Prayag');assert.equal(h.requests.length,7);
    assert.equal(h.requests[0].options.headers.Authorization,'Bearer native-session-token');assert.equal(h.requests[0].pathname,'/api/profile');
  }finally{if(renderer)await act(async()=>renderer.unmount());h.restore();}
});
test('initial profile lookup failure never becomes completed or fresh onboarding',async()=>{
  const h=workspaceHarness(null);h.server.failProfile=true;let renderer;try{
    renderer=await mountWorkspace(h);assert.equal(h.latest.profileFetched,false);assert.equal(h.latest.profile,null);assert.match(h.latest.error,/Profile lookup failed/);assert.equal(h.requests.length,1);
    h.server.failProfile=false;await act(async()=>h.latest.refresh());assert.equal(h.latest.profileFetched,true);assert.equal(h.latest.profile,null);
  }finally{if(renderer)await act(async()=>renderer.unmount());h.restore();}
});
test('new onboarding POST uses the PWA profile API and returned server profile, then loads account data',async()=>{
  const h=workspaceHarness(null);let renderer;try{
    renderer=await mountWorkspace(h);assert.equal(h.requests.length,1);
    await act(async()=>h.latest.saveProfile({displayName:'Prayag',location:'Mumbai',focus:'Confidence',practiceTime:'Evening',privacyConsent:true}));
    assert.equal(h.latest.profile.location,'Mumbai');assert.equal(h.latest.profileFetched,true);
    assert.ok(h.requests.some(r=>r.pathname==='/api/profile'&&r.options.method==='POST'));
    assert.ok(h.requests.some(r=>r.pathname==='/api/reflections'));
  }finally{if(renderer)await act(async()=>renderer.unmount());h.restore();}
});
test('completed PWA profile routes into the app, but a lookup error cannot route to onboarding',async()=>{
 let current={profile:fullProfile,loading:false,profileFetched:true,error:'',refresh:async()=>{},signOut:async()=>{}};
 const loader=createLoader({
  'react-native':native,'react-native-safe-area-context':safeArea,'expo-status-bar':{StatusBar:'StatusBar'},
  '@clerk/clerk-expo':{useAuth:()=>({isLoaded:true,isSignedIn:true,userId:'user_a'})},
  'expo-router':{Redirect:'Redirect',Stack:'Stack',useSegments:()=>['(workspace)','(tabs)']},
  [absolute('src/components/read-aloud.tsx')]:{ReadAloudProvider:({children})=>children},
  [absolute('src/lib/workspace.tsx')]:{WorkspaceProvider:({children})=>children,useWorkspace:()=>current},
 });
 const Component=loader('src/app/(workspace)/_layout.tsx').default;let renderer;
 await act(async()=>{renderer=create(React.createElement(Component));});assert.equal(renderer.root.findAllByType('Stack').length,1);
 current={...current,profile:null,profileFetched:false,error:'Server unavailable'};
 await act(async()=>renderer.update(React.createElement(Component)));assert.match(text(renderer.toJSON()),/Server unavailable/);assert.equal(renderer.root.findAllByType('Redirect').length,0);
 current={...current,profileFetched:true,error:''};await act(async()=>renderer.update(React.createElement(Component)));
 assert.equal(renderer.root.findByType('Redirect').props.href,'/(workspace)/onboarding');await act(async()=>renderer.unmount());
});
test('email sign-in activates the returned session, and a failed sign-in keeps a retryable form',async()=>{
 let activeSession=null;let fail=false;let credentials;
 const auth={useAuth:()=>({isLoaded:true,isSignedIn:false}),useSSO:()=>({startSSOFlow:async()=>({})}),useSignIn:()=>({isLoaded:true,signIn:{create:async value=>{credentials=value;if(fail)throw Error('Try again');return {status:'complete',createdSessionId:'session_a'};}},setActive:async value=>{activeSession=value.session;}}),useSignUp:()=>({isLoaded:true,signUp:{}})};
 const loader=createLoader({
  'react-native':native,'react-native-safe-area-context':safeArea,'expo-status-bar':{StatusBar:'StatusBar'},'@clerk/clerk-expo':auth,'expo-auth-session':{},'expo-router':{Redirect:'Redirect'},
  [absolute('src/lib/workspace.tsx')]:{useWorkspace:()=>({})},
 });
 const Component=loader('src/app/sign-in.tsx').default;let renderer;
 await act(async()=>{renderer=create(React.createElement(Component));});
 await act(async()=>{renderer.root.findAllByType('TextInput')[0].props.onChangeText(' test@example.com ');renderer.root.findAllByType('TextInput')[1].props.onChangeText('password');});
 await click(renderer,'Sign in');assert.equal(credentials.identifier,'test@example.com');assert.equal(activeSession,'session_a');
 fail=true;await click(renderer,'Sign in');assert.match(text(renderer.toJSON()),/Try again/);assert.equal(press(renderer.root,'Sign in').props.disabled,false);
 await act(async()=>renderer.unmount());
});
test('writing later completes setup without asking for notification permission or creating an entry',async()=>{
 const h=onboardingHarness();let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});
 await act(async()=>renderer.root.findByType('Switch').props.onValueChange(true));await click(renderer,'Continue');await click(renderer,'Skip for now');await click(renderer,'I’ll write later');
 assert.equal(h.entries.length,0);assert.equal(h.permissionCalls,0);assert.deepEqual(h.routes,['/(workspace)/(tabs)']);await act(async()=>renderer.unmount());
});
test('notification permission is requested only after a user chooses a reminder and a valid time',async()=>{
 const h=onboardingHarness();let renderer;
 await act(async()=>{renderer=create(React.createElement(h.Component));});await toFirstEntry(renderer);await click(renderer,'Save my first manifestation');await click(renderer,'Set a reminder');
 assert.equal(h.permissionCalls,0);
 await act(async()=>renderer.root.findByType('TextInput').props.onChangeText('25:00'));await click(renderer,'Save reminder & enable notifications');assert.match(text(renderer.toJSON()),/Use a time/);assert.equal(h.permissionCalls,0);
 await act(async()=>renderer.root.findByType('TextInput').props.onChangeText('08:30'));await click(renderer,'Save reminder & enable notifications');assert.equal(h.permissionCalls,1);assert.equal(h.requests.find(r=>r.route==='/api/reminders'&&r.options).options.body.timeLocal,'08:30');assert.equal(h.routes.length,1);await act(async()=>renderer.unmount());
});

test('a successful save notice uses a supported Android live announcement without a status accessibilityRole',async()=>{
 const loader=createLoader({'react-native':{...native,RefreshControl:'RefreshControl'},'react-native-safe-area-context':safeArea,'expo-status-bar':{StatusBar:'StatusBar'},[absolute('src/lib/workspace.tsx')]:{useWorkspace:()=>({theme:'warm',error:'',notice:'Saved to your account',refresh:async()=>{},clearError(){}})}});
 const {Screen}=loader('src/components/ui.tsx');let renderer;
 await act(async()=>{renderer=create(React.createElement(Screen,{title:'Today',label:'Your space'}));});
 const notice=renderer.root.findAllByType('Text').find(node=>text(node)==='Saved to your account');assert.ok(notice);assert.equal(notice.props.accessibilityLiveRegion,'polite');assert.equal(notice.props.accessibilityRole,undefined);await act(async()=>renderer.unmount());
});
