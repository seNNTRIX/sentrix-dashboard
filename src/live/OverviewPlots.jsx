import React,{useState} from 'react';
import {useServiceDeviation} from './useServiceDeviation.js';
import {historyStates} from './service-health.js';
import {decisionLabel,jobLabel,analysisReason} from './analysis-values.js';
import {serviceCutoff} from './service-deviation.js';
import {scoreY,splitSeries} from './plot-series.js';

const time = value => new Date(value).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});
const windowTime = value => new Date(value).toLocaleTimeString('en-GB',{hour12:false});
const ticks = (from,to,count) => Array.from({length:count},(_,i)=>time(from+(to-from)*i/(count-1)));

function intervals(rows, from, to) {
 return (rows||[]).map(row=>({row, start:Math.max(from,Date.parse(row.windowStart)), end:Math.min(to,Date.parse(row.windowEnd))}))
  .filter(x=>x.end>x.start).sort((a,b)=>a.start-b.start);
}
function Shading({bands,x,height}) {
 return bands.filter(({row})=>row.decision==='ANOMALY').map(({row,start,end})=>
  <rect key={row.jobId} x={x(start)} width={x(end)-x(start)} height={height} className="sx-anomaly-band" fill="var(--shade)"><title>환경 이상 판정 · {windowTime(start)}–{windowTime(end)}</title></rect>);
}
function Series({plot,x,y,color,width=1.5}) {
 const xy = point => x(point.t)+' '+y(point.value);
 const line = points => points.map((point,i)=>(i?'L':'M')+xy(point)).join(' ');
 const {runs,bridges} = plot;
 const latest = runs.at(-1)?.at(-1);
 return <g fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round">
  {bridges.map(([a,b])=><path key={a.t} className="sx-gap-bridge" d={line([a,b])} vectorEffect="non-scaling-stroke">
   <title>{windowTime(a.t)}–{windowTime(b.t)} · 중간 관측값 없음</title></path>)}
  <path className="sx-observed-line" d={runs.map(line).join(' ')} vectorEffect="non-scaling-stroke"/>
  {runs.filter(run=>run.length===1 && run[0]!==latest).map(([p])=><circle key={p.t} cx={x(p.t)} cy={y(p.value)} r="1.8" fill={color} stroke="none"/>)}
  {latest&&<circle key={latest.t} className="sx-sample" cx={x(latest.t)} cy={y(latest.value)} r="1.8" fill={color} stroke="none"/>}
 </g>;
}
export function ScorePanel({rows,error,threshold,range,service,environment}){
 const [mode,setMode]=useState('environment');
 const local=mode==='service';
 const state=useServiceDeviation(environment?.id,service,range,local&&!environment?.recorded);
 const from=Date.parse(range.from),to=Date.parse(range.to),bands=intervals(rows,from,to);
 const points=[],gaps=[];let lastEnd;
 const observed=bands.filter(({row})=>Date.parse(row.windowEnd)<=to);
 if(!local)for(const {row,start,end} of observed){
  if(lastEnd && start>lastEnd)gaps.push({start:lastEnd,end:start,label:'분석 기록 없음'});
  if(!Number.isFinite(row.score))gaps.push({start,end,label:[row.decision?decisionLabel(row.decision):jobLabel(row.status),analysisReason(row.reason)].filter(Boolean).join(' · ')});
  if(lastEnd && Date.parse(row.windowStart)>lastEnd)points.push({t:(lastEnd+start)/2,value:null});
  lastEnd=Date.parse(row.windowEnd);
  if(lastEnd<=to)points.push({t:lastEnd,value:row.score});
 }
 const series=local?(state.points||[]):points;
 const limit=local?serviceCutoff:threshold, maximum=local?100:1;
 const x=t=>600*(t-from)/(to-from),y=v=>scoreY(v,maximum);
 const plot=splitSeries(series,local?60000:30000);
 const finite=series.some(p=>Number.isFinite(p.value)),format=v=>Number.isFinite(v)?v.toFixed(local?1:4):'—';
 const newest=observed.at(-1)?.row;
 const lastRow=observed.findLast(({row})=>row.decision)?.row;
 const latestValue=local?series.at(-1)?.value:lastRow?.score;
 const newerJob=newest && newest.jobId!==lastRow?.jobId;
 const decision=lastRow?decisionLabel(lastRow.decision):'판정 대기';
 return <section className="panel obs-panel obs-score" aria-labelledby="score-h">
  <header><h2 id="score-h">{local?'서비스 지표 이탈':'Anomaly score'} <small>{local?service:'환경 전체'}</small></h2>
   <div className="sx-map-modes" role="group" aria-label="점수 범위">
    {!environment?.recorded&&<button type="button" aria-pressed={local} onClick={()=>setMode('service')}>서비스 지표</button>}
    <button type="button" aria-pressed={!local} onClick={()=>setMode('environment')}>환경 모델</button>
   </div></header>
  <div className="score-summary"><strong>{local?'서비스 이탈 점수':'모델 점수'} {format(latestValue)}</strong>
   {Number.isFinite(limit)&&<span className="score-key"><i/>{local?'참고선':'현재 점수 기준'} {format(limit)}</span>}
   {!local&&Number.isFinite(limit)&&latestValue>limit&&<span>점수 기준 초과</span>}
   <span>{local?(Number.isFinite(latestValue)?series.at(-1).signal+' · 지표 '+series.at(-1).coverage+'/3개':''):<>최종 판정 <b>{decision}</b> {lastRow&&<time dateTime={lastRow.windowEnd}>{windowTime(lastRow.windowEnd)}</time>}</>}</span>
   {local&&state.error&&finite&&<span>갱신 실패 · 직전 관측값</span>}
   {!local&&newerJob&&<span>{windowTime(newest.windowEnd)} · {jobLabel(newest.status)}</span>}
  </div>
  {(finite||gaps.length>0)?<div className="score-plot"><div className="score-axis" aria-label="Y축">{[1,.75,.5,.25,0].map(n=><span key={n} style={{top:y(n*maximum)}}>{local?n*100:n.toFixed(2)}</span>)}</div>
   <svg viewBox="0 0 600 160" preserveAspectRatio="none" role="img" aria-label={(local?service+' 서비스 지표 이탈 점수':'환경 모델 이상 점수')+' · 세로축 0~'+maximum}>
    <Shading bands={bands} x={x} height={160}/>
    {gaps.map(g=><g className="sx-missing-window" key={g.start+'-'+g.end}><title>{windowTime(g.start)}–{windowTime(g.end)} · {g.label}</title>
     <rect x={x(g.start)} width={x(g.end)-x(g.start)} height="160" fill="transparent"/>
     <rect x={x(g.start)} width={x(g.end)-x(g.start)} y="156" height="4" fill="var(--border-strong)"/></g>)}
    {Number.isFinite(limit)&&<line x2="600" y1={y(limit)} y2={y(limit)} stroke="var(--text-2)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"/>}
    <Series plot={plot} x={x} y={y} color="var(--text)"/>
   </svg><footer>{ticks(from,to,6).map((t,i)=><span key={i}>{t}</span>)}</footer></div>
   :<div className="obs-empty">{local?(state.error||(state.points?'비교할 서비스 지표가 부족합니다.':'서비스 지표 조회 중…')):(error||'이 기간에 관측된 점수가 없습니다.')}</div>}
  <div className="score-legend"><span><i className="alarm-key"/>이상 판정 구간</span>{gaps.length>0&&<span><i className="missing-key"/>점수 없음</span>}{plot.bridges.length>0&&<span><i className="gap-key"/>짧은 결측 연결</span>}</div>
  <p className="sx-score-context">{local?'직전 1시간과 비교한 요청량·오류율·p99 지연 중 가장 큰 이탈입니다. 분홍 음영은 환경 모델의 이상 판정 구간입니다.':environment?.id===1&&location.pathname==='/display'?'10초 간격의 두 분석 구간이 모두 점수 기준을 넘고, 지연·오류 등 관측 증상이 있어야 이상으로 판정합니다.':'가로 점선은 현재 모델의 임계값입니다.'}</p>
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
 const from=Date.parse(range.from),to=Date.parse(range.to),minimum=chart.min??0;
 const x=t=>600*(t-from)/(to-from),y=v=>119-115*(v-minimum)/(chart.max-minimum);
 const series=chart.series.map(points=>points.map(p=>({t:Date.parse(p.timestamp),value:p.value})));
 const plots=chart.column?[]:series.map(points=>splitSeries(points,range.stepSeconds*1000));
 const barWidth=Math.min(22,600*range.stepSeconds*1000/(to-from)*.78);
 if(chart.error)return <p role="alert" className="bound-notice">{chart.error}</p>;
 return <svg className="sx-metric" viewBox="0 0 600 120" preserveAspectRatio="none" role="img" aria-label={chart.aria}>
  {plots.some(p=>p.bridges.length>0)&&<desc>가는 점선은 짧은 결측 전후의 두 관측값을 잇습니다.</desc>}
  <Shading bands={intervals(rows,from,to)} x={x} height={120}/>
  <line x2="600" y1="119.5" y2="119.5" stroke="var(--border-weak)" vectorEffect="non-scaling-stroke"/>
  {chart.column?series[0].map((p,i)=>Number.isFinite(p.value)&&<rect key={p.t} className={i===series[0].length-1?'sx-bar':''} x={x(p.t)-barWidth/2} width={barWidth} y={y(p.value)} height={Math.max(0,119-y(p.value))} fill="var(--border)"/>)
   :plots.map((plot,i)=><Series key={i} plot={plot} x={x} y={y} color={['var(--text)','var(--text-2)','var(--border-strong)'][i]} width={i?1.15:1.5}/>)}
 </svg>;
}

function HistoryRow({name,environment,range}){
 const from=Date.parse(range.from),to=Date.parse(range.to);
 const {points,error}=useServiceDeviation(environment?.id,name,range,!environment?.recorded,true);
 const segments=[];
 for(const {t,status} of points||[]){
  const start=Math.max(from,t-60000),end=Math.min(to,t);
  if(end<=start)continue;
  const last=segments.at(-1);
  if(last?.status===status && last.end===start)last.end=end;
  else segments.push({start,end,status});
 }
 return <div className="sx-history-row"><a href={'#B5-Service?service='+encodeURIComponent(name)}>{name}</a>
  <div className="sx-track" aria-label={name+' 관측 이력'} aria-busy={!points&&!error} title={error||(!points?'지표 조회 중':'미관측')}>
   {!points&&<small className="history-pending">{error?'조회 실패':'조회 중…'}</small>}{segments.map(s=><span key={s.start} className={'sx-'+s.status} style={{left:(s.start-from)/(to-from)*100+'%',width:(s.end-s.start)/(to-from)*100+'%'}} title={name+' · '+historyStates[s.status]+' · '+time(s.start)+'–'+time(s.end)}/>)}
  </div></div>;
}
export function ServiceHistory({live}){
 const {range,inventory,environment}=live,from=Date.parse(range.from),to=Date.parse(range.to);
 return <section className="panel obs-panel sx-history" aria-labelledby="st-h"><header><h2 id="st-h">서비스 상태 <small>오류율 · p99</small></h2><div className="sx-legend" title="직전 1시간의 중앙값과 비교합니다. 오류율이 2%p 이상 증가하면 빨강, p99가 1.5배 이상이면서 20ms 이상 증가하면 노랑입니다.">{Object.entries(historyStates).map(([key,label])=><span key={key}><i className={'sx-'+key}/>{label}</span>)}</div></header>
 <div className="sx-history-body">{!inventory.length&&<p>{live.inventoryError||'서비스 목록 조회 중…'}</p>}
 {environment?.recorded?<p>서비스별 서버 지표 이력이 없습니다.</p>:inventory.map(({name})=><HistoryRow key={name} name={name} environment={environment} range={range}/>)}
 <div className="sx-history-row"><span/><footer>{ticks(from,to,6).map((t,i)=><span key={i}>{t}</span>)}</footer></div></div></section>;
}
