# SentriX UI 규격 (Vercel 대시보드, Linear, Sentry 이슈 화면 기준)

Reference implementations already done: B4-Incident.dc.html (whole), B1-Overview.dc.html top half (header, incident row card, KPI strip, 이상 점수 card, 서비스 맵 card), B3-Incidents.dc.html (list rows, status badges), C1-Notifications.dc.html (list rows). Match them.

## Tokens
Keep the existing :root / [data-theme=dark] token block and .g base rules exactly. Only tokens, no new literal colours (brand logos and Kakao/Google buttons are the only exceptions).

## Page
- main: `padding: 24px 32px 48px`; inner content wrapper `max-width: 1160px` (wide data screens like map/trace/logs may use full width); vertical gap between blocks 24px; inside a block 12–16px.
- Header: h1 `22px / 30px / 600 / letter-spacing -0.01em`; optional one subtitle line 14px var(--text-2); actions right-aligned, 32px buttons. No template-variable select boxes, no key|value pills in headers.
- Tabs: plain buttons, 40px tall, gap 24px, active = text color + 500 + `box-shadow: inset 0 -2px 0 var(--text)`, inactive = var(--text-2). Container has a 1px bottom border.

## Cards
- `background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px`.
- Padding 20px 24px (16px 20px for small chart cards). Header row: h2 `14px / 500`, optional right meta `13px var(--text-2)`; 12px gap to content.
- Never a card inside a card. Never a coloured left stripe, never `inset Npx 0 0` shadows, never filled icon blocks.
- Lists inside a card: rows `padding: 12px 20px`, hairline between rows (none after the last), title 14px/20px, secondary line 13px/20px var(--text-2).

## Tables
- Inside a card with no card padding (`overflow-x: auto`). th: 13px / 500 / var(--text-2), height 36px, padding 0 16px. td: 14px, height 44px, padding 0 16px. No border after last row.
- Numbers: body font with `font-variant-numeric: tabular-nums`, right-aligned. Use `class="mono"` only for IDs, code, queries, URLs, log lines.

## Text and status
- Status = text-only badge: `height 22px; padding 0 8px; border-radius 6px; font-size 12px; font-weight 500`. 진행 중/오류: error-text on error 10% tint. 경고/확인함: warning-text on warning 18% tint. 정상/해결됨/비활성: text-2 on var(--secondary). No icons inside status badges, no dots, no ✓ ✕ glyphs, no arrows glued to labels, no middle dots, no em/en dashes, no emoji.
- Fault types: plain text (13px text-2) or the soft tag `padding 1px 8px; radius 4px; 12px; color var(--on-tag); background var(--tag-*)`.
- English for industry terms (Evidence, Supporting, Contradicting, Trace, Span, p50/p90/p99, Pod, namespace, Avg@5, Top-1).
- Labels in forms: 13px / 500; help text 12px var(--text-2); inputs 32px (40px only on login), `border 1px var(--border); radius 6px; background var(--bg1)`.

## Buttons
- Primary: `background var(--primary); color var(--on-primary); border 0`.
- Secondary: `background var(--bg1); border 1px solid var(--border)`. (Not var(--secondary) grey fill.)
- Destructive: `background var(--error); color #fff` only for irreversible actions.
- Height 32px, padding 0 14px, radius 6px, 14px / 500.
- Segmented control: container `background var(--bg2); padding 2px; radius 8px; gap 2px`; option 28px tall; selected `background var(--bg1); box-shadow var(--shadow-z1); font-weight 500`; others transparent var(--text-2).

## Charts
- One neutral series line `stroke var(--text)` 1.5px; comparison series `var(--border-strong)`; incident region `var(--shade)`; threshold dashed `var(--border-strong)`. Axis labels 12px var(--text-2), no inner grid except a baseline. Only use red/amber when the colour means error/warning (log levels, error bars).
- Legends: 12px var(--text-2), 12×2px swatch.

## Spacing audit
- Use only 4, 8, 12, 16, 20, 24, 32, 48. Remove stray margins, empty wrappers, double borders, uneven gaps between sibling cards, padding that differs between cards in the same row. Cards in one row stretch to equal height. No content touching card edges.
- Set each file's $preview height to the real content height (round up to 100) and report it.
