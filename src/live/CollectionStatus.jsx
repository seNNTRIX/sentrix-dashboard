import React,{useEffect,useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {request,environmentPath} from './api.js';
import {validateCollection} from './observation-values.js';
const names={deployment_metrics:'Deployment 지표',request_metrics:'요청 지표',logs:'로그',traces:'트레이스'};
const labels={RECENT:'최근 데이터 있음',STALE:'오래된 데이터',NO_DATA:'구간 내 미관측',UNKNOWN:'확인 불가'};
export function CollectionStatus(){const d=useDesign();return d.environment?<Panel key={`${d.environment.id}:${d.service}`} d={d}/>:null;}
function Panel({d}){
 const [state,setState]=useState({loading:true}),[revision,setRevision]=useState(0);
 useEffect(()=>{const c=new AbortController();setState({loading:true});request(`${environmentPath(d.environment.id)}/collection-status?${new URLSearchParams({service:d.service})}`,{signal:c.signal,timeoutMs:35000}).then(data=>{validateCollection(data,d.environment.id,d.service);if(!c.signal.aborted)setState({data});}).catch(e=>{if(!c.signal.aborted)setState({error:e.message});});return()=>c.abort();},[d.environment.id,d.service,d.revision,revision]);
 return <section className="panel panel-padded" aria-label="수집 데이터 최신성" style={{border:'1px solid var(--border-weak)',borderRadius:8,background:'var(--bg1)',padding:20}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><h2 className="section-title" style={{fontSize:14,margin:0}}>수집 데이터 최신성 · {d.service}</h2><button className="ui-button" onClick={()=>setRevision(n=>n+1)}>수집 상태 새로고침</button></div>
 {state.loading?<p role="status">저장소별 확인 중…</p>:state.error?<p role="alert">{state.error}</p>:<><div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr>{['데이터','최신성','마지막 관측 시각','조회 결과'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{state.data.signals.map(s=><tr key={s.signal}><td>{names[s.signal]}</td><td>{labels[s.freshness]}</td><td>{s.observedAt?new Date(s.observedAt).toLocaleString():'—'}</td><td>{s.queryStatus==='ERROR'?`조회 실패 (${s.failureCode||'QUERY_FAILED'})`:s.queryStatus==='NOT_CONFIGURED'?'소스 미설정':s.queryStatus==='PARTIAL'?'일부 응답':'조회 완료'}{s.warnings.includes('FUTURE_TIMESTAMP')?' · 미래 시각 감지':''}{s.warnings.includes('TRACE_START_OUTSIDE_WINDOW')?' · 시작 시각이 조회 구간 밖':''}</td></tr>)}</tbody></table></div><p className="secondary-text">확인 {new Date(state.data.checkedAt).toLocaleString()} · 최근 {state.data.lookbackSeconds/60}분 조회 · {state.data.freshnessThresholdSeconds}초 이내 기준</p></>}
 <p className="secondary-text" style={{fontSize:12}}>지표 샘플·로그 이벤트·트레이스 시작 시각 기준입니다. 수신 시각이나 요청 발생 여부가 아니며, 미관측만으로 수집 장애 또는 서비스 장애를 판정하지 않습니다.</p></section>;
}
