import React,{useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {SourceForm} from './DataSources.jsx';
import {DeploymentStatus} from './DeploymentStatus.jsx';
import {css} from '../styles.js';
export function QueryEditor({mode=0}){
 const d=useDesign();if(!d)return null;
 const trace=d.route==='B6-Trace';
 const query=trace?`{ resource.service.namespace = ${JSON.stringify(d.environment?.namespace||'')} && resource.service.name = ${JSON.stringify(d.service)} }`:`{k8s_namespace_name=${JSON.stringify(d.environment?.namespace||'')}, k8s_deployment_name=${JSON.stringify(d.service)}}${d.search?' |= '+JSON.stringify(d.search):''}`;
 return <form className="bound-query" onSubmit={e=>{e.preventDefault();mode===1?d.chooseTrace(d.traceId):d.run();}}>
  {mode===1?<label>Trace ID<input aria-label="Trace ID" required pattern="[0-9a-f]{32}" maxLength={32} value={d.traceId} onChange={e=>d.setTraceId(e.target.value.trim().toLowerCase())} placeholder="32자리 추적 ID"/></label>:<>
   <div className="bound-filters"><label>서비스<input aria-label="조회 서비스" required maxLength={253} pattern="[a-z0-9]([a-z0-9.-]*[a-z0-9])?" value={d.service} onChange={e=>d.setService(e.target.value)}/></label>
   {!trace&&<label>포함 문자열<input aria-label="포함 문자열" maxLength={200} value={d.search} onChange={e=>d.setSearch(e.target.value)} placeholder="원문 검색"/></label>}
   <label>Limit<select aria-label="조회 최대 개수" value={d.limit} onChange={e=>d.setLimit(e.target.value)}>{(trace?[20,50,100]:[20,50,100,500]).map(n=><option key={n}>{n}</option>)}</select></label></div>
   <div className="mono bound-query-code">{query}</div>
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
  {s.data?.truncated&&<p>최신 {s.data.limit}건만 표시합니다. 전체 로그 수가 아닙니다.</p>}
  {s.data?.limitReached&&<p>검색 상한에 도달했습니다. 검색된 결과 내에서 시작 시각 역순이며 전체 최신 요청을 보장하지 않습니다.</p>}
  {s.data?.items?.length===0&&<p>조건에 맞는 데이터가 없습니다. 기간과 수집 상태를 확인하세요.</p>}
  {s.data?.warnings?.map(w=>warnings[w]?<p key={w}>{warnings[w]}</p>:w==='UPSTREAM_WARNING'?<p key={w}>저장소 조회 경고가 있습니다.</p>:null)}
 </div>;
}
export function UnavailablePanel({title,children,style,...props}){
 return <section {...props} style={style}><h2 id={props['aria-labelledby']} className="section-title" style={{margin:0,fontSize:14,fontWeight:500,padding:props.className?.includes('panel-padded')?undefined:'20px 24px 12px'}}>{title}</h2><div className="bound-unavailable">{children||'API 미연결'}</div></section>;
}
export function ServicePicker(){const d=useDesign();return <div className="bound-service-picker"><label>서비스 <select aria-label="관측 서비스" value={d.service} onChange={e=>{d.setService(e.target.value);location.hash=`${d.route}?service=${encodeURIComponent(e.target.value)}`;}}>{!d.inventory.some(x=>x.name===d.service)&&<option>{d.service}</option>}{d.inventory.map(x=><option key={x.name}>{x.name}</option>)}</select></label><a href={`#B5-Service?service=${encodeURIComponent(d.service)}`}>서비스 상세</a><a href={`#B7-Logs?service=${encodeURIComponent(d.service)}`}>로그</a><a href={`#B6-Trace?service=${encodeURIComponent(d.service)}`}>Trace</a></div>;}
export function ServiceReadiness(){const d=useDesign();return d.environment?<DeploymentStatus key={`${d.environment.id}:${d.service}`} environmentId={d.environment.id} service={d.service} refresh={d.revision}/>:null;}
export function BoundSettings(){
 const d=useDesign(),[type,setType]=useState(null);
 return <div>{d.sourceError?<p role="alert">{d.sourceError}</p>:null}{type?<><button className="ui-button" onClick={()=>setType(null)}>데이터 소스 목록</button>{d.environment&&<SourceForm key={`${d.environment.id}:${type}`} type={type} onSaved={d.run} initial={d.sources.find(s=>s.type===type)} environmentId={d.environment.id}/>}</>:<section className="panel" style={css('border:1px solid var(--border-weak);border-radius:8px;background:var(--bg1);overflow:hidden')}>{['prometheus','tempo','loki'].map(type=>{const x=d.sources.find(s=>s.type===type);return <button key={type} onClick={()=>setType(type)} className="bound-source-row"><span className="bound-source-logo">{type[0].toUpperCase()}</span><span><strong>{type==='prometheus'?'Prometheus':type==='tempo'?'Tempo':'Loki'}</strong><span className="secondary-text mono" style={{display:'block'}}>{x?.baseUrl||'미등록'}</span></span><span style={{marginLeft:'auto'}}>{x?.status==='CONNECTED'?'마지막 검사 성공':x?.status==='FAILED'?'마지막 검사 실패':'미검사'}</span></button>;})}</section>}</div>;
}
