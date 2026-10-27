const {test}=require('node:test');const assert=require('node:assert/strict');
const createLoader=require('./load-ts.cjs');
test('setup diagnostics record timing, failures and next-day return without entry content or shared account state',async()=>{
 const records=new Map();const load=createLoader({'@react-native-async-storage/async-storage':{getItem:async k=>records.get(k)||null,setItem:async(k,v)=>records.set(k,v)}});
 const {recordSetupEvent,readSetupMetrics}=load('src/lib/setup-metrics.ts');
 await recordSetupEvent('a','started');await Promise.all([recordSetupEvent('a','sync_failed'),recordSetupEvent('a','sync_failed')]);await recordSetupEvent('a','first_entry_saved');await recordSetupEvent('a','completed');
 const a=await readSetupMetrics('a');assert.equal(a.syncFailures,2);assert.ok(a.firstEntryAt>=a.startedAt);assert.ok(a.completedAt>=a.firstEntryAt);assert.equal((await readSetupMetrics('b')).startedAt,undefined);
 records.set('solace:a:setup-metrics-v1',JSON.stringify({...a,completedAt:Date.now()-86400000}));await recordSetupEvent('a','opened');assert.equal((await readSetupMetrics('a')).nextDayReturn,true);
 assert.deepEqual(Object.keys(a).sort(),['version','syncFailures','nextDayReturn','startedAt','firstEntryAt','completedAt','lastStep'].sort());
});
