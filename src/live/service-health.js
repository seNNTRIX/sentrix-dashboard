export const historySignals = [['error_ratio','오류율'], ['latency_p99_ms','p99']];
export const historyStates = {normal:'기준 범위', warn:'지연 상승', alarm:'오류 증가', unknown:'미관측'};

function baseline(samples, t) {
 const values = [];
 for (let offset = 1; offset <= 60; offset++) {
  const value = samples?.get(t - offset * 60000);
  if (Number.isFinite(value)) values.push(value);
 }
 if (values.length < 45) return null;
 values.sort((a,b) => a-b);
 const mid = Math.floor(values.length/2);
 return (values[mid] + values[Math.floor((values.length-1)/2)]) / 2;
}

export function serviceHealth(series, from, to) {
 const points = [];
 for (let t=Math.ceil(from/60000)*60000; t<=to; t+=60000) {
  const [error,latency] = historySignals.map(([id]) => {
   const samples = series.get(id), value = samples?.get(t), ref = baseline(samples,t);
   return Number.isFinite(value) && ref !== null ? {value,ref} : null;
  });
  let status = 'unknown';
  if (error && error.value-error.ref >= 0.02) status = 'alarm';
  else if (latency && latency.value-latency.ref >= 20 && latency.value >= 1.5*latency.ref) status = 'warn';
  else if (error && latency) status = 'normal';
  points.push({t,status});
 }
 return points;
}
