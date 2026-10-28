# SentriX Dashboard

SentriX의 React + Vite 프론트엔드입니다. Node.js 18.20 이상이 필요합니다. 환경 등록·데이터 소스 설정·서비스 목록·메트릭 화면은 Java 백엔드 API를 사용합니다.

```sh
npm ci
npm run dev
```

기본 화면은 개요입니다. 사이드바와 상단 메뉴로 이동하며, `/#B4-Incident`처럼 화면 주소를 직접 열 수 있습니다. 라이트·다크 테마는 브라우저에 유지됩니다.

## 구현 범위

개요, 서비스 맵, 장애 목록·분석, 서비스 상세, Trace, 로그, 모델 평가, 알림, Alert rules, 설정, 팀과 권한, 계정, Audit log, 상태 화면, 로그인·초대·비밀번호 재설정·온보딩, 메인 디자인 화면을 제공합니다. 공통 TopBar, SideNav, TimePicker를 공유합니다.

기본 개요(`B1-Overview`), 서비스 상세(`B5-Service`), 설정(`C3-Settings`), 첫 설정(`A4-Onboarding`)은 실제 API 연결 화면입니다. 나머지 화면과 `?demo=1#B1-Overview` 등의 명시적 미리보기는 **디자인 예시 데이터**를 사용하며 상단에 구분 표시합니다. 로그인 화면도 인증을 수행하지 않는 예시입니다. RCA·서비스 맵·트레이스·로그·알림·계정 관리 API는 아직 연결하지 않았습니다.

## 백엔드 연결

`sentrix-core`의 데이터 소스 API와 서비스·메트릭 API가 모두 필요합니다(백엔드 PR #2, #3). 기본 접속 대상은 `http://127.0.0.1:8080`입니다. 백엔드와 MySQL을 먼저 실행하고, 프론트는 위 명령으로 실행합니다.

브라우저는 같은 출처의 `/api/v1`에 요청하고 Vite가 Java 서버로 전달합니다. 개발 중 CORS 허용 범위를 넓힐 필요가 없습니다. 백엔드 포트가 다르면 프론트 루트의 `.env`에 설정하고 Vite를 재시작합니다.

```dotenv
SENTRIX_API_TARGET=http://127.0.0.1:8080
```

이 변수는 개발/preview 서버용입니다. `npm run build`의 정적 파일을 배포할 때는 웹서버에서 `/api`를 Java 백엔드로 전달하는 reverse proxy를 별도로 구성해야 합니다. Vite 설정이 정적 호스팅에 포함되지는 않습니다. 현재 인증이 없으므로 로컬 개발 환경에서 사용합니다.

### 사용 순서

1. 처음 실행 시 등록된 환경 목록을 조회합니다. 없으면 환경 이름과 namespace를 등록합니다. 기존 환경은 상단 선택 상자로 전환하고 선택을 브라우저에 기억합니다.
2. 설정에서 Prometheus·Tempo·Loki의 이름, base URL, 제한 시간(1~10초)을 저장합니다. 서버의 `SENTRIX_DATASOURCE_ALLOWED_URLS`에도 정확한 base URL이 등록되어 있어야 합니다. 브라우저에서 허용 목록을 수정하지는 않습니다.
3. `저장 후 테스트` 또는 `연결 테스트`를 누르면 실제 API 결과를 표시합니다. HTTP 200이어도 응답의 `status=FAILED`면 실패로 표시합니다. URL 등 수정 중에는 기존 검사 결과임을 알립니다.
4. 개요에서 실제 Deployment 목록을 조회하고 서비스를 고릅니다. CPU·메모리·요청량·오류율·p50/p90/p99 그래프를 조회합니다.
5. 빠른 기간 또는 직접 지정(최대 24시간)을 사용합니다. `지표 새로고침`이나 선택적 30초 자동 갱신으로 다시 조회할 수 있습니다. 직접 지정 기간은 자동 갱신해도 고정됩니다.

서비스는 `#B5-Service?service=frontend`처럼 링크할 수 있습니다. 환경별 namespace는 백엔드가 결정하며, 환경 또는 서비스 변경 시 이전 지표 요청을 취소하고 응답도 무시합니다. 환경 목록은 50개씩 페이지를 읽으며 최대 100페이지까지 허용합니다. 연결 실패 시 예시 데이터로 대체하지 않습니다.

### 화면과 API

| 화면 | API |
| --- | --- |
| 환경 선택/등록 | `GET, POST /api/v1/environments` |
| 데이터 소스 목록 | `GET /api/v1/environments/{id}/data-sources` |
| 데이터 소스 저장 | `PUT /api/v1/environments/{id}/data-sources/{type}` |
| 연결 검사 | `POST /api/v1/environments/{id}/data-sources/{type}/test` |
| 서비스 목록 | `GET /api/v1/environments/{id}/services` |
| 그래프 | `GET /api/v1/environments/{id}/metrics?service=...&metric=...&from=...&to=...&stepSeconds=...` |

그래프에서 CPU는 cores, 메모리는 API bytes를 MiB로 변환, 오류율은 ratio를 %로 변환, 지연은 ms로 표시합니다. 제목 아래 숫자는 마지막 조회 지점의 값이며 그 지점이 null이면 `—`입니다. 실제 0은 유지합니다. 누락 구간을 선으로 연결하거나 0으로 채우지 않고, PARTIAL/NO_DATA와 서버 오류를 별도로 표시합니다. 시각은 브라우저 시간대로 표시하고 요청은 UTC·초 단위로 보냅니다. 기간에 따라 최대 1440개 지점을 넘지 않도록 간격을 조정합니다.

현재 개요는 선택한 서비스의 지표입니다. 미구현인 전체 상태·이상 점수·장애 건수 등을 예시 수치로 섞지 않습니다. 서비스 목록은 Deployment 단위이며 건강 상태나 trace 계측 여부를 보장하지 않습니다. 실제 관측 저장소가 연결되지 않으면 설정 안내나 조회 오류가 나타나는 것이 정상입니다.

## 검증

```sh
npm test
npm run build
# 별도 터미널에서 npm run dev 실행 후
npx playwright install chromium
npm run test:browser
npm run test:api-ui
# 기존 Chrome을 쓰는 경우 CHROME_PATH에 실행 파일 경로 지정
```

## 디자인 소스

`design/`는 제공된 ZIP의 원본이며, 문서 안의 내용은 디자인 참고 자료입니다. `scripts/convert.py`는 디자인 마크업과 화면 로직을 일반 React 컴포넌트로 변환합니다. 런타임에 코드를 평가하지 않습니다.

```sh
python3 scripts/convert.py
```

`src/screens.jsx`, `src/design.css`는 변환 결과입니다. 디자인을 수정할 때 원본을 변경하고 재생성합니다. **실제 API 연결 코드는 `src/live/`에 두고 `src/main.jsx`에서 해당 화면을 선택**하므로 디자인 재생성으로 덮어쓰지 않습니다. 앱 진입과 화면 이동은 `src/main.jsx`, 공통 타이포그래피·여백·반응형 규칙은 `src/responsive.css`에서 관리합니다. 공통 헤더·메뉴·시간 선택·모달·버튼은 `src/components/`의 React 컴포넌트로 관리하며, 변환 시 기존 디자인의 공통 부품 대신 사용합니다. 빌드 결과는 `dist/`입니다.


## UI 검증과 데모 동작

`npm run test:browser`는 명시적 `?demo=1`에서 기존 20개 디자인 화면의 390·768·1440px 레이아웃과 인터랙션을 검사합니다. `npm run test:api-ui`는 API 응답을 브라우저에서 가로채는 독립 테스트로 환경 페이지 처리·등록·선택, 설정 저장/재조회, 200 FAILED 처리, 단위·null/0, 시간 범위, 이전 요청 응답 무시, 서버 오류, 다크 모드와 모바일 화면을 확인합니다. 테스트 예시 응답은 앱 코드에 포함되지 않습니다. 캡처는 무시된 `artifacts/ui-after/`, `artifacts/live/`에 저장됩니다. 개발 서버 포트가 다르면 `UI_BASE_URL=http://127.0.0.1:5175/`를 지정하세요.

- 아래 항목은 디자인 미리보기 모드에 대한 설명입니다. 검색은 화면·서비스·샘플 장애로 이동합니다. `Ctrl/Cmd + K`로 열 수 있습니다.
- 모달은 Esc 또는 바깥 클릭으로 닫히고 원래 버튼으로 초점이 돌아갑니다. 모바일·태블릿 메뉴도 같은 방식으로 동작합니다.
- 시간 선택은 범위를 검증하지만 차트 데이터는 고정된 데모입니다. 새로고침도 실시간 API를 호출하지 않습니다.
- 클립보드 복사는 실제로 수행하며, 지원하지 않거나 권한이 없으면 오류를 표시합니다.
- API가 필요한 미구현 버튼은 현재 사용할 수 없는 이유를 표시합니다. 초대·설정 변경도 데모 범위임을 안내합니다.

## 연결 검증 기록 — 2026-10-28

- 단위 테스트 6개와 production build 통과.
- API UI 테스트: 환경 페이지 처리·분리, 생성, 설정 저장·검사·재조회, 0/null·오류 상태, 시간 범위, 느린 이전 응답 무시, 라이트/다크와 모바일 검증 통과.
- 기존 20개 디자인 화면을 390/768/1440px에서 검사하고 인터랙션 회귀 테스트 통과.
- 별도 Java 서버와 MySQL `sentrix_test`를 사용한 실제 브라우저 경로에서도 등록→저장→readiness→재조회→서비스 목록→지표 표시 통과. 이때 관측 저장소는 임시 HTTP 시험 서버를 사용했다. 실제 Online Boutique 연결 성공으로 해석하지 않는다.
- 개발 서버의 실제 `/api/v1/environments` 프록시 연결도 확인했다. 개발 환경의 관측 주소는 임의로 등록하지 않았다.
