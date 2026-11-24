import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateTrend,evidenceRange,evidenceScale,metricEvidencePoints} from '../src/live/candidate-trend.js';

const node=(service,evidence)=>({kind:'NODE',service,evidence});
const outage='Kubernetes에서 최근 30초간 목표 복제본은 1개 이상, 가용 복제본은 0개로 관측됐습니다.';
const cpu='분석 기준 · paymentservice의 평소 CPU 사용률은 한도의 1%였습니다. 최근 두 표본 모두 한도의 100% 이상을 사용했고, CPU 할당 주기의 20% 이상에서 실행이 제한됐습니다.';
const mem='메모리 한도 대비 사용률 구간 최대값이 평소 대비 +29.6 (평소 변동폭 단위)';
test('a Pod outage selects deployment availability with integer ticks even with an earlier CPU feature',()=>{
 const plan=candidateTrend(node('a',['분석 기준 · 여러 서비스에서 관측','CPU 사용량 구간 평균이 평소 대비 +26.7 (평소 변동폭 단위)',outage]));
 assert.deepEqual(plan.metrics.map(m=>m.id),['available_replicas','desired_replicas']);
 assert.deepEqual(plan.metrics.map(m=>m.label),['요청 가능한 Pod','목표 Pod']);
 assert.deepEqual(evidenceScale([0,1,1],'개'),{max:1,min:0,ticks:[1,0]});
 assert.equal(candidateTrend(node('a',[outage]),true).type,'snapshot');
});
test('a CPU pressure reason applies to the named service rather than every candidate carrying that branch explanation',()=>{
 const own=candidateTrend(node('paymentservice',[cpu,mem]));
 assert.deepEqual(own.metrics.map(m=>m.id),['cpu_limit_ratio','cpu_throttling_ratio']);
 const other=candidateTrend(node('emailservice',[cpu,mem,'CPU 사용량 구간 평균이 평소 대비 +1.0 (평소 변동폭 단위)']));
 assert.equal(other.type,'snapshot');assert.equal(other.summary,mem);
 const raw=candidateTrend(node('emailservice',['CPU 사용량 구간 평균이 평소 대비 +1.0 (평소 변동폭 단위)']));
 assert.equal(raw.metrics[0].id,'cpu_usage_cores');
});
test('a path uses its own saved percentile or recorded directional series',()=>{
 const edge={kind:'EDGE',source:'frontend',target:'checkoutservice',evidence:['호출 지연 p90 4 ms → 27 ms']};
 assert.equal(candidateTrend(edge).title,'호출 경로 지연 p90');
 assert.equal(candidateTrend({...edge,evidence:[]}).type,'snapshot');
 const archive=candidateTrend({...edge,evidence:[]},true);
 assert.equal(archive.key,'frontend>checkoutservice');
});
test('range covers the selected analysis with a five-second grid matching the last observed CPU samples',()=>{
 const end='2026-11-24T02:10:30Z',s=Date.parse(end);
 const period=evidenceRange(end,s+10*60000);
 assert.equal(period.stepSeconds,5);
 assert.equal((s-1000-Date.parse(period.from))%5000,0);
 assert.ok(Date.parse(period.from)<s&&Date.parse(period.to)>s);
 assert.equal(Date.parse(evidenceRange(end,s+1000).to),s+1000);
 assert.equal(Date.parse(evidenceRange(end,s-3600000).to),s);
});
test('rejects another service, unit, fractional replica and out-of-range samples; preserves missing and zero',()=>{
 const service='paymentservice',plan=candidateTrend(node(service,[outage]));
 const period=evidenceRange('2026-11-24T02:10:30Z');
 const data={environmentId:1,service,metric:'available_replicas',unit:'replicas',points:[{timestamp:period.from,value:0},{timestamp:new Date(Date.parse(period.from)+5000).toISOString(),value:null}]};
 const get=x=>metricEvidencePoints(x,1,service,plan.metrics[0],period);
 assert.deepEqual(get(data).map(p=>p.value),[0,null]);
 for(const change of [{unit:'cores'},{service:'other'},{metric:'desired_replicas'},{points:[{timestamp:period.from,value:0.5}]},{points:[{timestamp:period.to,value:0}]}])assert.throws(()=>get({...data,...change}));
 const ratio=candidateTrend(node(service,[cpu])).metrics[0];
 assert.equal(metricEvidencePoints({...data,metric:ratio.id,unit:'ratio',points:[{timestamp:period.from,value:1.05}]},1,service,ratio,period)[0].value,105);
 assert.ok(evidenceScale([0,105],'%').max>=105);
});
