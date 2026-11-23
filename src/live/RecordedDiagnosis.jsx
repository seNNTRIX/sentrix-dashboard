import React,{useState,useEffect} from 'react';
import {environmentPath,request,queryRange} from './api.js';
import {MetricPlot} from './OverviewPlots.jsx';
import {useDesign} from './DesignContext.jsx';

export const candidateName=c=>c.kind==='EDGE'?c.source+' → '+c.target:c.service;
const clock=t=>new Date(t).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});

function EvidenceTrend({candidate,record,end,environment}){
 const [state,setState]=useState({});
 const edge=candidate.kind==='EDGE', recorded=environment.recorded;
 const names=edge?[candidate.source,candidate.target]:[candidate.service];
 const metric=edge?'latency_p90_ms':'cpu_usage_cores';
 const key=JSON.stringify([environment.id,end,...names]);
 useEffect(()=>{
  const ctrl=new AbortController(),signal=ctrl.signal,base=environmentPath(environment.id);
  const range=queryRange(Date.parse(end)-1800000,Date.parse(end));
  async function read(){
   if(recorded){
    const graph=await request(base+'/observed-topology?'+new URLSearchParams({end}),{signal});
    return [(graph.history||[]).map(h=>({timestamp:h.time,value:edge?h.latency?.[names.join('>')]:h.cpu?.[names[0]]})).filter(p=>Date.parse(p.timestamp)>=Date.parse(range.from))];
   }
   return Promise.all(names.map(async service=>{
    const r=await request(base+'/metrics?'+new URLSearchParams({service,metric,...range}),{signal});
    if(r.environmentId!==environment.id||r.service!==service||r.metric!==metric||!Array.isArray(r.points))throw Error('시계열 응답을 확인하세요.');
    return r.points;
   }));
  }
  read().then(series=>{if(!signal.aborted)setState({key,range,series});}).catch(e=>{if(!signal.aborted)setState({key,error:e.message});});
  return ()=>ctrl.abort();
 },[key,recorded]);
 const title=recorded?(edge?'경로 Span p90 (ms)':'CPU 변화 · 평소 변동폭 단위'):(edge?'서비스별 서버 처리 시간 p90 (ms)':'CPU 사용량 (cores)');
 const loaded=state.key===key,series=loaded?state.series:null;
 const values=(series||[]).flat().map(p=>p.value).filter(Number.isFinite);
 const bands=record?[{jobId:record.id,decision:'ANOMALY',windowStart:record.occurredAt,windowEnd:record.resolvedAt||end}]:[];
 return <figure className="rca-trend"><figcaption><span>{title}</span><span>{clock(Date.parse(end)-1800000)}–{clock(end)}</span></figcaption>
 {values.length?<MetricPlot chart={{series,max:Math.max(.001,...values)*1.08,aria:title}} rows={bands} range={state.range}/>:<div className="rca-empty" role="status">{loaded?(state.error||'선택한 기간에 수집된 값이 없습니다.'):'시계열 조회 중…'}</div>}
 <div className="rca-keys">{(recorded?[candidateName(candidate)]:names).map((n,i)=><span key={n}><i style={{background:i?'var(--text-2)':'var(--text)'}}/>{n}</span>)}<span><i className="rca-band-key"/>장애 구간</span></div></figure>;
}

export function RecordedDiagnosis({result,record}){
 const d=useDesign(),[rank,setRank]=useState(1);
 const candidate=result.candidates.find(c=>c.rank===rank)||result.candidates[0];
 const name=candidateName(candidate);
 const period=new URLSearchParams({service:candidate.source||candidate.service,at:result.windowEnd});
 return <div className="obs-candidates rca-summary">
  <section aria-labelledby="cand-h"><h2 id="cand-h">원인 후보</h2><div className="panel obs-list">{result.candidates.map(c=><button type="button" key={c.rank} aria-pressed={c.rank===candidate.rank} onClick={()=>setRank(c.rank)}>
   <span>{c.rank}</span><span><span className="rca-name" title={candidateName(c)}>{candidateName(c)}</span><small title={c.faultType}>{c.faultType}</small></span><span>{c.score.toFixed(2)}</span>
  </button>)}</div></section>
  <section className="panel obs-panel rca-detail" aria-labelledby="sel-h"><header><div><small>{candidate.rank}순위 후보</small><h2 id="sel-h">{name}</h2><span className={'rca-tag '+(candidate.kind==='EDGE'?'edge':'node')}>{candidate.faultType}</span></div><div className="rca-score"><strong>{candidate.score.toFixed(2)}</strong><small>점수</small></div></header>
  <EvidenceTrend candidate={candidate} end={result.windowEnd} record={record} environment={d.environment}/>
  <section><h3>Evidence</h3><ul className="obs-evidence">{candidate.evidence.map((item,i)=>{
   const match=item.match(/^(.*?)\s+([-+]?\d[\d.,]*\s*(?:ms|%|s)?)\s*→\s*([-+]?\d[\d.,]*\s*(?:ms|%|s)?)$/);
   return <li key={i}><small>모델 근거</small><span>{match?match[1]:item}</span>{match&&<span className="rca-values">{match[2]} → <b>{match[3]}</b></span>}</li>;
  })}</ul></section>
  <nav aria-label="관련 관측 화면">{[['B5-Service','서비스 Dashboard'],['B6-Trace','관련 trace'],['B7-Logs','관련 로그']].map(([route,title])=><a key={route} href={'#'+route+'?'+period}>{title}</a>)}<a href={'#B2-ServiceMap?incidentId='+encodeURIComponent(d.incidentId)+'&jobId='+encodeURIComponent(result.jobId)}>Service map</a></nav>
 </section></div>;
}
