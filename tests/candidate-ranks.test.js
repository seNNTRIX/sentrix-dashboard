import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateScoreText,kindRankLabel,leadingCandidates,rankedCandidates,scoreComparisonKey} from '../src/live/candidate-ranks.js';

test('rank within node and edge groups follows original evidence order regardless of score',()=>{
 const rows=[
  {rank:4,kind:'EDGE',source:'a',target:'b',score:.99},
  {rank:2,kind:'NODE',service:'b',score:.88},
  {rank:3,kind:'NODE',service:'c',score:.12},
  {rank:1,kind:'NODE',service:'a',score:.03},
  {rank:5,kind:'EDGE',source:'b',target:'c',score:1}
 ];
 const ranked=rankedCandidates(rows);
 assert.deepEqual(ranked.map(c=>[c.rank,kindRankLabel(c)]),[[1,'서비스 1위'],[2,'서비스 2위'],[3,'서비스 3위'],[4,'호출 경로 1위'],[5,'호출 경로 2위']]);
 assert.equal(ranked.find(c=>c.service==='b').kindRank,2);
 assert.deepEqual(leadingCandidates(rows).map(c=>c.rank),[1,4]);
 assert.equal(rows[0].rank,4);
 assert.equal(rows[0].kindRank,undefined);
});

test('a truncated overview contains leaders only for kinds actually returned',()=>{
 assert.deepEqual(leadingCandidates([{kind:'EDGE',rank:1},{kind:'EDGE',rank:2}]).map(kindRankLabel),['호출 경로 1위']);
 assert.deepEqual(leadingCandidates(null),[]);
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
