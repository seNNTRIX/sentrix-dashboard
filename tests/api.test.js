import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartPath, queryRange, request } from '../src/live/api.js';

test('range contract uses whole seconds, exclusive end and at most 1440 points',()=>{
 const range=queryRange('2026-10-28T00:00:00Z','2026-10-29T00:00:00Z');
 assert.equal(range.stepSeconds,60);
 assert.equal(range.from,'2026-10-28T00:00:00Z');
 assert.throws(()=>queryRange('bad','date'));
 assert.throws(()=>queryRange('2026-10-28','2026-10-30'));
 assert.throws(()=>queryRange('2026-10-28','2026-10-28'));
 assert.throws(()=>queryRange('2026-10-28T00:00:00.100Z','2026-10-28T00:00:00.200Z'));
});
test('zero is drawn and gaps start new chart segments',()=>{
 const path=chartPath([{value:0},{value:null},{value:2},{value:3}]);
 assert.equal((path.match(/M/g)||[]).length,2);
 assert.equal((path.match(/L/g)||[]).length,1);
 assert.equal(chartPath([{value:null}]),'');
});
test('API client handles HTTP errors, network errors and caller cancellation',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({code:'PROMETHEUS_NOT_CONFIGURED'}),{status:409}));
 await assert.rejects(request('/environments/1/services'),e=>e.status===409&&e.message.includes('먼저 저장'));
 globalThis.fetch=async()=>new Response('{}',{status:409});
 await assert.rejects(request('/environments',{method:'POST',body:{}}),e=>e.message.includes('같은 이름'));
 globalThis.fetch=async()=>{throw new TypeError('network');};
 await assert.rejects(request('/environments'),e=>e.status===0&&e.message.includes('연결할 수 없습니다'));
 const controller=new AbortController();controller.abort();
 globalThis.fetch=async(_url,{signal})=>{assert.equal(signal.aborted,true);throw new DOMException('aborted','AbortError');};
 await assert.rejects(request('/environments',{signal:controller.signal}),e=>e.name==='AbortError');
});

test('health uses its own path and collection can override the bounded timeout',async t=>{
 t.mock.method(globalThis,'fetch',async url=>{assert.equal(url,'/actuator/health');return new Response('{"status":"UP"}');});
 assert.equal((await request('/actuator/health')).status,'UP');
 globalThis.fetch=(_url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError')),{once:true}));
 await assert.rejects(request('/environments/1/collection-status',{timeoutMs:5}),e=>e.message.includes('초과'));
});
