# 구현 API ↔ 대시보드 연결 현황

기준: 2026-11-22. 현재 구현된 **29개 operation 모두 호출 경로를 화면에 연결**했다. 제품의 모든 설계 기능이 완성됐다는 의미가 아니다. 자동 장애 탐지·인증 등 미구현 API는 이 표에 포함하지 않는다. 모델 API의 실제 추론 검증은 별도이며 현재 학습 모델은 연결 전이다.

`E = /api/v1/environments/{id}`. 체크는 구현된 계약 범위의 UI 연결을 뜻한다.

| 상태 | API | 사용 화면 |
|---|---|---|
| [x] | GET /actuator/health | 설정 → 일반 → SentriX 백엔드·DB |
| [x] | POST /api/v1/environments | 환경 등록 |
| [x] | GET /api/v1/environments | 상단 환경 선택, 페이지 순회 |
| [x] | GET E | 설정 → 일반 → 환경 상세 |
| [x] | PUT E/data-sources/{type} | 설정 → 데이터 소스 → 저장 |
| [x] | GET E/data-sources | 설정 → 데이터 소스 목록 |
| [x] | POST E/data-sources/{type}/test | 설정 → 데이터 소스 → 연결 테스트 |
| [x] | GET E/services | 개요 서비스 목록, 서비스 선택 |
| [x] | GET E/services/{service}/status | 서비스 상세 → 준비 상태 |
| [x] | GET E/metrics | 개요·서비스 상세 → CPU/메모리/요청/오류/지연 |
| [x] | GET E/logs | Explore → 로그 검색 |
| [x] | GET E/traces | Explore → Trace 검색 |
| [x] | GET E/traces/{traceId} | Trace 상세, 호출 관계에서 돌아오기 |
| [x] | GET E/collection-status | 서비스 상세 → 수집 데이터 최신성 |
| [x] | GET E/service-map?traceId=… | Service map → 요청 한 건의 호출 관계 |
| [x] | GET E/services/{service}/pods | 서비스 상세 → Pod 목록 |
| [x] | GET E/services/{service}/pods/{pod}/metrics | 선택 Pod CPU·메모리 |
| [x] | GET E/logs/volume | 로그 → Logs volume |
| [x] | GET E/monitoring | 설정 → 분석 → 저장된 실행 설정 |
| [x] | PUT E/monitoring | 설정 → 분석 → 실행 설정 저장 |

## 범위와 제한

- Service map은 직접 CLIENT→SERVER span 관계만 표시한다. 전체 서비스 토폴로지·RPS·원인 판정이 아니다. 60개 초과 서비스는 그래프를 생략하고 연결 표를 제공한다. 서비스 이름과 Deployment가 일치할 때만 서비스 상세 링크를 제공한다.
- 수집 최신성은 조회 시점 최근 30분에서 대표 신호의 시각을 확인한다. 요청 지표의 최근 샘플은 최근 요청 발생을 뜻하지 않는다. UNKNOWN/NO_DATA/STALE을 정상·장애로 바꾸지 않는다.
- 수집 최신성 API는 저장소를 순차 조회하므로 최대 timeout 합계 30초를 기다릴 수 있다. 이 호출만 35초 클라이언트 제한을 사용하고 나머지는 기존 20초다.
- 일반 설정은 환경 상세 및 health 조회다. 환경 수정 기능은 없다. health는 SentriX 서버·DB 상태이며 관측 대상의 정상 판정이 아니다.
- 설정 → 분석에서 환경 주기 실행을 시작·중지한다. 수동 장애 이력·분석 요청 상태·저장 결과 조회는 연결됐다. 자동 장애 탐지/CPU throttling/전체 상태 이력/인증/알림/평가 등은 미구현이며 예시 또는 미지원으로 남긴다.
- 새 외부 환경에 대한 일반화 검증 및 장시간 부하 검증은 별도다.

## 이번 검증

- 단위 테스트 19개 및 production build 통과. 기존 번들 500kB 경고 유지.
- 실제 Java/MySQL/Prometheus/Loki/Tempo 연동: 서비스 수집 최신성 4종, 부분 Tempo 응답의 UNKNOWN 표시 확인.
- 저장된 실제 상품 조회 trace에서 3개 서비스·2개 연결 확인. Trace 상세 6개 span과 호출 관계 화면 왕복 이동 확인.
- 설정 일반에서 실제 Online Boutique 환경 상세와 health UP 표시 확인. 검증 탭 오류 로그 없음.
- 기존 기능의 검증 기록은 README 및 sentrix-core/docs/BACKEND-TRACKER.md 참조. 이번 작업에서 모든 저장 API를 재실행하거나 사용자 설정을 변경하지 않았다.


## 수동 장애 기록·작업 상태 (2026-11-02)

| 상태 | API | 사용 화면 |
|---|---|---|
| [x] | POST E/incidents | 장애 기록 등록 폼 |
| [x] | GET E/incidents | 장애 목록, 상태·서비스 필터 및 페이지 |
| [x] | GET E/incidents/{incidentId} | 장애 기록 상세 |
| [x] | PATCH E/incidents/{incidentId} | 수동 종료·다시 열기 |
| [x] | POST E/incidents/{incidentId}/rca-jobs | 장애 상세 → 발생 시점 분석 또는 최근 30초 분석. Java에서 구간 고정 |
| [x] | GET E/incidents/{incidentId}/rca-jobs | 분석 요청 이력·페이지 |
| [x] | GET E/incidents/{incidentId}/rca-jobs/{jobId} | 작업 ID 클릭 상세. 대기·실행 중 3초마다 상태 갱신 |
| [x] | POST E/incidents/{incidentId}/rca-jobs/{jobId}/cancel | 대기 요청 취소 |

기존 B3/B4의 상단/사이드바와 패널·표 스타일을 유지하고 실제 기록을 표시한다. 수동 기록을 자동 탐지로 표시하지 않는다. 기간 필터는 API에서 지원하며 목록 UI에는 상태·서비스 필터를 제공한다. 모델 미연결 요청은 자동 실행되지 않는다.

검증: 프론트 20개 테스트, production build 통과. 실제 Java/MySQL에서 화면 등록·상세·작업 요청·취소·재요청·장애 종료 시 작업 취소·작업 사유 조회 및 새로고침 유지 확인. 테스트 기록은 '[기능 검증]' 제목으로 수동 종료했다. 모바일·부하·ML 실행은 미검증, 기존 번들 크기 경고 유지.


## 환경 자동 분석 (2026-11-23)

설정 → 분석에서 주기를 저장한다. Java가 대시보드와 독립적으로 실행한다. 이력 새로고침은 `GET E/anomaly-scores?limit=5`로 구간 종료·점수·판정 또는 상태·사유를 다시 읽는다.

## 수동 분석 실행 준비·저장 결과 (2026-11-22)

| 상태 | API | 사용 화면 |
|---|---|---|
| [x] | GET E/incidents/{incidentId}/rca-jobs/{jobId}/result | 완료 작업 선택 → 저장된 판정·후보·근거 |

- 작업 상태 `BLOCKED_MODEL_UNAVAILABLE`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED`를 표시한다. 앞의 세 상태에서 취소할 수 있다.
- `기록·분석 새로고침`으로 이력과 선택한 작업/결과를 다시 조회한다. 화면·환경·작업 변경 시 이전 조회를 취소한다.
- 완료된 작업의 결과만 읽으며 작업/환경/namespace/분석 구간/계약·특징·모델 버전을 검증한다. NODE·EDGE 후보와 근거는 반환된 내용만 표시하고 점수를 확률로 표현하지 않는다.
- 기존 미연결 이력의 null metadata를 허용한다. 과거 미연결 요청은 모델 연결 후 자동 재실행하지 않는다.
- 모델 미연결 기본 동작은 유지한다. 이 연결은 실제 모델의 추론 성능이나 자동 감지를 검증한 것이 아니다.

검증: 프론트 단위 테스트 23개 및 production build 통과. `scripts/check-analysis.mjs`의 브라우저 API fixture로 6개 상태·취소·저장 결과/보류·다른 환경 응답 거부·늦은 결과 차단·근거 escaping을 확인했다. 실제 모델 추론 검증과 구분한다. 기존 번들 크기 경고 유지.

- 2026-11-22 실제 Java/MySQL 연동: 대시보드5176에서 검증용 수동 기록의 분석 요청→미연결·고정30초 구간 표시→취소→수동 종료를 확인했다. 서버 API에서도 CANCELLED/USER_CANCELLED 및 결과409 확인. 모델 성공 결과는 fixture로만 검증했고 실제 모델 추론은 미검증이다.


### 실제 frozen 모델 서버 연결 — 2026-11-22 후속

Python 모델 서버가 실제 RF/LightGBM을 로드한 상태에서 Java 작업 접수·응답·MySQL저장을 확인했다.
화면에서 완료 작업의 ABSTAIN/FEATURE_INPUT_UNAVAILABLE, 모델re2ob-v2-freeze 및 특징re2ob-v0-rel18-all58 확인.
보류 사유는 한국어로 표시한다. 실시간 특징 생성·정상기준·연속 탐지 준비 전이므로 실제 RCA 결과로 표시하지 않는다.
monitoring.modelStatus CONFIGURED와 BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE를 지원하며 자동분석 미구현을 명시한다.
프론트24개 테스트·build 통과. 모델 원인 순위 정확도는 검증하지 않았다.


### 온라인 조회 품질 사유 — 2026-11-22

저장된 판정 보류에서 트레이스 부분검색·조회상한·부모누락·기준선/현재 표본 부족·로그 심각도
미확인·저장소 실패 등의 사유를 한국어로 표시한다. 디자인과 API 경로는 유지한다.
원본 준비 성공 여부와 작업 처리 성공을 구분하며 입력이 불완전한 상태를 실제 RCA로 표시하지 않는다.

### 관측 환경 등록 · 2026-11-23

환경 이름 입력란의 예시 쇼핑몰 이름을 제거했다. 환경 선택기는 서버에서 받은 등록 이름을 표시한다.

### 전시 화면과 관측 데이터 · 2026-11-24

전시 주소의 개요는 Vercel 배포 화면의 배치에 맞춰 장애 배너, 주요 지표, Anomaly score와 Service map, 서비스 타임라인과 요청 지표, 최근 장애를 표시한다. 이상 점수는 Java overview의 recentWindows에서 읽는다. 관측한 호출만 지도에 그린다. 일반 환경의 미니 맵은 최근 Trace 한 건을 사용한다. 재현 환경은 같은 시각까지 확보된 실험 경로를 사용한다. 서비스별 정상·경고·이상 이력은 아직 미판정이다.

실험 시작은 큰 모니터의 현재 페이지를 이동시키지 않는다. 장애 상세에서 모델 후보를 선택하면 근거가 바뀌고, 지도 링크는 같은 작업의 순위를 연다. 11월 24일 로컬 검증에서 서비스 11개, 상품 조회 경로 1순위, 30초 구간별 분석과 정상 회복을 확인했다. 공용 Vercel은 예시 데이터를 제공한다.
