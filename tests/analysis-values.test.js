import test from 'node:test';
import assert from 'node:assert/strict';
import {validateJob,validateAnalysisResult,canCancelJob,jobLabel,candidateScoreLabel,hasReplicaOutage} from '../src/live/analysis-values.js';

const job={id:'job-1',incidentId:'incident-1',environmentId:1,namespace:'sentrix',status:'SUCCEEDED',createdAt:'2026-11-22T00:00:00Z',updatedAt:'2026-11-22T00:01:00Z',windowStart:'2026-11-21T23:59:30Z',windowEnd:'2026-11-22T00:00:00Z',contractVersion:'v1',featureSchemaVersion:'test-v1',modelVersion:'test-model'};
const result={jobId:job.id,environmentId:1,namespace:'sentrix',windowStart:job.windowStart,windowEnd:job.windowEnd,contractVersion:'v1',featureSchemaVersion:'test-v1',modelVersion:'test-model',decision:'ANOMALY',score:0.8,candidates:[{rank:1,kind:'EDGE',source:'frontend',target:'catalog',faultType:'NETWORK_DELAY',score:2.5,evidence:['span duration increased']},{rank:2,kind:'NODE',service:'catalog',faultType:'CPU',score:0.4,evidence:[]}]};

test('candidate scores retain their source and require explicit availability evidence', () => {
 const availability='Kubernetes에서 최근 30초간 목표 복제본은 1개 이상, 가용 복제본은 0개로 관측됐습니다.';
 const fallback='모델 입력 부족으로 이 후보의 점수는 목표 대비 가용 복제본 손실률(100%)을 표시합니다.';
 const node={rank:1,kind:'NODE',service:'emailservice',faultType:'서비스 내부 이상 후보 (CPU·Pod 계열)',score:0.026222443473061866,evidence:[availability]};
 assert.equal(hasReplicaOutage(node),true);
 assert.equal(candidateScoreLabel(node),'서비스 모델 점수');
 assert.equal(candidateScoreLabel({...node,score:1,evidence:[availability,fallback]}),'복제본 손실률');
 assert.equal(hasReplicaOutage({...node,evidence:['가용 복제본 확인 필요']}),false);
 assert.equal(hasReplicaOutage({...node,evidence:[]}),false);
 assert.equal(candidateScoreLabel({...node,evidence:undefined}),'서비스 후보 점수');
 assert.equal(candidateScoreLabel({...node,evidence:[]}),'서비스 후보 점수');
 assert.equal(hasReplicaOutage({...node,kind:'EDGE'}),false);
 assert.equal(candidateScoreLabel({...node,kind:'EDGE'}),'경로 통계 점수');
 assert.equal(candidateScoreLabel(undefined),'후보 점수');
});

test('analysis jobs keep legacy null metadata and limit cancellation to active states',()=>{
 for(const status of ['BLOCKED_MODEL_UNAVAILABLE','QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED']){
  assert.equal(validateJob({...job,status},1,'incident-1','job-1').status,status);
  assert.notEqual(jobLabel(status),'확인 불가');
 }
 const legacy={...job,status:'CANCELLED',namespace:null,windowStart:null,windowEnd:null,contractVersion:null,featureSchemaVersion:null,modelVersion:null};
 assert.equal(validateJob(legacy,1,'incident-1'),legacy);
 for(const status of ['BLOCKED_MODEL_UNAVAILABLE','QUEUED','RUNNING'])assert.equal(canCancelJob(status),true);
 for(const status of ['SUCCEEDED','FAILED','CANCELLED','UNKNOWN'])assert.equal(canCancelJob(status),false);
 for(const change of [{environmentId:2},{incidentId:'other'},{status:'UNKNOWN'},{windowStart:null},{startedAt:'bad'}])assert.throws(()=>validateJob({...job,...change},1,'incident-1'));
});

test('stored results must match the selected job and preserve raw scores',()=>{
 assert.equal(validateAnalysisResult(result,job,'sentrix'),result);
 assert.equal(result.candidates[0].score,2.5);
 for(const change of [{jobId:'other'},{environmentId:2},{namespace:'other'},{modelVersion:'other'},{featureSchemaVersion:'other'},{contractVersion:'other'},{windowEnd:'2026-11-22T00:00:30Z'},{score:'0.8'},{decision:'UNKNOWN'}])assert.throws(()=>validateAnalysisResult({...result,...change},job,'sentrix'));
 assert.throws(()=>validateAnalysisResult(result,{...job,status:'RUNNING'},'sentrix'));
 assert.throws(()=>validateAnalysisResult({...result,candidates:[result.candidates[0],result.candidates[0]]},job,'sentrix'));
 assert.throws(()=>validateAnalysisResult({...result,candidates:[{...result.candidates[0],target:null}]},job,'sentrix'));
 assert.throws(()=>validateAnalysisResult({...result,candidates:[{...result.candidates[1],evidence:[null]}]},job,'sentrix'));
});

test('normal and abstained results do not fabricate candidates or scores',()=>{
 const normal={...result,decision:'NORMAL',score:null,candidates:[]};
 assert.equal(validateAnalysisResult(normal,job,'sentrix'),normal);
 const {score,...withoutScore}=normal;
 assert.equal(validateAnalysisResult(withoutScore,job,'sentrix'),withoutScore);
 const abstained={...normal,decision:'ABSTAIN',abstainReason:'INSUFFICIENT_DATA'};
 assert.equal(validateAnalysisResult(abstained,job,'sentrix'),abstained);
 assert.throws(()=>validateAnalysisResult({...abstained,abstainReason:null},job,'sentrix'));
 assert.throws(()=>validateAnalysisResult({...normal,candidates:result.candidates},job,'sentrix'));
});
