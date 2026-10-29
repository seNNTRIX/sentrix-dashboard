import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCollection,validateMap,validateEnvironment} from '../src/live/observation-values.js';
const t='2026-10-29T10:00:00Z',id=1,traceId='a'.repeat(32);
test('collection distinguishes missing/error/stale without implying healthy',()=>{
 const d={environmentId:1,service:'frontend',checkedAt:t,from:t,to:t,lookbackSeconds:1800,freshnessThresholdSeconds:180,signals:['deployment_metrics','request_metrics','logs','traces'].map((signal,i)=>({signal,freshness:['RECENT','STALE','NO_DATA','UNKNOWN'][i],queryStatus:i===3?'ERROR':'OK',warnings:[],observedAt:i<2?t:null,ageSeconds:i<2?0:null}))};
 assert.equal(validateCollection(d,1,'frontend'),d);
 for(const changed of [{environmentId:2},{service:'other'},{signals:[...d.signals.slice(0,3),d.signals[0]]},{signals:d.signals.map(s=>({...s,ageSeconds:-1}))}])assert.throws(()=>validateCollection({...d,...changed},1,'frontend'));
});
test('map rejects foreign traces, missing nodes, invalid counts and timings',()=>{
 const d={environmentId:id,traceId,scope:'SINGLE_TRACE',dataStatus:'PARTIAL',nodes:['a','b'],warnings:['SINGLE_TRACE_ONLY'],edges:[{source:'a',target:'b',observedCalls:2,explicitErrorCount:0,unsetStatusCount:2,meanServerDurationMs:0,maxServerDurationMs:1}]};
 assert.equal(validateMap(d,id,traceId),d);
 for(const change of [{environmentId:2},{traceId:'b'.repeat(32)},{scope:'ALL'},{nodes:['a']},{edges:[...d.edges,...d.edges]},{edges:[{...d.edges[0],explicitErrorCount:1}]},{edges:[{...d.edges[0],meanServerDurationMs:2}]}])assert.throws(()=>validateMap({...d,...change},id,traceId));
 assert.equal(validateMap({...d,edges:[],dataStatus:'NO_OBSERVED_EDGES'},id,traceId).edges.length,0);
});
test('environment detail must match selection',()=>{const d={id,name:'test',namespace:'sentrix',createdAt:t};assert.equal(validateEnvironment(d,id),d);assert.throws(()=>validateEnvironment(d,2));assert.throws(()=>validateEnvironment({...d,createdAt:null},id));});
