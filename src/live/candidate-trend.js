import {hasReplicaOutage} from './analysis-values.js';
import {queryRange} from './api.js';
import {pathEvidenceComparison} from './path-evidence.js';

const metric=(id,label,unit)=>({id,label,unit});
const cpu=metric('cpu_usage_cores','CPU 사용량','cores');
const quota=metric('cpu_limit_ratio','한도 대비 CPU 사용률','ratio');
const throttling=metric('cpu_throttling_ratio','CPU 제한 주기 비율','ratio');
const available={...metric('available_replicas','요청 가능한 Pod','replicas'),description:'가용 복제본 수. Kubernetes가 준비 상태를 확인한 Pod 수입니다.'};
const desired={...metric('desired_replicas','목표 Pod','replicas'),description:'목표 복제본 수. 이 서비스가 유지하도록 설정된 Pod 수입니다.'};
const signals=[
 [/^CPU 사용량 구간 (?:평균|최대값)이 평소 대비 /,cpu],
 [/^CPU 한도 대비 사용률 구간 (?:평균|최대값)이 평소 대비 /,quota],
 [/^들어오는 호출 수가 평소의 /,metric('request_rate','수신 요청량','requests/second')],
 [/^요청 처리 시간 p50이 평소의 /,metric('latency_p50_ms','요청 처리 시간 p50','milliseconds')],
 [/^요청 처리 시간 p90이 평소의 /,metric('latency_p90_ms','요청 처리 시간 p90','milliseconds')],
 [/^들어오는 호출 오류율이 평소 대비 /,metric('error_ratio','수신 요청 오류율','ratio')],
];
const units={replicas:'개',ratio:'%',milliseconds:'ms','requests/second':'req/s',cores:'cores'};

function historical(title,metrics,summary) {
 return {type:'history',title,metrics,unit:units[metrics[0].unit],summary};
}

export function candidateTrend(candidate,recorded=false) {
 const evidence=candidate.evidence||[];
 if(candidate.kind==='EDGE'){
  const pair=pathEvidenceComparison(candidate);
  if(pair)return {type:'comparison',title:'호출 경로 지연 p'+pair.percentile,...pair};
  if(recorded)return {type:'archived',field:'latency',key:candidate.source+'>'+candidate.target,title:'호출 지연 p90',unit:'ms'};
  return {type:'snapshot',title:'호출 경로 관측',summary:evidence.find(s=>s.startsWith('호출 ')||s.startsWith('현재 30초'))};
 }
 const own=evidence.filter(s=>!s.startsWith('분석 기준 · ')&&!s.startsWith('우선 확인 이유:'));
 const summary=own[0];
 if(hasReplicaOutage(candidate)){
  const outage=own.find(s=>s.startsWith('Kubernetes에서 최근 30초간'));
  return recorded?{type:'snapshot',title:'Pod 가용성',summary:outage}:historical('Pod 가용성',[available,desired],outage);
 }
 const basis=evidence[0]||'';
 const pressure=basis.startsWith('분석 기준 · '+candidate.service+'의 CPU 한도 대비 사용률이 ')
   ||basis.startsWith('분석 기준 · '+candidate.service+'의 평소 CPU 사용률은 한도의 ');
 if(!recorded&&pressure)return historical('CPU 한도와 실행 제한',[quota,throttling],basis.replace(/^분석 기준 · /,''));
 if(recorded&&summary?.startsWith('CPU 사용량 구간 평균이 평소 대비 '))
  return {type:'archived',field:'cpu',key:candidate.service,title:'CPU 사용량 · 구간 평균 변화',unit:'평소 변동폭',summary};
 const leading=signals.find(([pattern])=>pattern.test(summary||''))?.[1];
 if(!recorded&&leading)return historical(leading.label,[leading],summary);
 return {type:'snapshot',title:'서비스 관측',summary};
}

export function evidenceRange(windowEnd,now=Date.now()) {
 const end=Date.parse(windowEnd);
 // Five-second samples at :04/:09/.../:29 include both short CPU observations used by the live model.
 return {...queryRange(end-24*60000-1000,Math.max(end,Math.min(now,end+6*60000))),stepSeconds:5};
}

export function metricEvidencePoints(response,env,service,signal,range) {
 if(response?.environmentId!==env||response.service!==service||response.metric!==signal.id
    ||response.unit!==signal.unit||!Array.isArray(response.points))throw Error('관측 응답이 선택한 지표와 일치하지 않습니다.');
 const from=Date.parse(range.from),to=Date.parse(range.to);
 return response.points.map(p=>{
  const time=Date.parse(p.timestamp),v=p.value;
  if(!Number.isFinite(time)||time<from||time>=to||!(v===null||Number.isFinite(v))
     ||(v!==null&&signal.unit==='replicas'&&(!Number.isInteger(v)||v<0)))throw Error('관측값을 확인할 수 없습니다.');
  return {timestamp:p.timestamp,value:v===null?null:signal.unit==='ratio'?v*100:v};
 });
}

export function evidenceScale(values,unit) {
 const low=Math.min(0,...values), high=Math.max(0,...values);
 if(unit==='개'){
  const top=Math.max(1,Math.ceil(high));
  return {min:0,max:top,ticks:top===1?[1,0]:[top,Math.floor(top/2),0]};
 }
 const max=unit==='%'&&high>=10?Math.ceil(high/10)*10:high||(low<0?0:1);
 const min=low<0?low:0;
 return {min,max,ticks:[max,(min+max)/2,min]};
}
