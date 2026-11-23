// Rank the current minute against preceding minutes of the same service.
// Inclusive tails keep ties (particularly a constant zero error rate) from scoring as unusual.
export const serviceSignals = [
 ['request_rate','요청량'], ['error_ratio','오류율'], ['latency_p99_ms','p99 지연']
];
export const referenceMinutes = 60;
export const serviceCutoff = 95;
const minute = 60000;
export function serviceDeviation(series,from,to) {
 const points=[];
 for(let t=Math.ceil(from/minute)*minute;t<=to;t+=minute){
  const observed=[];
  for(const [metric,label] of serviceSignals){
   const samples=series.get(metric),value=samples?.get(t);
   if(!Number.isFinite(value))continue;
   let count=0,lower=0,upper=0;
   for(let i=1;i<=referenceMinutes;i++){
    const prior=samples.get(t-i*minute);
    if(!Number.isFinite(prior))continue;
    count++;if(prior<=value)lower++;if(prior>=value)upper++;
   }
   if(count<45)continue;
   const tail=metric==='request_rate'?Math.min(1,2*(1+Math.min(lower,upper))/(count+1)):(1+upper)/(count+1);
   observed.push({label,value:100*(1-tail)});
  }
  observed.sort((a,b)=>b.value-a.value);
  points.push({t,value:observed.length>=2?observed[0].value:null,signal:observed[0]?.label,coverage:observed.length});
 }
 return points;
}
