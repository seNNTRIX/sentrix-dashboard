const fail=()=>{throw new Error('관측 응답 형식 또는 조회 대상이 올바르지 않습니다.');};
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
export function validateCollection(d,id,service){
 const names=['deployment_metrics','request_metrics','logs','traces'];
 if(d?.environmentId!==id||d.service!==service||!date(d.checkedAt)||!date(d.from)||!date(d.to)||!Number.isInteger(d.lookbackSeconds)||!Number.isInteger(d.freshnessThresholdSeconds)||!Array.isArray(d.signals)||d.signals.length!==4)fail();
 const seen=new Set();
 for(const s of d.signals){if(!names.includes(s.signal)||seen.has(s.signal)||!['RECENT','STALE','NO_DATA','UNKNOWN'].includes(s.freshness)||!['OK','PARTIAL','ERROR','NOT_CONFIGURED'].includes(s.queryStatus)||!Array.isArray(s.warnings)||(s.observedAt!==null&&!date(s.observedAt))||(s.ageSeconds!==null&&(!Number.isInteger(s.ageSeconds)||s.ageSeconds<0)))fail();seen.add(s.signal);}
 return d;
}
export function validateMap(d,id,traceId){
 if(d?.environmentId!==id||d.traceId!==traceId||d.scope!=='SINGLE_TRACE'||!['PARTIAL','NO_OBSERVED_EDGES'].includes(d.dataStatus)||!Array.isArray(d.nodes)||d.nodes.length>5000||!Array.isArray(d.edges)||d.edges.length>5000||!Array.isArray(d.warnings))fail();
 const nodes=new Set(d.nodes),edges=new Set();if(nodes.size!==d.nodes.length||d.nodes.some(n=>typeof n!=='string'||!n))fail();
 for(const e of d.edges){const key=JSON.stringify([e.source,e.target]);if(!nodes.has(e.source)||!nodes.has(e.target)||edges.has(key)||!Number.isSafeInteger(e.observedCalls)||e.observedCalls<1||!Number.isSafeInteger(e.explicitErrorCount)||e.explicitErrorCount<0||!Number.isSafeInteger(e.unsetStatusCount)||e.unsetStatusCount<0||e.explicitErrorCount+e.unsetStatusCount>e.observedCalls||!Number.isFinite(e.meanServerDurationMs)||e.meanServerDurationMs<0||!Number.isFinite(e.maxServerDurationMs)||e.maxServerDurationMs<e.meanServerDurationMs)fail();edges.add(key);}
 return d;
}
export function validateEnvironment(d,id){if(d?.id!==id||typeof d.name!=='string'||typeof d.namespace!=='string'||!date(d.createdAt))fail();return d;}
