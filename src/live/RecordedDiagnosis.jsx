import {CandidateTypeTag} from './CandidateTypeTag.jsx';
import {candidateScoreLabel,diagnosisBasis,hasReplicaOutage,knownRankingMethod,usesReplicaLossScore} from './analysis-values.js';
import {candidateScoreText,storedCandidates,kindRankLabel} from './candidate-ranks.js';
import React,{useMemo,useState} from 'react';
import {candidateTrend} from './candidate-trend.js';
import {CandidateEvidenceTrend} from './CandidateEvidenceTrend.jsx';
import {useDesign} from './DesignContext.jsx';

export const candidateName=c=>c.kind==='EDGE'?c.source+' → '+c.target:c.service;
export function RecordedDiagnosis({result,record}){
 const d=useDesign(),[selected,setSelected]=useState(null);
 const candidates=storedCandidates(result.candidates);
 const candidate=candidates.find(c=>selected?.jobId===result.jobId&&c.rank===selected.rank)||candidates[0];
 const plan=useMemo(()=>candidate?candidateTrend(candidate,d.environment.recorded):null,[candidate,d.environment.recorded]);
 const known=knownRankingMethod(result);
 if(!candidate)return <p className="panel obs-panel" role="status">이전 분석에는 단일 원인 유형 판정이 없습니다.</p>;
 const basis=diagnosisBasis(result,candidate);
 const evidence=candidate.evidence.filter(item=>item!==basis&&!(plan.type==='snapshot'&&item===plan.summary));
 const name=candidateName(candidate);
 const period=new URLSearchParams({service:candidate.source||candidate.service,at:result.windowEnd});
 const scoreLabel=c=>known?(c.kind==='EDGE'?'경로 백분위 점수':candidateScoreLabel(c)):'후보 점수';
 return <div className="obs-candidates rca-summary">
  <section className="rca-candidates" aria-labelledby="rca-candidates-title">
   <h2 id="rca-candidates-title">원인 후보</h2>
   <div className="obs-list" aria-labelledby="rca-candidates-title">{candidates.map(c=><button type="button" key={c.rank} aria-pressed={c.rank===candidate.rank} onClick={()=>setSelected({jobId:result.jobId,rank:c.rank})}>
     <span className="rca-kind-place" aria-label={kindRankLabel(c)}>{c.rank}위</span>
     <span>{c.kind==='EDGE'?<span className="rca-hop" title={candidateName(c)}><span>{c.source}</span><span>→ {c.target}</span></span>:<span className="rca-name" title={candidateName(c)}>{c.service}</span>}
      <small title={c.faultType}>{hasReplicaOutage(c)?'가용 복제본 0개':c.faultType}</small></span>
     <span className="rca-list-score" title={scoreLabel(c)}>{candidateScoreText(c,known)}</span>
    </button>)}</div>
  </section>
  <section className="panel obs-panel rca-detail" aria-labelledby="sel-h"><header><div><small>{kindRankLabel(candidate)} 후보</small><h2 id="sel-h">{name}</h2><CandidateTypeTag kind={candidate.kind} label={candidate.faultType}/></div><div className="rca-score"><strong>{candidateScoreText(candidate,known)}</strong><small>{scoreLabel(candidate)}</small></div></header>
  <div className="rca-score-basis">
   {basis&&<p>{basis}</p>}
   {hasReplicaOutage(candidate)&&<p className="rca-availability"><strong>가용 복제본 0개</strong><span>최근 30초간 목표 복제본은 1개 이상이었습니다.{known&&' 이 조건이 한 서비스에서만 관측되면 서비스 후보 1위에 둡니다.'}</span></p>}
   {!known?<p>저장된 분석 결과에 점수 산정 방식이 명시되지 않았습니다.</p>
    :usesReplicaLossScore(candidate)?<p>모델 입력이 부족해 이 후보의 점수에는 목표 대비 가용 복제본 손실률을 표시합니다.</p>
    :candidate.kind==='NODE'?<p>두 분석 구간(각 30초)에서 Random Forest가 이 서비스의 지표로 계산한 점수를 평균했습니다.</p>
    :<p>각 30초 구간에서 평소 대비 p90 변화와 오류율 변화의 백분위를 구합니다. 두 값 중 큰 값을 골라 연속 두 구간의 점수를 평균합니다.</p>}
  </div>
  <CandidateEvidenceTrend plan={plan} candidate={candidate} result={result} record={record} environment={d.environment}/>
  {evidence.length>0&&<section><h3>Evidence</h3><ul className="obs-evidence">{evidence.map((item,i)=>{
   const match=item.match(/^(.*?)\s+([-+]?\d[\d.,]*\s*(?:ms|%|s)?)\s*→\s*([-+]?\d[\d.,]*\s*(?:ms|%|s)?)$/);
   return <li key={i}><small>{candidate.kind==='EDGE'?'경로 관측':'서비스 관측'}</small><span>{match?match[1]:item}</span>{match&&<span className="rca-values">{match[2]} → {match[2]===match[3]?match[3]:<b>{match[3]}</b>}</span>}</li>;
  })}</ul></section>}
  <nav aria-label="관련 관측 화면">{[['B5-Service','서비스 Dashboard'],['B6-Trace','관련 trace'],['B7-Logs','관련 로그']].map(([route,title])=><a key={route} href={'#'+route+'?'+period}>{title}</a>)}<a href={'#B2-ServiceMap?incidentId='+encodeURIComponent(d.incidentId)+'&jobId='+encodeURIComponent(result.jobId)}>Service map</a></nav>
 </section></div>;
}
