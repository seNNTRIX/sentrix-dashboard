import React, { useEffect, useState } from 'react';
import { request, environmentPath, metricDefinitions, queryRange, chartPath } from './api.js';
import { useEnvironment } from './EnvironmentContext.jsx';
import { Button, DataViewport } from '../components/controls.jsx';

const format = value => new Intl.NumberFormat('ko-KR',{maximumSignificantDigits:4}).format(value);
const dateInput = date => new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
const statusLabels = { AVAILABLE:'데이터 있음', PARTIAL:'일부 데이터 누락·경고', NO_DATA:'데이터 없음' };

function MetricCard({ definition, state, retry }) {
 const [id,title,unit,factor] = definition;
 const points = state?.data?.points || [], data = state?.data;
 const latest = points.at(-1)?.value;
 const hasValues = points.some(p=>Number.isFinite(p.value));
 const finiteValues = points.filter(p=>Number.isFinite(p.value)).map(p=>p.value*factor);
 const min = Math.min(0,...finiteValues), max = Math.max(1,...finiteValues);
 return <section className="live-panel metric-card" aria-label={title} data-metric={id}>
  <div className="live-row"><h2>{title}</h2><span className="secondary-text">{unit}</span></div>
  {state?.loading || !state ? <p className="metric-placeholder" role="status">조회 중…</p> : state.error ? <div className="metric-placeholder"><p role="alert" className="field-error">{state.error}</p><Button onClick={retry}>다시 조회</Button><a href="#C3-Settings">연결 설정 확인</a></div> : <>
   <div className="metric-value">{Number.isFinite(latest) ? format(latest*factor) : '—'}</div>
   <p className="secondary-text">{statusLabels[data.dataStatus]} · 마지막 조회 지점 기준</p>
   {hasValues ? <svg className="metric-chart" viewBox="0 0 584 140" role="img" aria-label={`${title}, ${statusLabels[data.dataStatus]}. 누락 구간은 선으로 연결하지 않습니다.`}>
    <path d="M12 124H572" className="chart-axis"/><path d={chartPath(points,factor)} className="chart-line"/>
    {points.map((p,i)=>Number.isFinite(p.value) && <circle key={p.timestamp} cx={i/Math.max(1,points.length-1)*560+12} cy={124-(p.value*factor-min)/(max-min)*112} r="2"><title>{new Date(p.timestamp).toLocaleString()} · {format(p.value*factor)} {unit}</title></circle>)}
   </svg> : <p className="metric-placeholder">이 구간에는 계산 가능한 데이터가 없습니다.</p>}
   <div className="live-row secondary-text"><time>{points[0] && new Date(points[0].timestamp).toLocaleTimeString()}</time><time>{points.at(-1) && new Date(points.at(-1).timestamp).toLocaleTimeString()}</time></div>
   {data.warnings?.length>0 && <p className="secondary-text">{data.warnings.includes('NON_FINITE_VALUES')?'계산할 수 없는 값은 비워 두었습니다. ':''}{data.warnings.includes('UPSTREAM_WARNING')?'관측 저장소가 조회 경고를 반환했습니다.':''}</p>}
   <details><summary>최근 20개 지점 보기</summary><DataViewport label={`${title} 데이터`}><table className="live-table"><thead><tr><th>시각</th><th>{unit}</th></tr></thead><tbody>{points.slice(-20).map(p=><tr key={p.timestamp}><td>{new Date(p.timestamp).toLocaleString()}</td><td>{Number.isFinite(p.value)?format(p.value*factor):'데이터 없음'}</td></tr>)}</tbody></table></DataViewport></details>
  </>}
 </section>;
}

export function ServiceMetrics({ route, params }) {
 const { environment } = useEnvironment();
 const [inventory,setInventory] = useState({loading:true}), [inventoryRevision,setInventoryRevision] = useState(0);
 const [service,setService] = useState(params.get('service') || '');
 const [duration,setDuration] = useState('3600'), [start,setStart] = useState(()=>dateInput(new Date(Date.now()-3600000))), [end,setEnd] = useState(()=>dateInput(new Date()));
 const [range,setRange] = useState(()=>queryRange(Date.now()-3600000,Date.now())), [rangeError,setRangeError] = useState('');
 const [refresh,setRefresh] = useState(0), [automatic,setAutomatic] = useState(false), [metrics,setMetrics] = useState({});
 const reload = () => { if(duration!=='custom')setRange(queryRange(Date.now()-Number(duration)*1000,Date.now())); setRefresh(n=>n+1); };
 useEffect(()=>{
  if (!automatic) return;
  const timer = setInterval(reload,30000); return ()=>clearInterval(timer);
 },[automatic,duration]);
 useEffect(()=>{
  const controller = new AbortController(); setInventory({loading:true});
  request(`${environmentPath(environment.id)}/services`,{signal:controller.signal})
   .then(data=>{
    if (!Array.isArray(data.items)) throw new Error('서비스 목록 형식이 올바르지 않습니다.');
    if(controller.signal.aborted)return;
    setInventory({data});
    setService(current=>current || data.items.find(s=>s.name==='frontend')?.name || data.items[0]?.name || '');
   }).catch(e=>{if(!controller.signal.aborted)setInventory({error:e.message});});
  return ()=>controller.abort();
 },[environment.id,inventoryRevision]);
 const knownService = inventory.data?.items.some(s=>s.name===service);
 const requestedService = params.get('service') || '';
 useEffect(()=>{
  setService(requestedService || inventory.data?.items.find(s=>s.name==='frontend')?.name || inventory.data?.items[0]?.name || '');
 },[requestedService,inventory.data]);
 useEffect(()=>{
  setMetrics({});
  if (!knownService) return;
  const controller = new AbortController();
  for (const [metric] of metricDefinitions) {
   setMetrics(old=>({...old,[metric]:{loading:true}}));
   const query = new URLSearchParams({service,metric,...range});
   request(`${environmentPath(environment.id)}/metrics?${query}`,{signal:controller.signal})
    .then(data=>{
     if (!Array.isArray(data.points) || data.metric!==metric || data.service!==service || !statusLabels[data.dataStatus]) throw new Error('지표 응답 형식이 올바르지 않습니다.');
     if(!controller.signal.aborted)setMetrics(old=>({...old,[metric]:{data}}));
    }).catch(e=>{if(!controller.signal.aborted)setMetrics(old=>({...old,[metric]:{error:e.message}}));});
  }
  return ()=>controller.abort();
 },[environment.id,service,knownService,range,refresh]);
 const changeService = value => { setService(value); location.hash=`${route}?service=${encodeURIComponent(value)}`; };
 return <><div className="live-row"><div><h1 className="page-title">{route==='B5-Service'?'서비스 상세':'서비스별 개요'}</h1><p className="secondary-text">{environment.name} · namespace {environment.namespace} · Kubernetes Deployment 기준</p></div><a className="ui-button" href="#C3-Settings">데이터 소스 설정</a></div>
  <section className="live-panel live-form"><div className="live-row"><h2>관측 서비스</h2><Button onClick={()=>setInventoryRevision(n=>n+1)} icon="refresh">서비스 목록 새로고침</Button></div>
   {inventory.loading ? <p role="status">서비스 목록을 불러오는 중…</p> : inventory.error ? <p className="field-error" role="alert">{inventory.error}</p> : inventory.data.items.length===0 ? <p role="status">관측된 Deployment가 없습니다. Namespace와 수집 설정을 확인하세요.</p> : <>
    <label>서비스<select aria-label="서비스" value={knownService?service:''} onChange={e=>changeService(e.target.value)}><option disabled value="">서비스 선택</option>{inventory.data.items.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
    {service&&!knownService&&<p role="status">이 환경에서 {service}을 찾지 못했습니다. 서비스를 다시 선택하세요.</p>}
    <p className="secondary-text">{inventory.data.items.length}개 Deployment · 조회 시각 {new Date(inventory.data.queriedAt).toLocaleString()}{inventory.data.dataStatus==='PARTIAL'?' · 수집 서버 조회 경고 있음':''}</p>
    {knownService&&route!=='B5-Service'&&<a href={`#B5-Service?service=${encodeURIComponent(service)}`}>{service} 상세 보기</a>}
   </>}
  </section>
  {knownService && <>
   <form className="live-panel range-controls" onSubmit={e=>{e.preventDefault();try{setRange(queryRange(start,end));setRangeError('');setRefresh(n=>n+1);}catch(e){setRangeError(e.message);}}}>
    <label>조회 기간<select aria-label="조회 기간" value={duration} onChange={e=>{setDuration(e.target.value);setRangeError('');if(e.target.value!=='custom')setRange(queryRange(Date.now()-Number(e.target.value)*1000,Date.now()));}}>{[[300,'지난 5분'],[900,'지난 15분'],[3600,'지난 1시간'],[21600,'지난 6시간'],[86400,'지난 24시간'],['custom','직접 지정']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    {duration==='custom'&&<><label>시작<input type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}/></label><label>끝<input type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}/></label><Button type="submit">기간 적용</Button></>}
    <Button icon="refresh" onClick={reload}>지표 새로고침</Button><label className="inline-label"><input type="checkbox" checked={automatic} onChange={e=>setAutomatic(e.target.checked)}/>30초마다 새로고침</label>
    {rangeError&&<p className="field-error" role="alert">{rangeError}</p>}
    <p className="secondary-text range-caption">{new Date(range.from).toLocaleString()} ~ {new Date(range.to).toLocaleString()} · {range.stepSeconds}초 간격 · 브라우저 시간대</p>
   </form>
   <div className="live-metric-grid">{metricDefinitions.map(definition=><MetricCard key={definition[0]} definition={definition} state={metrics[definition[0]]} retry={reload}/>)}</div>
   <p className="secondary-text">데이터 없음은 0과 다릅니다. 요청 지표는 트레이스 계측이 필요하며, 데이터가 있다는 사실만으로 서비스가 정상임을 뜻하지 않습니다.</p>
  </>}
 </>;
}
