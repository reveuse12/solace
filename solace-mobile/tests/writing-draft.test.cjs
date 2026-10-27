const {test}=require('node:test');const assert=require('node:assert/strict');
const load=require('./load-ts.cjs')();const {createWritingDraftStore}=load('src/lib/writing-draft.ts');
const value={version:1,clientId:'d5aa8d6f-6891-4c16-965d-10c23f5dce65',body:'🌱'.repeat(2500),title:'',prompt:'',editing:null};
function fixture(){const data=new Map();let fail=false;return {data,fail:()=>{fail=true;},storage:{getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>{if(fail&&k.endsWith('.1'))throw Error('full');assert.ok(Buffer.byteLength(v)<2048);data.set(k,v);},deleteItemAsync:async k=>data.delete(k)}};}
test('a long ordinary writing draft and its retry identifier survive a fresh store/account isolation',async()=>{
 const f=fixture();await createWritingDraftStore(f.storage,'user_a','reflections').save(value);
 const read=await createWritingDraftStore(f.storage,'user_a','reflections').load();assert.equal(read.body,value.body);assert.equal(read.clientId,value.clientId);
 assert.equal(await createWritingDraftStore(f.storage,'user_b','reflections').load(),null);assert.equal(await createWritingDraftStore(f.storage,'user_a','desires').load(),null);
});
test('an interrupted writing update leaves the previous complete draft intact',async()=>{
 const f=fixture();const store=createWritingDraftStore(f.storage,'user_a','reflections');await store.save(value);f.fail();await assert.rejects(store.save({...value,body:'a'.repeat(5000)}));assert.equal((await store.load()).body,value.body);
});
test('an old successful save cannot clear a newer draft written after navigating back',async()=>{
 const f=fixture();const a=createWritingDraftStore(f.storage,'a','desires');const b=createWritingDraftStore(f.storage,'a','desires');await a.save(value);const newer={...value,clientId:'f306c463-78e6-4378-99c2-b73883750896',body:'New words'};await b.save(newer);
 assert.equal(await a.clearIf(row=>row.clientId===value.clientId),false);assert.equal((await b.load()).body,'New words');assert.equal(await b.clearIf(row=>row.clientId===newer.clientId),true);assert.equal(await b.load(),null);
});
