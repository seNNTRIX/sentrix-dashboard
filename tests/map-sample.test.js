import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleIds,sampleTopology,focusedTopology} from '../src/live/map-sample.js';

test('sample uses distinct traces, prefers different operations and skips telemetry exports',()=>{
 const items=['TraceService/Export','checkout','checkout','cart','checkout'].map((rootOperation,i)=>({rootOperation,traceId:String(i)}));
 assert.deepEqual(sampleIds([...items,items[1]],3),['1','3','2']);
});
test('only direct client/server pairs in the same trace contribute to calls and p90',()=>{
 const client={spanId:'1',service:'a',kind:'CLIENT'};
 const server={spanId:'2',parentSpanId:'1',service:'b',kind:'SERVER',durationMs:10,status:'OK'};
 const result=sampleTopology([{spans:[client,server]},{spans:[client,{...server,durationMs:300,status:'ERROR'}]},{spans:[server]}]);
 assert.deepEqual(result.nodes,['a','b']);
 assert.deepEqual(result.edges,[{source:'a',target:'b',observedCalls:2,explicitErrorCount:1,p90Ms:300}]);
});

test('selected service keeps both directions, excludes unrelated calls and stays centered without traces',()=>{
 const edges=[{source:'a',target:'b'},{source:'b',target:'c'},{source:'b',target:'a'},{source:'a',target:'c'}];
 const map=focusedTopology('b',edges);
 assert.deepEqual(map.links,edges.slice(0,3));
 assert.deepEqual([...map.positions.keys()],['b','a','c']);
 assert.ok(map.positions.get('a')[0]<map.positions.get('b')[0]);
 assert.ok(map.positions.get('c')[0]>map.positions.get('b')[0]);
 assert.deepEqual([...focusedTopology('redis-cart',edges).positions.keys()],['redis-cart']);
});
