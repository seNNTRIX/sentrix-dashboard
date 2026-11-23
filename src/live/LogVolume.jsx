import React from 'react';
import {useDesign} from './DesignContext.jsx';
const time=x=>new Date(x).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
const palette={unknown:'var(--text-2)',trace:'#abb6c1',debug:'#aab3bc',info:'var(--border-strong)',warning:'var(--warning)',error:'var(--error)'};
export function LogVolume({hidden={},onToggle}){
 const d=useDesign(),state=d.volume||{},data=state.data,buckets=data?.buckets||[];
 const max=Math.max(1,...buckets.map(b=>b.count??0)),scale=Math.ceil(max/2)*2,step=600/Math.max(1,buckets.length);
 const categories=Object.keys(palette).filter(key=>['info','warning','error'].includes(key)||buckets.some(b=>b.levels?.[key]>0||(key==='unknown'&&!b.levels&&b.count>0)));
 const shown=key=>!hidden[key==='warning'?'warn':key];
 const missing=buckets.some(b=>b.count===null);
 return <section className="panel panel-padded" aria-labelledby="vol-h" style={{background:'var(--bg1)',border:'1px solid var(--border-weak)',borderRadius:8,padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
  <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'8px 16px'}}>
   <h2 id="vol-h" className="section-title" style={{margin:0,fontSize:14,fontWeight:500}}>Logs volume</h2>
   <div className="volume-legend">{[...categories].reverse().map(key=><button key={key} type="button" aria-pressed={shown(key)} onClick={()=>onToggle(key==='warning'?'warn':key)}><i style={{background:palette[key]}}/>{key==='unknown'?'미분류':key}</button>)}</div>
  </div>
  {state.loading?<p role="status">로그 건수 조회 중…</p>:state.error?<p role="alert">{state.error} <button className="ui-button" onClick={d.run}>다시 조회</button></p>:!data?<p className="secondary-text">관측 환경을 선택하세요.</p>:<>
   <div style={{display:'flex',gap:8}}>
    <div aria-hidden="true" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:40,height:120,fontSize:12,color:'var(--text-2)',textAlign:'right'}}><span>{scale.toLocaleString()}</span><span>{(scale/2).toLocaleString()}</span><span>0</span></div>
    <svg viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label={`${data.service} 로그 건수, ${time(data.from)}부터 ${time(data.to)}까지. ${missing?'점선 구간은 집계값 없음.':''}`} style={{flex:1,minWidth:0,height:120,display:'block'}}>
     <line x1="0" y1="119.5" x2="600" y2="119.5" stroke="var(--border-weak)"/>
     {buckets.map((b,i)=>{
      const x=i*step+step*.14,w=step*.72;
      if(b.count===null)return <rect key={b.from} x={x} y="1" width={w} height="118" fill="none" stroke="var(--border-strong)" strokeDasharray="2 3"><title>{time(b.to)} · 집계값 없음</title></rect>;
      const levels=b.levels||{unknown:b.count};
      let bottom=120;
      return <g key={b.from}><title>{time(b.to)} · {b.count}건</title>{categories.filter(shown).map(key=>{
       const h=(levels[key]||0)/scale*120;bottom-=h;
       return h>0?<rect key={key} data-level={key} x={x} y={bottom} width={w} height={h} fill={palette[key]}/>:null;
      })}</g>;
     })}
    </svg>
   </div>
   <div className="chart-ticks explore-volume-ticks">{Array.from({length:6},(_,i)=><span key={i}>{time(Date.parse(data.from)+(Date.parse(data.to)-Date.parse(data.from))*i/5).slice(0,5)}</span>)}</div>
   {(missing||data.warnings.includes('UPSTREAM_WARNING'))&&<small className="secondary-text">{missing?'점선은 집계값이 없는 구간입니다. ':''}{data.warnings.includes('UPSTREAM_WARNING')?'저장소 조회 경고가 있습니다.':''}</small>}
  </>}
 </section>;
}
