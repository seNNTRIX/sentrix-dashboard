import React,{useState} from 'react';
import {useServiceDeviation} from './useServiceDeviation.js';
import {historyStates} from './service-health.js';
import {decisionLabel,jobLabel,analysisReason} from './analysis-values.js';
import {serviceCutoff} from './service-deviation.js';
import {scoreSamples,scoreY,splitSeries} from './plot-series.js';

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
 const observed=bands.map(({row})=>row).filter(row=>Date.parse(row.windowEnd)<=to)
  .sort((a,b)=>Date.parse(a.windowEnd)-Date.parse(b.windowEnd));
 const series=local?(state.points||[]):observed.map(row=>({t:Date.parse(row.windowEnd),value:row.score}));
 const samples=scoreSamples(series);
 const limit=local?serviceCutoff:threshold, maximum=local?100:1;
 const x=t=>600*(t-from)/(to-from),y=v=>scoreY(v,maximum);
 const format=value=>Number.isFinite(value)?value.toFixed(local?1:4):'—';
 const newest=observed.at(-1), lastDecision=observed.findLast(row=>row.decision);
 const value=local?series.at(-1)?.value:lastDecision?.score;
 const asOf=local?series.at(-1)?.t:lastDecision?.windowEnd;
 const current=Number.isFinite(value)?format(value):!local&&lastDecision?decisionLabel(lastDecision.decision):'—';
 const detail=local?service:[lastDecision&&decisionLabel(lastDecision.decision),analysisReason(lastDecision?.reason),
  newest&&newest!==lastDecision&&jobLabel(newest.status)].filter(Boolean).join(' · ');
 const statusTitle=[asOf&&windowTime(asOf),detail,(local?state.error:error)].filter(Boolean).join(' · ');
 const path=samples.map((p,i)=>(i?'L':'M')+x(p.t)+' '+y(p.value)).join(' ');
 return <section className="panel obs-panel obs-score" aria-labelledby="score-h">
  <header><h2 id="score-h">{environment?.recorded?'Anomaly score':<select aria-label="점수 범위" title={local?service:'환경 전체 모델 점수'} value={mode} onChange={e=>setMode(e.target.value)}>
   <option value="environment">Anomaly score</option><option value="service">서비스 지표 이탈</option>
  </select>}</h2>
   <span className="mono score-current" title={statusTitle}>현재 {current}{Number.isFinite(limit)&&<>, {local?'참고선':'임계값'} {format(limit)}</>}{local&&state.error&&samples.length>0?' · 갱신 실패':''}</span></header>
  {samples.length>0?<div className="score-plot"><div className="score-axis" aria-label="Y축">{[1,.75,.5,.25,0].map(n=><span key={n} style={{top:y(n*maximum)}}>{local?n*100:n.toFixed(2)}</span>)}</div>
   <svg viewBox="0 0 600 160" preserveAspectRatio="none" role="img" aria-label={(local?service+' 서비스 지표 이탈 점수':'환경 모델 이상 점수')+' · 세로축 0~'+maximum}>
    <desc>검은 선은 점수가 있는 시각만 이어 그립니다. 분홍 음영은 실제 환경 이상 판정 구간입니다.</desc>
    <Shading bands={bands} x={x} height={160}/>
    {Number.isFinite(limit)&&<line x2="600" y1={y(limit)} y2={y(limit)} stroke="var(--border-strong)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke"/>}
    <path className="sx-observed-line" d={path} fill="none" stroke="var(--text)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    {samples.length===1&&<circle cx={x(samples[0].t)} cy={y(samples[0].value)} r="2" fill="var(--text)"/>}
   </svg><footer>{ticks(from,to,6).map((t,i)=><span key={i}>{t}</span>)}</footer></div>
   :<div className="obs-empty">{local?(state.error||(state.points?'비교할 서비스 지표가 부족합니다.':'서비스 지표 조회 중…')):(error||analysisReason(lastDecision?.reason)||'이 기간에 관측된 점수가 없습니다.')}</div>}
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
