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

function MapGraph({nodes,edges,mini,select,selected,candidates=[],mode=0}){
 const positions=mini?previewCoordinates:coordinates;
 const known=nodes.filter(n=>positions[n]);
 const top=candidates[0],focus=top?(top.kind==='EDGE'?[top.source,top.target]:[top.service]):[];
 const visible=mini?[...new Set([...focus.filter(n=>nodes.includes(n)),...Object.keys(positions).filter(n=>known.includes(n)),...nodes])].slice(0,6):nodes;
 const extras=visible.filter(n=>!positions[n]);
 const height=mini?300:680+100*Math.ceil(extras.length/4), width=mini?600:1000;
 const slots=Object.values(positions).filter(pair=>!visible.some(n=>positions[n]===pair));
 const pos=n=>positions[n]||(mini?slots[extras.indexOf(n)]:[110+230*(extras.indexOf(n)%4),670+Math.floor(extras.indexOf(n)/4)*100]);
 const links=edges.filter(e=>visible.includes(e.source)&&visible.includes(e.target));
 return <div className={'obs-graph '+(mini?'obs-mini':'obs-full')} style={{aspectRatio:width+'/'+height}}>
  <svg viewBox={'0 0 '+width+' '+height} aria-hidden="true" preserveAspectRatio="none">
  <defs><marker id="obs-direction" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="var(--border-strong)"/></marker></defs>
  {links.map(e=>{const [x,y]=pos(e.source),[a,b]=pos(e.target);
   const ranked=candidates.find(c=>c.kind==='EDGE'&&c.source===e.source&&c.target===e.target);
   const highlight=mode===1&&e.maxServerDurationMs>=200||mode===2&&e.explicitErrorCount>0;
   return <g key={e.source+'>'+e.target}><path d={`M${x} ${y} L${(x+a)/2} ${(y+b)/2} L${a} ${b}`} stroke={ranked?'var(--cause)':highlight?'var(--error)':'var(--border-strong)'} vectorEffect="non-scaling-stroke" strokeWidth={ranked?2:1} fill="none" markerMid={mini?undefined:'url(#obs-direction)'}/>{ranked&&!mini&&<g transform={`translate(${(x+a)/2},${(y+b)/2})`}><circle r="10" fill="var(--bg1)" stroke="var(--cause)"/><text y="4" textAnchor="middle" fontSize="12" fill="var(--cause)">{ranked.rank}</text><title>{ranked.rank}순위 · {e.source} → {e.target}</title></g>}</g>;})}</svg>
  {visible.map(n=>{const [x,y]=pos(n),style={left:100*x/width+'%',top:100*y/height+'%'};
   const ranked=candidates.find(c=>c.kind==='NODE'&&c.service===n);
   return mini?<span key={n} className="obs-node" data-cause={top?.source===n?'source':(top?.target===n||top?.service===n)?'first':undefined} style={style}>{n.endsWith('service')?<>{n.slice(0,-7)}<wbr/>service</>:n}</span>:<button type="button" key={n} className="obs-node" aria-pressed={selected===n} onClick={()=>select(n)} style={style}>{n}{ranked&&<small>후보 {ranked.rank}순위</small>}</button>;})}
 </div>;
}

export function ObservationMap({mini=false,embedded=false}) {
 const d=useDesign(),[pick,setPick]=useState(''),[showCause,setShowCause]=useState(true),[mode,setMode]=useState(0),[search,setSearch]=useState('');
 const [diagnosis,setDiagnosis]=useState(null);
 const latest=d.overview?.recentWindows?.find(w=>w.decision);
 const alarm=latest?.decision==='ANOMALY'?latest:null;
 useEffect(()=>{
  const incident=d.incidentId||alarm?.incidentId, job=d.jobId||alarm?.jobId;
  const controller=new AbortController();
  setDiagnosis(null);
  if(d.environment && incident && job){
   request(environmentPath(d.environment.id)+'/incidents/'+encodeURIComponent(incident)+'/rca-jobs/'+encodeURIComponent(job)+'/result',{signal:controller.signal})
    .then(r=>{if(!controller.signal.aborted && r.environmentId===d.environment.id && r.jobId===job)setDiagnosis(r);}).catch(()=>{});
  }
  return ()=>controller.abort();
 },[d.environment?.id,d.incidentId,d.jobId,alarm?.jobId]);
 const end=(d.incidentId && diagnosis?.windowEnd)||d.overview?.recentWindows?.[0]?.windowEnd||d.range.to;
 const {graph,error}=useTopology(d.environment,end,d.service,d.traceId);
 const nodes=graph?.nodes?.length?graph.nodes:d.inventory.map(n=>n.name),edges=graph?.edges||[];
 const first=diagnosis?.candidates?.[0],subject=first?.target || first?.service || d.service;
 const chosen=nodes.includes(pick)?pick:nodes.includes(subject)?subject:nodes[0];
 const latency=Object.entries(graph?.history?.at(-1)?.latency || {}).filter(([edge,value])=>edge.endsWith('>'+chosen)&&Number.isFinite(value)).map(([,value])=>value);
 const content=nodes.length?<MapGraph nodes={nodes} edges={edges} mini={mini} selected={chosen} select={setPick} mode={mode} candidates={showCause?(diagnosis?.candidates||[]):[]}/>:<div className="obs-empty">{error?'호출 관계 조회 실패':graph?'관측된 서비스 없음':'조회 중…'}</div>;
 if(mini)return <section className="panel panel-padded obs-panel obs-map" aria-labelledby="map-h"><header><h2 id="map-h">Service map</h2><a href="#B2-ServiceMap">전체 보기</a></header><a href="#B2-ServiceMap" aria-label="Service map 열기">{content}</a></section>;
 return <>{!embedded&&<header><h1 className="page-title">Service map</h1><span className="secondary-text">{d.environment?.name}{graph?' · 서비스 '+graph.nodes.length+'개, 연결 '+graph.edges.length+'개':''}</span></header>}
 <div className="sx-map-tools"><div className="sx-map-modes" role="radiogroup" aria-label="지도 표시">{['상태','지연','오류'].map((m,i)=><button key={m} role="radio" aria-checked={mode===i} onClick={()=>setMode(i)}>{m}</button>)}</div><label>서비스 검색 <input type="search" list="sx-map-services" value={search} onChange={e=>{setSearch(e.target.value);if(nodes.includes(e.target.value))setPick(e.target.value);}}/></label><datalist id="sx-map-services">{nodes.map(n=><option key={n}>{n}</option>)}</datalist><label><input type="checkbox" checked={showCause} onChange={e=>setShowCause(e.target.checked)}/> 원인 후보 표시</label></div>
 <div className="obs-map-layout"><section className="panel obs-panel" aria-label="서비스 호출 그래프">{content}
 {mode>0&&<small>{mode===1?'빨간 연결 · 관측된 최대 서버 처리 시간 200 ms 이상':'빨간 연결 · 관측된 오류 span 포함'}</small>}{error&&<small role="status">호출 관계 조회 실패</small>}</section>
 {chosen&&<aside className="panel obs-panel"><h2>{chosen}</h2><MapMetrics d={d} service={chosen}/>
 <dl>{[['호출하는 연결',edges.filter(e=>e.source===chosen).length],['호출받는 연결',edges.filter(e=>e.target===chosen).length]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{graph?v:'—'}</dd></div>)}{latency.length>0&&<div><dt>수신 경로 최대 p90</dt><dd>{number(Math.max(...latency))} ms</dd></div>}</dl>
 <a className="ui-button" href={'#B5-Service?service='+encodeURIComponent(chosen)}>서비스 Dashboard</a> <a className="ui-button" href={'#B6-Trace?service='+encodeURIComponent(chosen)}>관련 Trace</a>{d.incidentId&&<a className="ui-button" href={'#B4-Incident?incidentId='+d.incidentId}>원인 분석</a>}</aside>}</div></>;
}

export function ServiceConnections(){
 const d=useDesign(),{graph,error}=useTopology(d.environment,d.range.to,d.service);
 const edges=(graph?.edges||[]).filter(e=>e.target===d.service);
 return <section className="panel obs-panel"><header><h2>호출받는 연결</h2><a href={'#B6-Trace?service='+encodeURIComponent(d.service)}>관련 Trace</a></header>
 <div className="sx-table-scroll"><table className="data-table"><thead><tr><th>호출 서비스</th><th>대상 서비스</th><th>관측 호출</th><th>최대 처리 시간</th></tr></thead><tbody>
 {edges.map(e=><tr key={e.source}><td>{e.source}</td><td>{e.target}</td><td>{e.observedCalls??'—'}</td><td>{Number.isFinite(e.maxServerDurationMs)?number(e.maxServerDurationMs)+' ms':'—'}</td></tr>)}</tbody></table></div>
 <small>{error||(!graph?'조회 중…':d.environment?.recorded?'선택 구간에 기록된 경로':'최근 조회한 요청 한 건에서 관측된 호출 경로')}</small></section>;
}
export function ServiceIncidents(){
 const d=useDesign(),items=new Map();
 for(const w of d.overview?.recentWindows||[]){
  const loc=w.locations?.find(c=>[c.source,c.target,c.service].includes(d.service));
  if(w.incidentId&&loc&&!items.has(w.incidentId))items.set(w.incidentId,{w,loc});
 }
 return <section className="panel obs-panel"><header><h2>원인 후보에 오른 장애</h2><a href="#B3-Incidents">장애 목록</a></header><div className="sx-table-scroll"><table className="data-table"><thead><tr><th>장애</th><th>순위</th><th>원인 후보</th><th>분석 시각</th></tr></thead><tbody>{[...items].map(([id,{w,loc}])=><tr key={id}><td><a href={'#B4-Incident?incidentId='+id+'&jobId='+w.jobId}>{id.slice(0,8)}</a></td><td>{loc.rank}</td><td>{loc.service||loc.source+' → '+loc.target}</td><td>{new Date(w.windowEnd).toLocaleString('ko-KR')}</td></tr>)}</tbody></table></div>
 <small>{d.overview?.error||(!d.overview?'조회 중…':items.size?'최근 분석 구간의 상위 3개 후보 기준':'최근 분석 구간에서 이 서비스가 상위 3개 후보에 오른 기록이 없습니다.')}</small></section>;
}

function MapMetrics({d,service}){
 const [metrics,setMetrics]=useState({});
 const definitions=[['request_rate','Requests',' req/s'],['error_ratio','Error rate','%'],['latency_p50_ms','p50',' ms'],['latency_p90_ms','p90',' ms'],['latency_p99_ms','p99',' ms']];
 useEffect(()=>{const c=new AbortController();setMetrics({});
  if(d.environment&&!d.environment.recorded)for(const [metric] of definitions){
   request(environmentPath(d.environment.id)+'/metrics?'+new URLSearchParams({service,metric,...d.range}),{signal:c.signal}).then(data=>{
    if(!c.signal.aborted&&data.service===service&&data.metric===metric&&Array.isArray(data.points))setMetrics(current=>({...current,[metric]:data.points}));
   }).catch(()=>{});
  }
  return ()=>c.abort();},[d.environment?.id,service,d.range]);
 const latency=metrics.latency_p99_ms||[],peak=Math.max(1,...latency.map(p=>p.value||0));let previous=false;
 const spark=latency.map((p,i)=>{if(!Number.isFinite(p.value)){previous=false;return '';}const cmd=previous?'L':'M';previous=true;return cmd+(i*210/Math.max(1,latency.length-1))+','+(52-p.value/peak*50);}).join(' ');
 return <><dl>{definitions.map(([id,title,unit])=>{const value=metrics[id]?.at(-1)?.value;return <div key={id}><dt>{title}</dt><dd>{Number.isFinite(value)?number(id==='error_ratio'?100*value:value)+unit:'—'}</dd></div>;})}</dl><small>p99 latency</small>{spark&&<svg viewBox="0 0 210 54" role="img" aria-label={service+' p99 지연'}><path d={spark} fill="none" stroke="var(--text)" vectorEffect="non-scaling-stroke"/></svg>}</>;
}
