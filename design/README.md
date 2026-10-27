# SentriX 디자인 파일

- `screens/` : 화면 22개 + 공통 부품(TopBar, SideNav, TimePicker)의 원본 마크업(`.dc.html`)과 캔버스 배치(`canvas.json`)
- `tokens.css` : 색·서체 토큰 (라이트 기본, `[data-theme=dark]`로 다크)
- `STYLE.md` : 간격·글자·카드·표·버튼·그래프 규격

`.dc.html`은 디자인 캔버스 전용 형식이라 브라우저에서 바로 열리지 않습니다.
각 파일의 `<x-dc>` 안 마크업과 inline style, `renderVals()`의 데이터가 구현 기준입니다.
