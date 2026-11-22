const labels={BLOCKED_MODEL_UNAVAILABLE:'모델 미연결 · 대기',QUEUED:'실행 대기',RUNNING:'분석 중',SUCCEEDED:'완료',FAILED:'실패',CANCELLED:'취소됨'};
const text=x=>typeof x==='string'&&x.trim().length>0;
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const fail=()=>{throw new Error('분석 작업 응답 형식 또는 조회 대상이 올바르지 않습니다.');};
export const jobLabel=status=>labels[status]||'확인 불가';
export const canCancelJob=status=>['BLOCKED_MODEL_UNAVAILABLE','QUEUED','RUNNING'].includes(status);
export const decisionLabel=decision=>({ANOMALY:'이상',NORMAL:'정상',ABSTAIN:'판정 보류'}[decision]||'확인 불가');

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
 const ranks=new Set();
 for(const c of x.candidates){
  if(!c||!Number.isSafeInteger(c.rank)||c.rank<1||ranks.has(c.rank)||!['NODE','EDGE'].includes(c.kind)||!text(c.faultType)||!Number.isFinite(c.score)||!Array.isArray(c.evidence)||c.evidence.some(e=>!text(e)))fail();
  if(c.kind==='NODE'?!text(c.service):!text(c.source)||!text(c.target))fail();
  ranks.add(c.rank);
 }
 return x;
}
