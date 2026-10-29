import React,{useEffect,useState} from 'react';
import {useDesign} from './DesignContext.jsx';
import {request,environmentPath} from './api.js';
import {validatePods,validatePodMetric} from './pod-values.js';
import {chartPath} from './design-values.js';
const metrics=[['cpu_usage_cores','CPU',1,'cores'],['memory_working_set_bytes','메모리',1/1048576,'MiB']];
const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('ko-KR',{maximumFractionDigits:3}).format(n):'—';
const panel={border:'1px solid var(--border-weak)',borderRadius:8,background:'var(--bg1)',overflow:'hidden'};
export function ServicePods(){
 const d=useDesign();
 return d.environment?<PodPanel key={`${d.environment.id}:${d.service}`} d={d}/>:null;
}
function PodPanel({d}){
 const [inventory,setInventory]=useState({loading:true}),[uid,setUid]=useState(''),[series,setSeries]=useState({}),[revision,setRevision]=useState(0);
 const id=d.environment.id,service=d.service,base=`${environmentPath(id)}/services/${encodeURIComponent(service)}/pods`;
 const selected=inventory.data?.items.find(p=>p.uid===uid);
 useEffect(()=>{
  const abort=new AbortController();setInventory({loading:true});setSeries({});
  request(base,{signal:abort.signal}).then(data=>{validatePods(data,id,service);if(abort.signal.aborted)return;setInventory({data});setUid(old=>data.items.some(p=>p.uid===old)?old:data.items[0]?.uid||'');})
   .catch(e=>{if(!abort.signal.aborted)setInventory({error:e.message});});
  return()=>abort.abort();
 },[id,service,d.revision,revision]);
 useEffect(()=>{
  const abort=new AbortController();setSeries({});if(!selected)return()=>abort.abort();
  for(const [metric] of metrics){
   request(`${base}/${encodeURIComponent(selected.name)}/metrics?${new URLSearchParams({uid:selected.uid,metric,...d.range})}`,{signal:abort.signal})
    .then(data=>{validatePodMetric(data,id,service,selected,metric,d.range);if(!abort.signal.aborted)setSeries(old=>({...old,[metric]:{data}}));})
    .catch(e=>{if(!abort.signal.aborted)setSeries(old=>({...old,[metric]:{error:e.message}}));});
  }
  return()=>abort.abort();
 },[selected,id,service,d.range]);
 const latest=(metric,factor,unit)=>{const s=series[metric];return s?.error?'조회 실패':!s?'조회 중…':`${fmt(s.data.points.at(-1)?.value===null?null:s.data.points.at(-1)?.value*factor)} ${unit}`;};
 return <section aria-labelledby="pod-h" style={{display:'flex',flexDirection:'column',gap:12}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 id="pod-h" className="section-title" style={{margin:0,fontSize:16,fontWeight:600}}>Pod</h2><button className="ui-button" onClick={()=>setRevision(n=>n+1)}>Pod 새로고침</button></div>
  {inventory.loading?<p role="status">Pod 목록 조회 중…</p>:inventory.error?<p role="alert">{inventory.error}</p>:<>
   <div style={panel}><div className="scroll-region" style={{overflowX:'auto'}} tabIndex="0" role="region" aria-label="Pod 목록"><table className="data-table"><thead><tr>{['이름','상태','Ready','재시작','CPU','메모리','노드','시작'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{inventory.data.items.map(p=><tr key={p.uid} style={{background:p.uid===uid?'var(--selected)':undefined}}>
    <td><button className="ui-button mono" style={{maxWidth:'100%',overflowWrap:'anywhere',textAlign:'left'}} aria-pressed={p.uid===uid} onClick={()=>{if(p.uid!==uid){setSeries({});setUid(p.uid);}}}>{p.name}</button></td>
    <td>—</td><td>{p.ready===null?'확인 불가':p.ready?'준비 완료':'준비 안 됨'}</td><td>{p.restarts??'—'}</td>
    {metrics.map(([metric,,factor,unit])=><td key={metric}>{p.uid===uid?latest(metric,factor,unit):'선택 후 조회'}</td>)}<td>—</td><td>—</td>
   </tr>)}</tbody></table></div></div>
   {!inventory.data.items.length&&<p>관측된 Pod가 없습니다. 서비스 소속과 수집 상태를 확인하세요.</p>}
   <p className="secondary-text" style={{fontSize:12,margin:0}}>목록은 조회 당시 상태({new Date(inventory.data.queriedAt).toLocaleTimeString()})입니다. Ready는 요청 성공을 보장하지 않습니다. 상태·노드·시작 시각은 API 미제공입니다.{inventory.data.warnings.includes('UPSTREAM_WARNING')?' 저장소 조회 경고가 있습니다.':''}</p>
  </>}
  {selected&&<><p className="mono" style={{fontSize:12,overflowWrap:'anywhere',margin:0}}>선택한 Pod: {selected.name} · UID {selected.uid}</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:16}}>{metrics.map(([metric,title,factor,unit])=>{
    const state=series[metric],points=(state?.data?.points||[]).map(p=>({...p,value:p.value===null?null:p.value*factor})),max=Math.max(1,...points.map(p=>p.value??0));
    return <section key={metric} aria-label={`선택 Pod ${title}`} style={{...panel,padding:'16px 20px'}}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><h3 style={{margin:0,fontSize:14,fontWeight:500}}>Pod {title}</h3><span className="secondary-text">{latest(metric,factor,unit)}</span></div>
     {state?.error?<p role="alert">{state.error}</p>:!state?<p role="status">조회 중…</p>:<><div style={{display:'flex',gap:8,marginTop:12}}><div aria-hidden="true" style={{fontSize:12,display:'flex',flexDirection:'column',justifyContent:'space-between',color:'var(--text-2)'}}><span>{fmt(max)}</span><span>0</span></div><svg viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label={`${selected.name} ${title} 사용량 (${unit}), 누락 구간은 비워 둡니다.`} style={{width:'100%',minWidth:0,height:120}}><line x1="0" x2="600" y1="119.5" y2="119.5" stroke="var(--border-weak)"/><path d={chartPath(points,max)} fill="none" stroke="var(--text)" vectorEffect="non-scaling-stroke"/></svg></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-2)'}}>{[d.range.from,d.range.to].map(t=><span key={t}>{new Date(t).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'})}</span>)}</div>{state.data.dataStatus!=='AVAILABLE'&&<p className="secondary-text">{state.data.dataStatus==='NO_DATA'?'조회 구간에 관측값이 없습니다.':'일부 구간 누락 또는 저장소 경고가 있습니다.'}</p>}</>}
    </section>;
   })}</div><p className="secondary-text" style={{fontSize:12,margin:0}}>선택한 기간의 관측된 컨테이너 합계입니다. 표의 CPU·메모리는 마지막 지점의 값이며 누락은 —입니다. CPU는 1분 평균 코어 사용량, 메모리는 working set입니다. 전체 컨테이너 수집 여부는 확인되지 않습니다.</p></>}
 </section>;
}
