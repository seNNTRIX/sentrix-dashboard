import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateScoreText,kindRankLabel,leadingCandidates,storedCandidates,scoreComparisonKey} from '../src/live/candidate-ranks.js';

test('display single-branch candidates in the exact order and ranks returned by the model',()=>{
 const rows=[{rank:1,kind:'NODE',service:'a',score:.03},{rank:2,kind:'NODE',service:'b',score:.88}];
 assert.equal(storedCandidates(rows),rows);
 assert.deepEqual(rows.map(kindRankLabel),['서비스 1위','서비스 2위']);
 assert.deepEqual(leadingCandidates(rows),[rows[0]]);
 const edge={kind:'EDGE',rank:1,source:'a',target:'b',score:.8};
 assert.deepEqual(leadingCandidates([edge]).map(kindRankLabel),['호출 경로 1위']);
});

test('legacy mixed candidates do not imply a selected diagnosis',()=>{
 const mixed=[{rank:1,kind:'NODE',service:'a'},{rank:2,kind:'EDGE',source:'b',target:'a'}];
 for(const entries of [mixed,null,[]]){
  assert.deepEqual(storedCandidates(entries),[]);
  assert.deepEqual(leadingCandidates(entries),[]);
 }
});

test('representative scores from different methods or model versions are not comparable',()=>{
 const edge={kind:'EDGE',score:1},node={kind:'NODE',score:.35,evidence:['CPU 측정']};
 const loss={...node,evidence:['Kubernetes에서 최근 30초간 목표 복제본은 1개 이상, 가용 복제본은 0개로 관측됐습니다.','모델 입력 부족으로 이 후보의 점수는 목표 대비 가용 복제본 손실률(100%)을 표시합니다.']};
 assert.notEqual(scoreComparisonKey(edge,'v1'),scoreComparisonKey(node,'v1'));
 assert.notEqual(scoreComparisonKey(node,'v1'),scoreComparisonKey(loss,'v1'));
 assert.notEqual(scoreComparisonKey(edge,'v1'),scoreComparisonKey(edge,'v2'));
 assert.equal(scoreComparisonKey({kind:'NODE',score:1},'v1'),null);
 assert.equal(scoreComparisonKey(node,null),null);
});

test('show different units for RF, percentile rules and measured replica loss',()=>{
 assert.equal(candidateScoreText({kind:'EDGE',score:1}),'100점');
 assert.equal(candidateScoreText({kind:'EDGE',score:.8125}),'81.3점');
 assert.equal(candidateScoreText({kind:'NODE',score:.52}),'0.52');
 assert.equal(candidateScoreText({kind:'EDGE',score:.8125},false),'0.81');
 assert.equal(candidateScoreText({kind:'NODE',score:1,evidence:['Kubernetes에서 최근 30초간 목표 복제본은 1개 이상, 가용 복제본은 0개로 관측됐습니다.','모델 입력 부족으로 이 후보의 점수는 목표 대비 가용 복제본 손실률(100%)을 표시합니다.']}),'100%');
 assert.equal(candidateScoreText(null),'—');
});
