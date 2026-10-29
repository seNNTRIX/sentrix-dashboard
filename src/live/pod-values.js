const fail=()=>{throw new Error('Pod 응답 형식이나 조회 대상이 올바르지 않습니다.');};
export function validatePods(data,id,service){
 if(data?.environmentId!==id||data.service!==service||!Array.isArray(data.items)||data.items.length>500||!Array.isArray(data.warnings)||!Number.isFinite(Date.parse(data.queriedAt)))fail();
 const ids=new Set();
 for(const p of data.items){if(typeof p.name!=='string'||!p.name.match(/^[a-z0-9][a-z0-9.-]{0,252}$/)||typeof p.uid!=='string'||!p.uid.match(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)||ids.has(p.uid)||![true,false,null].includes(p.ready)||(p.restarts!==null&&(!Number.isSafeInteger(p.restarts)||p.restarts<0)))fail();ids.add(p.uid);}
 return data;
}
export function validatePodMetric(data,id,service,pod,metric,range){
 const count=Math.ceil((Date.parse(range.to)-Date.parse(range.from))/1000/range.stepSeconds);
 if(data?.environmentId!==id||data.service!==service||data.pod!==pod.name||data.uid!==pod.uid||data.metric!==metric||data.unit!==(metric==='cpu_usage_cores'?'cores':'bytes')||data.from!==range.from||data.to!==range.to||data.stepSeconds!==range.stepSeconds||!Array.isArray(data.points)||data.points.length!==count||!Array.isArray(data.warnings)||!['AVAILABLE','PARTIAL','NO_DATA'].includes(data.dataStatus))fail();
 data.points.forEach((p,i)=>{if(Date.parse(p.timestamp)!==Date.parse(range.from)+i*range.stepSeconds*1000||(p.value!==null&&(!Number.isFinite(p.value)||p.value<0)))fail();});
 return data;
}
