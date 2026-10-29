import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePods,validatePodMetric} from '../src/live/pod-values.js';
const uid='97d1d5ef-203c-43dc-a345-72df4783703e',pod={name:'frontend-abc',uid,ready:false,restarts:0};
const range={from:'2026-10-29T09:00:00Z',to:'2026-10-29T09:01:00Z',stepSeconds:30};
test('Pod inventory preserves false and zero and rejects duplicates and foreign responses',()=>{
 const d={environmentId:1,service:'frontend',queriedAt:range.from,warnings:[],items:[pod]};
 assert.equal(validatePods(d,1,'frontend').items[0].ready,false);
 for(const value of [{...d,environmentId:2},{...d,service:'other'},{...d,items:[pod,pod]},{...d,items:[{...pod,restarts:-1}]},{...d,items:[{...pod,ready:'true'}]}])assert.throws(()=>validatePods(value,1,'frontend'));
 assert.equal(validatePods({...d,items:[{...pod,ready:null,restarts:null}]},1,'frontend').items[0].ready,null);
});
test('Pod metrics enforce immutable identity, query grid, units and missing samples',()=>{
 const d={environmentId:1,service:'frontend',pod:pod.name,uid,metric:'cpu_usage_cores',unit:'cores',...range,dataStatus:'PARTIAL',warnings:[],points:[{timestamp:range.from,value:0},{timestamp:'2026-10-29T09:00:30Z',value:null}]};
 const validate=x=>validatePodMetric(x,1,'frontend',pod,'cpu_usage_cores',range);
 assert.equal(validate(d).points[1].value,null);
 for(const patch of [{uid:'old-uid'},{environmentId:2},{pod:'other'},{unit:'percent'},{points:[]},{points:[{timestamp:range.from,value:-1},d.points[1]]},{points:[d.points[0],d.points[0]]}])assert.throws(()=>validate({...d,...patch}));
});
