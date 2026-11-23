import React, {useEffect, useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {environmentPath, request} from './api.js';
import {validateMap} from './observation-values.js';

const coordinates = {
 frontend:[90,330], adservice:[330,60], recommendationservice:[330,190],
 checkoutservice:[330,460], cartservice:[330,590], productcatalogservice:[600,120],
 currencyservice:[600,300], 'redis-cart':[600,590], paymentservice:[860,360],
 shippingservice:[860,470], emailservice:[860,590]
};
const previewCoordinates = {
 frontend:[102,150], productcatalogservice:[306,60], currencyservice:[306,150],
 recommendationservice:[306,240], checkoutservice:[504,150], cartservice:[504,240]
};
const clock = time => new Date(time).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});
const number = value => Number.isFinite(value) ? value.toFixed(2) : '—';

export function AnomalyChart({rows,error}) {
 const series = [...(rows || [])].sort((a,b)=>Date.parse(a.windowEnd)-Date.parse(b.windowEnd));
 const first = Date.parse(series[0]?.windowEnd), last = Date.parse(series.at(-1)?.windowEnd);
 const scores = series.map(row=>row.score).filter(Number.isFinite);
 const max = Math.max(1,...scores), min = Math.min(0,...scores);
 const x = row => 4+592*(Date.parse(row.windowEnd)-first)/Math.max(1,last-first);
 const y = row => 155-150*(row.score-min)/(max-min);
 let previous;
 const line = series.map(row=>{
  if(!Number.isFinite(row.score)){previous=null;return '';}
  const joined=previous && previous.windowEnd===row.windowStart;
  previous=row;
  return (joined?'L':'M')+x(row)+','+y(row);
 }).join(' ');
 return <section className="panel panel-padded obs-panel obs-score" aria-labelledby="score-h">
  <header><h2 id="score-h">Anomaly score</h2><span className="mono">현재 {number(series.at(-1)?.score)}</span></header>
  {scores.length ? <><svg viewBox="0 0 600 160" preserveAspectRatio="none" role="img" aria-label="분석 구간별 이상 점수">
   <path d="M0 159.5H600" stroke="var(--border-weak)"/><path d={line} stroke="var(--text)" fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
   {series.filter(row=>Number.isFinite(row.score)).map(row=><circle key={row.jobId} cx={x(row)} cy={y(row)} r="2" fill={row.decision==='ANOMALY'?'var(--error)':'var(--text)'}/>)}
  </svg><footer>{clock(first)}<span>{clock(last)}</span></footer></>:<div className="obs-empty">{error || (rows?'분석 점수 없음':'조회 중…')}</div>}
 </section>;
}

export function useTopology(environment,end,service,inventoryTrace) {
 const [state,setState]=useState({});
 useEffect(()=>{
  const controller=new AbortController(), signal=controller.signal;
  setState({});
  if(!environment)return ()=>controller.abort();
  const base=environmentPath(environment.id);
  async function load(){
   if(environment.recorded) return request(base+'/observed-topology?'+new URLSearchParams({end}),{signal});
   const to=end, from=new Date(Date.parse(to)-15*60000).toISOString();
   let traceId=inventoryTrace;
   if(!traceId){
    const recent=await request(base+'/traces?'+new URLSearchParams({service,from,to,limit:1}),{signal});
    traceId=recent.items?.[0]?.traceId;
   }
   if(!traceId)return {nodes:[],edges:[]};
   const graph=await request(base+'/service-map?'+new URLSearchParams({traceId}),{signal});
   validateMap(graph,environment.id,traceId);
   return graph;
  }
  load().then(graph=>{if(!signal.aborted)setState({graph});}).catch(e=>{if(!signal.aborted)setState({error:e.message});});
  return ()=>controller.abort();
 },[environment?.id,environment?.recorded,end,service,inventoryTrace]);
 return state;
}

function MapGraph({nodes,edges,mini,select,selected,candidates=[]}){
 const positions=mini?previewCoordinates:coordinates;
 const known=nodes.filter(n=>positions[n]);
 const visible=mini?[...known,...nodes.filter(n=>!positions[n])].slice(0,6):nodes;
 const extras=visible.filter(n=>!positions[n]);
 const height=mini?300:680+100*Math.ceil(extras.length/4), width=mini?600:1000;
 const slots=Object.values(positions).filter(pair=>!known.some(n=>positions[n]===pair));
 const pos=n=>positions[n]||(mini?slots[extras.indexOf(n)]:[110+230*(extras.indexOf(n)%4),670+Math.floor(extras.indexOf(n)/4)*100]);
 const links=edges.filter(e=>visible.includes(e.source)&&visible.includes(e.target));
 return <div className={'obs-graph '+(mini?'obs-mini':'obs-full')} style={{aspectRatio:width+'/'+height}}>
  <svg viewBox={'0 0 '+width+' '+height} aria-hidden="true" preserveAspectRatio="none">
  <defs><marker id="obs-direction" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="var(--border-strong)"/></marker></defs>
  {links.map(e=>{const [x,y]=pos(e.source),[a,b]=pos(e.target);
   const ranked=candidates.find(c=>c.kind==='EDGE'&&c.source===e.source&&c.target===e.target);
   return <g key={e.source+'>'+e.target}><path d={`M${x} ${y} L${(x+a)/2} ${(y+b)/2} L${a} ${b}`} stroke={ranked?'var(--cause)':'var(--border-strong)'} vectorEffect="non-scaling-stroke" strokeWidth={ranked?2:1} fill="none" markerMid={mini?undefined:'url(#obs-direction)'}/>{ranked&&!mini&&<g transform={`translate(${(x+a)/2},${(y+b)/2})`}><circle r="10" fill="var(--bg1)" stroke="var(--cause)"/><text y="4" textAnchor="middle" fontSize="12" fill="var(--cause)">{ranked.rank}</text><title>{ranked.rank}순위 · {e.source} → {e.target}</title></g>}</g>;})}</svg>
  {visible.map(n=>{const [x,y]=pos(n),style={left:100*x/width+'%',top:100*y/height+'%'};
   const ranked=candidates.find(c=>c.kind==='NODE'&&c.service===n);
   return mini?<span key={n} className="obs-node" style={style}>{n}</span>:<button type="button" key={n} className="obs-node" aria-pressed={selected===n} onClick={()=>select(n)} style={style}>{n}{ranked&&<small>후보 {ranked.rank}순위</small>}</button>;})}
 </div>;
}

export function ObservationMap({mini=false}) {
 const d=useDesign(),[pick,setPick]=useState('');
 const [diagnosis,setDiagnosis]=useState(null);
 useEffect(()=>{
  const alarm=d.overview?.recentWindows?.find(w=>w.decision==='ANOMALY'&&w.incidentId);
  const incident=d.incidentId||alarm?.incidentId, job=d.jobId||alarm?.jobId;
  const controller=new AbortController();
  setDiagnosis(null);
  if(d.environment && incident && job){
   request(environmentPath(d.environment.id)+'/incidents/'+encodeURIComponent(incident)+'/rca-jobs/'+encodeURIComponent(job)+'/result',{signal:controller.signal})
    .then(r=>{if(!controller.signal.aborted && r.environmentId===d.environment.id && r.jobId===job)setDiagnosis(r);}).catch(()=>{});
  }
  return ()=>controller.abort();
 },[d.environment?.id,d.incidentId,d.jobId,d.overview?.recentWindows?.find(w=>w.decision==='ANOMALY'&&w.incidentId)?.jobId]);
 const end=(d.incidentId && diagnosis?.windowEnd)||d.overview?.recentWindows?.[0]?.windowEnd||d.range.to;
 const {graph,error}=useTopology(d.environment,end,d.service,d.traceId);
 const nodes=graph?.nodes?.length?graph.nodes:d.inventory.map(n=>n.name),edges=graph?.edges||[];
 const first=diagnosis?.candidates?.[0],subject=first?.target || first?.service || d.service;
 const chosen=nodes.includes(pick)?pick:nodes.includes(subject)?subject:nodes[0];
 const latency=Object.entries(graph?.history?.at(-1)?.latency || {}).filter(([edge,value])=>edge.endsWith('>'+chosen)&&Number.isFinite(value)).map(([,value])=>value);
 const content=nodes.length?<MapGraph nodes={nodes} edges={edges} mini={mini} selected={chosen} select={setPick} candidates={diagnosis?.candidates||[]}/>:<div className="obs-empty">{error?'호출 관계 조회 실패':graph?'관측된 서비스 없음':'조회 중…'}</div>;
 if(mini)return <section className="panel panel-padded obs-panel obs-map" aria-labelledby="map-h"><header><h2 id="map-h">Service map</h2><a href="#B2-ServiceMap">전체 보기</a></header><a href="#B2-ServiceMap" aria-label="Service map 열기">{content}</a></section>;
 return <><header><h1 className="page-title">Service map</h1><span className="secondary-text">{d.environment?.name}</span></header>
 <div className="obs-map-layout"><section className="panel obs-panel" aria-label="서비스 호출 그래프">{content}
 {error&&<small role="status">호출 관계 조회 실패</small>}</section>
 {chosen&&<aside className="panel obs-panel"><h2>{chosen}</h2>
 <dl>{[['호출하는 연결',edges.filter(e=>e.source===chosen).length],['호출받는 연결',edges.filter(e=>e.target===chosen).length]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{graph?v:'—'}</dd></div>)}{latency.length>0&&<div><dt>수신 경로 최대 p90</dt><dd>{number(Math.max(...latency))} ms</dd></div>}</dl>
 <a className="ui-button" href={'#B5-Service?service='+encodeURIComponent(chosen)}>서비스 Dashboard</a></aside>}</div></>;
}
