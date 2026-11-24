import React,{createContext,useContext,useEffect,useState} from 'react';
import {environmentPath,request} from './api.js';
import {useDesign} from './DesignContext.jsx';
import {scopeSemantics,semanticLogLink,semanticWindow} from './log-semantics.js';
import './log-semantics.css';

const Context=createContext(null);
export const useLogSemantics=()=>useContext(Context);
const clock=value=>new Date(value).toLocaleTimeString('ko-KR',{hour12:false});
const format=value=>value.toLocaleString('ko-KR');
const reasons={
 LOG_SEMANTICS_LOADING:'정상 로그 문장의 기준을 준비하는 중입니다.',
 BASELINE_LOGS_INSUFFICIENT:'정상 기준을 만들 로그가 충분하지 않습니다.',
 LOG_SEMANTICS_NOT_INSTALLED:'모델 서버의 로그 임베딩 모델을 사용할 수 없습니다.',
 LOG_QUERY_LIMIT:'로그 조회 한도에 도달해 이 구간의 분석을 보류했습니다.',
 TELEMETRY_ENVIRONMENT_NOT_CONFIGURED:'이 환경의 로그 기준이 설정되지 않았습니다.',
 BASELINE_OVERLAPS_WINDOW:'정상 기준 구간이 끝난 뒤 첫 30초를 기다리는 중입니다.',
};

export function LogSemanticProvider({live,children,expanded}) {
 const [state,setState]=useState({}),[focus,setFocus]=useState('');
 const id=live.environment?.id;
 const active=id && !live.environment.recorded && (live.route==='B1-Overview'||expanded);
 useEffect(()=>{
  if(!active)return;
  const c=new AbortController();
  let timer,busy=false;
  async function read(){
   if(document.hidden || busy || c.signal.aborted)return;
   clearTimeout(timer);busy=true;
   try {
    const path=environmentPath(id)+'/log-semantics'+(live.publicView?'/summary':'');
    const data=semanticWindow(await request(path,{signal:c.signal,timeoutMs:60000}),id,live.publicView);
    if(!c.signal.aborted)setState(data.status==='OK'?{data}:{error:reasons[data.reason]||'이 구간의 로그 의미 분석 결과를 사용할 수 없습니다.'});
   }catch(e){if(!c.signal.aborted)setState({error:e.message});}
   finally{busy=false;if(!c.signal.aborted)timer=setTimeout(read,10000);}
  }
  read();document.addEventListener('visibilitychange',read);
  return ()=>{c.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',read);};
 },[active,id,live.publicView,live.revision]);
 const all=scopeSemantics(state.data,live.applicationServices);
 return <Context.Provider value={{...state,all,focus,setFocus,expanded,active,allowed:live.applicationServices}}>{children}</Context.Provider>;
}

function goToCard(){
 const card=document.getElementById('semantic-space');
 card?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 card?.focus({preventScroll:true});
}
const palette={frontend:'--viz-blue',currencyservice:'--viz-green',cartservice:'--viz-orange',recommendationservice:'--viz-purple',checkoutservice:'--viz-yellow',paymentservice:'--viz-orange',emailservice:'--viz-green',productcatalogservice:'--viz-yellow'};
const color=name=>'var('+(palette[name]||'--text-2')+')';

export function SemanticKpi(){
 const s=useLogSemantics();
 if(!s?.active)return null;
 const leading=s.all?.services.filter(row=>row.novelSentences).sort((a,b)=>b.novelSentences-a.novelSentences).slice(0,2).map(row=>row.service+' '+row.novelSentences).join(' · ');
 return <button type="button" className="semantic-kpi" data-novel={s.all?.novel>0||undefined} onClick={goToCard}>
  <span>새 로그 문장</span><strong>{s.all?format(s.all.novel):'—'}{s.all&&<small>개</small>}</strong>
  <span title={leading||undefined}>{s.all?(leading||'최근 30초'):s.error?'분석 결과 없음':'분석 중…'}</span>
 </button>;
}
function SemanticMap({scope,novelOnly,onPick,selected}){
 const entries=[...scope.baseline,...scope.points];
 if(!entries.length)return <p className="sem-empty">표시할 로그 문장이 없습니다.</p>;
 const xs=entries.map(p=>p.x),ys=entries.map(p=>p.y);
 const xMin=Math.min(...xs),yMin=Math.min(...ys),xRange=Math.max(...xs)-xMin,yRange=Math.max(...ys)-yMin;
 const scale=Math.min(360/(xRange||1),171/(yRange||1));
 const cx=p=>195+(p.x-xMin-xRange/2)*scale,cy=p=>100-(p.y-yMin-yRange/2)*scale;
 const points=scope.points.filter(p=>!novelOnly||p.novel);
 const keyboardIndex=Math.max(0,points.indexOf(selected));
 function navigate(e,p,i){
  if(e.key==='Enter'||e.key===' '){e.preventDefault();onPick(p);return;}
  const offset={ArrowLeft:-1,ArrowRight:1,ArrowDown:1,ArrowUp:-1}[e.key];
  if(!offset)return;
  e.preventDefault();
  const next=(i+offset+points.length)%points.length;
  onPick(points[next]);
  e.currentTarget.ownerSVGElement.querySelectorAll('circle[role=button]')[next]?.focus();
 }
 return <div className="sem-plot">
  <svg viewBox="0 0 390 200" role="group" aria-label="정상 기준과 최근 로그 문장 분포">
   {scope.baseline.map((p,i)=><circle key={i} cx={cx(p)} cy={cy(p)} r="2.5" className="sem-baseline"/>)}
   {points.map((p,i)=><circle key={i} role="button" tabIndex={i===keyboardIndex?0:-1} aria-label={p.service+' · '+(p.novel?'새 문장':'관측 문장')+' · '+p.count+'줄'}
    aria-pressed={selected===p} className={p.novel?'sem-novel':'sem-current'} style={{fill:color(p.service)}} cx={cx(p)} cy={cy(p)} r={Math.min(9,2+Math.log2(1+p.count))}
    onClick={()=>onPick(p)} onKeyDown={e=>navigate(e,p,i)}>
    <title>{p.service} · {format(p.count)}줄{p.text?' · '+p.text:''}</title></circle>)}
  </svg>
  <div className="sem-legend"><span><i/>정상 기준</span>{[...new Set(points.map(p=>p.service))].map(name=><span key={name}><i style={{background:color(name)}}/>{name}</span>)}<span className="sem-novel-key"><i/>새 문장</span></div>
 </div>;
}
export function SemanticPanel(){
 const live=useDesign(),s=useLogSemantics();
 const [filter,setFilter]=useState(()=>s?.expanded?new URLSearchParams(location.hash.split('?')[1]).get('service')||'':''),[only,setOnly]=useState(false),[picked,setPicked]=useState(null);
 if(!s?.active)return null;
 const {data,all}=s;
 const scope=scopeSemantics(data,s.allowed,filter);
 const rowKey=p=>JSON.stringify([p.service,p.text??p.x,p.y]);
 const selected=scope?.points.find(p=>rowKey(p)===picked);
 const novel=scope?.points.filter(p=>p.novel)||[];
 const openLogs=selected&&!live.publicView?semanticLogLink(selected,data.windowEnd):null;
 function select(p){setPicked(rowKey(p));s.setFocus(p.service);}
 return <section id="semantic-space" tabIndex="-1" className="panel obs-panel semantic-space" data-expanded={s.expanded||undefined} aria-labelledby="semantic-heading">
  <header><div><h2 id="semantic-heading">로그 의미 공간</h2><small>{data?'최근 30초 · '+clock(data.windowEnd)+' 기준':'최근 30초'}</small></div>
   {scope&&<div className="sem-tools"><label>서비스 <select className="ui-input" aria-label="로그 의미 공간 서비스" value={filter} onChange={e=>{setFilter(e.target.value);setPicked(null);s.setFocus(e.target.value);}}>
    <option value="">전체</option>{all.services.map(x=><option key={x.service}>{x.service}</option>)}</select></label>
    <label><input type="checkbox" checked={only} onChange={e=>setOnly(e.target.checked)}/> 새 문장만</label>
    {!s.expanded&&<a href={'#B7-Logs?'+new URLSearchParams({semantic:'1',...(filter?{service:filter}:{})})}>로그 화면에서 크게 보기</a>}</div>}</header>
  {!scope?<p role="status" className="sem-empty">{s.error||'로그 문장을 분석하는 중…'}</p>:<>
   <div className="sem-body"><SemanticMap scope={scope} novelOnly={only} onPick={select} selected={selected}/>
    <div className="sem-list"><h3>평소에 없던 로그 문장 <small>{format(scope.novel)}개 · {format(scope.lines)}줄</small></h3>
     {live.publicView&&scope.novel>0&&<small>문장 내용은 운영자 화면에서 확인할 수 있습니다.</small>}
     {novel.length>0?<ul>{novel.map((p,i)=><li key={rowKey(p)+i}><button type="button" aria-pressed={selected===p} onClick={()=>select(p)}>
      <span>{p.service} · {format(p.count)}줄{p.distance!==null&&' · 정상 문장과 거리 '+p.distance.toFixed(2)}</span>{!live.publicView&&<code>{p.text}</code>}
     </button></li>)}</ul>:<p className="sem-empty">{scope.novel?'표시 한도 안에 새 문장이 없습니다.':'이 구간에 새 문장이 없습니다.'}</p>}
     {novel.length>0&&novel.length<scope.novel&&<small>빈도순으로 수집한 {format(scope.novel)}개 중 {format(novel.length)}개 표시</small>}
     {selected&&<div className="sem-selection"><b>{selected.service}</b><span>{selected.novel?'새 문장':'최근 문장'} · {format(selected.count)}줄</span>{openLogs&&<a href={openLogs}>이 구간의 로그 보기</a>}</div>}
    </div></div>
   <footer><span>로그 끊김 · {scope.services.filter(x=>x.stopped).map(x=>x.service).join(', ')||'없음'}</span>
    <span>정상 기준 · {new Date(data.baseline.start*1000).toLocaleDateString('ko-KR')} {clock(data.baseline.start*1000)}–{clock(data.baseline.end*1000)}</span></footer>
  </>}
 </section>;
}
