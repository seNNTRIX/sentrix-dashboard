const labels={BLOCKED_MODEL_UNAVAILABLE:'모델 미연결 · 대기',QUEUED:'실행 대기',RUNNING:'분석 중',SUCCEEDED:'완료',FAILED:'실패',CANCELLED:'취소됨'};
const text=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const fail=()=>{throw new Error('분석 작업 응답 형식 또는 조회 대상이 올바르지 않습니다.');};
export const jobLabel=status=>labels[status]||'확인 불가';
export const canCancelJob=status=>['BLOCKED_MODEL_UNAVAILABLE','QUEUED','RUNNING'].includes(status);
export const decisionLabel=decision=>({ANOMALY:'이상',NORMAL:'정상',ABSTAIN:'판정 보류'}[decision]||'확인 불가');

// Version 1 stores these observations as evidence text, including on historical jobs.
const noAvailableReplicas = 'Kubernetes에서 최근 30초간 목표 복제본은 1개 이상, 가용 복제본은 0개로 관측됐습니다.';
const replicaLossScore = '모델 입력 부족으로 이 후보의 점수는 목표 대비 가용 복제본 손실률(100%)을 표시합니다.';

export function hasReplicaOutage(candidate) {
 return candidate?.kind === 'NODE' && candidate.evidence?.includes(noAvailableReplicas) === true;
}

export const usesReplicaLossScore=c=>hasReplicaOutage(c)&&c.evidence.includes(replicaLossScore);
export const knownRankingMethod=result=>result.contractVersion==='sentrix-analysis-v1-draft'
 && result.featureSchemaVersion==='re2ob-v0-rel18-all58'
 && ['linuxv1-b-fold2','linuxv1-b-fold2-route1','re2ob-v2-freeze'].includes(result.modelVersion);

const branchEvidencePrefix='분석 기준 · ';
export function diagnosisBasis(result, candidate) {
 if(result?.modelVersion!=='linuxv1-b-fold2-route1'||!knownRankingMethod(result))return null;
 const line=candidate?.evidence?.[0];
 return line?.startsWith(branchEvidencePrefix)&&line.slice(branchEvidencePrefix.length).trim()?line:null;
}

export function candidateScoreLabel(candidate) {
 if (candidate?.kind === 'EDGE') return '경로 통계 점수';
 if (candidate?.kind !== 'NODE') return '후보 점수';
 if (usesReplicaLossScore(candidate)) return '복제본 손실률';
 if (!candidate.evidence?.length) return '서비스 후보 점수';
 return '서비스 모델 점수';
}

export function validateJob(x,env,incidentId,id){
 if(!x||!text(x.id)||(id!==undefined&&x.id!==id)||x.environmentId!==env||x.incidentId!==incidentId||!Object.hasOwn(labels,x.status)||!date(x.createdAt)||!date(x.updatedAt))fail();
 for(const field of ['windowStart','windowEnd','startedAt','finishedAt','readyAt'])if(x[field]!=null&&!date(x[field]))fail();
 for(const field of ['namespace','contractVersion','featureSchemaVersion','modelVersion','reason'])if(x[field]!=null&&!text(x[field]))fail();
 if((x.windowStart==null)!==(x.windowEnd==null)||(x.windowStart!=null&&Date.parse(x.windowStart)>=Date.parse(x.windowEnd)))fail();
 return x;
}

export function validateAnalysisResult(x,job,namespace){
 if(!x||job.status!=='SUCCEEDED'||x.jobId!==job.id||x.environmentId!==job.environmentId||x.namespace!==(job.namespace??namespace)||!['ANOMALY','NORMAL','ABSTAIN'].includes(x.decision)||!Array.isArray(x.candidates))fail();
 for(const field of ['contractVersion','featureSchemaVersion','modelVersion'])if(!text(x[field])||x[field]!==job[field])fail();
 for(const field of ['windowStart','windowEnd'])if(!date(x[field])||!date(job[field])||Date.parse(x[field])!==Date.parse(job[field]))fail();
 if(Date.parse(x.windowStart)>=Date.parse(x.windowEnd)||(x.score!=null&&!Number.isFinite(x.score)))fail();
 if(x.decision==='ABSTAIN'&&!text(x.abstainReason))fail();
 if(x.decision!=='ANOMALY'&&x.candidates.length)fail();
 if(x.modelVersion==='linuxv1-b-fold2-route1'&&new Set(x.candidates.map(c=>c?.kind)).size>1)fail();
 const ranks=new Set();
 for(const c of x.candidates){
  if(!c||!Number.isSafeInteger(c.rank)||c.rank<1||ranks.has(c.rank)||!['NODE','EDGE'].includes(c.kind)||!text(c.faultType)||!Number.isFinite(c.score)||!Array.isArray(c.evidence)||c.evidence.some(e=>!text(e)))fail();
  if(c.kind==='NODE'?!text(c.service):!text(c.source)||!text(c.target))fail();
  ranks.add(c.rank);
 }
 return x;
}

export const analysisReason=reason=>({AWAITING_EXECUTION:'실행 대기',EXECUTING:'분석 중',COMPLETED:'처리 완료',MONITORING_DISABLED:'자동 분석 중지',WORKER_INTERRUPTED:'실행 중단',FEATURE_INPUT_UNAVAILABLE:'분석할 구간의 특징 데이터가 아직 준비되지 않았습니다.',CALIBRATION_REQUIRED:'모델의 정상 기준값이 필요합니다.',PREVIOUS_WINDOW_UNAVAILABLE:'직전 분석 구간의 입력이 부족합니다.',CALIBRATION_AND_CONSECUTIVE_WINDOWS_REQUIRED:'정상 기준값과 연속 구간 확인이 필요합니다.',TRACE_SEARCH_INCOMPLETE:'트레이스 검색이 완료되지 않아 분석을 보류했습니다.',TRACE_QUERY_LIMIT:'트레이스 조회 상한에 도달해 분석을 보류했습니다.',INVALID_TRACE_ID:'저장소의 트레이스 식별자를 확인할 수 없습니다.',TRACE_ID_MISMATCH:'트레이스 상세 응답의 식별자가 일치하지 않습니다.',TRACE_PARENT_UNAVAILABLE:'호출의 부모 구간이 수집되지 않아 분석을 보류했습니다.',BASELINE_METRIC_COVERAGE_INSUFFICIENT:'정상 기준 구간의 지표 표본이 부족합니다.',INSUFFICIENT_METRIC_SAMPLES:'분석 구간의 지표 표본이 부족합니다.',INCOMPLETE_NODE_COVERAGE:'일부 서비스의 관측값이 비어 있습니다. 기존 장애 상태를 유지합니다.',LOG_SEVERITY_UNAVAILABLE:'로그 심각도를 확인할 수 없어 분석을 보류했습니다.',LOG_QUERY_LIMIT:'로그 조회 상한에 도달해 분석을 보류했습니다.',TELEMETRY_UPSTREAM_ERROR:'관측 저장소 조회에 실패했습니다.',TELEMETRY_BUDGET_EXCEEDED:'관측 데이터 조회 시간이 초과됐습니다.',BASELINE_OVERLAPS_ANALYSIS:'정상 기준 구간과 분석 구간이 겹칩니다.'}[reason]||reason);
