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
