import test from 'node:test';
import assert from 'node:assert/strict';
import {queryRange} from '../src/live/api.js';
import {chartScope,failedRefresh,matchesWindow,rollingRange} from '../src/live/chart-snapshot.js';

const now=Date.parse('2026-11-24T00:12:47Z'), duration=900000;
const first=rollingRange(now,duration),next=rollingRange(now+31000,duration);
const scope=chartScope(1,'paymentservice',first,true);
const prior={scope,range:first,data:{points:[{value:null}]}};

test('relative requests for the same period evaluate common timestamps across refreshes',()=>{
 assert.equal(first.to,'2026-11-24T00:12:30Z');
 assert.equal(next.to,'2026-11-24T00:13:00Z');
 assert.deepEqual(rollingRange(now+8000,duration),first);
 assert.equal(Date.parse(next.from)-Date.parse(first.from),first.stepSeconds*1000);
 assert.equal(rollingRange(now,86400000).to,'2026-11-24T00:12:00Z');
});

test('failed refresh retains only observed overlapping samples from the same live selection',()=>{
 const failure=failedRefresh(prior,scope,next,'timeout');
 assert.equal(failure.data,prior.data);
 assert.equal(failure.range,first);
 assert.equal(failure.refreshError,'timeout');
 const different=[
  [chartScope(2,'paymentservice',next,true),next],
  [chartScope(1,'frontend',next,true),next],
  [chartScope(1,'paymentservice',rollingRange(now,3600000),true),rollingRange(now,3600000)],
  [chartScope(1,'paymentservice',next,false),next],
  [scope,rollingRange(now+duration,duration)]
 ];
 for(const [other,bounds] of different){
  assert.equal(matchesWindow(prior,other,bounds),false);
  assert.equal(failedRefresh(prior,other,bounds,'timeout').data,undefined);
 }
 const fixedA=chartScope(1,'paymentservice',first,false);
 const fixedB=chartScope(1,'paymentservice',queryRange(Date.parse(first.from)+1000,Date.parse(first.to)+1000),false);
 assert.notEqual(fixedA,fixedB);
});
