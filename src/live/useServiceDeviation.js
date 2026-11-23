import {useEffect,useState} from 'react';
import {environmentPath,queryRange,request} from './api.js';
import {referenceMinutes,serviceDeviation,serviceSignals} from './service-deviation.js';

import {historySignals,serviceHealth} from './service-health.js';

export function useServiceDeviation(environmentId,service,range,enabled,health=false){
 const [result,setResult]=useState({});
 const from=Math.ceil(Date.parse(range.from)/60000)*60000,to=Math.floor(Date.parse(range.to)/60000)*60000;
 const key=JSON.stringify([environmentId,service,from,to,health]);
 useEffect(()=>{
  if(!enabled||!environmentId||!service)return;
  const abort=new AbortController();
  async function load(){
   const end=Math.floor(to/60000)*60000;
   const start=(Math.ceil(from/60000)-referenceMinutes)*60000;
   const series=await Promise.all((health?historySignals:serviceSignals).map(async ([metric])=>{
    const samples=new Map();
    // Include the preceding hour even for a full-day view. Each request is bounded by the metric API.
    for(let cursor=start;cursor<=end;){
     const stop=Math.min(end+1000,cursor+720*60000);
     const bounds=queryRange(cursor,stop);
     const query=new URLSearchParams({...bounds,service,metric,stepSeconds:60});
     const r=await request(environmentPath(environmentId)+'/metrics?'+query,{signal:abort.signal});
     if(r.environmentId!==environmentId||r.service!==service||r.metric!==metric||!Array.isArray(r.points))throw Error('서비스 지표 응답이 일치하지 않습니다.');
     for(const p of r.points)samples.set(Date.parse(p.timestamp),p.value);
     cursor+=720*60000;
    }
    return [metric,samples];
   }));
   if(!abort.signal.aborted)setResult({key,service,environmentId,health,from,to,points:(health?serviceHealth:serviceDeviation)(new Map(series),from,to)});
  }
  load().catch(e=>{if(!abort.signal.aborted)setResult({key,error:e.message});});
  return ()=>abort.abort();
 },[key,enabled]);
 const rolling=result.service===service && result.environmentId===environmentId && result.health===health
  && to>=result.to && to-result.to<=60000 && from>=result.from && from-result.from<=60000;
 return enabled && (result.key===key || rolling) ? result : {};
}
