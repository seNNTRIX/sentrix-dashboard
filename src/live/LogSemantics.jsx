import React, {lazy, Suspense, useEffect, useState} from 'react';
import {SideNav, TopBar} from '../components/navigation.jsx';
import {environmentPath, request} from './api.js';
import {useDesign} from './DesignContext.jsx';
import {scopeSemantics, semanticLogLink, semanticWindow} from './log-semantics.js';
import './log-semantics.css';

const RecordedExperiment = lazy(() => import('./RecordedLogExperiment.jsx'));
const space = '#B9-LogSpace';
const clock = value => new Date(value).toLocaleTimeString('ko-KR', {hour12:false});
const dateTime = value => new Date(value).toLocaleString('ko-KR', {hour12:false});
const number = value => value.toLocaleString('ko-KR');
const reasons = {
 LOG_SEMANTICS_LOADING:'정상 기준을 준비하고 있습니다.',
 BASELINE_LOGS_INSUFFICIENT:'정상 기준으로 쓸 로그가 부족합니다.',
 LOG_SEMANTICS_NOT_INSTALLED:'로그 임베딩 모델을 사용할 수 없습니다.',
 LOG_QUERY_LIMIT:'이 구간의 로그가 조회 한도를 넘었습니다.',
 TELEMETRY_ENVIRONMENT_NOT_CONFIGURED:'이 환경의 정상 기준이 설정되지 않았습니다.',
 BASELINE_OVERLAPS_WINDOW:'정상 기준 구간이 끝난 뒤 첫 30초를 기다리고 있습니다.'
};
const colors = {frontend:'#336fae', emailservice:'#358276', paymentservice:'#b27328', recommendationservice:'#835eae', productcatalogservice:'#4c9050', cartservice:'#b65870', checkoutservice:'#776a47', currencyservice:'#657981', adservice:'#8c705b'};
const color = service => colors[service] || 'var(--text-2)';

function useWindow(live, end, paused=false) {
 const [state,setState] = useState({});
 const [attempt,retry] = useState(0);
 const id = live.environment?.id;
 useEffect(() => {
  if (!id || live.environment.recorded || paused) return;
  const controller = new AbortController();
  let timer, busy=false;
  async function read() {
   if (document.hidden || busy || controller.signal.aborted) return;
   clearTimeout(timer);
   busy=true;
   try {
    const params = end ? '?'+new URLSearchParams({windowEnd:end}) : '';
    const path = environmentPath(id)+'/log-semantics'+(live.publicView?'/summary':'')+params;
    const data = semanticWindow(await request(path,{signal:controller.signal,timeoutMs:60000}),id,live.publicView);
    if (end && Date.parse(data.windowEnd)!==Date.parse(end)) throw Error('선택한 관측 시각의 결과를 확인할 수 없습니다.');
    if (!controller.signal.aborted) setState(data.status==='OK'?{data}:{error:reasons[data.reason]||'이 구간의 로그 의미 분석 결과가 없습니다.'});
   } catch(e) {
    const message = e.status===410?'이 관측 구간은 보관 기간이 지났습니다.':e.status===429?'이전 구간 조회가 많습니다. 잠시 후 다시 시도하세요.':e.message;
    if (!controller.signal.aborted) setState({error:message});
   } finally {
    busy=false;
    if (!end && !controller.signal.aborted) timer=setTimeout(read,10000);
   }
  }
  read();
  document.addEventListener('visibilitychange',read);
  return () => {controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',read);};
 },[id,live.publicView,live.environment?.recorded,end,attempt,paused]);
 return {...state,retry:()=>retry(n=>n+1)};
}

export function IncidentLogLink({record,leader}) {
 const live=useDesign();
 const {data}=useWindow(live);
 if (!data || Date.parse(data.windowEnd)-30000 < Date.parse(record.occurredAt)) return null;
 const related=new Set([record.service,leader?.service,leader?.source,leader?.target]);
 const rows=scopeSemantics(data,live.applicationServices).services.filter(s=>related.has(s.service)&&s.novelSentences>0);
 if (!rows.length) return null;
 return <nav className="incident-log-links" aria-label="진행 중 장애의 새 로그 문장">{rows.map(row=>
  <a key={row.service} href={space+'?'+new URLSearchParams({service:row.service,windowEnd:data.windowEnd,incidentId:record.id,novel:'1'})}>
   {row.service} · 새 로그 문장 {number(row.novelSentences)}종 보기 <span aria-hidden="true">→</span>
  </a>)}</nav>;
}

function Distribution({scope,points,selected,onPick}) {
 const all=[...scope.baseline,...scope.points];
 if (!all.length) return <p className="sem-empty">이 서비스에서 수집한 로그 문장이 없습니다.</p>;
 const xs=all.map(p=>p.x), ys=all.map(p=>p.y);
 const left=Math.min(...xs), bottom=Math.min(...ys), width=Math.max(...xs)-left, height=Math.max(...ys)-bottom;
 const scale=Math.min(560/(width||1),280/(height||1));
 const cx=p=>300+(p.x-left-width/2)*scale, cy=p=>160-(p.y-bottom-height/2)*scale;
 function keyDown(e,index) {
  if (e.key==='Enter'||e.key===' ') {e.preventDefault();onPick(points[index]);return;}
  const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[e.key];
  if (!delta) return;
  e.preventDefault();
  const next=(index+delta+points.length)%points.length;
  e.currentTarget.ownerSVGElement.querySelectorAll('[role=button]')[next].focus();
  onPick(points[next]);
 }
 return <svg viewBox="0 0 600 320" className="sem-canvas" role="group" aria-label="정상 기준과 관측 로그 문장 분포">
  {scope.baseline.map((p,i)=><circle key={i} cx={cx(p)} cy={cy(p)} r="2.6" className="sem-baseline"/>)}
  {points.map((p,i)=><circle key={pointKey(p)} role="button" aria-pressed={selected===p} tabIndex={i===Math.max(0,points.indexOf(selected))?0:-1}
   className={p.novel?'sem-novel':'sem-current'} style={{fill:color(p.service)}} cx={cx(p)} cy={cy(p)} r={Math.min(9,2+Math.log2(1+p.count))}
   aria-label={p.service+' · '+(p.novel?'새 문장':'관측 문장')+' · '+p.count+'줄'} onClick={()=>onPick(p)} onKeyDown={e=>keyDown(e,i)}>
   <title>{p.service} · {number(p.count)}줄{p.text?' · '+p.text:''}</title></circle>)}
 </svg>;
}
function pointKey(p) {return JSON.stringify([p.service,p.text??p.x,p.y]);}

function LiveSpace({live}) {
 const params=live.params, end=params.get('windowEnd');
 const [filter,setFilter]=useState(params.get('service')||''),[only,setOnly]=useState(params.get('novel')==='1');
 const [picked,setPicked]=useState(null),[paused,setPaused]=useState(false);
 const {data,error,retry}=useWindow(live,end,paused);
 const scope=scopeSemantics(data,live.applicationServices,filter);
 const points=scope?.points.filter(p=>!only||p.novel)||[];
 const selected=points.find(p=>pointKey(p)===picked);
 const options=[...new Set([...(live.applicationServices||live.serviceNames),...(scopeSemantics(data,live.applicationServices)?.services.map(s=>s.service)||[]),...(params.get('service')?[params.get('service')]:[])])];
 function pick(p){setPicked(pointKey(p));if(!end)setPaused(true);}
 function resume(){setPicked(null);setPaused(false);}
 const emptyMessage=live.error||(!live.environment&&!live.loading?'선택한 환경이 없습니다.':live.environment?.recorded?'이 환경은 실시간 로그를 수집하지 않습니다.':error||'관측 로그를 불러오는 중…');
 return <>
  <div className="sem-toolbar">
   <label>서비스 <select className="ui-input" value={filter} onChange={e=>{setFilter(e.target.value);setPicked(null);}}>
    <option value="">전체 서비스</option>{options.map(name=><option key={name}>{name}</option>)}</select></label>
   <label className="sem-check"><input type="checkbox" checked={only} onChange={e=>{setOnly(e.target.checked);setPicked(null);}}/>새 문장만</label>
   <div className="sem-time">{end?<><span>{dateTime(end)} 기준</span><a href={space+(filter?'?'+new URLSearchParams({service:filter}):'')}>실시간으로 돌아가기</a></>:<>
    <span>{data?clock(data.windowEnd)+' 기준 · 30초 구간':'최근 30초'}</span>
    {data&&<button type="button" className="ui-button" onClick={paused?resume:()=>setPaused(true)}>{paused?'실시간 재개':'일시정지'}</button>}</>}
   </div>
  </div>
  {!scope?<div className="panel sem-empty" role={error?'alert':'status'}>{emptyMessage} {error&&<button className="ui-button" onClick={retry}>다시 조회</button>}</div>:<>
   <div className="sem-layout">
    <section className="panel sem-card"><header><h2>문장 분포</h2><span>{data.baseline.projection?.toUpperCase()} · 2D</span></header>
     <Distribution scope={scope} points={points} selected={selected} onPick={pick}/>
     {!points.length&&scope.baseline.length>0&&<p className="sem-caption">{only?'이 구간에서 표시할 새 문장이 없습니다.':'이 구간에서 관측된 문장이 없습니다.'}</p>}
     <div className="sem-legend"><span><i className="sem-base-key"/>정상 기준</span>{[...new Set(points.map(p=>p.service))].map(s=><span key={s}><i style={{background:color(s)}}/>{s}</span>)}<span><i className="sem-new-key"/>새 문장</span></div>
    </section>
    <aside className="panel sem-card sem-detail"><header><h2>선택한 문장</h2></header>
     {selected?<><b>{selected.service}</b>{selected.text&&<code>{selected.text}</code>}
      <dl>{[['관측 구간',clock(Date.parse(data.windowEnd)-30000)+' – '+clock(data.windowEnd)],['발생 횟수',number(selected.count)+'회'],['정상 기준과 거리',selected.distance==null?'비교 문장 없음':selected.distance.toFixed(3)]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {live.publicView?<p className="sem-caption">문장 본문과 관련 로그는 운영자 화면에서 확인할 수 있습니다.</p>:<a href={semanticLogLink(selected,data.windowEnd)}>이 구간의 Loki 로그 보기 →</a>}</>:
      <p className="sem-caption">분포의 점이나 아래 목록에서 문장을 선택하세요.</p>}
    </aside>
   </div>
   <section className="panel sem-card sem-rows"><header><h2>{only?'새 로그 문장':'관측된 로그 문장'}</h2><span>표시 {number(points.length)}종 · 새 문장 전체 {number(scope.novel)}종</span></header>
    {points.length?<ul>{points.map(p=><li key={pointKey(p)}><button type="button" aria-pressed={p===selected} onClick={()=>pick(p)}>
     <span className="sem-svc"><i style={{background:color(p.service)}}/>{p.service}</span>
     <span className="sem-snippet">{p.text||(p.novel?'새 문장':'기준에 있는 문장')}</span><span>{number(p.count)}회</span></button></li>)}</ul>:<p className="sem-caption">조건에 맞는 문장이 없습니다.</p>}
   </section>
   <p className="sem-caption sem-foot">점 하나는 서비스별로 묶은 로그 문장 한 종류이며, 점 크기는 발생 횟수입니다. 정상 기준 {dateTime(data.baseline.start*1000)} – {clock(data.baseline.end*1000)}.</p>
  </>}
 </>;
}

export function LogSpacePage({theme:initialTheme,live}) {
 const [theme,setTheme]=useState(initialTheme),[menu,setMenu]=useState(()=>!matchMedia('(max-width:1023px)').matches);
 const archive=live.params.get('mode')==='recorded';
 const liveParams=new URLSearchParams(live.params);liveParams.delete('mode');
 const query=liveParams.toString();
 return <div className="g screen-root sem-screen" data-theme={theme} data-screen="B9-LogSpace">
  <div className="shell-header"><TopBar crumbs="홈|Explore|로그 의미 공간" hrefs="B1-Overview.dc.html|B7-Logs.dc.html|" theme={theme} onTheme={setTheme} onMenu={()=>setMenu(!menu)} menuOpen={menu}/></div>
  <div className="shell-body"><div className="shell-sidebar"><SideNav active="logspace" open={menu} onClose={()=>setMenu(false)}/></div>
   <main id="main-content" tabIndex="-1" className="page-content sem-page">
    <h1 className="page-title">로그 의미 공간</h1>
    <nav className="sem-tabs" aria-label="로그 데이터 선택">
     <a href={space+(query?'?'+query:'')} aria-current={!archive?'page':undefined}>{live.params.has('windowEnd')?'선택한 장애 구간':'실시간 관측'}</a>
     <a href={space+'?'+new URLSearchParams([...liveParams,['mode','recorded']])} aria-current={archive?'page':undefined}>저장된 실험</a>
    </nav>
    {archive?<Suspense fallback={<p role="status">실험 기록을 불러오는 중…</p>}><RecordedExperiment/></Suspense>:<LiveSpace live={live}/>}
   </main></div>
 </div>;
}
