import {CandidateTypeTag} from './CandidateTypeTag.jsx';
import {candidateScoreLabel,hasReplicaOutage,knownRankingMethod,usesReplicaLossScore} from './analysis-values.js';
import {candidateScoreText,rankedCandidates,kindRankLabel} from './candidate-ranks.js';
import React,{useState,useEffect} from 'react';
import {environmentPath,request,queryRange} from './api.js';
import {MetricPlot} from './OverviewPlots.jsx';
import {useDesign} from './DesignContext.jsx';

export const candidateName=c=>c.kind==='EDGE'?c.source+' → '+c.target:c.service;
const clock=t=>new Date(t).toLocaleTimeString('ko-KR',{hour12:false,hour:'2-digit',minute:'2-digit'});

function EvidenceTrend({candidate,record,end,environment}){
 const [state,setState]=useState({});
 const edge=candidate.kind==='EDGE', recorded=environment.recorded;
 const names=edge?[candidate.source,candidate.target]:[candidate.service];
 const metric=edge?'latency_p90_ms':'cpu_usage_cores';
 const key=JSON.stringify([environment.id,end,...names]);
 useEffect(()=>{
  const ctrl=new AbortController(),signal=ctrl.signal,base=environmentPath(environment.id);
  const range=queryRange(Date.parse(end)-1800000,Date.parse(end));
  async function read(){
   if(recorded){
    const graph=await request(base+'/observed-topology?'+new URLSearchParams({end}),{signal});
    const points=(graph.history||[]).map(h=>({timestamp:h.time,value:edge?h.latency?.[names.join('>')]:h.cpu?.[names[0]]})).filter(p=>Date.parse(p.timestamp)>=Date.parse(range.from));
    return {series:[points],failed:[]};
   }
   const results=await Promise.allSettled(names.map(async service=>{
    const r=await request(base+'/metrics?'+new URLSearchParams({service,metric,...range}),{signal});
    if(r.environmentId!==environment.id||r.service!==service||r.metric!==metric||!Array.isArray(r.points))throw Error('시계열 응답을 확인하세요.');
    return r.points;
   }));
   return {series:results.map(r=>r.status==='fulfilled'?r.value:[]),failed:names.filter((_,i)=>results[i].status==='rejected')};
  }
  read().then(data=>{if(!signal.aborted)setState({key,range,...data});}).catch(e=>{if(!signal.aborted)setState({key,error:e.message});});
  return ()=>ctrl.abort();
 },[key,recorded]);
 const title=recorded?(edge?'경로 Span p90 (ms)':'CPU 변화 · 평소 변동폭 단위'):(edge?'서비스별 서버 처리 시간 p90 (ms)':'CPU 사용량 (cores)');
 const loaded=state.key===key,series=loaded?state.series:null;
 const values=(series||[]).flat().map(p=>p.value).filter(Number.isFinite);
 const min=recorded&&!edge?Math.min(0,...values)*1.08:0;
 const failure=loaded&&state.failed?.length?state.failed.join(', ')+' 지표 조회 실패':'';
 const bands=record?[{jobId:record.id,decision:'ANOMALY',windowStart:record.occurredAt,windowEnd:record.resolvedAt||end}]:[];
 return <figure className="rca-trend"><figcaption><span>{title}</span><span>{clock(Date.parse(end)-1800000)}–{clock(end)}</span></figcaption>
 {values.length?<MetricPlot chart={{series,min,max:Math.max(.001,...values)*1.08,aria:title}} rows={bands} range={state.range}/>:<div className="rca-empty" role="status">{loaded?(state.error||failure||'선택한 기간에 수집된 값이 없습니다.'):'시계열 조회 중…'}</div>}
 {values.length>0&&failure&&<small role="status">{failure}</small>}
 <div className="rca-keys">{(recorded?[candidateName(candidate)]:names).map((n,i)=><span key={n}><i style={{background:i?'var(--text-2)':'var(--text)'}}/>{n}</span>)}<span><i className="rca-band-key"/>장애 구간</span></div></figure>;
}

export function RecordedDiagnosis({result,record}){
 const d=useDesign(),[selected,setSelected]=useState(null);
 const candidates=rankedCandidates(result.candidates);
 const candidate=candidates.find(c=>selected?.jobId===result.jobId&&c.rank===selected.rank)||candidates[0];
 const known=knownRankingMethod(result);
 const groups=[
  {kind:'NODE',title:'서비스 내부 원인 후보',method:'Random Forest · RF 점수 0–1'},
  {kind:'EDGE',title:'호출 경로 원인 후보',method:'규칙 기반 · 백분위 점수 0–100'}
 ];
 const name=candidateName(candidate);
 const period=new URLSearchParams({service:candidate.source||candidate.service,at:result.windowEnd});
 const scoreLabel=c=>known?(c.kind==='EDGE'?'경로 백분위 점수':candidateScoreLabel(c)):'후보 점수';
 return <div className="obs-candidates rca-summary">
  <div className="rca-groups">{groups.map(group=>{
   const members=candidates.filter(c=>c.kind===group.kind);
   return <section key={group.kind} className={'panel rca-candidate-group '+group.kind.toLowerCase()} aria-labelledby={'candidates-'+group.kind}>
    <div className="rca-group-heading"><h2 id={'candidates-'+group.kind}>{group.title}</h2>{known&&<small>{group.method}</small>}</div>
    {members.length?<div className="obs-list">{members.map(c=><button type="button" key={c.rank} aria-pressed={c.rank===candidate.rank} onClick={()=>setSelected({jobId:result.jobId,rank:c.rank})}>
     <span className="rca-kind-place" aria-label={kindRankLabel(c)}>{c.kindRank}위</span>
     <span>{c.kind==='EDGE'?<span className="rca-hop" title={candidateName(c)}><span>{c.source}</span><span>→ {c.target}</span></span>:<span className="rca-name" title={candidateName(c)}>{c.service}</span>}
      {hasReplicaOutage(c)&&<small>가용 복제본 0개</small>}</span>
     <span className="rca-list-score" title={scoreLabel(c)}>{candidateScoreText(c,known)}</span>
    </button>)}</div>:<p className="rca-empty-group">이 분석에 저장된 후보가 없습니다.</p>}
   </section>;
  })}</div>
  <section className="panel obs-panel rca-detail" aria-labelledby="sel-h"><header><div><small>{kindRankLabel(candidate)} 후보</small><h2 id="sel-h">{name}</h2><CandidateTypeTag kind={candidate.kind} label={candidate.faultType}/></div><div className="rca-score"><strong>{candidateScoreText(candidate,known)}</strong><small>{scoreLabel(candidate)}</small></div></header>
  <div className="rca-score-basis">
   {hasReplicaOutage(candidate)&&<p className="rca-availability"><strong>가용 복제본 0개</strong><span>최근 30초간 목표 복제본은 1개 이상이었습니다.{known&&' 이 조건이 한 서비스에서만 관측되면 서비스 후보 1위에 둡니다.'}</span></p>}
   {!known?<p>저장된 분석 결과에 점수 산정 방식이 명시되지 않았습니다.</p>
    :usesReplicaLossScore(candidate)?<p>모델 입력이 부족해 이 후보의 점수에는 목표 대비 가용 복제본 손실률을 표시합니다.</p>
    :candidate.kind==='NODE'?<p>두 분석 구간(각 30초)에서 Random Forest가 이 서비스의 지표로 계산한 점수를 평균했습니다.</p>
    :<p>각 30초 구간에서 기준 p90 대비 변화 폭과 오류율 차이를 다른 경로와 비교합니다. 두 백분위 중 큰 값을 택해 두 구간을 평균합니다. 수신 서비스의 p90 변화가 작고 호출 p99와 수신 처리 외 p99가 함께 급증하면 해당 경로를 우선합니다.</p>}
  </div>
  <EvidenceTrend candidate={candidate} end={result.windowEnd} record={record} environment={d.environment}/>
  <section><h3>Evidence</h3><ul className="obs-evidence">{candidate.evidence.map((item,i)=>{
   const match=item.match(/^(.*?)\s+([-+]?\d[\d.,]*\s*(?:ms|%|s)?)\s*→\s*([-+]?\d[\d.,]*\s*(?:ms|%|s)?)$/);
   return <li key={i}><small>{candidate.kind==='EDGE'?'경로 관측':'서비스 관측'}</small><span>{match?match[1]:item}</span>{match&&<span className="rca-values">{match[2]} → {match[2]===match[3]?match[3]:<b>{match[3]}</b>}</span>}</li>;
  })}</ul></section>
  <nav aria-label="관련 관측 화면">{[['B5-Service','서비스 Dashboard'],['B6-Trace','관련 trace'],['B7-Logs','관련 로그']].map(([route,title])=><a key={route} href={'#'+route+'?'+period}>{title}</a>)}<a href={'#B2-ServiceMap?incidentId='+encodeURIComponent(d.incidentId)+'&jobId='+encodeURIComponent(result.jobId)}>Service map</a></nav>
 </section></div>;
}
