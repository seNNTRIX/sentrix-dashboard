import React,{useState} from 'react';
import {useServiceDeviation} from './useServiceDeviation.js';
import {serviceCutoff} from './service-deviation.js';

const time = value => new Date(value).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});
const ticks = (from,to,count) => Array.from({length:count},(_,i)=>time(from+(to-from)*i/(count-1)));

function intervals(rows, from, to) {
 return (rows||[]).map(row=>({row, start:Math.max(from,Date.parse(row.windowStart)), end:Math.min(to,Date.parse(row.windowEnd))}))
  .filter(x=>x.end>x.start).sort((a,b)=>a.start-b.start);
}
function Shading({bands,x,height}) {
 return bands.filter(({row})=>row.decision==='ANOMALY').map(({row,start,end})=>
  <rect key={row.jobId} x={x(start)} width={x(end)-x(start)} height={height} fill="var(--shade)"/>);
}
function Series({points,x,y,color,width=1.5}) {
 let path='',last,tip;
 for(let i=0;i<points.length;i++){
  const p=points[i];
  if(!Number.isFinite(p.value)){last=null;continue;}
  const here=x(p.t)+' '+y(p.value);
  if(i===points.length-1 && last)tip='M'+last+' L'+here;
  else path+=(last?' L':' M')+here;
  last=here;
 }
 return <g fill="none" stroke={color} strokeWidth={width}>
  <path d={path} vectorEffect="non-scaling-stroke"/>
  {tip&&<path key={points.at(-1).t} className="sx-draw" d={tip} pathLength="1" vectorEffect="non-scaling-stroke"/>}
  {last&&<circle key={'dot'+points.at(-1).t} className="sx-sample" cx={last.split(' ')[0]} cy={last.split(' ')[1]} r="1.65" fill={color} stroke="none"/>}
 </g>;
}
export function ScorePanel({rows,error,threshold,range,service,environment}){
 const [mode,setMode]=useState(environment?.recorded?'environment':'service');
 const local=mode==='service';
 const state=useServiceDeviation(environment?.id,service,range,local&&!environment?.recorded);
 const from=Date.parse(range.from),to=Date.parse(range.to),bands=intervals(rows,from,to);
 const points=[];let lastEnd;
 if(!local)for(const {row} of bands){
  if(lastEnd && Date.parse(row.windowStart)>lastEnd)points.push({t:lastEnd,value:null});
  lastEnd=Date.parse(row.windowEnd);
  if(lastEnd<=to)points.push({t:lastEnd,value:row.score});
 }
 const series=local?(state.points||[]):points,latest=series.at(-1);
 const limit=local?serviceCutoff:threshold, maximum=local?100:1;
 const x=t=>600*(t-from)/(to-from),y=v=>156-152*v/maximum;
 const finite=series.some(p=>Number.isFinite(p.value)),format=v=>Number.isFinite(v)?v.toFixed(local?1:4):'—';
 const lastRow=bands.at(-1)?.row;
 const decision={NORMAL:'정상',ANOMALY:'이상',ABSTAIN:'판정 보류'}[lastRow?.decision]||'판정 대기';
 return <section className="panel obs-panel obs-score" aria-labelledby="score-h">
  <header><h2 id="score-h">Anomaly score <small>{local?service:'환경 전체'}</small></h2>
   <div className="sx-map-modes" role="group" aria-label="점수 범위">
    {!environment?.recorded&&<button type="button" aria-pressed={local} onClick={()=>setMode('service')}>서비스 지표</button>}
    <button type="button" aria-pressed={!local} onClick={()=>setMode('environment')}>환경 모델</button>
   </div></header>
  <div className="score-summary"><strong>{local?'서비스 이탈 점수':'모델 이상 점수'} {format(latest?.value)}</strong>
   {Number.isFinite(limit)&&<span className="score-key"><i/>{local?'참고선':'모델 임계값'} {format(limit)}</span>}
   <span>{local?(Number.isFinite(latest?.value)?latest.signal+' · 지표 '+latest.coverage+'/3개':''):decision}</span>
  </div>
  {finite?<div className="score-plot"><div className="score-axis" aria-label="Y축">{[1,.75,.5,.25,0].map(n=><span key={n}>{local?n*100:n.toFixed(2)}</span>)}</div>
   <svg viewBox="0 0 600 160" preserveAspectRatio="none" role="img" aria-label={(local?service+' 서비스 지표 이탈 점수':'환경 모델 이상 점수')+' · 세로축 0~'+maximum}>
    {!local&&<Shading bands={bands} x={x} height={160}/>}
    {Number.isFinite(limit)&&<line x2="600" y1={y(limit)} y2={y(limit)} stroke="var(--text-2)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"/>}
    <Series points={series} x={x} y={y} color="var(--text)"/>
   </svg><footer>{ticks(from,to,6).map((t,i)=><span key={i}>{t}</span>)}</footer></div>
   :<div className="obs-empty">{local?(state.error||(state.points?'비교할 서비스 지표가 부족합니다.':'서비스 지표 조회 중…')):(error||'이 기간에 관측된 점수가 없습니다.')}</div>}
  <p className="sx-score-context">{local?'직전 1시간과 비교한 요청량·오류율·p99 지연 중 가장 큰 이탈입니다.':environment?.id===1&&location.pathname==='/display'?'두 연속 분석 구간의 점수가 임계값을 넘고 관측 증상이 확인되면 이상으로 판정합니다. 음영은 실제 이상 판정입니다.':'점선은 현재 모델의 임계값, 음영은 실제 이상 판정입니다.'}</p>
 </section>;
}

export function HomeServicePicker({live}){
 const {metricService,serviceNames,setHomeChoice,inventoryLoading,inventoryError}=live;
 return <label className="home-service-picker">서비스
  <select className="ui-input" aria-label="지표 서비스" value={metricService} disabled={!serviceNames.length} onChange={e=>setHomeChoice(e.target.value)}>
   {!serviceNames.length&&<option value="">{inventoryLoading?'조회 중…':inventoryError?'서비스 조회 실패':'서비스 없음'}</option>}
   {serviceNames.map(name=><option key={name} value={name}>{name}</option>)}
  </select>
 </label>;
}

export function MetricPlot({chart,range,rows}){
 const from=Date.parse(range.from),to=Date.parse(range.to), x=t=>600*(t-from)/(to-from),y=v=>119-117*v/chart.max;
 const series=chart.series.map(points=>points.map(p=>({t:Date.parse(p.timestamp),value:p.value})));
 const barWidth=Math.min(22,600*range.stepSeconds*1000/(to-from)*.78);
 if(chart.error)return <p role="alert" className="bound-notice">{chart.error}</p>;
 return <svg className="sx-metric" viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label={chart.aria}>
  <Shading bands={intervals(rows,from,to)} x={x} height={120}/>
  <line x2="600" y1="119.5" y2="119.5" stroke="var(--border-weak)" vectorEffect="non-scaling-stroke"/>
  {chart.column?series[0].map((p,i)=>Number.isFinite(p.value)&&<rect key={p.t} className={i===series[0].length-1?'sx-bar':''} x={x(p.t)-barWidth/2} width={barWidth} y={y(p.value)} height={Math.max(0,119-y(p.value))} fill="var(--border)"/>)
   :series.map((points,i)=><Series key={i} points={points} x={x} y={y} color={['var(--text)','var(--text-2)','var(--border-strong)'][i]} width={i?1.15:1.5}/>)}
 </svg>;
}

function serviceState(row,service){
 if(row.decision==='NORMAL')return 'normal';
 if(row.decision!=='ANOMALY'||!Array.isArray(row.locations))return 'unknown';
 const hits=row.locations.filter(c=>c.service===service||c.source===service||c.target===service);
 return hits.some(c=>c.rank===1)?'alarm':hits.length?'warn':'unranked';
}
const states={normal:'정상 판정',warn:'경고 · 2~3순위 후보',alarm:'이상 · 1순위 후보',unknown:'미판정',unranked:'이상 구간 · 상위 후보 외'};
export function ServiceHistory({live}){
 const {range,overview,inventory}=live, from=Date.parse(range.from),to=Date.parse(range.to);
 const bands=intervals(overview?.recentWindows,from,to);
 const inventoryRows=inventory.filter(s=>!live.applicationServices||live.applicationServices.includes(s.name)).sort((a,b)=>Number(b.name===live.metricService)-Number(a.name===live.metricService));
 return <section className="panel obs-panel sx-history" aria-labelledby="st-h"><header><h2 id="st-h">서비스 상태</h2><div className="sx-legend">{[['normal','정상'],['warn','경고'],['alarm','이상'],['unknown','미판정']].map(([key,label])=><span key={key} title={states[key]}><i className={'sx-'+key}/>{label}</span>)}</div></header>
 <div className="sx-history-body">{!inventory.length&&<p>{live.inventoryError||'서비스 목록 조회 중…'}</p>}{inventoryRows.map(({name})=>{
  const segments=[];
  for(const b of bands){const status=serviceState(b.row,name),last=segments.at(-1);if(last?.status===status&&last.end===b.start)last.end=b.end;else segments.push({...b,status});}
  return <div key={name} className="sx-history-row"><a href={'#B5-Service?service='+name}>{name}</a><div className="sx-track">{segments.map(s=><span key={s.start} className={'sx-'+s.status} style={{left:(s.start-from)/(to-from)*100+'%',width:(s.end-s.start)/(to-from)*100+'%'}} title={name+' · '+states[s.status]+' · '+time(s.start)+'–'+time(s.end)}/>)}</div></div>;
 })}<div className="sx-history-row"><span/><footer>{ticks(from,to,6).map((t,i)=><span key={i}>{t}</span>)}</footer></div></div></section>;
}
