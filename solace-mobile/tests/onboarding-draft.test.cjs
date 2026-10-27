const {test}=require('node:test');const assert=require('node:assert/strict');
const {createDraftStore}=require('./load-ts.cjs')()('src/lib/onboarding-draft.ts');
const draft={version:2,step:2,value:{displayName:'',location:'',focus:'',practiceTime:'',privacyConsent:true},entry:'🌱'.repeat(500),savedEntry:'',reminderTime:'20:00'};
test('draft writes are bounded, account isolated and clear removes both slots',async()=>{
 const data=new Map();const storage={getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>{assert.ok(Buffer.byteLength(v)<2048);assert.match(k,/^[\w.-]+$/);data.set(k,v);},deleteItemAsync:async k=>data.delete(k)};
 const a=createDraftStore(storage,'user:a');const b=createDraftStore(storage,'user:b');await a.save(draft);
 assert.equal((await a.load()).entry,draft.entry);assert.equal(await b.load(),null);await a.clear();assert.equal(data.size,0);
});
test('interrupted writes preserve the last committed draft and malformed drafts are errors',async()=>{
 const data=new Map();let fail=false;const storage={getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>{if(fail&&k.endsWith('.1'))throw Error('full');data.set(k,v);},deleteItemAsync:async k=>data.delete(k)};
 const store=createDraftStore(storage,'user');await store.save(draft);fail=true;await assert.rejects(store.save({...draft,entry:'a'.repeat(1000)}));assert.equal((await store.load()).entry,draft.entry);
 const pointer=[...data.keys()].find(k=>k.endsWith('.pointer'));data.set(pointer,'corrupt');await assert.rejects(store.load());assert.equal(data.get(pointer),'corrupt');
});
