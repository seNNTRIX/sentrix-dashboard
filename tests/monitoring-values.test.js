import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateMonitoring,monitoringLabel} from '../src/live/monitoring-values.js';
test('monitoring rejects cross-environment and fabricated execution states',()=>{
 const value={environmentId:1,enabled:false,intervalSeconds:60,executionStatus:'DISABLED',modelStatus:'UNAVAILABLE',lastSuccessfulAt:null};
 assert.equal(validateMonitoring(value,1),value);
 assert.throws(()=>validateMonitoring(value,2));
 for(const bad of [{enabled:true},{intervalSeconds:0},{executionStatus:'RUNNING'},{lastSuccessfulAt:'2026-10-28'}])assert.throws(()=>validateMonitoring({...value,...bad},1));
 assert.equal(monitoringLabel('BLOCKED_MODEL_UNAVAILABLE'),'모델 미연결 · 실행 대기');
});

test('configured model does not imply automatic analysis is running',()=>{
 const data={environmentId:1,enabled:true,intervalSeconds:60,modelStatus:'CONFIGURED',executionStatus:'BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE',lastSuccessfulAt:null};
 assert.equal(validateMonitoring(data,1),data);
 assert.throws(()=>validateMonitoring({...data,executionStatus:'RUNNING'},1));
});

test('scheduled monitoring accepts the timestamp of the last completed model request',()=>{
 const data={environmentId:1,enabled:true,intervalSeconds:60,modelStatus:'CONFIGURED',executionStatus:'SCHEDULED',lastSuccessfulAt:'2026-11-23T01:00:00Z'};
 assert.equal(validateMonitoring(data,1),data);
 assert.throws(()=>validateMonitoring({...data,modelStatus:'UNAVAILABLE'},1));
});
