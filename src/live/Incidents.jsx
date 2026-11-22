import {validateIncident} from './incident-values.js';
import {validateJob,validateAnalysisResult,jobLabel,canCancelJob,decisionLabel} from './analysis-values.js';
import React,{useEffect,useRef,useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {request,environmentPath} from './api.js';
import {Dialog} from '../components/controls.jsx';
import {DataNotice} from './DesignBindings.jsx';
const panel={border:'1px solid var(--border-weak)',borderRadius:8,background:'var(--bg1)',padding:24};
const at=t=>t?new Date(t).toLocaleString():'—';

export function Incidents(){const d=useDesign();return <><DataNotice/>{d.environment&&<History key={d.environment.id} d={d}/>}</>;}
function History({d}){
 const [page,setPage]=useState(0),[filter,setFilter]=useState(''),[service,setService]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[rev,setRev]=useState(0),[form,setForm]=useState(false);
 const base=environmentPath(d.environment.id)+'/incidents';
 useEffect(()=>{const c=new AbortController();setData(null);setError('');request(base+'?'+new URLSearchParams({page,size:20,...(filter?{status:filter}:{}),...(service?{service}:{})}),{signal:c.signal}).then(x=>{if(!Array.isArray(x.items)||!Number.isInteger(x.totalPages))throw new Error('목록 응답 오류');x.items.forEach(i=>validateIncident(i,d.environment.id));if(!c.signal.aborted)setData(x);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[base,page,filter,service,rev]);
 return <><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><h1 className="page-title">장애 기록</h1><p className="secondary-text">수동 등록한 장애 의심 상황입니다. 자동 탐지 결과가 아닙니다.</p></div><button className="ui-button" onClick={()=>setForm(true)}>장애 기록 등록</button></div><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><label>상태 <select aria-label="장애 기록 상태" value={filter} onChange={e=>{setPage(0);setFilter(e.target.value);}}><option value="">전체</option><option value="OPEN">열림</option><option value="RESOLVED">수동 종료</option></select></label><label>서비스 <select aria-label="장애 기록 서비스" value={service} onChange={e=>{setPage(0);setService(e.target.value);}}><option value="">전체</option>{d.inventory.map(s=><option key={s.name}>{s.name}</option>)}</select></label><button className="ui-button" onClick={()=>setRev(n=>n+1)}>기록 새로고침</button></div>
 <section style={panel} aria-label="장애 기록 목록">{error?<p role="alert">{error}</p>:!data?<p role="status">조회 중…</p>:<><div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr>{['기록','서비스','상태','발생 시각','등록 방식'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(x=><tr key={x.id}><td><a href={`#B4-Incident?incidentId=${x.id}`}>{x.title}</a></td><td>{x.service}</td><td>{x.status==='OPEN'?'열림':'수동 종료'}</td><td>{at(x.occurredAt)}</td><td>수동 등록</td></tr>)}</tbody></table></div>{!data.items.length&&<p>등록된 기록이 없습니다.</p>}<Pager page={page} pages={data.totalPages} change={setPage}/></>}</section>{form&&<Dialog title="장애 의심 상황 기록" onClose={()=>setForm(false)}><CreateIncident base={base} env={d.environment.id}/></Dialog>}</>;
}
function CreateIncident({base,env}){
 const [title,setTitle]=useState(''),[service,setService]=useState('frontend'),[description,setDescription]=useState(''),[time,setTime]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const token=useRef(crypto.randomUUID()),active=useRef(null),payload=useRef(null);
 useEffect(()=>{active.current=new AbortController();return()=>active.current.abort();},[]);
 return <form className="live-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const body={service,title,description,occurredAt:new Date(time).toISOString()};const fingerprint=JSON.stringify(body);if(payload.current!==fingerprint){token.current=crypto.randomUUID();payload.current=fingerprint;}setBusy(true);setError('');try{const x=await request(base,{method:'POST',signal:active.current.signal,body:{...body,requestKey:token.current}});validateIncident(x,env);if(!active.current.signal.aborted)location.hash=`B4-Incident?incidentId=${x.id}`;}catch(e){if(!active.current.signal.aborted)setError(e.message);}finally{if(!active.current.signal.aborted)setBusy(false);}}}><p>장애 의심 상황을 수동 기록으로 저장합니다. 자동 탐지 결과가 아닙니다.</p><label>제목<input aria-label="장애 기록 제목" required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>서비스<input aria-label="장애 기록 대상 서비스" required maxLength={253} pattern="[a-z0-9]([a-z0-9.-]*[a-z0-9])?" value={service} onChange={e=>setService(e.target.value)}/></label><label>발생 시각<input aria-label="장애 발생 시각" required type="datetime-local" value={time} onChange={e=>setTime(e.target.value)}/></label><label>관측 내용<textarea aria-label="관측 내용" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="ui-button" disabled={busy}>{busy?'저장 중…':'기록 저장'}</button></form>;
}
function Pager({page,pages,change}){return <div style={{display:'flex',gap:12,marginTop:16}}><button className="ui-button" disabled={page===0} onClick={()=>change(page-1)}>이전</button><span>{page+1} / {Math.max(1,pages)}</span><button className="ui-button" disabled={page+1>=pages} onClick={()=>change(page+1)}>다음</button></div>;}
export function IncidentDetail(){const d=useDesign();return <><DataNotice/>{d.environment&&<Detail key={`${d.environment.id}:${d.incidentId}`} d={d}/>}</>;}
function Detail({d}){
 const [record,setRecord]=useState(null),[jobs,setJobs]=useState(null),[page,setPage]=useState(0),[rev,setRev]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [selectedId,setSelectedId]=useState(''),[selected,setSelected]=useState(null),[result,setResult]=useState(null),[detailError,setDetailError]=useState('');
 const active=useRef(null),jobKey=useRef(crypto.randomUUID());
 const base=`${environmentPath(d.environment.id)}/incidents/${encodeURIComponent(d.incidentId||'')}`;
 useEffect(()=>{
  const c=new AbortController();active.current=c;setRecord(null);setJobs(null);setError('');
  if(!d.incidentId){setError('장애 목록에서 기록을 선택하세요.');return()=>c.abort();}
  Promise.all([request(base,{signal:c.signal}),request(base+`/rca-jobs?page=${page}&size=20`,{signal:c.signal})]).then(([x,j])=>{
   validateIncident(x,d.environment.id);
   if(!Array.isArray(j.items)||!Number.isInteger(j.totalPages))throw new Error('분석 작업 응답 오류');
   j.items.forEach(item=>validateJob(item,d.environment.id,x.id));
   if(!c.signal.aborted){setRecord(x);setJobs(j);}
  }).catch(e=>{if(!c.signal.aborted)setError(e.message);});
  return()=>c.abort();
 },[base,page,rev]);
 useEffect(()=>{
  const c=new AbortController();setSelected(null);setResult(null);setDetailError('');
  if(!selectedId)return()=>c.abort();
  const path=base+'/rca-jobs/'+encodeURIComponent(selectedId);
  request(path,{signal:c.signal}).then(async x=>{
   validateJob(x,d.environment.id,d.incidentId,selectedId);
   if(c.signal.aborted)return;
   setSelected(x);
   if(x.status==='SUCCEEDED'){
    const value=await request(path+'/result',{signal:c.signal});
    validateAnalysisResult(value,x,d.environment.namespace);
    if(!c.signal.aborted)setResult(value);
   }
  }).catch(e=>{if(!c.signal.aborted)setDetailError(e.message);});
  return()=>c.abort();
 },[base,selectedId,rev]);
 const mutate=async(path,method,body)=>{
  if(busy)return;setBusy(true);setError('');const c=active.current;
  try{await request(path,{method,body,signal:c.signal});if(!c.signal.aborted){jobKey.current=crypto.randomUUID();setRev(n=>n+1);}}
  catch(e){if(!c.signal.aborted)setError(e.message);}
  finally{if(!c.signal.aborted)setBusy(false);}
 };
 return <><a href="#B3-Incidents">← 장애 기록 목록</a><h1 className="page-title">{record?.title||'장애 기록 상세'}</h1>
 {error&&<p role="alert">{error}</p>}{!record&&!error&&<p role="status">조회 중…</p>}
 <button className="ui-button" disabled={busy} onClick={()=>setRev(n=>n+1)}>기록·분석 새로고침</button>
 {record&&<><section style={panel}>
  <p>수동 등록 · {record.status==='OPEN'?'열림':'수동 종료'}</p>
  <p>{record.service} · 발생 {at(record.occurredAt)} · 등록 {at(record.createdAt)}</p>
  <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{record.description||'추가 내용 없음'}</p>
  <p>종료 시각 {at(record.resolvedAt)}</p>
  <button className="ui-button" disabled={busy} onClick={()=>mutate(base,'PATCH',{status:record.status==='OPEN'?'RESOLVED':'OPEN'})}>{record.status==='OPEN'?'수동 종료':'기록 다시 열기'}</button>
  <p className="secondary-text">수동 종료는 서비스 자동 회복 판정이 아닙니다.</p>
 </section><section style={panel} aria-label="분석 작업 이력">
  <div style={{display:'flex',gap:12,justifyContent:'space-between',flexWrap:'wrap'}}><h2 style={{fontSize:16}}>분석 작업 이력</h2><button className="ui-button" disabled={busy||record.status!=='OPEN'} onClick={()=>mutate(base+'/rca-jobs','POST',{requestKey:jobKey.current})}>분석 요청 기록</button></div>
  <p className="secondary-text">모델 미연결로 대기한 요청은 연결 후에도 자동 실행되지 않습니다. 새 분석을 요청해야 합니다.</p>
  <div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr><th>작업 ID</th><th>상태</th><th>요청 시각</th><th>작업</th></tr></thead><tbody>{jobs.items.map(j=><tr key={j.id}><td><button className="ui-button" aria-pressed={selectedId===j.id} onClick={()=>setSelectedId(j.id)}>{j.id.slice(0,8)}</button></td><td>{jobLabel(j.status)}</td><td>{at(j.createdAt)}</td><td><button className="ui-button" disabled={busy||!canCancelJob(j.status)} onClick={()=>mutate(base+'/rca-jobs/'+j.id+'/cancel','POST')}>요청 취소</button></td></tr>)}</tbody></table></div>
  {!jobs.items.length&&<p>분석 요청 이력이 없습니다.</p>}
  <Pager page={page} pages={jobs.totalPages} change={setPage}/>
  {detailError&&<p role="alert">{detailError}</p>}
  {selectedId&&!selected&&!detailError&&<p role="status">작업 조회 중…</p>}
  {selected&&<div style={{overflowWrap:'anywhere'}} aria-label="선택한 분석 작업">
   <p role="status">작업 {selected.id} · {jobLabel(selected.status)}</p>
   <p>사유 {selected.reason||'—'} · 갱신 {at(selected.updatedAt)}</p>
   <p>분석 구간 {at(selected.windowStart)} ~ {at(selected.windowEnd)}</p>
   <p>시작 {at(selected.startedAt)} · 종료 {at(selected.finishedAt)}</p>
   {selected.status==='BLOCKED_MODEL_UNAVAILABLE'&&<p>모델 미연결로 이 요청의 분석은 실행되지 않았습니다.</p>}
  </div>}
 </section><section style={panel} aria-label="RCA 결과"><h2 style={{fontSize:16}}>RCA 결과</h2>
  {result?<AnalysisResult value={result}/>:<p>{!selectedId?'작업 ID를 선택하면 저장된 결과를 확인할 수 있습니다.':detailError?'결과를 확인하지 못했습니다. 새로고침 후 다시 확인하세요.':selected?.status==='SUCCEEDED'?'저장된 결과 조회 중…':selected?'이 작업에는 완료된 분석 결과가 없습니다.':'작업 조회 중…'}</p>}
 </section></>}
 </>;
}
function AnalysisResult({value}){
 return <div style={{overflowWrap:'anywhere'}}>
  <p><strong>판정 · {decisionLabel(value.decision)}</strong>{value.score!=null&&<> · 점수 {value.score}</>}</p>
  <p className="secondary-text">점수는 모델이 반환한 값이며 확률을 뜻하지 않습니다.</p>
  {value.abstainReason&&<p>보류 사유 · {({FEATURE_INPUT_UNAVAILABLE:'분석할 구간의 특징 데이터가 아직 준비되지 않았습니다.',CALIBRATION_AND_CONSECUTIVE_WINDOWS_REQUIRED:'정상 기준값과 연속 구간 확인이 필요합니다.'}[value.abstainReason]||value.abstainReason)}</p>}
  <p>모델 {value.modelVersion} · 특징 {value.featureSchemaVersion} · 계약 {value.contractVersion}</p>
  {value.candidates.length?<div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr><th>순위</th><th>원인 후보</th><th>장애 유형</th><th>점수</th><th>근거</th></tr></thead><tbody>{[...value.candidates].sort((a,b)=>a.rank-b.rank).map(c=><tr key={c.rank}><td>{c.rank}</td><td>{c.kind==='NODE'?<>서비스 · {c.service}</>:<>호출 경로 · {c.source} → {c.target}</>}</td><td>{c.faultType}</td><td>{c.score}</td><td>{c.evidence.length?<ul>{c.evidence.map((e,i)=><li key={i}>{e}</li>)}</ul>:'제공된 근거 없음'}</td></tr>)}</tbody></table></div>:<p>반환된 원인 후보가 없습니다.</p>}
 </div>;
}
