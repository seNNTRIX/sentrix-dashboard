import {candidateScoreLabel,usesReplicaLossScore} from './analysis-values.js';

// The API's order includes evidence priority. Keep it within each kind, even if
// a lower-ranked candidate has a larger score from a different scoring method.
export function rankedCandidates(candidates = []) {
 const counts = {NODE: 0, EDGE: 0};
 return [...(candidates || [])]
  .filter(c => c && Object.hasOwn(counts, c.kind) && Number.isInteger(c.rank) && c.rank > 0)
  .sort((a, b) => a.rank - b.rank)
  .map(c => ({...c, kindRank: ++counts[c.kind]}));
}

export function kindRankLabel(c) {
 if (!c?.kindRank) return '';
 return (c.kind === 'NODE' ? '서비스' : '호출 경로') + ' ' + c.kindRank + '위';
}

export function leadingCandidates(candidates) {
 return rankedCandidates(candidates).filter(c => c.kindRank === 1);
}


export function scoreComparisonKey(candidate,modelVersion) {
 if (!modelVersion || !Number.isFinite(candidate?.score)) return null;
 const source = candidateScoreLabel(candidate);
 if (!['경로 통계 점수','서비스 모델 점수','복제본 손실률'].includes(source)) return null;
 return JSON.stringify([modelVersion,candidate.kind,source]);
}


const displayNumber = new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1});
export function candidateScoreText(candidate, knownMethod=true) {
 if (!Number.isFinite(candidate?.score)) return '—';
 if (knownMethod && candidate.kind==='EDGE') return displayNumber.format(100*candidate.score)+'점';
 if (usesReplicaLossScore(candidate)) return displayNumber.format(100*candidate.score)+'%';
 return candidate.score.toFixed(2);
}
