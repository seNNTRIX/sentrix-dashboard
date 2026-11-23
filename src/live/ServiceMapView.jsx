import React,{useEffect,useId,useRef,useState} from 'react';
import {environmentPath,queryRange,request} from './api.js';
import {focusedTopology} from './map-sample.js';
import {formatErrorPercent} from './design-values.js';
import {MetricPlot} from './OverviewPlots.jsx';
import './service-map.css';

const positions={frontend:[90,330],adservice:[330,60],recommendationservice:[330,190],checkoutservice:[330,460],cartservice:[330,590],productcatalogservice:[600,120],currencyservice:[600,300],'redis-cart':[600,590],paymentservice:[860,360],shippingservice:[860,470],emailservice:[860,590]};
const definitions=[['request_rate','Requests','/s'],['error_ratio','Error rate','%'],['latency_p50_ms','p50',' ms'],['latency_p90_ms','p90',' ms'],['latency_p99_ms','p99',' ms']];
const format=v=>Number.isFinite(v)?v.toLocaleString('ko-KR',{maximumFractionDigits:2}):'—';
const clock=t=>new Date(t).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});
const last=points=>points?.findLast(p=>Number.isFinite(p.value))?.value;
async function pointsFor(env,service,metric,range,signal){
 const r=await request(environmentPath(env.id)+'/metrics?'+new URLSearchParams({service,metric,...range}),{signal});
 if(r.environmentId!==env.id || r.service!==service || r.metric!==metric || !Array.isArray(r.points))throw Error('서비스 지표 응답을 확인하세요.');
 return r.points;
}

function useReadings(env,names,range){
 const [data,setData]=useState({});
 const namesKey=JSON.stringify(names);
 useEffect(()=>{setData({});},[env?.id,namesKey]);
 useEffect(()=>{
  if(!env||env.recorded)return;
  const c=new AbortController(), queue=JSON.parse(namesKey);
  const recent=queryRange(Math.max(Date.parse(range.from),Date.parse(range.to)-120000),range.to);
  async function worker(){
   while(queue.length&&!c.signal.aborted){
    const n=queue.shift(), results=await Promise.allSettled(['request_rate','latency_p99_ms'].map(m=>pointsFor(env,n,m,recent,c.signal)));
    if(!c.signal.aborted)setData(v=>({...v,[n]:results.map(r=>last(r.value))}));
   }
  }
  Promise.all([worker(),worker()]);
  return ()=>c.abort();
 },[env?.id,env?.recorded,namesKey,range.from,range.to]);
 return data;
}

function Inspector({env,name,range,decision,rank,incidentId,jobId,traceId,windows,onClose}){
 const [snapshot,setSnapshot]=useState(null);
 useEffect(()=>{
  if(!env||env.recorded)return;
  const c=new AbortController();
  Promise.allSettled(definitions.map(([m])=>pointsFor(env,name,m,range,c.signal))).then(values=>{
   if(!c.signal.aborted)setSnapshot({range,readings:Object.fromEntries(values.map((r,i)=>[definitions[i][0],r.status==='fulfilled'?r.value:null]))});
  });
  return ()=>c.abort();
 },[env?.id,env?.recorded,name,range.from,range.to,range.stepSeconds]);
 const readings=snapshot?.readings||{}, plottedRange=snapshot?.range||range;
 const refreshing=!env?.recorded && (!snapshot||plottedRange.from!==range.from||plottedRange.to!==range.to);
 const series=readings.latency_p99_ms||[],peak=Math.max(1,...series.map(p=>p.value||0));
 const serviceQuery=new URLSearchParams({service:name});
 if(jobId)serviceQuery.set('at',range.to);
 const incidentQuery=new URLSearchParams({incidentId:incidentId||''});
 if(jobId)incidentQuery.set('jobId',jobId);
 return <aside className="sm-inspector panel" aria-label="선택 서비스 관계">
  <header><h2>{name}</h2><button type="button" onClick={onClose} aria-label="서비스 패널 닫기">×</button></header>
  <div className="sm-badges"><span>{decision}</span>{rank&&<b>원인 후보 {rank}순위</b>}</div>
  <dl>{definitions.map(([m,label,unit])=>{
   const value=m==='error_ratio'?readings[m]?.at(-1)?.value:last(readings[m]);
   const display=!Number.isFinite(value)?'—':m==='error_ratio'?formatErrorPercent(value*100):format(value)+unit;
   return <div key={m}><dt>{label}</dt><dd>{display}</dd></div>;
  })}</dl>
  <div className="sm-trend" aria-busy={refreshing}><span>p99 latency{snapshot&&refreshing?' · 갱신 중':''}</span>{series.some(p=>Number.isFinite(p.value))?<MetricPlot chart={{series:[series],max:peak*1.08,aria:name+' p99 지연'}} range={plottedRange} rows={windows}/>:<div className="sm-no-series">{!snapshot&&!env?.recorded?'지표 조회 중…':readings.latency_p99_ms===null?'지표 조회 실패':'관측값 없음'}</div>}
  <footer><time>{clock(plottedRange.from)}</time><time>{clock(plottedRange.to)}</time></footer></div>
  <nav><a href={'#B5-Service?'+serviceQuery}>서비스 Dashboard</a>
   {incidentId&&<a href={'#B4-Incident?'+incidentQuery}>장애 원인 분석</a>}
   <a href={'#B6-Trace?'+(traceId?new URLSearchParams({traceId,service:name}):serviceQuery)}>{traceId?'이 요청의 Trace 상세':'관련 trace'}</a></nav>
 </aside>;
}

export function ServiceMapView({d,nodes:graphNodes,edges,range=d.range,candidates=[],decision,preferred,incidentId,jobId,traceId,scope,error,loading=false,onSearch,focusedService,onFocus}) {
 const [pick,setPick]=useState(null),[mode,setMode]=useState('상태'),[causes,setCauses]=useState(true);
 const [overflow,setOverflow]=useState(false),scroll=useRef(null),uid=useId().replace(/:/g,'');
 const [traceFocus,setTraceFocus]=useState('');
 const nodes=d.applicationServices?graphNodes.filter(n=>d.applicationServices.includes(n)):graphNodes;
 const requestedFocus=focusedService??traceFocus;
 const focus=nodes.includes(requestedFocus)?requestedFocus:'';
 const selected=focus||(pick===''?'':nodes.includes(preferred)?preferred:nodes.includes('productcatalogservice')?'productcatalogservice':nodes[0]);
 const readings=useReadings(d.environment,nodes,range);
 useEffect(()=>{const el=scroll.current;if(!el)return;const resize=()=>setOverflow(el.scrollWidth>el.clientWidth+1);resize();const o=new ResizeObserver(resize);o.observe(el);return ()=>o.disconnect();},[nodes.length,selected]);
 const extra=nodes.filter(n=>!Object.hasOwn(positions,n)),height=nodes.some(n=>Object.hasOwn(positions,n))?650:0;
 function pos(n){if(neighborhood)return neighborhood.positions.get(n);const i=extra.indexOf(n);return i<0?positions[n]:[125+(i%4)*245,height+55+Math.floor(i/4)*105];}

 const shown=causes?candidates:[];
 const nodeRanks=new Map(shown.filter(c=>c.kind==='NODE').map(c=>[c.service,c.rank]));
 const edgeRanks=new Map(shown.filter(c=>c.kind==='EDGE').map(c=>[JSON.stringify([c.source,c.target]),c.rank]));
 const allLinks=edges.filter(e=>nodes.includes(e.source)&&nodes.includes(e.target));
 const observed=new Set(allLinks.map(e=>JSON.stringify([e.source,e.target])));
 for(const c of shown)if(c.kind==='EDGE'&&nodes.includes(c.source)&&nodes.includes(c.target)&&!observed.has(JSON.stringify([c.source,c.target])))allLinks.push({...c,candidateOnly:true});
 const neighborhood=focus?focusedTopology(focus,allLinks):null;
 const links=neighborhood?.links||allLinks;
 const visible=neighborhood?[...neighborhood.positions.keys()]:nodes;
 const canvasHeight=neighborhood?.height??(height+Math.ceil(extra.length/4)*105);
 const maxCalls=Math.max(1,...links.map(e=>e.observedCalls||e.calls||0));
 function choose(n){
  setPick(n||null);(onFocus||setTraceFocus)(n);onSearch?.(n);
  if(scroll.current)scroll.current.scrollLeft=0;
 }
 function state(n){
  const v=readings[n]?.[1];
  if(mode==='지연')return Number.isFinite(v)?(v>=400?'이상':v>=200?'경고':'정상'):'미관측';
  if(mode==='오류')return links.some(e=>e.target===n&&e.explicitErrorCount>0)?'오류 관측':'미판정';
  if(decision==='NORMAL')return '환경 정상';
  if(decision==='ANOMALY'&&candidates.some(c=>c.kind==='NODE'&&c.service===n&&c.rank===1))return '이상 후보';
  return '미판정';
 }
 return <><div className="sm-toolbar"><label>기준 서비스 <select className="ui-input" aria-label="기준 서비스" value={focus} onChange={e=>choose(e.target.value)}><option value="">전체 서비스</option>{nodes.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
 <div className="sx-map-modes" role="radiogroup" aria-label="지도 표시">{['상태','지연','오류'].map(m=><button key={m} role="radio" aria-checked={mode===m} onClick={()=>setMode(m)}>{m}</button>)}</div>
 <label><input type="checkbox" checked={causes} onChange={e=>setCauses(e.target.checked)}/> 원인 후보 표시</label></div>
 <div className="sm-layout"><section className="sm-surface panel" aria-label="서비스 호출 그래프">
 {overflow&&<div className="sm-guide">가로로 스크롤하여 전체 서비스 맵 보기</div>}
 {focus&&<div className="sm-focus-head"><span>호출하는 서비스</span><strong>{focus}</strong><span>호출받는 서비스</span></div>}
 <div className="sm-scroll" ref={scroll} tabIndex={0} aria-label="서비스 맵 가로 탐색">
 {nodes.length>0?<div className={focus?"sm-canvas sm-focused":"sm-canvas"} style={{'--sm-canvas-height':canvasHeight+'px'}}>
 <svg viewBox={'0 0 1000 '+canvasHeight} preserveAspectRatio="none" aria-hidden="true"><defs>{['base','slow','rank','bad'].map(k=><marker key={k} id={uid+k} viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path className={'sm-fill-'+k} d="M0 0L8 4L0 8Z"/></marker>)}</defs>
 {links.map(e=>{const [x,y]=pos(e.source),[a,b]=pos(e.target),key=JSON.stringify([e.source,e.target]),rank=edgeRanks.get(key),delay=e.p90Ms??(Number.isFinite(e.p90)?e.p90*1000:e.maxServerDurationMs),k=rank?'rank':mode==='오류'&&e.explicitErrorCount?'bad':delay>=200?'slow':'base';
 const reverse=observed.has(JSON.stringify([e.target,e.source]))&&e.source!==e.target;
 const length=Math.hypot(a-x,b-y)||1, midX=(x+a)/2-(reverse?(b-y)*15/length:0),midY=(y+b)/2+(reverse?(a-x)*15/length:0);
 const path=e.source===e.target?`M${x} ${y} Q${x-100} ${y-85} ${x} ${y-50} Q${x+90} ${y-75} ${x} ${y}`:`M${x} ${y} L${midX} ${midY} L${a} ${b}`;
 return <path key={key} className={'sm-edge sm-line-'+k} d={path} strokeWidth={rank?2.7:1+1.7*(e.observedCalls||e.calls||0)/maxCalls} strokeDasharray={e.candidateOnly?'5 4':undefined} markerMid={'url(#'+uid+k+')'}><title>{e.source+' → '+e.target}{rank?' · 원인 후보 '+rank+'순위':''}{e.candidateOnly?' · 표본에서 미관측':''}</title></path>;})}</svg>
 {visible.map(n=>{const [x,y]=pos(n),[rate,delay]=readings[n]||[],status=state(n);
 return <button type="button" className="sm-node" key={n} data-name={n} data-state={status} aria-label={n+' 선택'} aria-pressed={selected===n} title={n+' · '+status} style={{left:x/10+'%',top:(y/canvasHeight)*100+'%'}} onClick={()=>choose(n)}><span>{n.endsWith('service')?<>{n.slice(0,-7)}<wbr/>service</>:n}</span><small>{format(delay)} ms, {format(rate)}/s {nodeRanks.has(n)&&<b>{nodeRanks.get(n)}순위</b>}</small></button>;})}</div>:<div className="sm-empty">{loading?'호출 관계 조회 중…':error||'관측된 서비스 없음'}</div>}</div>
 {focus&&!loading&&!error&&!links.some(e=>!e.candidateOnly)&&<small className="sm-scope">조회 구간에서 확인된 직접 호출 없음</small>}
 <footer className="sm-legend"><span><i/>정상</span><span><i/>경고</span><span><i/>이상</span><span><i/>원인 후보 연결</span><span>{traceId?'선 두께는 관측 호출 수, 진한 선은 최대 지연 200 ms 이상':'선 두께는 관측 호출 수, 진한 선은 p90 200 ms 이상'}</span></footer>
 {scope&&<small className="sm-scope">{scope}</small>}{error&&nodes.length>0&&<small role="status">{error}</small>}</section>
 {selected&&<Inspector key={d.environment?.id+':'+selected} env={d.environment} name={selected} range={range} windows={d.overview?.recentWindows} decision={state(selected)} rank={nodeRanks.get(selected)} incidentId={incidentId} jobId={jobId} traceId={traceId} onClose={()=>{choose('');setPick('');}}/>}</div></>;
}
