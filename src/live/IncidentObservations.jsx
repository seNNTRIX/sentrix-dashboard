import React,{useEffect,useState} from 'react';
import {environmentPath,queryRange,request} from './api.js';
import {MetricPlot} from './OverviewPlots.jsx';
import {volumeRange} from './log-volume.js';

const metrics=[['request_rate','Requests','req/s'],['error_ratio','Error rate','%'],['latency_p90_ms','지연 p90','ms'],['cpu_usage_cores','CPU 사용량','cores']];
const format=t=>new Date(t).toLocaleTimeString('ko-KR',{hour12:false});
export function IncidentObservations({d,service,end,timeline}){
 const [readings,setReadings]=useState({});
 const range=queryRange(Date.parse(end)-1800000,Date.parse(end)),base=environmentPath(d.environment.id);
 const params=new URLSearchParams({service,at:end});
 useEffect(()=>{
  const c=new AbortController(),signal=c.signal;
  setReadings({});
  const read=(key,path)=>request(base+path,{signal}).then(data=>{
   if(!signal.aborted)setReadings(old=>({...old,[key]:{data}}));
  }).catch(e=>{if(!signal.aborted)setReadings(old=>({...old,[key]:{error:e.message}}));});
  if(timeline){
   read('windows','/overview?'+new URLSearchParams({from:range.from,to:range.to}));
   for(const [metric] of metrics)read(metric,'/metrics?'+new URLSearchParams({service,metric,...range}));
  }else{
   const period={service,from:range.from,to:range.to};
   read('traces','/traces?'+new URLSearchParams({...period,limit:8}));
   read('logs',d.publicView?'/logs/volume?'+new URLSearchParams({service,...volumeRange(range)}):'/logs?'+new URLSearchParams({...period,limit:8}));
  }
  return ()=>c.abort();
 },[base,service,end,timeline,d.publicView]);
 const empty=k=>readings[k]?.error||(readings[k]?.data?'관측값 없음':'조회 중…');
 if(timeline){
  const windows=readings.windows?.data?.recentWindows||[];
  const score=windows.slice().reverse().map(w=>({timestamp:w.windowEnd,value:w.score}));
  const plot=(title,series,max,key)=> <section className="panel obs-panel" key={key}><header><h2>{title}</h2><small>{key==='windows'?'환경 전체':service}</small></header>{series.some(p=>Number.isFinite(p.value))?<MetricPlot chart={{series:[series],max,aria:title,column:key==='windows'}} range={range} rows={windows}/>:<p role="status">{empty(key)}</p>}</section>;
  return <>{plot('환경 이상 점수',score,1,'windows')}<div className="sx-state-columns">{metrics.map(([id,title,unit])=>{
   const series=(readings[id]?.data?.points||[]).map(p=>({...p,value:Number.isFinite(p.value)?p.value*(id==='error_ratio'?100:1):null}));
   return plot(title+' ('+unit+')',series,Math.max(.001,...series.map(p=>p.value||0))*1.08,id);
  })}</div></>;
 }
 const traces=readings.traces?.data?.items||[],logs=d.publicView?(readings.logs?.data?.buckets||[]).filter(x=>x.count>0).slice(-8).reverse():readings.logs?.data?.items||[];
 return <><section className="panel sx-table-scroll" aria-label="관련 Trace"><table className="data-table"><thead><tr>{['Trace ID','시작','요청','소요 시간'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>
 {traces.map(t=><tr key={t.traceId}><td><a className="mono" href={'#B6-Trace?'+params+'&traceId='+encodeURIComponent(t.traceId)}>{t.traceId.slice(0,16)}</a></td><td>{format(t.startedAt)}</td><td>{t.rootOperation||'—'}</td><td>{t.durationMs} ms</td></tr>)}
 {!traces.length&&<tr><td colSpan="4">{empty('traces')}</td></tr>}</tbody></table></section><section className="panel obs-panel"><header><h2>{d.publicView?'시간별 로그 건수':'로그'}</h2><span>{service}</span></header>
 {logs.map((x,i)=><div className="rca-log mono" key={i}><time>{format(x.timestamp||x.to)}</time><span>{d.publicView?x.count+'건':x.message}</span></div>)}{!logs.length&&<p>{empty('logs')}</p>}<a href={'#B7-Logs?'+params}>로그 전체 보기</a></section></>;
}
