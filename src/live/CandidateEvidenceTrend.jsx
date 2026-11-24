import React,{useEffect,useMemo,useState} from 'react';
import {environmentPath,request} from './api.js';
import {MetricPlot} from './OverviewPlots.jsx';
import {evidenceRange,evidenceScale,metricEvidencePoints} from './candidate-trend.js';

const clock=(v,seconds=false)=>new Date(v).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit',...(seconds?{second:'2-digit'}:{})});
const interval=(a,b,seconds)=>clock(a,seconds)+'–'+clock(b,seconds);
const axisLabel=x=>new Intl.NumberFormat('ko-KR',{maximumSignificantDigits:3}).format(x);

function RecordedValues({plan,result}){
 const period=interval(result.windowStart,result.windowEnd,true);
 return <figure className="rca-trend"><figcaption><span>{plan.title}</span><span>{period}</span></figcaption>
 {plan.type==='comparison'?<table className="rca-comparison"><thead><tr><th>지표</th><th>평소 기준</th><th>분석 구간</th></tr></thead>
  <tbody>{plan.rows.map(r=><tr key={r.label}><th scope="row">{r.label}</th><td>{r.before.toFixed(r.digits)} {r.unit}</td><td>{r.current.toFixed(r.digits)} {r.unit}</td></tr>)}</tbody></table>
 :<p className="rca-observed-value">{plan.summary||'이 구간에 저장된 개별 측정값이 없습니다.'}</p>}</figure>;
}

function HistoricalTrend({plan,candidate,record,result,environment}){
 const range=useMemo(()=>evidenceRange(result.windowEnd),[result.windowEnd]);
 const [data,setData]=useState(null);
 useEffect(()=>{
  const controller=new AbortController(),signal=controller.signal,base=environmentPath(environment.id);
  async function load(){
   if(plan.type==='archived'){
    const graph=await request(base+'/observed-topology?'+new URLSearchParams({end:range.to}),{signal});
    const from=Date.parse(range.from),to=Date.parse(range.to);
    const series=(graph.history||[]).filter(p=>Date.parse(p.time)>=from&&Date.parse(p.time)<to)
     .map(p=>({timestamp:p.time,value:Number.isFinite(p[plan.field]?.[plan.key])?p[plan.field][plan.key]:null}));
    return [{label:plan.title,points:series}];
   }
   return Promise.all(plan.metrics.map(async metric=>{
    try {
     const response=await request(base+'/metrics?'+new URLSearchParams({service:candidate.service,metric:metric.id,...range}),{signal});
     return {label:metric.label,description:metric.description,points:metricEvidencePoints(response,environment.id,candidate.service,metric,range)};
    }catch(error){return {label:metric.label,points:[],error:error.message};}
   }));
  }
  load().then(rows=>{if(!signal.aborted)setData(rows);}).catch(e=>{if(!signal.aborted)setData([{label:plan.title,points:[],error:e.message}]);});
  return ()=>controller.abort();
 },[range,plan,environment.id,candidate.service]);
 const series=(data||[]).map(s=>s.points);
 const values=series.flat().map(p=>p.value).filter(Number.isFinite);
 const unavailable=(data||[]).filter(s=>!s.points.some(p=>Number.isFinite(p.value)));
 const scale=evidenceScale(values,plan.unit);
 const bands=record?[{jobId:record.id,decision:'ANOMALY',label:'장애 기록 구간',windowStart:record.occurredAt,windowEnd:record.resolvedAt||range.to}]:[];
 return <figure className="rca-trend" aria-busy={data===null}><figcaption><span>{plan.title} ({plan.unit})</span><span>{interval(range.from,range.to)}</span></figcaption>
 {values.length>0?<div className="rca-metric-frame"><div className="rca-axis">{scale.ticks.map(t=><span key={t} style={{top:((119-115*(t-scale.min)/(scale.max-scale.min))/120*100)+'%'}}>{axisLabel(t)}</span>)}</div>
 <MetricPlot chart={{series,...scale,aria:plan.title+' ('+plan.unit+')',step:plan.unit==='개'}} rows={bands} range={plan.type==='archived'?{...range,stepSeconds:10}:range}/></div>
 :<div className="rca-empty" role="status">{!data?'시계열 조회 중…':data.some(s=>s.error)?'이 기간의 시계열을 불러오지 못했습니다.':'이 기간에 수집된 값이 없습니다.'}</div>}
 {values.length>0&&unavailable.length>0&&<small role="status">{unavailable.map(s=>s.label+(s.error?' 조회 실패':' 관측값 없음')).join(' · ')}</small>}
 {data&&!values.length&&plan.summary&&<p className="rca-observed-value">{plan.summary}</p>}
 {values.length>0&&<div className="rca-keys">{data.map((item,i)=>item.points.some(p=>Number.isFinite(p.value))&&<span key={item.label} title={item.description}><i style={{background:i?'var(--text-2)':'var(--text)'}}/>{item.label}</span>)}{bands.length>0&&<span><i className="rca-band-key"/>장애 기록 구간</span>}</div>}
 </figure>;
}

export function CandidateEvidenceTrend({plan,candidate,record,result,environment}){
 const key=[environment.id,environment.recorded,result.jobId,result.windowEnd,candidate.rank,candidate.service,candidate.source,candidate.target].join('|');
 return plan.type==='history'||plan.type==='archived'
  ?<HistoricalTrend key={key} plan={plan} candidate={candidate} result={result} record={record} environment={environment}/>
  :<RecordedValues plan={plan} result={result}/>;
}
