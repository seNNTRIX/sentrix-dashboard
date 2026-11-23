import React,{useState} from 'react';
import {useDesign} from './DesignContext.jsx';
const time=x=>new Date(x).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
export function LogVolume(){
 const d=useDesign(),state=d.volume||{},data=state.data,buckets=data?.buckets||[];
 const max=Math.max(1,...buckets.map(b=>b.count??0)),scale=Math.ceil(max/2)*2,step=600/Math.max(1,buckets.length);
 const total=buckets.reduce((n,b)=>n+(b.count??0),0),missing=buckets.some(b=>b.count===null);
 return <section className="panel panel-padded" aria-labelledby="vol-h" style={{background:'var(--bg1)',border:'1px solid var(--border-weak)',borderRadius:8,padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
  <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'baseline',gap:'8px 16px'}}>
   <h2 id="vol-h" className="section-title" style={{margin:0,fontSize:14,fontWeight:500}}>Logs volume</h2>
   {data&&<span className="secondary-text" style={{fontSize:12}}>{data.bucketSeconds/60}분별 전체 로그 · {data.dataStatus==='NO_DATA'?'집계 데이터 없음':`${missing?'관측된 구간 ':''}${total.toLocaleString()}건`}</span>}
  </div>
  {state.loading?<p role="status">로그 건수 조회 중…</p>:state.error?<p role="alert">{state.error} <button className="ui-button" onClick={d.run}>다시 조회</button></p>:!data?<p className="secondary-text">관측 환경을 선택하세요.</p>:<>
   <div style={{display:'flex',gap:8}}>
    <div aria-hidden="true" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:40,height:120,fontSize:12,color:'var(--text-2)',textAlign:'right'}}><span>{scale.toLocaleString()}</span><span>{(scale/2).toLocaleString()}</span><span>0</span></div>
    <svg viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label={`${data.service} 로그 건수, ${time(data.from)}부터 ${time(data.to)}까지. ${missing?'점선 구간은 집계값 없음.':''}`} style={{flex:1,minWidth:0,height:120,display:'block'}}>
     <line x1="0" y1="119.5" x2="600" y2="119.5" stroke="var(--border-weak)"/>
     {buckets.map((b,i)=><rect key={b.from} x={i*step+step*.14} y={b.count===null?1:120-b.count/scale*120} width={step*.72} height={b.count===null?118:b.count/scale*120} fill={b.count===null?'none':'var(--border-strong)'} stroke={b.count===null?'var(--border-strong)':'none'} strokeDasharray={b.count===null?'2 3':undefined}><title>{time(b.from)} 초과 ~ {time(b.to)} 이하: {b.count===null?'집계값 없음':`${b.count}건`}</title></rect>)}
    </svg>
   </div>
   <div className="chart-ticks explore-volume-ticks">{Array.from({length:6},(_,i)=><span key={i}>{time(Date.parse(data.from)+(Date.parse(data.to)-Date.parse(data.from))*i/5).slice(0,5)}</span>)}</div>
   {(missing||data.warnings.includes('UPSTREAM_WARNING'))&&<small className="secondary-text">{missing?'점선은 집계값이 없는 구간입니다. ':''}{data.warnings.includes('UPSTREAM_WARNING')?'저장소 조회 경고가 있습니다.':''}</small>}
  </>}
 </section>;
}

export function PublicLogRows(){
 const d=useDesign(),data=d.volume?.data,buckets=data?.buckets||[];
 const [newest,setNewest]=useState(true),[showTime,setShowTime]=useState(true),[showLabels,setShowLabels]=useState(false);
 const rows=newest?[...buckets].reverse():buckets;
 return <section aria-labelledby="logs-h" className="panel explore-log-list"><header><h2 id="logs-h" className="section-title">Logs</h2><small>분 단위 집계 · {rows.length}개 구간</small></header>
  <div className="explore-log-options">
   <label><input type="checkbox" checked={showTime} onChange={e=>setShowTime(e.target.checked)}/>Time</label>
   <label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/>Labels</label>
   <span>정렬</span><div className="sx-map-modes" role="group" aria-label="정렬">{[true,false].map(flag=><button key={String(flag)} aria-pressed={newest===flag} onClick={()=>setNewest(flag)}>{flag?'최신 순':'오래된 순'}</button>)}</div>
  </div>
  {!data?<p className="secondary-text">{d.volume?.error||'집계 조회 중…'}</p>:rows.length===0?<p className="secondary-text">조회 구간에 집계된 로그가 없습니다.</p>:rows.map(b=><details key={data.service+b.from} className="explore-log-entry"><summary>
   {showTime&&<time>{time(b.to)}</time>}<span>{data.service}</span>{showLabels&&<small>{d.environment?.namespace}</small>}
   <strong>{b.count===null?'집계값 없음':b.count.toLocaleString()+'건'}</strong></summary>
   <dl><dt>서비스</dt><dd>{data.service}</dd><dt>집계 구간</dt><dd>{time(b.from)} – {time(b.to)}</dd><dt>로그 건수</dt><dd>{b.count===null?'집계값 없음':b.count.toLocaleString()}</dd></dl>
  </details>)}
 </section>;
}
