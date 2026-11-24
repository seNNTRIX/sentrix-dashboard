import test from 'node:test';
import assert from 'node:assert/strict';
import {pathEvidenceComparison} from '../src/live/path-evidence.js';

const edge = evidence => ({kind:'EDGE',source:'recommendationservice',target:'productcatalogservice',evidence});
const routed = '분석 기준 · 수신 처리 외 p90이 0.5 → 30.9 ms로 늘었고, 같은 호출의 수신 처리 시간은 0.0 → 0.0 ms였습니다.';
const tail = '호출 지연 p99 0.7 → 211.2 ms, 수신 처리 외 시간 p99 0.5 → 210.7 ms';
const span = '호출 지연 p90 1 ms → 31 ms';

test('selected path uses its measured percentile and preserves the stored rounding', () => {
  assert.deepEqual(pathEvidenceComparison(edge([span,tail,routed])), {percentile:90,rows:[
    {label:'수신 처리 외 지연',before:0.5,current:30.9,unit:'ms',digits:1},
    {label:'수신 처리 시간',before:0,current:0,unit:'ms',digits:1},
  ]});
  assert.equal(pathEvidenceComparison(edge([routed.replace('p90','p99')])).percentile,99);
});

test('legacy pairs keep the distinction between the full call and time outside callee processing', () => {
  assert.deepEqual(pathEvidenceComparison(edge([span,tail])).rows.map(r=>[r.label,r.before,r.current]),[
    ['수신 처리 외 지연',0.5,210.7],['호출 지연',0.7,211.2],
  ]);
  assert.deepEqual(pathEvidenceComparison(edge([span])),{percentile:90,rows:[
    {label:'호출 지연',before:1,current:31,unit:'ms',digits:0},
  ]});
});

test('a different candidate or a non-latency statement cannot supply a path measurement', () => {
  assert.equal(pathEvidenceComparison({kind:'NODE',service:'frontend',evidence:[routed]}),null);
  for (const lines of [[],['호출 오류율 0.0% → 0.0%'],['우선 확인 이유: p99가 20 ms 이상 증가'],[span.replace('31','1.2.3')]]) {
    assert.equal(pathEvidenceComparison(edge(lines)),null);
  }
});
