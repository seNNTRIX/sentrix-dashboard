import {candidateScoreLabel,usesReplicaLossScore} from './analysis-values.js';

// Historical jobs can contain two independent rankings. They have no single
// diagnostic branch. For single-kind jobs keep the server's order and ranks.
export function storedCandidates(candidates) {
 if(!candidates?.length)return [];
 const kind=candidates[0]?.kind;
 if(!['NODE','EDGE'].includes(kind)||!candidates.every(c=>c?.kind===kind))return [];
 return candidates;
}

export function kindRankLabel(c) {
 if(!c?.rank)return '';
 return (c.kind==='NODE'?'서비스':'호출 경로')+' '+c.rank+'위';
}

export function leadingCandidates(candidates) {
 return storedCandidates(candidates).slice(0,1);
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
