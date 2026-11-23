import React,{useEffect,useState} from 'react';
import {ServiceMapView} from './ServiceMapView.jsx';
import {useDesign} from './DesignContext.jsx';
import {request,environmentPath} from './api.js';
import {validateMap} from './observation-values.js';
import {DataNotice} from './DesignBindings.jsx';
const panel={background:'var(--bg1)',border:'1px solid var(--border-weak)',borderRadius:8,padding:'20px 24px'};
export function LiveServiceMap(){
 const d=useDesign(),[input,setInput]=useState(d.traceId),[trace,setTrace]=useState(d.traceId),[revision,setRevision]=useState(0),[state,setState]=useState({}),[search,setSearch]=useState('');
 useEffect(()=>{const c=new AbortController();setState({});if(!d.environment||!trace)return()=>c.abort();if(!/^[0-9a-f]{32}$/.test(trace)){setState({error:'Trace ID는 소문자 16진수 32자리입니다.'});return()=>c.abort();}setState({loading:true});request(`${environmentPath(d.environment.id)}/service-map?${new URLSearchParams({traceId:trace})}`,{signal:c.signal}).then(data=>{validateMap(data,d.environment.id,trace);if(!c.signal.aborted){setState({data});}}).catch(e=>{if(!c.signal.aborted)setState({error:e.message});});return()=>c.abort();},[d.environment?.id,trace,revision]);
 const data=state.data,nodes=data?.nodes||[],edges=data?.edges||[];
 return <><DataNotice/><div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}><div><h1 className="page-title" style={{fontSize:22,margin:0}}>Service map</h1><span className="secondary-text">{d.environment?.name||'환경 미선택'} · 요청 한 건의 호출 관계{data?` · 서비스 ${nodes.length}개 · 연결 ${edges.length}개`:''}</span></div><a className="ui-button" href="#B6-Trace">Trace에서 요청 찾기</a></div>
 <form onSubmit={e=>{e.preventDefault();setTrace(input);setRevision(n=>n+1);}} style={{display:'flex',flexWrap:'wrap',alignItems:'end',gap:12}}><label>Trace ID<input className="ui-input mono" aria-label="호출 관계 Trace ID" required pattern="[0-9a-f]{32}" maxLength={32} value={input} onChange={e=>setInput(e.target.value.trim().toLowerCase())} style={{display:'block',width:'min(320px,100%)'}}/></label><button className="ui-button" disabled={!d.environment}>호출 관계 조회</button></form>
 <p className="secondary-text" style={{margin:0}}>이 요청에서 관측된 직접 CLIENT → SERVER 연결입니다. 전체 트래픽·초당 요청량·RCA 원인 순위가 아닙니다. 미계측·누락 부모·비동기 호출은 복원되지 않습니다.</p>
 {state.loading?<p role="status">호출 관계 조회 중…</p>:state.error?<p role="alert">{state.error}</p>:!data?<p>Trace에서 요청을 선택하거나 ID를 입력하세요.</p>:<>{nodes.length<=60?<ServiceMapView key={trace} d={d} nodes={nodes} edges={edges} traceId={trace} onSearch={setSearch} scope="선택한 요청에서 관측한 호출 연결 · 서비스 지표는 조회 기간 기준"/>:<p>서비스가 60개를 초과해 아래 연결 표에 표시합니다.</p>}
 {!edges.length&&<p>직접 연결이 관측되지 않았습니다.</p>}
 <section style={panel} aria-label="관측된 호출 연결"><h2 style={{fontSize:14}}>관측된 호출 연결</h2><div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0"><table className="data-table"><thead><tr>{['호출 서비스','대상 서비스','관측 호출','명시적 ERROR','상태 미지정','평균 처리 시간','최대 처리 시간'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{edges.filter(e=>`${e.source} ${e.target}`.toLowerCase().includes(search.toLowerCase())).map(e=><tr key={JSON.stringify([e.source,e.target])}><td>{e.source}</td><td>{e.target}</td><td>{e.observedCalls}</td><td>{e.explicitErrorCount}</td><td>{e.unsetStatusCount}</td><td>{e.meanServerDurationMs.toFixed(2)} ms</td><td>{e.maxServerDurationMs.toFixed(2)} ms</td></tr>)}</tbody></table></div><p className="secondary-text">서버 span 처리 시간 기준입니다. UNSET(상태 미지정)은 정상 판정이 아닙니다.</p>{data.warnings.filter(w=>!['SINGLE_TRACE_ONLY','DIRECT_CLIENT_SERVER_PAIRS_ONLY'].includes(w)).map(w=><p key={w} className="secondary-text">수집 제한: {w}</p>)}</section></>}
 </>;
}
export function TraceMapLink(){const d=useDesign();return d.detail.data?<a className="ui-button" href={`#B2-ServiceMap?traceId=${d.detail.data.traceId}`}>이 요청의 호출 관계 보기</a>:null;}
