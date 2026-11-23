import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceHealth} from '../src/live/service-health.js';

test('history distinguishes missing samples, latency and errors for each service',()=>{
 const series=new Map(['error_ratio','latency_p99_ms'].map((id,index)=>[id,new Map(Array.from({length:61},(_,i)=>[i*60000,index?10:0]))]));
 const t=60*60000, read=()=>serviceHealth(series,t,t)[0].status;
 assert.equal(read(),'normal');
 series.get('latency_p99_ms').set(t,31);
 assert.equal(read(),'warn');
 series.get('error_ratio').set(t,.02);
 assert.equal(read(),'alarm');
 series.get('error_ratio').delete(t);series.get('latency_p99_ms').delete(t);
 assert.equal(read(),'unknown');
});
