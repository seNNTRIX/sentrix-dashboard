import React,{useEffect,useState} from 'react';
import {layouts} from './design-layouts.jsx';
import {useDesign} from './DesignContext.jsx';
import {environmentPath,request} from './api.js';
import {EnvironmentDetails} from './EnvironmentDetails.jsx';
import {EnvironmentForm} from './EnvironmentContext.jsx';
import {MonitoringSettings} from './MonitoringSettings.jsx';
import {BoundSettings,DataNotice} from './DesignBindings.jsx';
import {CollectionStatus} from './CollectionStatus.jsx';
import {publicView} from './public-view.js';
import evaluation from './evaluation-sydney.json';
import benchmark from './evaluation-re2ob.json';

const tabStyle='height:40px;padding:0 12px;border:0;background:none;white-space:nowrap;';
const chipStyle='min-height:28px;padding:0 12px;border:0;border-radius:6px;';
const percent=x=>(100*x).toFixed(1)+'%';
const muted=text=><p className="bound-unavailable">{text}</p>;
function rows(data){return <tbody>{data.map(([key,...cells])=><tr key={key}><td>{key}</td>{cells.map((v,i)=><td key={i}>{v}</td>)}</tr>)}</tbody>;}
function head(names){return <thead><tr>{names.map(n=><th key={n}>{n}</th>)}</tr></thead>;}
function trials(){
 return <section className="panel obs-panel sx-incidents"><header><h2>전시 환경 실험 기록</h2><span>{evaluation.date} · {evaluation.model}</span></header><div className="sx-table-scroll"><table className="data-table">{head(['대상','실험','첫 경보 순위','p99 반영 후','경보 구간'])}
 {rows(evaluation.cases.map(r=>[r.target.replace('->',' → '),r.type,r.old.length?r.old[0]+'위':'미감지',r.new.length?r.new[0]+'위':'미감지',r.windows]))}</table></div></section>;
}
function model(d){
 const threshold=Number.isFinite(d.threshold)?d.threshold:null;
 const name=d.modelVersion||'—';
 const metrics=[['Top-1',percent(benchmark.top1),'원인 서비스 제외 검증'],['Top-3',percent(benchmark.top3),'원인 서비스 제외 검증'],['탐지 AUROC',benchmark.auc.toFixed(3),'반복 회차 3-fold'],['Detection threshold',threshold?.toFixed(4)||'—','현재 관측 환경']];
 return {thr:threshold??'',thrText:threshold?.toFixed(5)||'—',stats:metrics.map(([title,value,sub],i)=>({title,value,sub,cell:'display:flex;flex-direction:column;gap:4px;padding:16px 20px;'+(i?'border-left:1px solid var(--border-weak)':'')})),
  gauges:Object.entries(benchmark.faults).map(([label,value])=>({label,value:value.toFixed(3),bar:'height:100%;background:var(--primary);width:'+percent(value)})),
  slots:{modelRows:rows([['모델',name],['탐지','LightGBM'],['서비스 순위','Random Forest'],['분석 구간','30초'],['환경',d.environment?.name||'—']]),
   featureHead:head(['소스','관측 지표','대상']),featureRows:rows([['Prometheus','CPU·메모리·네트워크 지표','서비스'],['Tempo','호출량·오류율·지연 분포','호출 경로'],['Loki','서비스별 로그','서비스']]),
   foldHead:head(['학습에서 제외한 서비스','Avg@5']),foldRows:rows(Object.entries(benchmark.folds).map(([service,v])=>[service,v.toFixed(3)])),
   historyHead:head(['모델','평가 조건','근거']),historyRows:rows([['re2ob-v2-freeze','공개 데이터 · 장애 '+benchmark.cases+'건',<a href={benchmark.source} target="_blank" rel="noreferrer">평가 원본</a>],[evaluation.model,'시드니 전시 환경',evaluation.date]]),trials:trials()}};
}
function useRemote(id,route){
 const [state,setState]=useState({});
 useEffect(()=>{if(!id||!['C1-Notifications','C2-AlertRules','C3-Settings','C7-States'].includes(route))return;
  const ctrl=new AbortController();let timer;const events=route==='C1-Notifications';
  async function load(){try{const data=await request(environmentPath(id)+(events?'/incidents?size=50':'/monitoring'),{signal:ctrl.signal});
   if(!ctrl.signal.aborted)setState({data});
  }catch(e){if(!ctrl.signal.aborted)setState({error:e.message});}finally{if(!ctrl.signal.aborted)timer=setTimeout(load,30000);}}
  load();return()=>{ctrl.abort();clearTimeout(timer);};},[route,id]);return state;
}
function settings(d,remote){
 const status=remote.data;
 const info=<section className="panel obs-panel"><h2>관측 환경</h2><table>{rows([['환경',d.environment?.name||'—'],['Namespace',d.environment?.namespace||'—'],['자동 분석',status?(status.enabled?'활성':'비활성'):'—'],['분석 주기',status?status.intervalSeconds+'초':'—'],['최근 성공',status?.lastSuccessfulAt?new Date(status.lastSuccessfulAt).toLocaleString('ko-KR'):'—']])}</table>{remote.error&&<p role="alert">{remote.error}</p>}</section>;
 const sources=publicView?<section className="panel obs-panel"><h2>데이터 소스</h2>{muted('연결 주소와 설정은 운영자 화면에서 확인할 수 있습니다.')}<CollectionStatus/></section>:<BoundSettings/>;
 return {generalStatus:publicView?info:<EnvironmentDetails/>,tDs:sources,tAnalysis:publicView?info:<MonitoringSettings/>,status:<>{info}<CollectionStatus/></>,channelEmpty:muted('알림 채널 미연결')};
}
export function WorkspacePage({theme:initialTheme}){
 const d=useDesign(),route=d.route,Layout=layouts[route];
 const [menu,setMenu]=useState(()=>!matchMedia('(max-width:1023px)').matches),[theme,setTheme]=useState(initialTheme);
 const [tab,setTab]=useState(route==='C3-Settings'&&d.settingsTab==='sources'?1:0),[query,setQuery]=useState('');
 const key='sentrix-event-read:'+d.environment?.id;
 const [read,setRead]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))||[];}catch{return [];}});
 const remote=useRemote(d.environment?.id,route);
 function mark(ids){setRead(old=>{const values=[...new Set([...old,...ids])].slice(-250);try{localStorage.setItem(key,JSON.stringify(values));}catch{}return values;});}
 function options(labels,index,choose,tabs=false){return labels.map((label,i)=>({label,pick:()=>choose(i),sel:String(i===index),checked:String(i===index),style:(tabs?tabStyle:chipStyle)+(tabs?(i===index?'box-shadow:inset 0 -2px var(--text);':'color:var(--text-2);'):(i===index?'background:var(--bg1);box-shadow:var(--shadow-z1);':'background:none;'))}));}
 const names=route==='C4-Team'?['멤버','초대 대기','역할']:['일반','데이터 소스','분석','알림 채널','API 키','Retention'];
 const themes=options(['라이트','다크','시스템'],theme==='dark'?1:0,i=>setTheme(i===2?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):i?'dark':'light'));
 const binding={menuOpen:menu,toggleMenu:()=>setMenu(!menu),closeMenu:()=>setMenu(false),theme,setTheme,environmentName:d.environment?.name||'—',tabs:options(names,tab,setTab,true),themeOpts:themes,themes,
 tGeneral:tab===0,tDs:tab===1,tAnalysis:tab===2,tChannels:tab===3,tKeys:tab===4,tRetention:tab===5,tMembers:tab===0,tPending:tab===1,tRoles:tab===2,q:query,onQ:e=>setQuery(e.target.value),
 slots:settings(d,remote),atFirst:true,atLast:true,retention:['메트릭','Trace','로그'].map(name=>({name,days:'—',used:'—',cap:'—',pct:'—',row:'padding:12px 0'}))};
 if(route==='B8-Model')Object.assign(binding,model(d));
 if(route==='C1-Notifications'){
  const events=(remote.data?.items||[]).filter(i=>i.source==='AUTOMATIC').flatMap(i=>[[i.occurredAt,'이상 감지'],...(i.resolvedAt?[[i.resolvedAt,'회복']]:[])].map(([time,title])=>({id:i.id+title,href:'#B4-Incident?incidentId='+i.id,title,body:i.title||i.service,time}))).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
  const visible=events.filter(e=>tab===1?!read.includes(e.id):tab!==3);
  Object.assign(binding,{items:visible.map(e=>({...e,isRead:read.includes(e.id),read:()=>mark([e.id]),readLabel:'읽음으로 표시',time:new Date(e.time).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}),timeIso:e.time,timeFull:new Date(e.time).toLocaleString('ko-KR'),row:'display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border-weak)',titleStyle:'font-weight:500'})),hasItems:!!visible.length,empty:!visible.length&&!!remote.data,filters:options(['전체','읽지 않음','장애','데이터 소스'],tab,setTab),noUnread:!events.some(e=>!read.includes(e.id)),markAll:()=>mark(events.map(e=>e.id)),showAll:()=>setTab(0)});
 }
 if(route==='C2-AlertRules'){
  const s=remote.data;Object.assign(binding,{isList:true,crumbs:'홈|장애|Alert rules',hrefs:'B1-Overview.dc.html|B3-Incidents.dc.html|',cycle:s?'평가 주기 '+s.intervalSeconds+'초':'—',
   rules:s&&'자동 이상 탐지 anomaly score'.includes(query.toLowerCase())?[{name:'자동 이상 탐지',on:s.enabled,stateLabel:s.enabled?'활성':'비활성',labelText:Number.isFinite(d.threshold)?'Anomaly score · '+d.threshold.toFixed(4):'Anomaly score',row:'display:grid;grid-template-columns:96px minmax(200px,1fr) 80px 80px;align-items:center;padding:12px 20px;border-top:1px solid var(--border-weak)'}]:[]});
 }
 if(route.startsWith('A')){
  const steps=['클러스터 연결','데이터 소스','서비스 발견','알림 채널','완료'];
  Object.assign(binding,{stop:e=>e.preventDefault(),pwLabel:'비밀번호',pwType:'password',stepTitle:'비밀번호 재설정',stepNum:'1',stepDesc:'계정 인증 미연결',s1:true,notDone:true});
  if(route==='A4-Onboarding')Object.assign(binding,{steps:steps.map((label,i)=>({label,mark:i+1,pick:()=>setTab(i)})),...Object.fromEntries(steps.map((_,i)=>['s'+i,i===tab])),showFooter:tab<4,next:()=>setTab(i=>Math.min(4,i+1)),prev:()=>setTab(i=>Math.max(0,i-1)),atFirst:tab===0,nextLocked:!d.environment,slots:{s0:<EnvironmentForm/>,s1:binding.slots.tDs,s2:<section><h2>서비스 발견</h2>{d.inventory.length?<table>{rows(d.inventory.map(i=>[i.name]))}</table>:muted('조회된 서비스가 없습니다.')}</section>,s3:muted('알림 채널 미연결'),s4:<a href="#B1-Overview">대시보드 열기</a>}});
 }
 return <>{d.error&&<DataNotice/>}<Layout {...binding}/>{remote.error&&['C1-Notifications','C2-AlertRules'].includes(route)&&<p className="bound-notice" role="alert">{remote.error}</p>}</>;
}
