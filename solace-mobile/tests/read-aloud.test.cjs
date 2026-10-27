const {test}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {create,act}=require('react-test-renderer');
const path=require('node:path');
const loader=require('./load-ts.cjs');
global.IS_REACT_ACT_ENVIRONMENT=true;
test('read aloud replaces playback, ignores stale completion, chunks long entries and stops in background',async()=>{
 let background;const spoken=[];let stops=0;
 const load=loader({
  'react-native':{View:'View',AppState:{addEventListener:(_event,callback)=>{background=callback;return {remove(){}};}}},
  'expo-router':{usePathname:()=>'/today'},
  'expo-speech':{maxSpeechInputLength:10,VoiceQuality:{Enhanced:'Enhanced'},getAvailableVoicesAsync:async()=>[{identifier:'english',language:'en-US',name:'English',quality:'Enhanced'}],stop:async()=>{stops++;},speak:(text,options)=>spoken.push({text,options})},
  [path.resolve('src/components/ui.tsx')]:{Button:({children,onPress})=>React.createElement('Button',{onPress},children),Body:'Body',ErrorText:'Error'},
 });
 const {ReadAloudProvider,ReadAloud}=load('src/components/read-aloud.tsx');let view;
 await act(async()=>{view=create(React.createElement(ReadAloudProvider,null,React.createElement(ReadAloud,{id:'one',text:'abcdefghijklmnop'}),React.createElement(ReadAloud,{id:'two',text:'Second'})));});
 const buttons=()=>view.root.findAllByType('Button');
 await act(async()=>{await buttons()[0].props.onPress();});
 assert.equal(spoken[0].text,'abcdefghij');assert.equal(spoken[0].options.rate,0.85);
 await act(async()=>spoken[0].options.onDone());assert.equal(spoken[1].text,'klmnop');
 await act(async()=>{await buttons()[2].props.onPress();});assert.equal(spoken[2].text,'Second');
 await act(async()=>spoken[1].options.onDone());assert.equal(buttons()[2].children[0],'Stop reading');
 await act(async()=>background('background'));assert.equal(buttons()[2].children[0],'Read aloud');assert.ok(stops>=3);
 await act(async()=>view.unmount());
});
