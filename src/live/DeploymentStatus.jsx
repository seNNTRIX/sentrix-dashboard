import React, { useEffect, useState } from 'react';
import { request, environmentPath } from './api.js';
import { Button } from '../components/controls.jsx';

const labels = { READY:'준비 완료', NOT_READY:'준비 부족', SCALED_DOWN:'실행 수 0', UNKNOWN:'확인 불가' };
const warnings = {
 MISSING_METRICS:'필요한 상태 데이터가 없습니다.',
 STALE_METRICS:'수집된 상태 데이터가 60초보다 오래됐습니다.',
 INCONSISTENT_METRICS:'수집된 인스턴스 수가 서로 일치하지 않습니다.',
 UPSTREAM_WARNING:'관측 저장소가 조회 경고를 반환했습니다.',
};

export function DeploymentStatus({ environmentId, service, refresh }) {
 const [state,setState] = useState({loading:true}), [revision,setRevision] = useState(0), [expired,setExpired] = useState(false);
 useEffect(()=>{
  const controller=new AbortController(); let expiry; const startedAt=Date.now();
  setState({loading:true}); setExpired(false);
  request(`${environmentPath(environmentId)}/services/${encodeURIComponent(service)}/status`,{signal:controller.signal})
   .then(data=>{
    if (!labels[data.status] || data.service!==service || data.environmentId!==environmentId || !Array.isArray(data.warnings)) throw new Error('상태 응답 형식이 올바르지 않습니다.');
    if(controller.signal.aborted)return;
    setState({data});
    if(data.status!=='UNKNOWN'){
     const remaining = data.maxAgeSeconds*1000-(Date.parse(data.queriedAt)-Date.parse(data.observedAt))-(Date.now()-startedAt);
     expiry=setTimeout(()=>setExpired(true),Math.max(0,Number.isFinite(remaining)?remaining:0));
    }
   }).catch(error=>{if(!controller.signal.aborted)setState({error:error.message});});
  return ()=>{controller.abort();clearTimeout(expiry);};
 },[environmentId,service,refresh,revision]);
 const data=state.data;
 return <section className="panel panel-padded live-form" style={{border:'1px solid var(--border-weak)',borderRadius:8,background:'var(--bg1)'}} aria-label="서비스 준비 상태">
  <div className="live-row"><h2>서비스 준비 상태</h2><Button onClick={()=>setRevision(n=>n+1)}>상태 새로고침</Button></div>
  {state.loading ? <p role="status">상태를 조회하는 중…</p> : state.error ? <p role="alert" className="field-error">{state.error}</p> : <>
   <p><strong>{labels[expired?'UNKNOWN':data.status]}</strong> · {service}</p>
   <dl className="replica-counts">{[['desiredReplicas','목표 수'],['replicas','현재 수'],['readyReplicas','준비된 수'],['availableReplicas','가용 수']].map(([key,label])=><div key={key}><dt>{label}</dt><dd>{expired?'—':data[key]??'—'}</dd></div>)}</dl>
   <p className="secondary-text">조회 {new Date(data.queriedAt).toLocaleString()} · 수집 {data.observedAt?new Date(data.observedAt).toLocaleString():'확인 불가'}</p>
   {expired && <p role="status">조회한 상태의 유효 시간이 지났습니다. 새로고침해 주세요.</p>}
   {data.warnings.map(w=><p key={w} className="secondary-text">{warnings[w]||'상태 데이터를 확인할 수 없습니다.'}</p>)}
  </>}
  <p className="secondary-text">현재 수는 Kubernetes가 집계한 Pod 수이며 모두 요청을 받을 수 있다는 뜻은 아닙니다. 준비 완료도 요청 성공이나 최신 배포 완료를 보장하지 않습니다. 그래프 조회 기간과 별개인 최근 상태입니다.</p>
 </section>;
}
