import React from 'react';
import {findIncident} from '../incidents.js';

export function ScoreHelp() {
 return <details className="investigation-help"><summary>원인 후보 점수는 무엇인가요?</summary><p>현재 점수는 데모에서 원인 후보의 정렬 순서를 보여주는 예시값입니다. 같은 장애 안에서 높은 점수의 후보부터 분석 근거를 확인하세요.</p><p><strong>0.84는 원인일 확률 84%를 의미하지 않습니다.</strong> 장애의 심각도나 사용자 피해 규모를 나타내지도 않습니다. 실제 모델의 산식·보정·판정 기준은 아직 연결되지 않았습니다.</p><p>후보의 Supporting(지지 근거)와 Contradicting(반대 근거)을 함께 확인해야 합니다. Anomaly score는 이상 감지 지표이며 이 후보 점수와 구분됩니다.</p></details>;
}
export function ImpactSummary({id = 'INC-0142'}) {
 const incident=findIncident(id);
 if(!incident) return null;
 const hasEvidence=id==='INC-0142';
 return <section className="impact-summary" aria-label="장애 영향 요약"><h2 className="section-title">장애 영향 <span className="demo-badge">예시 데이터</span></h2><dl>
  <div><dt>사용자 기능</dt><dd>{hasEvidence?'상품 조회 지연·일부 요청 시간 초과':'확인되지 않음'}</dd><p>{hasEvidence?'예시 로그의 상품 조회 요청과 GetProduct 호출 기준':'서비스 장애만으로 사용자 기능의 실패를 단정할 수 없습니다.'}</p></div>
  <div><dt>영향 서비스 · 지속 시간</dt><dd>{incident.impact}개 · {Math.floor(incident.duration/60)}분 {incident.duration%60}초</dd><p>{incident.status==='resolved'?'해결된 장애의 기록':'데모 관측 시점 기준'} · {incident.start} 시작</p></div>
  <div><dt>관측된 변화</dt><dd>{hasEvidence?'호출 p90 42 → 222 ms':'상세 지표 없음'}</dd><p>{hasEvidence?'해당 연결의 오류율 0.10% → 0.42% (+0.32%p)':'이 장애의 비교 지표는 데모에 포함되지 않았습니다.'}</p></div>
  <div><dt>사용자 피해 규모</dt><dd>확인되지 않음</dd><p>영향 사용자 수·실패 주문 수는 수집되지 않았습니다. 서비스 수와 동일하지 않습니다.</p></div>
 </dl></section>;
}
