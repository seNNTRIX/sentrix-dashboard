export function validateIncident(x,env){if(x?.environmentId!==env||!['MANUAL','AUTOMATIC'].includes(x.source)||!['OPEN','RESOLVED'].includes(x.status)||typeof x.id!=='string'||typeof x.title!=='string'||typeof x.service!=='string'||!Number.isFinite(Date.parse(x.occurredAt)))throw new Error('장애 기록 응답이 올바르지 않습니다.');return x;}

// The overview returns windows newest first. Only link to a diagnosis from
// this incident and a completed window inside the visible time range.
export function lastDetectedWindow(windows,range,incidentId) {
 const start=Date.parse(range.from),end=Date.parse(range.to);
 return windows?.find(w=>{
  const time=Date.parse(w.windowEnd);
  return time>start && time<=end && w.decision==='ANOMALY' && w.incidentId && w.jobId &&
   (!incidentId || w.incidentId===incidentId);
 });
}

// The overview and incident list poll independently. During a disagreement,
// keep the observed diagnosis visible until the open count is confirmed.
export function incidentBannerLabel(listCount,overviewCount) {
 if(listCount==null)return '장애 기록 조회 중…';
 if(Number.isSafeInteger(overviewCount)&&overviewCount!==listCount)return '진행 상태 갱신 중…';
 return listCount?'진행 중 장애 '+listCount+'건':'진행 중 장애 없음';
}
