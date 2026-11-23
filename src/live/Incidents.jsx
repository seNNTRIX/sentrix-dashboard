import {IncidentObservations} from './IncidentObservations.jsx';
import {ExhibitionIncidents} from './ExhibitionIncidents.jsx';
import {ObservationMap} from './ObservationPanels.jsx';
import {publicView} from './public-view.js';
import {RecordedDiagnosis,candidateName} from './RecordedDiagnosis.jsx';
import {validateIncident} from './incident-values.js';
import {validateJob,validateAnalysisResult,jobLabel,canCancelJob,decisionLabel,analysisReason} from './analysis-values.js';
import React,{useEffect,useRef,useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {request,environmentPath} from './api.js';
import {Dialog} from '../components/controls.jsx';
import {DataNotice} from './DesignBindings.jsx';
const panel={border:'1px solid var(--border-weak)',borderRadius:8,background:'var(--bg1)',padding:24};
const at=t=>t?new Date(t).toLocaleString():'—';

// Schedule the next read only after the last one finishes. Changing filters aborts it.
export function pollRecords(controller, read) {
 let timer;
 async function update() {
  try {
   if (!document.hidden) await read(controller.signal);
  } finally {
   if (!controller.signal.aborted) timer=setTimeout(update,15000);
  }
 }
 update();
 return ()=>{controller.abort();clearTimeout(timer);};
}

export function IncidentPanel({recent=false, serviceScoped=false}) {
 const d=useDesign();
 const service=serviceScoped ? d.service : '';
 if(!d.environment || (serviceScoped && !service)) return null;
 return <IncidentPanelRecords key={JSON.stringify([d.environment.id,service,recent])}
  environmentId={d.environment.id} service={service} recent={recent}/>;
}

function IncidentPanelRecords({environmentId,service,recent}) {
 const [data,setData]=useState(null), [error,setError]=useState('');
 const closedResults=useRef(new Map());
 useEffect(()=>{
  const query=new URLSearchParams(recent ? {size:5} : {status:'OPEN',size:1});
  if(service) query.set('service',service);
  return pollRecords(new AbortController(),async signal=>{
   try {
    const response=await request(environmentPath(environmentId)+'/incidents?'+query,{signal});
    if(!Array.isArray(response.items)||!Number.isSafeInteger(response.totalElements)) throw new Error('장애 기록 응답을 읽을 수 없습니다.');
    response.items.forEach(row=>validateIncident(row,environmentId));
    if(recent) await Promise.all(response.items.map(async row=>{
     if(closedResults.current.has(row.id)){row.top=closedResults.current.get(row.id);return;}
     try{
      const rca=await request(environmentPath(environmentId)+'/incidents/'+row.id+'/rca',{signal});
      if(rca.environmentId!==environmentId||rca.incidentId!==row.id)return;
      row.top=rca.result?.candidates?.find(c=>c.rank===1);
      if(row.status==='RESOLVED'&&row.top){
       if(closedResults.current.size>=20)closedResults.current.delete(closedResults.current.keys().next().value);
       closedResults.current.set(row.id,row.top);
      }
     }catch{/* The incident remains readable while its analysis is unavailable. */}
    }));
    if(!signal.aborted){setData(response);setError('');}
   } catch(e){if(!signal.aborted)setError(e.message);}
  });
 },[environmentId,service,recent]);
 const title=recent?'최근 장애 기록':service?service+'에 등록된 열린 장애':'환경 전체의 열린 장애';
 if(!recent){
  const record=data?.items[0];
  return <a className="panel obs-alert" href={record?'#B4-Incident?incidentId='+encodeURIComponent(record.id):'#B3-Incidents'}>
   <span>{error?'장애 기록 조회 실패':!data?'장애 기록 조회 중…':record?'진행 중 장애 · '+record.title:'진행 중 장애 없음'}</span><span>{record?'상세 보기':'전체 보기'} →</span></a>;
 }
 return <section className="panel obs-panel sx-incidents"><header><h2>최근 장애</h2><a href="#B3-Incidents">장애 목록</a></header>
  {error?<p role="alert">{error}</p>:!data?<p role="status">조회 중…</p>:!data.items.length?<p>등록된 장애 없음</p>:
   <div className="sx-table-scroll"><table className="data-table"><thead><tr>{['ID','상태','1순위 원인 후보','후보 유형','점수','시작','지속'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>
    {data.items.map(x=>{
     const c=x.top,seconds=Math.max(0,Math.floor(((x.resolvedAt?Date.parse(x.resolvedAt):Date.now())-Date.parse(x.occurredAt))/1000));
     return <tr key={x.id}><td><a title={x.title+' · '+x.id} href={'#B4-Incident?incidentId='+x.id}>{x.id.slice(0,8)}</a></td>
      <td><span className={'sx-badge '+(x.status==='OPEN'?'open':'')}>{x.status==='OPEN'?'진행 중':'해결됨'}</span></td>
      <td>{c?.kind==='EDGE'?c.source+' → '+c.target:c?.service||'—'}</td><td>{c?.kind==='EDGE'?'호출 경로':c?.kind==='NODE'?'서비스 내부':'—'}</td>
      <td>{Number.isFinite(c?.score)?c.score.toFixed(2):'—'}</td><td>{at(x.occurredAt)}</td><td>{Math.floor(seconds/60)}분 {seconds%60}초</td></tr>;
    })}</tbody></table></div>}</section>;
}

export function Incidents(){const d=useDesign();return <><DataNotice/>{d.environment&&(location.pathname==='/display'?<ExhibitionIncidents key={d.environment.id} d={d}/>:<History key={d.environment.id} d={d}/>)}</>;}
function History({d}){
 const [page,setPage]=useState(0),[filter,setFilter]=useState(''),[service,setService]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[rev,setRev]=useState(0),[form,setForm]=useState(false);
 const base=environmentPath(d.environment.id)+'/incidents';
 useEffect(()=>{
  const c=new AbortController();
  setData(null);setError('');
  const query=new URLSearchParams({page,size:20,...(filter?{status:filter}:{}),...(service?{service}:{})});
  return pollRecords(c,async signal=>{
   try {
    const response=await request(base+'?'+query,{signal});
    if(!Array.isArray(response.items)||!Number.isInteger(response.totalPages))throw new Error('목록 응답 오류');
    response.items.forEach(item=>validateIncident(item,d.environment.id));
    if(!signal.aborted){setData(response);setError('');}
   } catch(e){if(!signal.aborted)setError(e.message);}
  });
 },[base,page,filter,service,rev]);
 return <><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><h1 className="page-title">장애 기록</h1><p className="secondary-text">모델이 감지한 이상과 운영자가 등록한 장애 기록을 확인합니다.</p></div>{!publicView&&<button className="ui-button" onClick={()=>setForm(true)}>장애 기록 등록</button>}</div><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><label>상태 <select aria-label="장애 기록 상태" value={filter} onChange={e=>{setPage(0);setFilter(e.target.value);}}><option value="">전체</option><option value="OPEN">열림</option><option value="RESOLVED">종료</option></select></label><label>서비스 <select aria-label="장애 기록 서비스" value={service} onChange={e=>{setPage(0);setService(e.target.value);}}><option value="">전체</option>{d.inventory.map(s=><option key={s.name}>{s.name}</option>)}</select></label><button className="ui-button" onClick={()=>setRev(n=>n+1)}>기록 새로고침</button></div>
 <section style={panel} aria-label="장애 기록 목록">{error?<p role="alert">{error}</p>:!data?<p role="status">조회 중…</p>:<><div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr>{['기록','서비스','상태','발생 시각','등록 방식'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{data.items.map(x=><tr key={x.id}><td><a href={`#B4-Incident?incidentId=${x.id}`}>{x.title}</a></td><td>{x.service}</td><td>{x.status==='OPEN'?'열림':'종료'}</td><td>{at(x.occurredAt)}</td><td>{x.source==='AUTOMATIC'?'자동 감지':'수동 등록'}</td></tr>)}</tbody></table></div>{!data.items.length&&<p>등록된 기록이 없습니다.</p>}<Pager page={page} pages={data.totalPages} change={setPage}/></>}</section>{form&&<Dialog title="장애 의심 상황 기록" onClose={()=>setForm(false)}><CreateIncident base={base} env={d.environment.id}/></Dialog>}</>;
}
function CreateIncident({base,env}){
 const [title,setTitle]=useState(''),[service,setService]=useState('frontend'),[description,setDescription]=useState(''),[time,setTime]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const token=useRef(crypto.randomUUID()),active=useRef(null),payload=useRef(null);
 useEffect(()=>{active.current=new AbortController();return()=>active.current.abort();},[]);
 return <form className="live-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const body={service,title,description,occurredAt:new Date(time).toISOString()};const fingerprint=JSON.stringify(body);if(payload.current!==fingerprint){token.current=crypto.randomUUID();payload.current=fingerprint;}setBusy(true);setError('');try{const x=await request(base,{method:'POST',signal:active.current.signal,body:{...body,requestKey:token.current}});validateIncident(x,env);if(!active.current.signal.aborted)location.hash=`B4-Incident?incidentId=${x.id}`;}catch(e){if(!active.current.signal.aborted)setError(e.message);}finally{if(!active.current.signal.aborted)setBusy(false);}}}><p>장애 의심 상황을 수동 기록으로 저장합니다. 자동 탐지 결과가 아닙니다.</p><label>제목<input aria-label="장애 기록 제목" required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>서비스<input aria-label="장애 기록 대상 서비스" required maxLength={253} pattern="[a-z0-9]([a-z0-9.-]*[a-z0-9])?" value={service} onChange={e=>setService(e.target.value)}/></label><label>발생 시각<input aria-label="장애 발생 시각" required type="datetime-local" value={time} onChange={e=>setTime(e.target.value)}/></label><label>관측 내용<textarea aria-label="관측 내용" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="ui-button" disabled={busy}>{busy?'저장 중…':'기록 저장'}</button></form>;
}
function Pager({page,pages,change}){return <div style={{display:'flex',gap:12,marginTop:16}}><button className="ui-button" disabled={page===0} onClick={()=>change(page-1)}>이전</button><span>{page+1} / {Math.max(1,pages)}</span><button className="ui-button" disabled={page+1>=pages} onClick={()=>change(page+1)}>다음</button></div>;}
export function IncidentDetail(){const d=useDesign();return <><DataNotice/>{d.environment&&<Detail key={`${d.environment.id}:${d.incidentId}:${d.jobId||''}`} d={d}/>}</>;}
function Detail({d}){
 const [tab,setTab]=useState(0);
 const [record,setRecord]=useState(null),[jobs,setJobs]=useState(null),[page,setPage]=useState(0),[rev,setRev]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [selectedId,setSelectedId]=useState(d.jobId||''),[selected,setSelected]=useState(null),[result,setResult]=useState(null),[detailError,setDetailError]=useState('');
 const active=useRef(null),jobKey=useRef(crypto.randomUUID()),latestKey=useRef(crypto.randomUUID());
 const pinned=useRef(Boolean(d.jobId));
 const base=`${environmentPath(d.environment.id)}/incidents/${encodeURIComponent(d.incidentId||'')}`;
 useEffect(()=>{
  const c=new AbortController();active.current=c;setRecord(null);setJobs(null);setError('');
  if(!d.incidentId){setError('장애 목록에서 기록을 선택하세요.');return()=>c.abort();}
  return pollRecords(c,async signal=>{
   try {
    const [x,j]=await Promise.all([request(base,{signal}),request(base+`/rca-jobs?page=${page}&size=20`,{signal})]);
    validateIncident(x,d.environment.id);
    if(!Array.isArray(j.items)||!Number.isInteger(j.totalPages))throw new Error('분석 작업 응답 오류');
    j.items.forEach(item=>validateJob(item,d.environment.id,x.id));
    if(signal.aborted)return;
    setRecord(x);setJobs(j);setError('');
    if(!pinned.current && page===0 && j.items.length){
     let diagnosis;
     try { diagnosis=await request(base+'/rca',{signal}); }
     catch(error) {
      if(error.status!==404)throw error;
      if(!signal.aborted && !pinned.current)setSelectedId(id=>id||j.items[0].id);
      return;
     }
     if(diagnosis.incidentId!==x.id || diagnosis.environmentId!==d.environment.id)throw new Error('원인 분석의 환경 또는 기록이 일치하지 않습니다.');
     if(!signal.aborted && !pinned.current)setSelectedId(diagnosis.result?.jobId || j.items[0].id);
    }
   } catch(e){if(!signal.aborted)setError(e.message);}
  });
 },[base,page,rev]);
 useEffect(()=>{
  const c=new AbortController();setSelected(null);setResult(null);setDetailError('');
  if(!selectedId)return()=>c.abort();
  const path=base+'/rca-jobs/'+encodeURIComponent(selectedId);
  let timer;
  const readJob=()=>request(path,{signal:c.signal}).then(async x=>{
   validateJob(x,d.environment.id,d.incidentId,selectedId);
   if(c.signal.aborted)return;
   setSelected(x);
   if(['QUEUED','RUNNING'].includes(x.status)) timer=setTimeout(readJob,3000);
   setJobs(j=>j&&({...j,items:j.items.map(item=>item.id===x.id?x:item)}));
   if(x.status==='SUCCEEDED'){
    const value=await request(path+'/result',{signal:c.signal});
    validateAnalysisResult(value,x,d.environment.namespace);
    if(!c.signal.aborted)setResult(value);
   }
  }).catch(e=>{if(!c.signal.aborted)setDetailError(e.message);});
  readJob();
  return()=>{c.abort();clearTimeout(timer);};
 },[base,selectedId,rev]);
 const mutate=async(path,method,body)=>{
  if(busy)return;setBusy(true);setError('');const c=active.current;
  try {
   const response=await request(path,{method,body,signal:c.signal});
   if(c.signal.aborted)return;
   if(body?.requestKey){
    validateJob(response,d.environment.id,d.incidentId);
    const key=body.latest?latestKey:jobKey;
    key.current=crypto.randomUUID();
    pinned.current=true;setSelectedId(response.id);
    setPage(0);
   }
   setRev(n=>n+1);
  }
  catch(e){if(!c.signal.aborted)setError(e.message);}
  finally{if(!c.signal.aborted)setBusy(false);}
 };
 if(d.environment.recorded || location.pathname==='/display'){
  const candidate=result?.candidates?.[0],service=candidate?.source||candidate?.service||record?.service;
  const period=new URLSearchParams({service:service||d.service,at:result?.windowEnd||record?.occurredAt||d.range.to});
  const tabs=['요약','타임라인','전파 경로','Trace와 로그','메모'];
  const open=record?.status==='OPEN';
  const shortId=record?.id.slice(0,8);
  const seconds=Math.max(0,Math.floor(((Date.parse(record?.resolvedAt)||Date.now())-Date.parse(record?.occurredAt))/1000));
  return <><header className="rca-heading"><div><h1 className="page-title">{candidate?candidateName(candidate)+' 이상':record?.title||'장애 상세'}</h1>
   {record&&<div className="rca-meta"><strong className={open?'active':''}>{open?'진행 중':'해결됨'}</strong><span>{at(record.occurredAt)} 시작 · {Math.floor(seconds/60)}분 {seconds%60}초</span><span>{shortId}</span></div>}</div>
   <div className="rca-actions"><a className="ui-button" href="#B3-Incidents">장애 목록</a>{!d.publicView&&record?.source==='MANUAL'&&<button type="button" className="ui-button" disabled={busy} onClick={()=>mutate(base,'PATCH',{status:open?'RESOLVED':'OPEN'})}>{open?'해결됨으로 표시':'다시 열기'}</button>}</div></header>
   <div role="tablist" className="sx-page-tabs" aria-label="장애 상세">{tabs.map((t,i)=><button role="tab" key={t} aria-selected={tab===i} onClick={()=>setTab(i)}>{t}</button>)}</div>
   {error||detailError?<p role="alert">{error||detailError}</p>:null}
   {tab===0&&(result?.candidates?.length?<RecordedDiagnosis key={result.jobId} result={result} record={record}/>:<p role="status">{result?'이 구간의 원인 후보 없음':selected?.status==='FAILED'?'분석 실패':jobs&&!jobs.items.length?'분석 기록 없음':'분석 결과 조회 중…'}</p>)}
   {(tab===1||tab===3)&&record&&<IncidentObservations key={tab+':'+service+':'+period.get('at')} d={d} service={service} end={period.get('at')} timeline={tab===1}/>}
   {tab===1&&<section className="panel obs-panel"><h2>장애 타임라인</h2><div className="sx-table-scroll"><table className="data-table"><thead><tr><th>시각</th><th>이벤트</th></tr></thead><tbody>{[[record?.occurredAt,'장애 발생'],[record?.createdAt,'기록 등록'],[selected?.finishedAt,'선택한 모델 분석 종료'],[record?.resolvedAt,'장애 종료']].filter(([t])=>t).sort((a,b)=>Date.parse(a[0])-Date.parse(b[0])).map(([time,title])=><tr key={title}><td>{at(time)}</td><td>{title}</td></tr>)}</tbody></table></div></section>}
   {tab===2&&<ObservationMap embedded result={result}/>}

   {tab===4&&<section className="panel obs-panel"><h2>메모</h2><p>{record?.description||'등록된 메모가 없습니다.'}</p></section>}
  </>;
 }
 return <><a href="#B3-Incidents">← 장애 기록 목록</a><h1 className="page-title">{record?.title||'장애 기록 상세'}</h1>
 {error&&<p role="alert">{error}</p>}{!record&&!error&&<p role="status">조회 중…</p>}
 <button className="ui-button" disabled={busy} onClick={()=>setRev(n=>n+1)}>기록·분석 새로고침</button>
 {record&&<><section style={panel}>
  <p>{record.source==='AUTOMATIC'?'자동 감지':'수동 등록'} · {record.status==='OPEN'?'열림':'종료'}</p>
  <p>{record.service} · 발생 {at(record.occurredAt)} · 등록 {at(record.createdAt)}</p>
  <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{record.description||'추가 내용 없음'}</p>
  <p>종료 시각 {at(record.resolvedAt)}</p>
  {record.source==='MANUAL'&&<><button className="ui-button" disabled={busy} onClick={()=>mutate(base,'PATCH',{status:record.status==='OPEN'?'RESOLVED':'OPEN'})}>{record.status==='OPEN'?'수동 종료':'기록 다시 열기'}</button>
  <p className="secondary-text">수동 종료는 서비스 자동 회복 판정이 아닙니다.</p></>}
 </section>
 <section style={panel} aria-label="분석 작업 이력">
  <div style={{display:'flex',gap:12,justifyContent:'space-between',flexWrap:'wrap'}}><h2 style={{fontSize:16}}>분석 작업 이력</h2><button className="ui-button" disabled={busy||record.status!=='OPEN'} onClick={()=>mutate(base+'/rca-jobs','POST',{requestKey:jobKey.current})}>발생 시점 분석</button><button className="ui-button" disabled={busy||record.status!=='OPEN'} onClick={()=>mutate(base+'/rca-jobs','POST',{requestKey:latestKey.current,latest:true})}>최근 30초 분석</button></div>
  <p className="secondary-text">모델 미연결로 대기한 요청은 연결 후에도 자동 실행되지 않습니다. 새 분석을 요청해야 합니다.</p>
  <div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr><th>분석 구간 시작</th><th>작업 ID</th><th>상태</th><th>요청 시각</th><th>작업</th></tr></thead><tbody>{jobs.items.map(j=><tr key={j.id}><td><button className="ui-button" aria-pressed={selectedId===j.id} onClick={()=>{pinned.current=true;setSelectedId(j.id);}}>{at(j.windowStart)}</button></td><td>{j.id.slice(0,8)}</td><td>{jobLabel(j.status)}</td><td>{at(j.createdAt)}</td><td><button className="ui-button" disabled={busy||!canCancelJob(j.status)} onClick={()=>mutate(base+'/rca-jobs/'+j.id+'/cancel','POST')}>요청 취소</button></td></tr>)}</tbody></table></div>
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
  {result?<AnalysisResult value={result} showCandidates={!d.environment.recorded}/>:<p>{!selectedId?'작업 ID를 선택하면 저장된 결과를 확인할 수 있습니다.':detailError?'결과를 확인하지 못했습니다. 새로고침 후 다시 확인하세요.':selected?.status==='SUCCEEDED'?'저장된 결과 조회 중…':selected?'이 작업에는 완료된 분석 결과가 없습니다.':'작업 조회 중…'}</p>}
 </section></>}
 </>;
}
function AnalysisResult({value,showCandidates=true}){
 return <div style={{overflowWrap:'anywhere'}}>
  <p><strong>판정 · {decisionLabel(value.decision)}</strong>{value.score!=null&&<> · 점수 {value.score}</>}</p>
  <p className="secondary-text">점수는 모델이 반환한 값이며 확률을 뜻하지 않습니다.</p>
  {value.abstainReason&&<p>보류 사유 · {analysisReason(value.abstainReason)}</p>}
  <p>모델 {value.modelVersion} · 특징 {value.featureSchemaVersion} · 계약 {value.contractVersion}</p>
  {!showCandidates&&value.candidates.length?null:value.candidates.length?<div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr><th>순위</th><th>원인 후보</th><th>장애 유형</th><th>점수</th><th>근거</th></tr></thead><tbody>{[...value.candidates].sort((a,b)=>a.rank-b.rank).map(c=><tr key={c.rank}><td>{c.rank}</td><td>{c.kind==='NODE'?<>서비스 · {c.service}</>:<>호출 경로 · {c.source} → {c.target}</>}</td><td>{c.faultType}</td><td>{c.score}</td><td>{c.evidence.length?<ul>{c.evidence.map((e,i)=><li key={i}>{e}</li>)}</ul>:'제공된 근거 없음'}</td></tr>)}</tbody></table></div>:<p>반환된 원인 후보가 없습니다.</p>}
 </div>;
}
