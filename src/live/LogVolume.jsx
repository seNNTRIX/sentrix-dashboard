import React from 'react';
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
   <div className="chart-ticks" style={{display:'flex',justifyContent:'space-between',marginLeft:48,fontSize:12,color:'var(--text-2)'}}><span>{time(data.from)}</span><span>{time(data.to)}</span></div>
   <p className="secondary-text" style={{fontSize:12,margin:0}}>서비스·포함 문자열 기준 전체 집계입니다. 아래 목록의 Limit·중복 제거·심각도 표시 필터와 독립적입니다. 수집 누락 여부는 알 수 없습니다.{missing?' 점선은 로그 없음 또는 미수집으로 집계값을 확인할 수 없는 구간입니다.':''}{data.to!==d.range.to||data.from!==d.range.from?' 선택 기간 안의 완성된 분 구간만 집계합니다.':''}{data.warnings.includes('UPSTREAM_WARNING')?' 저장소 조회 경고가 있습니다.':''}</p>
  </>}
 </section>;
}
