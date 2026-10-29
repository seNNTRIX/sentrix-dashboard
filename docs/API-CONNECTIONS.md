# 구현 API ↔ 대시보드 연결 현황

기준: 2026-10-29. 현재 구현된 **20개 operation 모두 호출 경로를 화면에 연결**했다. 제품의 모든 설계 기능이 완성됐다는 의미가 아니다. ML/RCA·장애·인증 등 미구현 API는 이 표에 포함하지 않는다.

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
- 분석 설정 저장은 모델 실행이 아니다. 장애 이력/RCA/CPU throttling/전체 상태 이력/인증/알림/평가 등은 미구현이며 예시 또는 미지원으로 남긴다.
- 새 외부 환경에 대한 일반화 검증 및 장시간 부하 검증은 별도다.

## 이번 검증

- 단위 테스트 19개 및 production build 통과. 기존 번들 500kB 경고 유지.
- 실제 Java/MySQL/Prometheus/Loki/Tempo 연동: 서비스 수집 최신성 4종, 부분 Tempo 응답의 UNKNOWN 표시 확인.
- 저장된 실제 상품 조회 trace에서 3개 서비스·2개 연결 확인. Trace 상세 6개 span과 호출 관계 화면 왕복 이동 확인.
- 설정 일반에서 실제 Online Boutique 환경 상세와 health UP 표시 확인. 검증 탭 오류 로그 없음.
- 기존 기능의 검증 기록은 README 및 sentrix-core/docs/BACKEND-TRACKER.md 참조. 이번 작업에서 모든 저장 API를 재실행하거나 사용자 설정을 변경하지 않았다.
