# sentrix-dashboard

SentriX 프론트엔드 대시보드.

> 프로젝트 기준 문서: `sentrix-collection` 저장소의 `sentrix-project-context.md`, 진행 상황: `docs/MILESTONES.md` (2026-10-20 Transfer 예정).

SentriX의 end-to-end 진단 결과를 보여준다.

## 화면 (예정)

- 서비스 topology와 서비스별 상태
- 이상 탐지 상태와 점수
- 원인 후보 순위(서비스 또는 연결, fault type, 점수)와 근거
- 장애 시점 전후 주요 지표

데이터는 `sentrix-core`의 dashboard API에서 받는다. 우선순위는 데이터·모델·백엔드 다음이다.
