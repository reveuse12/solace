const {test}=require('node:test');
const assert=require('node:assert/strict');
const createLoader=require('./load-ts.cjs');
function harness(){
 const scheduled=new Map();let fail=false;
 const sdk={
  setNotificationHandler(){},AndroidImportance:{DEFAULT:3},SchedulableTriggerInputTypes:{WEEKLY:'weekly'},
  getAllScheduledNotificationsAsync:async()=>[...scheduled.values()],cancelScheduledNotificationAsync:async id=>scheduled.delete(id),
  getPermissionsAsync:async()=>({granted:true}),setNotificationChannelAsync:async()=>{},requestPermissionsAsync:async()=>({granted:true}),
  scheduleNotificationAsync:async request=>{if(fail)throw Error('schedule failed');scheduled.set(request.identifier,request);},
 };
 const scheduler=createLoader({'expo-notifications':sdk,'react-native':{Platform:{OS:'android'}}})('src/lib/notifications.ts');
 return {scheduled,module:scheduler,setFail:value=>{fail=value;}};
}
const reminder={id:'uuid-with-gaps-7',label:'Practice',time_local:'08:00',days:[0,1,2],enabled:true};
test('refreshing twice replaces a reminder schedule without duplicate or index-based IDs',async()=>{
 const h=harness();await h.module.reconcileReminders('user_a',[reminder]);await h.module.reconcileReminders('user_a',[reminder]);
 assert.equal(h.scheduled.size,3);assert.ok(h.scheduled.has('solace:user_a:uuid-with-gaps-7:0'));
});
test('disabled/deleted reminders cancel the stored schedule and unrelated requests remain untouched',async()=>{
 const h=harness();h.scheduled.set('other',{identifier:'other'});
 await h.module.reconcileReminders('user_a',[reminder]);await h.module.reconcileReminders('user_a',[{...reminder,enabled:false}]);
 assert.deepEqual([...h.scheduled.keys()],['other']);await h.module.reconcileReminders('user_a',[reminder]);await h.module.reconcileReminders('user_a',[]);assert.equal(h.scheduled.size,1);
});
test('a newer account schedule wins concurrent reconciliation and sign-out clears the app schedule',async()=>{
 const h=harness();const a=h.module.reconcileReminders('user_a',[reminder]);const b=h.module.reconcileReminders('user_b',[reminder]);await Promise.all([a,b]);
 assert.ok([...h.scheduled.keys()].every(id=>id.startsWith('solace:user_b:')));
 await h.module.clearLocalReminders();assert.equal(h.scheduled.size,0);
});
test('scheduling failure rolls back app schedules rather than leaving a partial success',async()=>{
 const h=harness();await h.module.reconcileReminders('user_a',[reminder]);h.setFail(true);
 await assert.rejects(h.module.reconcileReminders('user_a',[reminder]),/schedule failed/);assert.equal(h.scheduled.size,0);
});
test('cold start preserves the same account alarms without needing a server response',async()=>{
 const h=harness();await h.module.reconcileReminders('user_a',[reminder]);
 const before=[...h.scheduled.keys()];await h.module.prepareReminderAccount('user_a');
 assert.deepEqual([...h.scheduled.keys()],before);
});
test('account preparation removes a previous account alarms but preserves current and unrelated alarms',async()=>{
 const h=harness();await h.module.reconcileReminders('user_a',[reminder]);h.scheduled.set('solace:user_b:existing:0',{identifier:'solace:user_b:existing:0'});h.scheduled.set('other',{identifier:'other'});
 await h.module.prepareReminderAccount('user_b');assert.deepEqual([...h.scheduled.keys()].sort(),['other','solace:user_b:existing:0']);
});
