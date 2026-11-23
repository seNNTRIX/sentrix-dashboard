import React,{useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {SourceForm} from './DataSources.jsx';
import {DeploymentStatus} from './DeploymentStatus.jsx';
import {css} from '../styles.js';
export function ExploreServicePicker(){
 const d=useDesign();
 return <label className="home-service-picker">서비스
  <select className="ui-input" aria-label="조회 서비스" value={d.service} disabled={!d.serviceNames.length} onChange={e=>d.setService(e.target.value)}>
   {!d.serviceNames.length&&<option value="">{d.inventoryLoading?'조회 중…':d.inventoryError?'서비스 조회 실패':'서비스 없음'}</option>}
   {d.serviceNames.map(name=><option key={name} value={name}>{name}</option>)}
  </select>
 </label>;
}
export function QueryEditor({mode=0,labelBrowser=false,setMode}){
 const d=useDesign();if(!d)return null;
 const trace=d.route==='B6-Trace', filters=d.traceFilters;
 const setFilter=(key,value)=>d.setTraceFilters(old=>({...old,[key]:value}));
 const token=text=><span className="query-key">{text}</span>;
 const value=text=><span className="query-literal">{JSON.stringify(text)}</span>;
 return <form className="bound-query" onSubmit={e=>{e.preventDefault();mode===1?d.chooseTrace(d.traceId):d.run();}}>
  {trace&&mode!==2&&<div className="explore-filter-row" role="radiogroup" aria-label="검색 방식">{['서비스','Trace ID'].map((label,i)=><button type="button" role="radio" key={label} aria-checked={mode===i} onClick={()=>setMode(i)}>{label}</button>)}</div>}
  {mode===1?<label>Trace ID<input aria-label="Trace ID" required pattern="[0-9a-f]{32}" maxLength={32} value={d.traceId} onChange={e=>d.setTraceId(e.target.value.trim().toLowerCase())} placeholder="32자리 추적 ID"/></label>:<>
  {trace&&mode===0?<div className="explore-form-service">서비스 <strong>{d.service||'—'}</strong></div>:<div className="mono bound-query-code explore-code">{'{ '}{token(trace?'resource.service.namespace':'k8s_namespace_name')}{' = '}{value(d.environment?.namespace||'')}{trace?' && ':', '}{token(trace?'resource.service.name':'k8s_deployment_name')}{' = '}{value(d.service||'')}
   {trace&&filters.namedRoot&&<>{' && '}{token('trace:rootName')}{' != '}{value('')}</>}
   {trace&&filters.minSpanMs!==''&&<>{' && '}{token('duration')}{' > '}<b>{filters.minSpanMs}ms</b></>}
   {trace&&filters.errorOnly&&<>{' && '}{token('status')}{' = '}<b>error</b></>}
   {trace&&filters.operation&&<>{' && '}{token('name')}{' = '}{value(filters.operation)}</>}{' }'}
   {!trace&&!d.publicView&&<>{' |= "'}<input className="query-search" aria-label="포함 문자열" value={d.search} onChange={e=>d.setSearch(e.target.value)} maxLength={200} placeholder="검색어"/>{'"'}</>}
  </div>}
  {labelBrowser&&<div className="explore-label-browser"><dl><dt>k8s_namespace_name</dt><dd>{d.environment?.namespace}</dd><dt>k8s_deployment_name</dt><dd>{d.serviceNames.map(name=><button type="button" key={name} aria-pressed={name===d.service} onClick={()=>d.setService(name)}>{name}</button>)}</dd></dl></div>}
  {trace&&<details className="query-options"><summary>쿼리 조건</summary><div className="explore-filter-row"><label><input type="checkbox" checked={filters.namedRoot} onChange={e=>setFilter('namedRoot',e.target.checked)}/>루트 이름이 있는 요청</label><label>최소 span 지연 (ms)<input type="number" min="0" max="86400000" value={filters.minSpanMs} onChange={e=>setFilter('minSpanMs',e.target.value)}/></label><label><input type="checkbox" checked={filters.errorOnly} onChange={e=>setFilter('errorOnly',e.target.checked)}/>오류 span</label><label>호출 이름<input value={filters.operation} maxLength={200} onChange={e=>setFilter('operation',e.target.value)}/></label></div></details>}
  {(!d.publicView||trace)&&<label className="query-limit">Limit<select aria-label="조회 최대 개수" value={d.limit} onChange={e=>d.setLimit(e.target.value)}>{(trace?[20,50,100]:[20,50,100,500]).map(n=><option key={n}>{n}</option>)}</select></label>}
  </>}
  <button type="submit" className="sr-only">쿼리 실행</button>
 </form>;
}
export function DataNotice({detail=false}){
 const d=useDesign();if(!d)return null;
 const s=detail?d.detail:d.result;
 const warnings={MISSING_PARENT_SPANS:'수집되지 않은 부모 구간이 있습니다.',OUTSIDE_ENVIRONMENT_OMITTED:'다른 환경의 구간은 제외했습니다.',UPSTREAM_PARTIAL:'저장소가 일부 구간만 반환했습니다.',MISSING_SERVICE_NAME:'서비스 이름이 없는 구간이 있습니다.'};
 return <div className={`bound-notice ${detail?'bound-notice-detail':''}`} aria-live="polite">
  {d.loading?<p role="status">환경을 불러오는 중…</p>:d.error?<p role="alert">{d.error} <button className="ui-button" onClick={d.reload}>다시 연결</button></p>:!d.environment?<p>등록된 환경이 없습니다. <a href="#A4-Onboarding">환경 등록</a></p>:s.loading?<p role="status">조회 중…</p>:s.error?<p role="alert">{s.error}</p>:null}
  {s.data?.truncated&&<p>최근 로그 {s.data.limit}건을 표시합니다.</p>}
  {s.data?.limitReached&&<p>조회 한도에 도달해 검색된 Trace만 최신 시작 시각순으로 표시합니다.</p>}
  {!detail&&d.route==='B6-Trace'&&s.data?.items?.length===0&&<p>선택한 기간에 조건과 일치하는 Trace가 없습니다.</p>}
  {s.data?.warnings?.map(w=>warnings[w]?<p key={w}>{warnings[w]}</p>:w==='UPSTREAM_WARNING'?<p key={w}>저장소 조회 경고가 있습니다.</p>:null)}
 </div>;
}
export function UnavailablePanel({title,children,style,...props}){
 return <section {...props} style={style}><h2 id={props['aria-labelledby']} className="section-title" style={{margin:0,fontSize:14,fontWeight:500,padding:props.className?.includes('panel-padded')?undefined:'20px 24px 12px'}}>{title}</h2><div className="bound-unavailable">{children||'API 미연결'}</div></section>;
}
export function ServicePicker(){const d=useDesign();return <div className="bound-service-picker"><label>서비스 <select aria-label="관측 서비스" value={d.service} onChange={e=>{d.setService(e.target.value);location.hash=`${d.route}?service=${encodeURIComponent(e.target.value)}`;}}>{!d.inventory.some(x=>x.name===d.service)&&<option>{d.service}</option>}{d.inventory.map(x=><option key={x.name}>{x.name}</option>)}</select></label><a href={`#B7-Logs?service=${encodeURIComponent(d.service)}`}>로그</a><a href={`#B6-Trace?service=${encodeURIComponent(d.service)}`}>Trace</a></div>;}
export function ServiceReadiness(){const d=useDesign();return d.environment?<DeploymentStatus key={`${d.environment.id}:${d.service}`} environmentId={d.environment.id} service={d.service} refresh={d.revision}/>:null;}
export function BoundSettings(){
 const d=useDesign(),[type,setType]=useState(null),[query,setQuery]=useState(''),[adding,setAdding]=useState(false);
 const types=['prometheus','tempo','loki'], names={prometheus:'Prometheus',tempo:'Tempo',loki:'Loki'};
 if(type&&!d.publicView)return <div><button className="ui-button" onClick={()=>setType(null)}>데이터 소스 목록</button>{d.environment&&<SourceForm key={type} type={type} onSaved={d.run} initial={d.sources.find(s=>s.type===type)} environmentId={d.environment.id}/>}</div>;
 const visible=types.filter(x=>x.includes(query.trim().toLowerCase()));
 return <div>{d.sourceError&&<p role="alert">{d.sourceError}</p>}<div className="sx-source-tools"><input className="ui-input" aria-label="데이터 소스 검색" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름 또는 유형으로 검색"/>
 <button className="ui-button primary" disabled={d.publicView} title={d.publicView?'운영자 전용':undefined} onClick={()=>setAdding(!adding)}>데이터 소스 추가</button></div>
 {adding&&!d.publicView&&<div className="sx-source-tools">{types.map(t=><button className="ui-button" key={t} onClick={()=>{setType(t);setAdding(false);}}>{names[t]}</button>)}</div>}
 <section aria-label="데이터 소스" className="panel obs-list">{visible.map(t=>{
  const x=d.sources.find(s=>s.type===t),Row=d.publicView?'div':'button';
  return <Row key={t} className="bound-source-row" {...(d.publicView?{}:{onClick:()=>setType(t)})}><span className="bound-source-logo">{names[t][0]}</span><span><strong>{names[t]}</strong><small>{d.publicView?'주소 비공개':x?.baseUrl||'미등록'}</small></span><span>{d.publicView?'운영자 전용':x?.status==='CONNECTED'?'마지막 검사 성공':x?.status==='FAILED'?'마지막 검사 실패':'미검사'}</span></Row>;
 })}{!visible.length&&<p className="bound-unavailable">검색 결과가 없습니다.</p>}</section></div>;
}
