import {queryRange} from './api.js';

// Keep Prometheus evaluations on the same grid when the time window advances.
export function rollingRange(end,durationMs) {
 const stepMs=Math.max(30,Math.ceil(durationMs/1000/1440))*1000;
 const aligned=Math.floor(end/stepMs)*stepMs;
 return queryRange(aligned-durationMs,aligned);
}

export function chartScope(environmentId,service,range,rolling) {
 const period=rolling?Date.parse(range.to)-Date.parse(range.from):[range.from,range.to];
 return JSON.stringify([environmentId,service,period,range.stepSeconds]);
}

export function matchesWindow(snapshot,scope,range) {
 return snapshot?.scope===scope && snapshot.range.to>range.from && snapshot.range.to<=range.to;
}

export function failedRefresh(previous,scope,range,error) {
 if(matchesWindow(previous,scope,range)&&previous.data) return {...previous,refreshError:error};
 return {scope,range,error};
}
