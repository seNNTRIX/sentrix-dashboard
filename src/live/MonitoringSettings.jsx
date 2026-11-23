import React,{useEffect,useState,useRef} from 'react';
import {useEnvironment} from './EnvironmentContext.jsx';
import {request,environmentPath} from './api.js';
import {jobLabel,decisionLabel,analysisReason} from './analysis-values.js';
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
   validateMonitoring(d,environment.id);if(abort.signal.aborted)return;setSaved(d);setEnabled(d.enabled);setInterval(String(d.intervalSeconds));setNotice('설정을 저장했습니다.');
  }catch(e){if(!abort.signal.aborted)setError(e.message);}finally{if(!abort.signal.aborted)setBusy(false);}
 };
 return <div style={{maxWidth:760,display:'flex',flexDirection:'column',gap:16}}><form className="panel" style={{background:"var(--bg1)",border:"1px solid var(--border-weak)",borderRadius:8}} onSubmit={save}>
  <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:16}}>
   <div><h2 className="section-title" style={{margin:0,fontSize:14,fontWeight:500}}>자동 분석</h2><p className="secondary-text">환경별로 최근 30초 데이터를 분석합니다. 창을 닫아도 서버에서 실행됩니다.</p></div>
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
  </div></form>{environment&&<WindowHistory key={environment.id} id={environment.id}/>}</div>;
}

function WindowHistory({id}){
 const [rows,setRows]=useState(null),[error,setError]=useState(''),[revision,refresh]=useState(0);
 useEffect(()=>{
  const abort=new AbortController();
  request(environmentPath(id)+'/anomaly-scores?limit=5',{signal:abort.signal})
   .then(items=>{if(!Array.isArray(items))throw new Error('구간 응답을 확인할 수 없습니다.');if(!abort.signal.aborted){setRows(items);setError('');}})
   .catch(e=>{if(!abort.signal.aborted)setError(e.message);});
  return ()=>abort.abort();
 },[id,revision]);
 return <ScoreWindows rows={rows} error={error} refresh={()=>refresh(n=>n+1)}/>;
}

export function ScoreWindows({rows,error,refresh}){
 return <section className="panel" style={{padding:'16px 24px'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 className="section-title">최근 자동 분석</h2>
   {refresh&&<button type="button" className="ui-button" onClick={refresh}>이력 새로고침</button>}</div>
  {error?<p role="alert">{error}</p>:rows==null?<p>이력을 불러오는 중…</p>:rows.length?<div style={{overflowX:'auto'}}><table className="data-table">
   <thead><tr>{['구간 종료','점수','판정 또는 작업 상태','사유','장애 기록'].map(x=><th key={x}>{x}</th>)}</tr></thead>
   <tbody>{rows.map(x=><tr key={x.jobId}><td>{new Date(x.windowEnd).toLocaleString('ko-KR')}</td><td>{x.score??'—'}</td>
    <td>{x.decision?decisionLabel(x.decision):jobLabel(x.status)}</td><td>{analysisReason(x.reason)}</td><td>{x.incidentId?<a href={`#B4-Incident?incidentId=${encodeURIComponent(x.incidentId)}`}>기록 보기</a>:'—'}</td></tr>)}</tbody>
  </table></div>:<p>자동 분석 기록이 없습니다.</p>}
 </section>;
}
