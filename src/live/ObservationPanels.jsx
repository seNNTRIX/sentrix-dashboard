import React, {useEffect, useMemo, useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {environmentPath, queryRange, request} from './api.js';
import {ServiceMapView} from './ServiceMapView.jsx';
import {sampleIds,sampleTopology} from './map-sample.js';
import {TimePicker} from '../components/TimePicker.jsx';
import {validateMap} from './observation-values.js';

const previewCoordinates = {
 frontend:[102,150], productcatalogservice:[306,60], currencyservice:[306,150],
 recommendationservice:[306,240], checkoutservice:[504,150], cartservice:[504,240]
};

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

function useMapSample(env,service,range) {
 const [result,setResult]=useState({});
 useEffect(()=>setResult({}),[env?.id,service]);
 useEffect(()=>{
  if(!env||env.recorded)return;
  const c=new AbortController(),signal=c.signal,base=environmentPath(env.id);
  async function load(){
   const results=await request(base+'/traces?'+new URLSearchParams({service,from:range.from,to:range.to,limit:50}),{signal});
   if(results.environmentId!==env.id||!Array.isArray(results.items))throw Error('Trace 목록 응답을 확인하세요.');
   const ids=sampleIds(results.items);
   const responses=await Promise.allSettled(ids.map(async id=>{
    const trace=await request(base+'/traces/'+encodeURIComponent(id),{signal});
    if(trace.environmentId!==env.id||trace.traceId!==id||!Array.isArray(trace.spans))throw Error('Trace 응답을 확인하세요.');
    return trace;
   }));
   const valid=responses.filter(r=>r.status==='fulfilled').map(r=>r.value);
   return {graph:sampleTopology(valid),error:valid.length<ids.length?'일부 요청의 호출 관계를 조회하지 못했습니다.':''};
  }
  load().then(r=>{if(!signal.aborted)setResult(r);}).catch(e=>{if(!signal.aborted)setResult({error:e.message});});
  return ()=>c.abort();
 },[env?.id,env?.recorded,service,range.from,range.to]);
 return result;
}

function MapPreview({nodes,edges,candidates=[]}){
 const top=candidates[0],focus=top?(top.kind==='EDGE'?[top.source,top.target]:[top.service]):[];
 const visible=[...new Set([...focus,...Object.keys(previewCoordinates),...nodes].filter(n=>nodes.includes(n)))].slice(0,6);
 const extras=visible.filter(n=>!previewCoordinates[n]);
 const slots=Object.entries(previewCoordinates).filter(([name])=>!visible.includes(name)).map(([,xy])=>xy);
 const pos=n=>previewCoordinates[n]||slots[extras.indexOf(n)];
 return <div className="obs-graph obs-mini" style={{aspectRatio:2}}>
 <svg viewBox="0 0 600 300" aria-hidden="true" preserveAspectRatio="none">{edges.filter(e=>visible.includes(e.source)&&visible.includes(e.target)).map(e=>{
  const [x,y]=pos(e.source),[a,b]=pos(e.target);
  const ranked=candidates.some(c=>c.kind==='EDGE'&&c.source===e.source&&c.target===e.target);
  return <line key={e.source+'>'+e.target} x1={x} y1={y} x2={a} y2={b} stroke={ranked?'var(--cause)':'var(--border-strong)'} strokeWidth={ranked?2:1} vectorEffect="non-scaling-stroke"/>;
 })}</svg>
 {visible.map(n=>{const [x,y]=pos(n);return <span key={n} className="obs-node" data-cause={top?.source===n?'source':(top?.target===n||top?.service===n)?'first':undefined} style={{left:x/6+'%',top:y/3+'%'}}>{n.endsWith('service')?<>{n.slice(0,-7)}<wbr/>service</>:n}</span>;})}</div>;
}

export function ObservationMap({mini=false,embedded=false}) {
 const d=useDesign();
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
 const pinned=d.incidentId&&diagnosis?.windowEnd;
 const range=useMemo(()=>pinned?queryRange(Date.parse(pinned)-(Date.parse(d.range.to)-Date.parse(d.range.from)),pinned):d.range,[pinned,d.range]);
 const single=useTopology(mini||d.environment?.recorded?d.environment:null,end,d.service,d.traceId);
 const sampled=useMapSample(mini?null:d.environment,d.service,range);
 const {graph,error}=mini||d.environment?.recorded?single:sampled;
 const edges=graph?.edges||[], inventory=d.inventory.map(n=>n.name);
 const first=diagnosis?.candidates?.[0];
 if(mini){
  const nodes=graph?.nodes?.length?graph.nodes:inventory;
  return <section className="panel panel-padded obs-panel obs-map" aria-labelledby="map-h"><header><h2 id="map-h">Service map</h2><a href="#B2-ServiceMap">전체 보기</a></header><a href="#B2-ServiceMap" aria-label="Service map 열기">{nodes.length?<MapPreview nodes={nodes} edges={edges} candidates={diagnosis?.candidates}/>:<span className="obs-empty">{error||'관측된 서비스 없음'}</span>}</a></section>;
 }
 const nodes=[...new Set([...inventory,...(graph?.nodes||[])])].filter(n=>!d.applicationServices||d.applicationServices.includes(n)).sort();
 const decision=pinned?diagnosis?.decision:latest?.decision;
 return <>{!embedded&&<header style={{display:'flex',justifyContent:'space-between',alignItems:'end',flexWrap:'wrap',gap:12}}><div><h1 className="page-title" style={{fontSize:22,margin:0}}>Service map</h1><span className="secondary-text">{d.environment?.name} · 서비스 {nodes.length}개 · 관측 연결 {edges.filter(e=>nodes.includes(e.source)&&nodes.includes(e.target)).length}개</span></div>{!pinned&&<TimePicker/>}</header>}
 <ServiceMapView key={d.environment?.id} d={d} nodes={nodes} edges={edges} range={range} candidates={diagnosis?.candidates} decision={decision} preferred={first?.target||first?.service||new URLSearchParams(location.hash.split('?')[1]).get('service')} incidentId={d.incidentId||alarm?.incidentId} jobId={d.jobId||alarm?.jobId} error={error} loading={!graph&&!error} scope={graph?.sampleSize!==undefined?'최근 요청 '+graph.sampleSize+'건에서 확인한 호출 관계':undefined}/></>;
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
