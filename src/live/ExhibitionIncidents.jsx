import React,{useState,useEffect} from 'react';
import {environmentPath,request} from './api.js';
import {IncidentListLayout} from './IncidentListLayout.jsx';
import {validateIncident} from './incident-values.js';
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
    try{const r=await request(base+'/'+encodeURIComponent(row.id)+'/rca',{signal:c.signal});if(r.incidentId===row.id&&r.environmentId===d.environment.id)return {...row,top:r.result?.candidates?.find(x=>x.rank===1)};}catch{/* Records remain visible without a completed diagnosis. */}return row;
   }));
   if(!c.signal.aborted)setState({items,pages:data.totalPages,total:data.totalElements});
  }catch(e){if(!c.signal.aborted)setState({error:e.message});}finally{if(!c.signal.aborted)timer=setTimeout(load,30000);}}
  load();return()=>{clearTimeout(timer);c.abort();};
 },[d.environment.id,page,status,svc]);
 const mapped=(state.items||[]).map(r=>{
  const t=r.top, target=t?.service||(t?.source&&t?.target?t.source+' → '+t.target:'—'),family=t?.faultType||'—';
  return {r,target,family,start:Date.parse(r.occurredAt),duration:Math.max(0,(Date.parse(r.resolvedAt)||Date.now())-Date.parse(r.occurredAt)),score:t?.score??null};
 });
 const visible=mapped.filter(x=>x.start>=Date.parse(d.range.from)&&x.start<=Date.parse(d.range.to)&&(!fault||x.family===fault)&&[x.r.title,x.r.id,x.target,x.r.service].some(t=>t.toLowerCase().includes(q.trim().toLowerCase()))).sort((a,b)=>((a[sort[0]]??-1)-(b[sort[0]]??-1))*sort[1]);
 const change=k=>()=>setSort(([old,dir])=>[k,old===k?-dir:-1]);
 const rows=visible.map(({r,target,family,start,duration,score})=>({title:r.title,id:r.id.slice(0,8),href:'#B4-Incident?incidentId='+r.id,detect:new Date(start).toLocaleTimeString('ko-KR'),stateLabel:r.status==='OPEN'?'진행 중':'해결됨',stateStyle:'display:inline-flex;padding:1px 8px;border-radius:6px;background:'+(r.status==='OPEN'?'var(--shade);color:var(--error-text)':'var(--secondary);color:var(--text-2)'),target,faultLabel:family,candidateKind:r.top?.kind,service:r.service,score:score?.toFixed(2)||'—',start:new Date(start).toLocaleString('ko-KR'),dur:Math.floor(duration/60000)+'분 '+Math.floor(duration/1000)%60+'초',open:open===r.id,expanded:open===r.id,chev:open===r.id?'transform:rotate(90deg)':'',toggle:()=>expand(open===r.id?null:r.id),toggleLabel:r.title+' 상세 펼치기'}));
 const statusOpts=[['','전체'],['OPEN','진행 중'],['RESOLVED','해결됨']].map(([key,label])=>({label,checked:key===status,pick:()=>{setPage(0);setStatus(key);},style:'height:28px;padding:0 12px;border:0;border-radius:6px;background:'+(key===status?'var(--bg1);box-shadow:var(--shadow-z1)':'none')}));
 const arrow=k=>sort[0]!==k?'':sort[1]>0?'M6 15l6-6 6 6':'M6 9l6 6 6-6';
 return <><IncidentListLayout {...{q,svc,fault,rows,statusOpts,services:d.inventory.map(s=>s.name),faults:[...new Set(mapped.map(x=>x.family).filter(x=>x!=='—'))],onQ:e=>setQ(e.target.value),onFault:e=>setFault(e.target.value),onSvc:e=>{setPage(0);setSvc(e.target.value);},summary:state.error||(!state.items?'조회 중…':'조회 '+state.total+'건 · 현재 페이지에서 조건에 맞는 장애 '+rows.length+'건'),empty:!!state.items&&!rows.length,hDur:headline,hScore:headline,hStart:headline,sortDur:change('duration'),sortStart:change('start'),sortScore:change('score'),iDur:arrow('duration'),iScore:arrow('score'),iStart:arrow('start')}}/>
 {state.pages>1&&<div><button className="ui-button" disabled={!page} onClick={()=>setPage(page-1)}>이전</button> {page+1} / {state.pages} <button className="ui-button" disabled={page+1>=state.pages} onClick={()=>setPage(page+1)}>다음</button></div>}</>;
}
