import test from 'node:test';
import assert from 'node:assert/strict';
import {logLevel,chartPath,chartBars,designValues} from '../src/live/design-values.js';
test('original chart slots preserve zero and break missing samples',()=>{
 const path=chartPath([{value:0},{value:null},{value:1}],1);assert.deepEqual(path.trim().split(/\s+/),['M5,120','M595,0']);
});
test('raw log words do not fabricate severity',()=>{
 assert.equal(logLevel('error processing a log line'),'unknown');assert.equal(logLevel('{"level":"warning"}'),'warn');assert.equal(logLevel('null'),'unknown');
});
test('trace slots use real relationships, status and missing metadata',()=>{
 const view={state:{},props:{},setState(){}};
 const d={route:'B6-Trace',range:{},result:{data:{items:[]}},environment:{namespace:'lab'},detail:{data:{traceId:'a'.repeat(32),durationMs:10,startedAt:'2026-10-28T00:00:00Z',spans:[{spanId:'b',parentSpanId:'not-collected',service:'api',operation:'GET',durationMs:10,startedAt:'2026-10-28T00:00:00Z',endedAt:'2026-10-28T00:00:00.010Z',kind:'SERVER',status:'UNSET'}]}}};
 const v=designValues(view,d);assert.equal(v.tv.count,1);assert.equal(v.tv.services,1);assert.equal(v.tv.spans[0].err,false);assert.equal(v.tv.spans[0].attrs.find(x=>x.k==='status').v,'UNSET');assert.ok(!JSON.stringify(v).includes('k8s.pod.name'));assert.ok(!JSON.stringify(v).includes('INC-0142'));
});

test('overview uses actual inventory, unassessed history, bars and short time ticks',()=>{
 const view={state:{},props:{},setState(){}};
 const metric=values=>({data:{points:values.map(value=>({value}))}});
 const d={route:'B1-Overview',service:'frontend',range:{from:'2026-10-28T10:00:00Z',to:'2026-10-28T10:15:00Z'},inventory:[{name:'frontend'},{name:'checkoutservice'}],metrics:{request_rate:metric([0,null,2]),error_ratio:metric([.0042]),latency_p99_ms:metric([486])}};
 const v=designValues(view,d);
 assert.equal(v.red[0].p1,'');assert.equal((v.red[0].bars.match(/M/g)||[]).length,2);
 assert.equal(v.red[0].legend[0].label,'frontend req/s');assert.equal(v.red[1].now,'0.42%');
 assert.equal(v.red[2].title,'지연');assert.equal(v.red[2].now,'p99 486 ms');
 assert.equal(v.ticks.length,6);assert.equal(v.ticksShort.length,3);assert.ok(v.ticks.every(x=>/^\d{2}:\d{2}$/.test(x.label)));
 assert.deepEqual(v.timeline.map(x=>x.name),['frontend','checkoutservice']);
 assert.ok(v.timeline.every(x=>x.segs[0].tip.includes('미판정')));
 assert.equal(chartBars([{value:null}],1),'');
});
