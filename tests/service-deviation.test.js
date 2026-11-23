import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceDeviation,serviceSignals} from '../src/live/service-deviation.js';
const t=60*60000;
function histories(count=60){
 return new Map(serviceSignals.map(([metric])=>[metric,new Map(Array.from({length:count+1},(_,i)=>[t-i*60000,2]))]));
}
test('constant signals stay at zero; a rare latency increase scores only for its service',()=>{
 const typical=histories(),slow=histories();slow.get('latency_p99_ms').set(t,10);
 const score=data=>serviceDeviation(data,t,t)[0];
 assert.equal(score(typical).value,0);assert.ok(score(slow).value>95);assert.equal(score(slow).signal,'p99 지연');
 slow.get('latency_p99_ms').set(t,1);assert.equal(score(slow).value,0);
 slow.get('request_rate').set(t,0);assert.ok(score(slow).value>95);
});
test('missing history or current points yield a gap rather than a healthy score',()=>{
 assert.equal(serviceDeviation(histories(44),t,t)[0].value,null);
 const data=histories();data.get('error_ratio').delete(t);data.get('request_rate').delete(t);
 assert.equal(serviceDeviation(data,t,t)[0].value,null);
});
