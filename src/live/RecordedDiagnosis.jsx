import React,{useState} from 'react';
import {useTopology} from './ObservationPanels.jsx';
import {useDesign} from './DesignContext.jsx';

const label=c=>c.kind==='EDGE'?c.source+' → '+c.target:c.service;

function EvidenceTrend({candidate,history}){
 const edge=candidate.kind==='EDGE';
 const samples=(history||[]).map(h=>({t:Date.parse(h.time),v:edge?h.latency[candidate.source+'>'+candidate.target]:h.cpu[candidate.service]}));
 const values=samples.map(p=>p.v).filter(Number.isFinite);
 if(!values.length)return null;
 const lo=Math.min(0,...values),hi=Math.max(lo+0.001,...values),t0=samples[0].t,t1=samples.at(-1).t;
 const x=t=>4+242*(t-t0)/Math.max(1,t1-t0), y=v=>71-66*(v-lo)/(hi-lo);
 let connected=false;
 const path=samples.map(p=>{if(!Number.isFinite(p.v)){connected=false;return '';}const cmd=connected?'L':'M';connected=true;return cmd+x(p.t)+','+y(p.v);}).join(' ');
 const title=edge?'경로 p90 · ms':'CPU 변화 · 평소 변동폭 단위';
 return <figure style={{margin:'16px 0'}}><figcaption>{title}</figcaption><svg viewBox="0 0 250 76" preserveAspectRatio="none" role="img" aria-label={title}><path d={path} stroke="var(--text)" fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>{samples.filter(p=>Number.isFinite(p.v)).map(p=><circle key={p.t} cx={x(p.t)} cy={y(p.v)} r="1.5" fill="var(--text)"/>)}</svg><small>{new Date(t0).toLocaleTimeString('ko-KR')} – {new Date(t1).toLocaleTimeString('ko-KR')}</small></figure>;
}

export function RecordedDiagnosis({result}){
 const d=useDesign();
 const [rank,setRank]=useState(1);
 const candidate=result.candidates.find(c=>c.rank===rank)||result.candidates[0];
 const {graph,error}=useTopology(d.environment,result.windowEnd,d.service);
 const name=label(candidate);
 return <div className="obs-candidates">
  <section aria-labelledby="cand-h"><h2 id="cand-h">원인 후보</h2><div className="panel obs-list">{result.candidates.map(c=><button type="button" key={c.rank} aria-pressed={c.rank===candidate.rank} onClick={()=>setRank(c.rank)}>
   <span>{c.rank}</span><span title={label(c)}>{label(c)}<small>{c.faultType}</small></span><span>{c.score.toFixed(2)}</span>
  </button>)}</div></section>
  <section className="panel obs-panel" aria-label="선택한 원인 후보"><header><div><small>{candidate.rank}순위 후보</small><h2>{name}</h2></div><strong className="mono">{candidate.score.toFixed(2)}</strong></header>
   <span>{candidate.faultType}</span><EvidenceTrend candidate={candidate} history={graph?.history}/>
   {error&&<small role="status">근거 시계열 조회 실패</small>}<h2>판단 근거</h2>
   <ul className="obs-evidence">{candidate.evidence.map((item,i)=><li key={i}>{item}</li>)}</ul>
   <a href={'#B2-ServiceMap?incidentId='+encodeURIComponent(d.incidentId)+'&jobId='+encodeURIComponent(result.jobId)}>Service map에서 보기</a>
  </section></div>;
}
