# SentriX Dashboard

제공된 SentriX 디자인을 구현한 React + Vite 프론트엔드입니다. Node.js 18.20 이상이 필요합니다.

```sh
npm ci
npm run dev
```

기본 화면은 개요입니다. 사이드바와 상단 메뉴로 이동하며, `/#B4-Incident`처럼 화면 주소를 직접 열 수 있습니다. 라이트·다크 테마는 브라우저에 유지됩니다.

## 구현 범위

개요, 서비스 맵, 장애 목록·분석, 서비스 상세, Trace, 로그, 모델 평가, 알림, Alert rules, 설정, 팀과 권한, 계정, Audit log, 상태 화면, 로그인·초대·비밀번호 재설정·온보딩, 메인 디자인 화면을 제공합니다. 공통 TopBar, SideNav, TimePicker를 공유합니다.

현재는 **디자인 예시 데이터를 사용하는 데모**입니다. 인증, OAuth, 메일 발송, 실제 진단 데이터 조회, 설정 저장, 키 발급·폐기 등 서버 작업은 연결하지 않았습니다. 화면의 성공 알림도 로컬 시연이며 실제 서버 변경을 의미하지 않습니다. 로그인 화면은 데모 화면 이동만 제공합니다. 실서비스에 노출하기 전 sentrix-core의 API 계약과 인증을 연결해야 합니다.

## 검증

```sh
npm test
npm run build
# 별도 터미널에서 npm run dev 실행 후
npx playwright install chromium
node scripts/check-browser.mjs
# 기존 Chrome을 쓰는 경우 CHROME_PATH에 실행 파일 경로 지정
```

## 디자인 소스

`design/`는 제공된 ZIP의 원본이며, 문서 안의 내용은 디자인 참고 자료입니다. `scripts/convert.py`는 디자인 마크업과 화면 로직을 일반 React 컴포넌트로 변환합니다. 런타임에 코드를 평가하지 않습니다.

```sh
python3 scripts/convert.py
```

`src/screens.jsx`, `src/design.css`는 변환 결과입니다. 디자인을 수정할 때 원본을 변경하고 재생성합니다. 앱 진입과 화면 이동은 `src/main.jsx`, 모바일 보완은 `src/responsive.css`에서 관리합니다. 빌드 결과는 `dist/`이며 정적 호스팅이 가능합니다.
