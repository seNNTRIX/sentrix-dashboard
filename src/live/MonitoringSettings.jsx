import React,{useEffect,useState,useRef} from 'react';
import {useEnvironment} from './EnvironmentContext.jsx';
import {request,environmentPath} from './api.js';
import {validateMonitoring,monitoringLabel} from './monitoring-values.js';
const field={height:32,padding:'0 8px',border:'1px solid var(--border)',borderRadius:6,background:'var(--bg1)',color:'inherit'};
export function MonitoringSettings(){
 const {environment}=useEnvironment();
 const [saved,setSaved]=useState(null),[enabled,setEnabled]=useState(false),[interval,setInterval]=useState('60');
 const [busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const active=useRef(null);
 useEffect(()=>{
  const abort=new AbortController();active.current=abort;setSaved(null);setBusy(true);setError('');setNotice('');
  if(!environment){setBusy(false);return()=>abort.abort();}
  request(`${environmentPath(environment.id)}/monitoring`,{signal:abort.signal}).then(d=>{
   validateMonitoring(d,environment.id);if(abort.signal.aborted)return;setSaved(d);setEnabled(d.enabled);setInterval(String(d.intervalSeconds));
  }).catch(e=>{if(!abort.signal.aborted)setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setBusy(false);});
  return()=>abort.abort();
 },[environment?.id,revision]);
 const save=async e=>{
  e.preventDefault();const abort=active.current;if(!saved||busy||abort.signal.aborted)return;
  setBusy(true);setError('');setNotice('');
  try{
   const d=await request(`${environmentPath(environment.id)}/monitoring`,{method:'PUT',body:{enabled,intervalSeconds:Number(interval)},signal:abort.signal});
   validateMonitoring(d,environment.id);if(abort.signal.aborted)return;setSaved(d);setEnabled(d.enabled);setInterval(String(d.intervalSeconds));setNotice('설정을 저장했습니다. 모델 연결 전에는 분석이 실행되지 않습니다.');
  }catch(e){if(!abort.signal.aborted)setError(e.message);}finally{if(!abort.signal.aborted)setBusy(false);}
 };
 return <div style={{maxWidth:760,display:'flex',flexDirection:'column',gap:16}}><form className="panel" onSubmit={save}>
  <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:16}}>
   <div><h2 className="section-title" style={{margin:0,fontSize:14,fontWeight:500}}>이상 탐지</h2><p className="secondary-text">실행 설정을 저장합니다. 모델은 아직 연결되지 않았습니다.</p></div>
   {!environment&&<p>먼저 관측 환경을 선택하세요.</p>}
   {busy&&!saved&&<p role="status">설정을 불러오는 중…</p>}
   {error&&<div role="alert">{error} <button type="button" disabled={busy} onClick={()=>setRevision(n=>n+1)}>다시 조회</button></div>}
   {saved&&<><p role="status">현재 상태: {monitoringLabel(saved.executionStatus)}</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,240px))',gap:16}}>
     <label>자동 분석 요청<select aria-label="자동 분석 요청" style={{...field,width:'100%'}} value={enabled?'on':'off'} disabled={busy} onChange={e=>setEnabled(e.target.value==='on')}><option value="off">비활성화</option><option value="on">활성화 요청</option></select></label>
     <label>실행 주기 (초)<input aria-label="실행 주기 (초)" type="number" min="30" max="3600" step="1" required style={{...field,width:'100%'}} value={interval} disabled={busy} onChange={e=>setInterval(e.target.value)}/></label>
    </div><span className="secondary-text">모델 학습 구간·임계값·RCA 후보 수 설정은 아직 지원하지 않습니다.</span></>}
   {notice&&<p role="status">{notice}</p>}
  </div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 24px',borderTop:'1px solid var(--border-weak)',background:'var(--canvas)',borderRadius:'0 0 8px 8px'}}>
   <span className="secondary-text">실행 주기 30~3600초</span><button type="submit" disabled={busy||!saved} style={{height:32,padding:'0 14px',border:0,borderRadius:6,background:'var(--primary)',color:'var(--on-primary)',fontWeight:500}}>{busy&&saved?'저장 중…':'저장'}</button>
  </div></form></div>;
}
