import React,{useState,useEffect} from 'react';
import {environmentPath,request} from './api.js';
import {IncidentListLayout} from './IncidentListLayout.jsx';
import {validateIncident} from './incident-values.js';
import {leadingCandidates,kindRankLabel,scoreComparisonKey,candidateScoreText} from './candidate-ranks.js';
import {candidateScoreLabel,knownRankingMethod} from './analysis-values.js';
import {candidateName} from './RecordedDiagnosis.jsx';
const scoreLabel=(c,known)=>known&&c.kind==='EDGE'?'경로 백분위 점수':candidateScoreLabel(c);
const headline='width:100%;display:flex;justify-content:flex-end;align-items:center;gap:4px;border:0;background:none;padding:0;color:var(--text-2)';
export function ExhibitionIncidents({d}){
 const [status,setStatus]=useState(''),[q,setQ]=useState(''),[svc,setSvc]=useState(''),[fault,setFault]=useState('');
 const [sort,setSort]=useState(['start',-1]),[open,expand]=useState(null),[page,setPage]=useState(0),[state,setState]=useState({});
 useEffect(()=>{
  const base=environmentPath(d.environment.id)+'/incidents',c=new AbortController();let timer;
  setState({});
  async function load(){try{
   const params=new URLSearchParams({page,size:20});if(status)params.set('status',status);if(svc)params.set('service',svc);
   const data=await request(base+'?'+params,{signal:c.signal});
   const items=await Promise.all(data.items.map(async row=>{
    validateIncident(row,d.environment.id);
    try{const r=await request(base+'/'+encodeURIComponent(row.id)+'/rca',{signal:c.signal});if(r.incidentId===row.id&&r.environmentId===d.environment.id)return {...row,leaders:leadingCandidates(r.result?.candidates),modelVersion:r.result?.modelVersion,knownMethod:!!r.result&&knownRankingMethod(r.result)};}catch{/* Records remain visible without a completed diagnosis. */}return row;
   }));
   if(!c.signal.aborted)setState({items,pages:data.totalPages,total:data.totalElements});
  }catch(e){if(!c.signal.aborted)setState({error:e.message});}finally{if(!c.signal.aborted)timer=setTimeout(load,30000);}}
  load();return()=>{clearTimeout(timer);c.abort();};
 },[d.environment.id,page,status,svc]);
 const mapped=(state.items||[]).map(r=>{
  const leaders=r.leaders||[],t=leaders.find(c=>c.faultType===fault)||leaders[0],target=t?candidateName(t):'—',family=t?.faultType||'—';
  return {r,t,leaders,target,family,start:Date.parse(r.occurredAt),duration:Math.max(0,(Date.parse(r.resolvedAt)||Date.now())-Date.parse(r.occurredAt)),score:t?.score??null};
 });
 const visible=mapped.filter(x=>x.start>=Date.parse(d.range.from)&&x.start<=Date.parse(d.range.to)&&(!fault||x.leaders.some(c=>c.faultType===fault))&&[x.r.title,x.r.id,x.r.service,...x.leaders.map(candidateName)].some(t=>t.toLowerCase().includes(q.trim().toLowerCase())) );
 const sources=new Set(visible.map(x=>scoreComparisonKey(x.t,x.r.modelVersion)));
 const scoreHint=!fault?'장애 유형을 선택하면 같은 방식으로 계산한 점수를 정렬할 수 있습니다.':
  sources.size!==1||sources.has(null)?'점수의 산정 방식과 모델 버전이 같은 후보만 정렬할 수 있습니다.':'';
 const activeSort=sort[0]==='score'&&scoreHint?['start',-1]:sort;
 visible.sort((a,b)=>((a[activeSort[0]]??-1)-(b[activeSort[0]]??-1))*activeSort[1]);
 const change=k=>()=>setSort(([old,dir])=>[k,old===k?-dir:-1]);
 const rows=visible.map(({r,t,leaders,target,family,start,duration})=>({title:r.title,id:r.id.slice(0,8),href:'#B4-Incident?incidentId='+r.id,detect:new Date(start).toLocaleTimeString('ko-KR'),stateLabel:r.status==='OPEN'?'진행 중':'해결됨',stateStyle:'display:inline-flex;padding:1px 8px;border-radius:6px;background:'+(r.status==='OPEN'?'var(--shade);color:var(--error-text)':'var(--secondary);color:var(--text-2)'),target,faultLabel:family,candidateKind:t?.kind,rankLabel:kindRankLabel(t),leaders:leaders.map(c=>({name:candidateName(c),label:kindRankLabel(c),score:candidateScoreText(c,r.knownMethod),scoreLabel:scoreLabel(c,r.knownMethod)})),service:r.service,score:t?candidateScoreText(t,r.knownMethod):'—',scoreLabel:t?scoreLabel(t,r.knownMethod):null,start:new Date(start).toLocaleString('ko-KR'),dur:Math.floor(duration/60000)+'분 '+Math.floor(duration/1000)%60+'초',open:open===r.id,expanded:open===r.id,chev:open===r.id?'transform:rotate(90deg)':'',toggle:()=>expand(open===r.id?null:r.id),toggleLabel:r.title+' 상세 펼치기'}));
 const statusOpts=[['','전체'],['OPEN','진행 중'],['RESOLVED','해결됨']].map(([key,label])=>({label,checked:key===status,pick:()=>{setPage(0);setStatus(key);},style:'height:28px;padding:0 12px;border:0;border-radius:6px;background:'+(key===status?'var(--bg1);box-shadow:var(--shadow-z1)':'none')}));
 const arrow=k=>activeSort[0]!==k?'':activeSort[1]>0?'M6 15l6-6 6 6':'M6 9l6 6 6-6';
 return <><IncidentListLayout {...{q,svc,fault,rows,scoreHint,statusOpts,services:d.inventory.map(s=>s.name),faults:[...new Set(mapped.flatMap(x=>x.leaders.map(c=>c.faultType)).filter(Boolean))],onQ:e=>setQ(e.target.value),onFault:e=>{setFault(e.target.value);if(sort[0]==='score')setSort(['start',-1]);},onSvc:e=>{setPage(0);setSvc(e.target.value);},summary:state.error||(!state.items?'조회 중…':'조회 '+state.total+'건 · 현재 페이지에서 조건에 맞는 장애 '+rows.length+'건'),empty:!!state.items&&!rows.length,hDur:headline,hScore:headline,hStart:headline,sortDur:change('duration'),sortStart:change('start'),sortScore:change('score'),iDur:arrow('duration'),iScore:arrow('score'),iStart:arrow('start')}}/>
 {state.pages>1&&<div><button className="ui-button" disabled={!page} onClick={()=>setPage(page-1)}>이전</button> {page+1} / {state.pages} <button className="ui-button" disabled={page+1>=state.pages} onClick={()=>setPage(page+1)}>다음</button></div>}</>;
}
