// Layouts from the checked-in design export, with live data supplied by DesignPage.
import React from 'react';
import {css,routeHref} from '../styles.js';
import {TopBar,SideNav} from '../components/navigation.jsx';
import {TimePicker} from '../components/TimePicker.jsx';
import {Dialog,AsyncButton,DataViewport,ServiceName} from '../components/controls.jsx';
import {PreviewAction} from '../components/PreviewAction.jsx';

function LayoutA1({closeMenu, eye, inputStyle, pwLabel, pwType, slots, stop, theme}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"A1-Login"}>
 <main style={css("flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 16px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
  <div style={css("width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 32px")}>
   <div style={css("display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center")}>
    <span style={css("display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 10px; background: #1c1c1c; color: #ffffff")}>
     <svg width={"22"} height={"22"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.4"} strokeLinecap={"round"} aria-hidden={"true"}>
      <path d={"M5 5l14 14M19 5L5 19"} />
      <circle cx={"12"} cy={"12"} r={"3.2"} style={css("fill: #E865C0; stroke: none")} />
     </svg>
    </span>
    <div style={css("display: flex; flex-direction: column; gap: 4px")}>
     <h1 style={css("margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
      {"SentriX에 로그인"}
     </h1>
     <p style={css("margin: 0; color: var(--text-2)")}>
      {"Kubernetes 마이크로서비스 이상 탐지와 원인 분석"}
     </p>
    </div>
   </div>
   <p className={"secondary-text"}>
    {"계정 인증 미연결"}
   </p>
   <form style={css("display: flex; flex-direction: column; gap: 16px")} onSubmit={stop}>
    <div style={css("display: flex; flex-direction: column; gap: 8px")}>
     <PreviewAction style={css("position: relative; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: #FEE500; color: rgba(0,0,0,.85); font-weight: 500; text-decoration: none")}>
      <svg width={"18"} height={"18"} viewBox={"0 0 24 24"} aria-hidden={"true"} style={css("position: absolute; left: 14px")}>
       <path d={"M12 3.5c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.4c-.1.3.3.6.6.4l4-2.7c.4 0 .7.1 1.1.1 5 0 9-3.1 9-7s-4-7.1-9-7.1z"} style={css("fill: #000000")} />
      </svg>
      {"카카오로 로그인"}
     </PreviewAction>
     <PreviewAction style={css("position: relative; height: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 6px; background: #FFFFFF; color: #1F1F1F; font-weight: 500; text-decoration: none")}>
      <svg width={"18"} height={"18"} viewBox={"0 0 48 48"} aria-hidden={"true"} style={css("position: absolute; left: 14px")}>
       <path d={"M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"} style={css("fill: #FFC107")} />
       <path d={"M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"} style={css("fill: #FF3D00")} />
       <path d={"M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"} style={css("fill: #4CAF50")} />
       <path d={"M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"} style={css("fill: #1976D2")} />
      </svg>
      {"Google로 로그인"}
     </PreviewAction>
    </div>
    <div style={css("display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-2)")}>
     <span style={css("flex: 1; height: 1px; background: var(--border-weak)")} />
     {"또는 이메일로"}
     <span style={css("flex: 1; height: 1px; background: var(--border-weak)")} />
    </div>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("font-size: 13px; font-weight: 500")}>
      {"이메일"}
     </span>
     <input type={"email"} required={true} autoComplete={"username"} style={css(inputStyle)} disabled={true} />
    </label>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("display: flex; justify-content: space-between; font-size: 13px")}>
      <span style={css("font-weight: 500")}>
       {"비밀번호"}
      </span>
      <a href={routeHref("A3-Reset.dc.html")} style={css("color: var(--text-2)")}>
       {"비밀번호 찾기"}
      </a>
     </span>
     <span style={css("position: relative; display: flex")}>
      <input type={pwType} required={true} autoComplete={"current-password"} style={css(String(inputStyle ?? '') + "; width: 100%; padding-right: 44px")} disabled={true} />
      <button type={"button"} aria-label={pwLabel} style={css("position: absolute; right: 4px; top: 4px; width: 32px; height: 32px; border: 0; border-radius: 6px; background: none; color: var(--text-2); display: inline-flex; align-items: center; justify-content: center")} disabled={true}>
       <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.8"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
        <path d={eye} />
       </svg>
      </button>
     </span>
    </label>
    <label style={css("display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2)")}>
     <input type={"checkbox"} defaultChecked={true} style={css("width: 16px; height: 16px; margin: 0; accent-color: var(--primary)")} disabled={true} />
     {"로그인 상태 유지"}
    </label>
    <button type={"submit"} style={css("border: 0; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")} disabled={true}>
     {"로그인"}
    </button>
   </form>
   <p style={css("margin: 0; text-align: center; font-size: 13px; color: var(--text-2)")}>
    {"초대를 받으셨나요? "}
    <a href={routeHref("A2-Signup.dc.html")}>
     {"초대 수락"}
    </a>
   </p>
  </div>
 </main>
 <footer style={css("display: flex; justify-content: center; gap: 16px; padding: 16px; font-size: 12px; color: var(--text-2)")}>
  <a href="#B1-Overview" style={css("color: var(--text-2)")}>
   {"대시보드"}
  </a>
  <a href={routeHref("C7-States.dc.html")} style={css("color: var(--text-2)")}>
   {"지원"}
  </a>
  <span>
   {"SentriX"}
  </span>
 </footer>
</div>
 );
}

function LayoutA2({closeMenu, mismatch, onPw, onPw2, pw2Style, slots, stop, theme}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"A2-Signup"}>
 <main style={css("flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 16px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
  <div style={css("width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 32px")}>
   <div style={css("display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center")}>
    <span style={css("display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 10px; background: #1c1c1c; color: #ffffff")}>
     <svg width={"22"} height={"22"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.4"} strokeLinecap={"round"} aria-hidden={"true"}>
      <path d={"M5 5l14 14M19 5L5 19"} />
      <circle cx={"12"} cy={"12"} r={"3.2"} style={css("fill: #E865C0; stroke: none")} />
     </svg>
    </span>
    <div style={css("display: flex; flex-direction: column; gap: 4px")}>
     <h1 style={css("margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
      {"팀 초대"}
     </h1>
     <p style={css("margin: 0; color: var(--text-2)")}>
      {"초대 수락"}
     </p>
    </div>
   </div>
   <p className={"secondary-text"}>
    {"계정 인증 미연결"}
   </p>
   <form style={css("display: flex; flex-direction: column; gap: 16px")} onSubmit={stop}>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("font-size: 13px; font-weight: 500")}>
      {"이메일"}
     </span>
     <input type={"email"} readOnly={true} style={css("height: 40px; padding: 0 12px; border: 1px solid var(--border-weak); border-radius: 8px; background: var(--bg2); color: var(--text-2)")} disabled={true} />
    </label>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("font-size: 13px; font-weight: 500")}>
      {"이름"}
     </span>
     <input type={"text"} required={true} autoComplete={"name"} style={css("height: 40px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
    </label>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("display: flex; justify-content: space-between; font-size: 13px")}>
      <span style={css("font-weight: 500")}>
       {"비밀번호"}
      </span>
      <span style={css("color: var(--text-2)")}>
       {"12자 이상"}
      </span>
     </span>
     <input type={"password"} required={true} minLength={"12"} autoComplete={"new-password"} onChange={onPw} style={css("height: 40px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
    </label>
    <label style={css("display: flex; flex-direction: column; gap: 8px")}>
     <span style={css("font-size: 13px; font-weight: 500")}>
      {"비밀번호 확인"}
     </span>
     <input type={"password"} required={true} minLength={"12"} autoComplete={"new-password"} onChange={onPw2} aria-invalid={mismatch} style={css(pw2Style)} disabled={true} />
    </label>
    <button type={"submit"} style={css("height: 40px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")} disabled={true}>
     {"가입"}
    </button>
   </form>
   <p style={css("margin: 0; text-align: center; font-size: 13px; color: var(--text-2)")}>
    {"이미 계정이 있나요? "}
    <a href={routeHref("A1-Login.dc.html")}>
     {"로그인"}
    </a>
   </p>
  </div>
 </main>
</div>
 );
}

function LayoutA3({closeMenu, done, mismatch, notDone, onPw, onPw2, pw2Style, resendLabel, s1, s2, s3, slots, stepDesc, stepNum, stepTitle, theme}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"A3-Reset"}>
 <main style={css("flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 16px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
  <div style={css("width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 32px")}>
   <div style={css("display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center")}>
    <span style={css("display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 10px; background: #1c1c1c; color: #ffffff")}>
     <svg width={"22"} height={"22"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.4"} strokeLinecap={"round"} aria-hidden={"true"}>
      <path d={"M5 5l14 14M19 5L5 19"} />
      <circle cx={"12"} cy={"12"} r={"3.2"} style={css("fill: #E865C0; stroke: none")} />
     </svg>
    </span>
    <div style={css("display: flex; flex-direction: column; gap: 4px")}>
     <span style={css("font-size: 13px; color: var(--text-2); font-variant-numeric: tabular-nums")}>
      {stepNum}
     </span>
     <h1 style={css("margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
      {stepTitle}
     </h1>
     <p style={css("margin: 0; color: var(--text-2)")}>
      {stepDesc}
     </p>
    </div>
   </div>
   {s1 && <>
    <div style={css("display: flex; flex-direction: column; gap: 16px")}>
     <label style={css("display: flex; flex-direction: column; gap: 8px")}>
      <span style={css("font-size: 13px; font-weight: 500")}>
       {"이메일"}
      </span>
      <input type={"email"} required={true} autoComplete={"email"} style={css("height: 40px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
     </label>
     <button type={"button"} style={css("height: 40px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")} disabled={true}>
      {"재설정 메일 보내기"}
     </button>
    </div>
   </>}
   {s2 && <>
    <div style={css("display: flex; flex-direction: column; gap: 8px")}>
     <button type={"button"} style={css("height: 40px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")} disabled={true}>
      {"메일의 링크 열기"}
     </button>
     <button type={"button"} style={css("height: 40px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")} disabled={true}>
      {resendLabel}
     </button>
    </div>
   </>}
   {s3 && <>
    <div style={css("display: flex; flex-direction: column; gap: 16px")}>
     <label style={css("display: flex; flex-direction: column; gap: 8px")}>
      <span style={css("display: flex; justify-content: space-between; font-size: 13px")}>
       <span style={css("font-weight: 500")}>
        {"새 비밀번호"}
       </span>
       <span style={css("color: var(--text-2)")}>
        {"12자 이상"}
       </span>
      </span>
      <input type={"password"} autoComplete={"new-password"} onChange={onPw} style={css("height: 40px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
     </label>
     <label style={css("display: flex; flex-direction: column; gap: 8px")}>
      <span style={css("font-size: 13px; font-weight: 500")}>
       {"비밀번호 확인"}
      </span>
      <input type={"password"} autoComplete={"new-password"} onChange={onPw2} aria-invalid={mismatch} style={css(pw2Style)} disabled={true} />
     </label>
     <button type={"button"} style={css("height: 40px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")} disabled={true}>
      {"비밀번호 변경"}
     </button>
    </div>
   </>}
   {done && <>
    <a href={routeHref("A1-Login.dc.html")} style={css("height: 40px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; text-decoration: none")}>
     {"로그인"}
    </a>
   </>}
   {notDone && <>
    <p style={css("margin: 0; text-align: center; font-size: 13px")}>
     <a href={routeHref("A1-Login.dc.html")} style={css("color: var(--text-2)")}>
      {"로그인으로 돌아가기"}
     </a>
    </p>
   </>}
  </div>
 </main>
</div>
 );
}

function LayoutA4({atFirst, closeMenu, environmentName, next, nextLocked, prev, s0, s1, s2, s3, s4, showFooter, slots, steps, theme}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 48px 32px")} data-screen={"A4-Onboarding"}>
 <div style={css("width: 100%; max-width: 960px; display: flex; flex-direction: column; gap: 32px")}>
  <header style={css("display: flex; align-items: center; gap: 12px")}>
   <span style={css("display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 6px; background: #1c1c1c; color: #ffffff")}>
    <svg width={"18"} height={"18"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.4"} strokeLinecap={"round"} aria-hidden={"true"}>
     <path d={"M5 5l14 14M19 5L5 19"} />
     <circle cx={"12"} cy={"12"} r={"3.2"} style={css("fill: #E865C0; stroke: none")} />
    </svg>
   </span>
   <div style={css("display: flex; flex-direction: column")}>
    <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
     {"SentriX 첫 설정"}
    </h1>
    <span style={css("color: var(--text-2)")}>
     {environmentName}
    </span>
   </div>
  </header>
  <div style={css("display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start")}>
   <ol aria-label={"설정 단계"} className="setup-steps">
    {(steps || []).map((s, i) => <React.Fragment key={i}>
     <li aria-current={s.current?'step':undefined}>
      <span aria-hidden="true">{s.mark}</span><span>{s.label}</span>
     </li>
    </React.Fragment>)}
   </ol>
   <section style={css("flex: 1 1 520px; min-width: 0; background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column")} className={"panel"}>
    <div style={css("padding: 24px; display: flex; flex-direction: column; gap: 20px")}>
     {s0 && <>
      {slots.s0}
     </>}
     {s1 && <>
      {slots.s1}
     </>}
     {s2 && <>
      {slots.s2}
     </>}
     {s3 && <>
      {slots.s3}
     </>}
     {s4 && slots.s4}
    </div>
    {showFooter && <div style={css("display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas)")}>
      <button type={"button"} onClick={prev} disabled={atFirst} style={css("height: 32px; padding: 0 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")}>
       {"이전"}
      </button>
      <div style={css("display: flex; gap: 8px")}>
       <button type={"button"} onClick={next} disabled={nextLocked} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")}>
        {"다음"}
       </button>
      </div>
    </div>}
   </section>
  </div>
 </div>
</div>
 );
}

function LayoutB8({alerts, closeMenu, gauges, menuOpen, onThr, setTheme, slots, stats, theme, thr, thrText, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"B8-Model"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|모델 평가"} hrefs={"B1-Overview.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"model"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 1160px; display: flex; flex-direction: column; gap: 24px")}>
    <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; justify-content: space-between")}>
     <div style={css("display: flex; flex-direction: column; gap: 2px; min-width: 0")}>
      <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
       {"모델 평가"}
      </h1>
      <span style={css("color: var(--text-2)")}>
       {"RCAEval RE2-OB · 90건"}
      </span>
     </div>
     <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")} disabled={true}>
      {"평가 다시 실행"}
     </button>
    </div>
    <section aria-label={"주요 평가 지표"} style={css("display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); border: 1px solid var(--border-weak); border-radius: 8px; background: var(--bg1); overflow: hidden")} className={"panel"}>
     {(stats || []).map((s, i) => <React.Fragment key={i}>
      <div style={css(s.cell)}>
       <span style={css("font-size: 13px; color: var(--text-2)")}>
        {s.title}
       </span>
       <span style={css("font-size: 24px; line-height: 32px; font-weight: 500; font-variant-numeric: tabular-nums")}>
        {s.value}
       </span>
       <span style={css("font-size: 12px; color: var(--text-2)")}>
        {s.sub}
       </span>
      </div>
     </React.Fragment>)}
    </section>
    <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: stretch")}>
     <section aria-labelledby={"model-h"} style={css("flex: 2 1 320px; min-width: 0; background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; display: flex; flex-direction: column")} className={"panel"}>
      <h2 id={"model-h"} style={css("margin: 0; padding: 16px 20px 12px; font-size: 14px; font-weight: 500")} className={"section-title"}>
       {"사용 중인 모델"}
      </h2>
      <table className={"data-table"}>
       {slots.modelRows}
      </table>
     </section>
     <section aria-labelledby={"feat-h"} style={css("flex: 3 1 480px; min-width: 0; background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; display: flex; flex-direction: column")} className={"panel"}>
      <h2 id={"feat-h"} style={css("margin: 0; padding: 16px 20px 12px; font-size: 14px; font-weight: 500")} className={"section-title"}>
       {"지표 묶음"}
      </h2>
      <div style={css("overflow-x: auto")} className={"scroll-region"} tabIndex={"0"}>
       <table className={"data-table"}>
        {slots.featureHead}
        {slots.featureRows}
       </table>
      </div>
     </section>
    </div>
    <section aria-labelledby={"thr-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; padding: 20px 24px; display: flex; flex-direction: column; gap: 12px")} className={"panel panel-padded"}>
     <div style={css("display: flex; justify-content: space-between; align-items: baseline; gap: 8px")}>
      <h2 id={"thr-h"} style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
       {"Detection threshold"}
      </h2>
      <span style={css("font-size: 13px; color: var(--text-2)")}>
       {"현재 관측 환경"}
      </span>
     </div>
     <div style={css("display: flex; flex-wrap: wrap; align-items: center; gap: 16px")}>
      <label htmlFor={"thr"} style={css("font-size: 13px; font-weight: 500")}>
       {"Anomaly score 임계값"}
      </label>
      <input id={"thr"} type={"range"} min={"0"} max={"1"} step={"any"} value={thr} onChange={onThr} style={css("flex: 1 1 320px; accent-color: var(--primary)")} disabled={true} />
      <input type={"text"} aria-label={"임계값"} value={thrText} readOnly={"readonly"} style={css("width: 72px; height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); text-align: right; font-variant-numeric: tabular-nums")} disabled={true} />
      <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
       {"임계값 저장"}
      </button>
     </div>
    </section>
    <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: stretch")}>
     <section aria-labelledby={"g-h"} style={css("flex: 1 1 420px; min-width: 0; background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")} className={"panel panel-padded"}>
      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
       <h2 id={"g-h"} style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
        {"장애 유형별 Avg@5"}
       </h2>
       <span style={css("font-size: 12px; color: var(--text-2)")}>
        {"공개 데이터 · 원인 서비스 제외 검증"}
       </span>
      </div>
      <div style={css("display: flex; flex-direction: column; gap: 12px")}>
       {(gauges || []).map((b, i) => <React.Fragment key={i}>
        <div style={css("display: grid; grid-template-columns: 112px minmax(0, 1fr) 48px; align-items: center; gap: 12px")}>
         <span style={css("font-size: 13px; color: var(--text-2)")}>
          {b.label}
         </span>
         <div style={css("height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden")}>
          <div style={css(b.bar)} />
         </div>
         <span style={css("text-align: right; font-variant-numeric: tabular-nums")}>
          {b.value}
         </span>
        </div>
       </React.Fragment>)}
      </div>
     </section>
     <section aria-labelledby={"f-h"} style={css("flex: 1 1 420px; min-width: 0; background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; display: flex; flex-direction: column")} className={"panel"}>
      <div style={css("display: flex; flex-direction: column; gap: 2px; padding: 20px 24px 12px")}>
       <h2 id={"f-h"} style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
        {"fold별 결과"}
       </h2>
       <span style={css("font-size: 12px; color: var(--text-2)")}>
        {"각 회차에서 학습에서 제외한 원인 서비스"}
       </span>
      </div>
      <div style={css("overflow-x: auto")} className={"scroll-region"} tabIndex={"0"}>
       <table className={"data-table"}>
        {slots.foldHead}
        {slots.foldRows}
       </table>
      </div>
     </section>
    </div>
    <section aria-labelledby={"hist-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; display: flex; flex-direction: column; min-width: 0")} className={"panel"}>
     <h2 id={"hist-h"} style={css("margin: 0; padding: 16px 20px 12px; font-size: 14px; font-weight: 500")} className={"section-title"}>
      {"모델 기록"}
     </h2>
     <div style={css("overflow-x: auto")} className={"scroll-region"} tabIndex={"0"}>
      <table className={"data-table"}>
       {slots.historyHead}
       {slots.historyRows}
      </table>
     </div>
    </section>
    {slots.trials}
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC1({closeMenu, empty, filters, hasItems, items, markAll, menuOpen, noUnread, notice, setTheme, showAll, slots, theme, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C1-Notifications"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|장애|알림 기록"} hrefs={"B1-Overview.dc.html|B3-Incidents.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"alerts"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px; display: flex; flex-direction: column; gap: 24px; max-width: 1200px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("display: flex; flex-direction: column; gap: 4px")}>
    <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
     {"알림 기록"}
    </h1>
    <div style={css("color: var(--text-2)")}>
     {"최근 감지·회복"}
    </div>
   </div>
   <div style={css("display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between")}>
    <div role={"radiogroup"} aria-label={"알림 종류"} style={css("display: inline-flex; padding: 2px; gap: 2px; border-radius: 8px; background: var(--bg2)")} className={"segmented-control"}>
     {(filters || []).map((f, i) => <React.Fragment key={i}>
      <button type={"button"} role={"radio"} aria-checked={f.checked} onClick={f.pick} style={css(f.style)}>
       {f.label}
      </button>
     </React.Fragment>)}
    </div>
    <button type={"button"} onClick={markAll} disabled={noUnread} style={css("height: 32px; padding: 0 16px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")}>
     {"모두 읽음"}
    </button>
   </div>
   <section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
    {notice}
    {hasItems && <>
     <ul style={css("list-style: none; margin: 0; padding: 0")}>
      {(items || []).map((n, i) => <React.Fragment key={i}>
       <li className="notice-row" style={css(n.row)}>
        <a href={routeHref(n.href)} style={css("flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; color: var(--text); text-decoration: none")}>
         <span style={css(n.titleStyle)}>
          {n.title}
         </span>
         <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis")}>
          {n.body}
         </span>
        </a>
        <time className="notice-time" dateTime={n.timeIso} title={n.timeFull}>{n.time}</time>
        <button type={"button"} onClick={n.read} disabled={n.isRead} aria-label={n.readLabel} title={"읽음으로 표시"} style={css("width: 28px; height: 28px; flex: none; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: none; color: var(--text-2)")}>
         <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
          <path d={"M5 12.5l4.5 4.5L19 7.5"} />
         </svg>
        </button>
       </li>
      </React.Fragment>)}
     </ul>
    </>}
    {empty && <>
     <div style={css("padding: 64px 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-2)")}>
      <svg width={"48"} height={"48"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"1.2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
       <path d={"M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"} />
      </svg>
      <div style={css("font-size: 16px; line-height: 24px; font-weight: 500; color: var(--text)")}>
       {"조건에 맞는 알림이 없습니다"}
      </div>
      <button type={"button"} onClick={showAll} style={css("height: 32px; padding: 0 16px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")}>
       {"전체 보기"}
      </button>
     </div>
    </>}
   </section>
   <div style={css("color: var(--text-2)")}>
    <a href={routeHref("C2-AlertRules.dc.html")}>
     {"탐지 규칙 보기"}
    </a>
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC2({q,onQ,closeMenu, crumbs, cycle, hrefs, isList, menuOpen, notice, rules, setTheme, slots, theme, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C2-AlertRules"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={crumbs} hrefs={hrefs} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"rules"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 1160px; display: flex; flex-direction: column; gap: 24px")}>
    {isList && <>
     <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; justify-content: space-between")}>
      <div style={css("display: flex; flex-direction: column; gap: 2px")}>
       <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
        {"Alert rules"}
       </h1>
       <span style={css("color: var(--text-2)")}>
        {"현재 관측 환경의 탐지 규칙"}
       </span>
      </div>
      <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
       {"새 Alert rules"}
      </button>
     </div>
     <label style={css("position: relative; display: flex; align-items: center; max-width: 360px")}>
      <span style={css("position: absolute; left: 10px; display: inline-flex; color: var(--text-2)")}>
       <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} aria-hidden={"true"}>
        <path d={"M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4.5 4.5"} />
       </svg>
      </span>
      <input type={"search"} aria-label={"규칙 검색"} onChange={onQ} value={q} placeholder={"이름, Labels로 검색"} style={css("width: 100%; height: 32px; padding: 0 12px 0 32px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} />
     </label>
     <section aria-labelledby={"grp-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto")} className={"panel scroll-region"} tabIndex={"0"}>
      <div style={css("display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border-weak)")}>
       <h2 id={"grp-h"} style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
        {"SentriX / rca"}
       </h2>
       <span style={css("font-size: 13px; color: var(--text-2)")}>
        {cycle}
       </span>
      </div>
      <div role={"table"} aria-label={"Alert rules"} className="workspace-rules">
       <div role={"row"}>
        <span role={"columnheader"}>
         {"상태"}
        </span>
        <span role={"columnheader"}>
         {"이름"}
        </span>
        <span role={"columnheader"}>
         {"사용"}
        </span>
        <span role={"columnheader"} style={css("text-align: right")}>
         {"작업"}
        </span>
       </div>
       {(rules || []).map((r, i) => <React.Fragment key={i}>
        <div role={"row"}>
         <span role={"cell"}>
          <span className="live-badge">
           {r.stateLabel}
          </span>
         </span>
         <span role={"cell"} style={css("min-width: 0; display: flex; flex-direction: column; gap: 2px")}>
          <span style={css("font-size: 14px; line-height: 20px")}>
           {r.name}
          </span>
          <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2)")}>
           {r.labelText}
          </span>
         </span>
         <span role={"cell"}>
          <button type="button" role="switch" aria-checked={r.on} aria-label={r.name + ' 사용'} disabled />
         </span>
         <span role={"cell"} style={css("text-align: right")}>
          <button type={"button"} style={css("height: 28px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-size: 13px; font-weight: 500")} disabled={true}>
           {"편집"}
          </button>
         </span>
        </div>
       </React.Fragment>)}
      </div>
      {notice}
     </section>
    </>}
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC3({closeMenu, environmentName, menuOpen, retention, setTheme, slots, tAnalysis, tChannels, tDs, tGeneral, tKeys, tRetention, tabs, theme, themeOpts, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C3-Settings"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|관리|설정"} hrefs={"B1-Overview.dc.html|C3-Settings.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"settings"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 1160px; display: flex; flex-direction: column; gap: 24px")}>
    <div style={css("display: flex; flex-direction: column; gap: 2px")}>
     <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
      {"설정"}
     </h1>
     <span style={css("color: var(--text-2)")}>
      {environmentName}
     </span>
    </div>
    <div role={"tablist"} aria-label={"설정"} style={css("display: flex; gap: 24px; border-bottom: 1px solid var(--border-weak); overflow-x: auto")} className={"tabs scroll-region"} tabIndex={"0"}>
     {(tabs || []).map((t, i) => <React.Fragment key={i}>
      <button type={"button"} role={"tab"} onClick={t.pick} aria-selected={t.sel} style={css(t.style)}>
       {t.label}
      </button>
     </React.Fragment>)}
    </div>
    {tGeneral && <>
     <div style={css("max-width: 760px; display: flex; flex-direction: column; gap: 16px")}>
      <section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px")} className={"panel"}>
       <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
         <h2 style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
          {"워크스페이스 이름"}
         </h2>
         <span style={css("font-size: 13px; color: var(--text-2)")}>
          {"팀원에게 보이는 이름입니다."}
         </span>
        </div>
        <input value={environmentName} type={"text"} aria-label={"워크스페이스 이름"} style={css("max-width: 360px; height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
       </div>
       <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas); border-radius: 0 0 8px 8px")}>
        <span style={css("font-size: 13px; color: var(--text-2)")}>
         {"최대 32자"}
        </span>
        <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
         {"저장"}
        </button>
       </div>
      </section>
      <section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px")} className={"panel"}>
       <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
         <h2 style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
          {"지역과 언어"}
         </h2>
         <span style={css("font-size: 13px; color: var(--text-2)")}>
          {"모든 시각은 이 시간대로 표시합니다."}
         </span>
        </div>
        <div style={css("display: flex; flex-wrap: wrap; gap: 16px")}>
         <label style={css("display: flex; flex-direction: column; gap: 4px; width: 240px")}>
          <span style={css("font-size: 13px; font-weight: 500")}>
           {"시간대"}
          </span>
          <select style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
           <option>
            {"Asia/Seoul (UTC+09:00)"}
           </option>
           <option>
            {"UTC"}
           </option>
           <option>
            {"브라우저 시간"}
           </option>
          </select>
         </label>
         <label style={css("display: flex; flex-direction: column; gap: 4px; width: 240px")}>
          <span style={css("font-size: 13px; font-weight: 500")}>
           {"언어"}
          </span>
          <select style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
           <option>
            {"한국어"}
           </option>
           <option>
            {"English"}
           </option>
          </select>
         </label>
        </div>
       </div>
       <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas); border-radius: 0 0 8px 8px")}>
        <span style={css("font-size: 13px; color: var(--text-2)")} />
        <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
         {"저장"}
        </button>
       </div>
      </section>
      <section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px")} className={"panel"}>
       <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
         <h2 style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
          {"테마"}
         </h2>
         <span style={css("font-size: 13px; color: var(--text-2)")}>
          {"이 브라우저에만 적용되고 바로 반영됩니다."}
         </span>
        </div>
        <div role={"radiogroup"} aria-label={"테마"} style={css("display: inline-flex; align-self: flex-start; gap: 2px; padding: 2px; border-radius: 8px; background: var(--bg2)")} className={"segmented-control"}>
         {(themeOpts || []).map((o, i) => <React.Fragment key={i}>
          <button type={"button"} role={"radio"} aria-checked={o.sel} onClick={o.pick} style={css(o.style)}>
           {o.label}
          </button>
         </React.Fragment>)}
        </div>
       </div>
      </section>
     </div>
     {slots.generalStatus}
    </>}
    {tDs && <>
     {slots.tDs}
    </>}
    {tAnalysis && <>
     {slots.tAnalysis}
    </>}
    {tChannels && <>
     <div style={css("display: flex; flex-direction: column; gap: 16px")}>
      <div style={css("display: flex; justify-content: flex-end")}>
       <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
        {"연락처 추가"}
       </button>
      </div>
      <section aria-label={"알림 채널"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
       {slots.channelEmpty}
      </section>
     </div>
    </>}
    {tKeys && <>
     <div style={css("display: flex; flex-direction: column; gap: 16px")}>
      <div style={css("display: flex; justify-content: flex-end")}>
       <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
        {"API 키 추가"}
       </button>
      </div>
      <section aria-label={"API 키"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto")} className={"panel scroll-region"} tabIndex={"0"}>
       <table className={"data-table"}>
        <thead>
         <tr>
          <th>
           {"이름"}
          </th>
          <th>
           {"키"}
          </th>
          <th>
           {"만든 날짜"}
          </th>
          <th>
           {"마지막 사용"}
          </th>
          <th>
           {"만료"}
          </th>
          <th style={css("width: 140px")} />
         </tr>
        </thead>
        <tbody>
         <tr>
          <td colSpan={"8"} style={css("color:var(--text-2)")}>
           {"API 키 조회 미연결"}
          </td>
         </tr>
        </tbody>
       </table>
      </section>
     </div>
    </>}
    {tRetention && <>
     <div style={css("max-width: 760px; display: flex; flex-direction: column; gap: 16px")}>
      <section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px")} className={"panel"}>
       <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 12px")}>
        <div style={css("display: flex; flex-direction: column; gap: 2px")}>
         <h2 style={css("margin: 0; font-size: 14px; font-weight: 500")} className={"section-title"}>
          {"Retention period과 사용량"}
         </h2>
         <span style={css("font-size: 13px; color: var(--text-2)")}>
          {"저장소별 보관 정책"}
         </span>
        </div>
        <div style={css("display: flex; flex-direction: column")}>
         {(retention || []).map((rt, i) => <React.Fragment key={i}>
          <div style={css(rt.row)}>
           <span style={css("width: 96px; font-weight: 500")}>
            {rt.name}
           </span>
           <select aria-label={String(rt.name ?? '') + " Retention period"} style={css("width: 112px; height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
            <option>
             {rt.days}
            </option>
            <option>
             {"30일"}
            </option>
            <option>
             {"90일"}
            </option>
           </select>
           <div style={css("flex: 1 1 200px; display: flex; flex-direction: column; gap: 8px")}>
            <div style={css("height: 6px; border-radius: 3px; background: var(--bg2); overflow: hidden")}>
             <div style={css(rt.bar)} />
            </div>
            <span style={css("font-size: 12px; color: var(--text-2); font-variant-numeric: tabular-nums")}>
             {rt.used}{" / "}{rt.cap}{", "}
             <span style={css(rt.pctStyle)}>
              {rt.pct}
             </span>
            </span>
           </div>
          </div>
         </React.Fragment>)}
        </div>
       </div>
      </section>
     </div>
    </>}
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC4({closeMenu, environmentName, menuOpen, onQ, q, setTheme, slots, tMembers, tPending, tRoles, tabs, theme, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C4-Team"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|관리|팀과 권한"} hrefs={"B1-Overview.dc.html|C3-Settings.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"team"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 1160px; display: flex; flex-direction: column; gap: 24px")}>
    <div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; justify-content: space-between")}>
     <div style={css("display: flex; flex-direction: column; gap: 2px")}>
      <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
       {"팀과 권한"}
      </h1>
      <span style={css("color: var(--text-2)")}>
       {environmentName}
      </span>
     </div>
     <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
      {"멤버 초대"}
     </button>
    </div>
    <div role={"tablist"} aria-label={"팀"} style={css("display: flex; gap: 24px; border-bottom: 1px solid var(--border-weak); overflow-x: auto")} className={"tabs scroll-region"} tabIndex={"0"}>
     {(tabs || []).map((t, i) => <React.Fragment key={i}>
      <button type={"button"} role={"tab"} onClick={t.pick} aria-selected={t.sel} style={css(t.style)}>
       {t.label}
       {t.hasCount && <>
        <span style={css("margin-left: 8px; color: var(--text-2); font-weight: 400; font-variant-numeric: tabular-nums")}>
         {t.count}
        </span>
       </>}
      </button>
     </React.Fragment>)}
    </div>
    {tMembers && <>
     <div style={css("display: flex; flex-direction: column; gap: 16px")}>
      <label style={css("position: relative; display: flex; align-items: center; max-width: 360px")}>
       <span style={css("position: absolute; left: 10px; display: inline-flex; color: var(--text-2)")}>
        <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} aria-hidden={"true"}>
         <path d={"M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4.5 4.5"} />
        </svg>
       </span>
       <input type={"search"} aria-label={"멤버 검색"} placeholder={"이름, 이메일, 로그인으로 검색"} value={q} onChange={onQ} style={css("width: 100%; height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); padding-left: 30px")} disabled={true} />
      </label>
      <section aria-label={"멤버"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto")} className={"panel scroll-region"} tabIndex={"0"}>
       <table className={"data-table"}>
        <thead>
         <tr>
          <th>
           {"멤버"}
          </th>
          <th>
           {"로그인"}
          </th>
          <th style={css("width: 160px")}>
           {"역할"}
          </th>
          <th>
           {"마지막 접속"}
          </th>
          <th style={css("width: 56px")} />
         </tr>
        </thead>
        <tbody>
         <tr>
          <td colSpan={"8"} style={css("color:var(--text-2)")}>
           {"팀 권한 저장소 미연결"}
          </td>
         </tr>
        </tbody>
       </table>
      </section>
     </div>
    </>}
    {tPending && <>
     <section aria-label={"초대 대기"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto")} className={"panel scroll-region"} tabIndex={"0"}>
      <table className={"data-table"}>
       <thead>
        <tr>
         <th>
          {"이메일"}
         </th>
         <th>
          {"이름"}
         </th>
         <th>
          {"역할"}
         </th>
         <th>
          {"초대한 사람"}
         </th>
         <th>
          {"보낸 시각"}
         </th>
         <th style={css("width: 220px")} />
        </tr>
       </thead>
       <tbody>
        <tr>
         <td colSpan={"8"} style={css("color:var(--text-2)")}>
          {"팀 권한 저장소 미연결"}
         </td>
        </tr>
       </tbody>
      </table>
     </section>
    </>}
    {tRoles && <>
     <section aria-label={"역할별 권한"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto; max-width: 880px")} className={"panel scroll-region"} tabIndex={"0"}>
      <table className={"data-table"}>
       <thead>
        <tr>
         <th>
          {"권한"}
         </th>
         <th style={css("text-align: center; width: 120px")}>
          {"관리자"}
         </th>
         <th style={css("text-align: center; width: 120px")}>
          {"운영자"}
         </th>
         <th style={css("text-align: center; width: 120px")}>
          {"읽기 전용"}
         </th>
        </tr>
       </thead>
       <tbody>
        <tr>
         <td colSpan={"8"} style={css("color:var(--text-2)")}>
          {"팀 권한 저장소 미연결"}
         </td>
        </tr>
       </tbody>
      </table>
     </section>
    </>}
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC5({closeMenu, menuOpen, onPw, onPw2, pw2Style, rules, setTheme, slots, theme, themes, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C5-Account"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|프로필"} hrefs={"B1-Overview.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"none"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 760px; display: flex; flex-direction: column; gap: 24px")}>
    <div style={css("display: flex; align-items: center; gap: 16px")}>
     <span style={css("width: 48px; height: 48px; flex: none; border-radius: 50%; background: var(--primary); color: var(--on-primary); font-size: 18px; font-weight: 500; display: inline-flex; align-items: center; justify-content: center")}>
      {"—"}
     </span>
     <div style={css("display: flex; flex-direction: column")}>
      <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
       {"프로필"}
      </h1>
      <span style={css("color: var(--text-2)")}>
       {"계정 미연결"}
      </span>
     </div>
    </div>
    <section aria-labelledby={"p-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
     <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
      <div style={css("display: flex; flex-direction: column; gap: 4px")}>
       <h2 id={"p-h"} style={css("margin: 0; font-size: 14px; line-height: 20px; font-weight: 500")} className={"section-title"}>
        {"프로필"}
       </h2>
       <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2)")}>
        {"이름과 이메일은 팀 멤버에게 표시됩니다."}
       </span>
      </div>
      <label style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"이름"}
       </span>
       <input type={"text"} style={css("height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
      </label>
      <label style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"이메일"}
       </span>
       <input type={"email"} style={css("height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
      </label>
      <label style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"사용자 이름"}
       </span>
       <input type={"text"} style={css("height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
      </label>
     </div>
     <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas)")}>
      <span style={css("font-size: 13px; color: var(--text-2)")}>
       {"영문, 숫자, 점(.)만 사용할 수 있습니다."}
      </span>
      <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
       {"저장"}
      </button>
     </div>
    </section>
    <section aria-labelledby={"pref-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
     <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
      <div style={css("display: flex; flex-direction: column; gap: 4px")}>
       <h2 id={"pref-h"} style={css("margin: 0; font-size: 14px; line-height: 20px; font-weight: 500")} className={"section-title"}>
        {"환경 설정"}
       </h2>
       <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2)")}>
        {"화면 테마는 이 브라우저에 적용됩니다."}
       </span>
      </div>
      <div style={css("display: flex; flex-direction: column; gap: 8px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"테마"}
       </span>
       <div role={"radiogroup"} aria-label={"테마"} style={css("display: inline-flex; align-self: flex-start; padding: 2px; gap: 2px; border-radius: 8px; background: var(--bg2)")} className={"segmented-control"}>
        {(themes || []).map((t, i) => <React.Fragment key={i}>
         <button type={"button"} role={"radio"} aria-checked={t.checked} onClick={t.pick} style={css(t.style)}>
          {t.label}
         </button>
        </React.Fragment>)}
       </div>
      </div>
      <div style={css("display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px")}>
       <label style={css("display: flex; flex-direction: column; gap: 8px")}>
        <span style={css("font-size: 13px; font-weight: 500")}>
         {"홈 화면"}
        </span>
        <select style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
         <option>
          {"개요"}
         </option>
         <option>
          {"Service map"}
         </option>
         <option>
          {"장애 목록"}
         </option>
        </select>
       </label>
       <label style={css("display: flex; flex-direction: column; gap: 8px")}>
        <span style={css("font-size: 13px; font-weight: 500")}>
         {"시간대"}
        </span>
        <select style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
         <option>
          {"Asia/Seoul (UTC+09:00)"}
         </option>
         <option>
          {"브라우저 시간"}
         </option>
         <option>
          {"UTC"}
         </option>
        </select>
       </label>
       <label style={css("display: flex; flex-direction: column; gap: 8px")}>
        <span style={css("font-size: 13px; font-weight: 500")}>
         {"주 시작"}
        </span>
        <select style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
         <option>
          {"월요일"}
         </option>
         <option>
          {"일요일"}
         </option>
         <option>
          {"토요일"}
         </option>
        </select>
       </label>
      </div>
     </div>
     <div style={css("display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas)")}>
      <button type={"button"} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500")} disabled={true}>
       {"저장"}
      </button>
     </div>
    </section>
    <section aria-labelledby={"pw-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
     <div style={css("padding: 20px 24px; display: flex; flex-direction: column; gap: 16px")}>
      <div style={css("display: flex; flex-direction: column; gap: 4px")}>
       <h2 id={"pw-h"} style={css("margin: 0; font-size: 14px; line-height: 20px; font-weight: 500")} className={"section-title"}>
        {"비밀번호"}
       </h2>
       <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2)")}>
        {"바꾸면 다른 기기에서는 다시 로그인해야 합니다."}
       </span>
      </div>
      <label style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"현재 비밀번호"}
       </span>
       <input type={"password"} autoComplete={"current-password"} style={css("height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
      </label>
      <div style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <label style={css("display: flex; flex-direction: column; gap: 8px")}>
        <span style={css("font-size: 13px; font-weight: 500")}>
         {"새 비밀번호"}
        </span>
        <input type={"password"} autoComplete={"new-password"} onChange={onPw} style={css("height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
       </label>
       <ul style={css("list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; line-height: 18px")}>
        {(rules || []).map((r, i) => <React.Fragment key={i}>
         <li style={css(r.style)}>
          {r.label}
         </li>
        </React.Fragment>)}
       </ul>
      </div>
      <label style={css("display: flex; flex-direction: column; gap: 8px; max-width: 400px")}>
       <span style={css("font-size: 13px; font-weight: 500")}>
        {"새 비밀번호 확인"}
       </span>
       <input type={"password"} autoComplete={"new-password"} onChange={onPw2} style={css(pw2Style)} disabled={true} />
      </label>
     </div>
     <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas)")}>
      <span style={css("font-size: 13px; color: var(--text-2)")}>
       {"12자 이상, 대소문자, 숫자, 기호를 모두 포함해야 합니다."}
      </span>
      <button type={"button"} disabled={true} style={css("height: 32px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--primary); color: var(--on-primary); font-weight: 500; white-space: nowrap")}>
       {"비밀번호 변경"}
      </button>
     </div>
    </section>
    <section aria-labelledby={"s-h"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
     <div style={css("padding: 20px 24px 12px; display: flex; flex-direction: column; gap: 4px")}>
      <h2 id={"s-h"} style={css("margin: 0; font-size: 14px; line-height: 20px; font-weight: 500")} className={"section-title"}>
       {"로그인한 기기"}
      </h2>
      <span style={css("font-size: 13px; line-height: 20px; color: var(--text-2)")}>
       {"최근 30일 동안 로그인한 세션입니다."}
      </span>
     </div>
     <div style={css("overflow-x: auto; border-top: 1px solid var(--border-weak)")} className={"scroll-region"} tabIndex={"0"}>
      <table className={"data-table"}>
       <thead>
        <tr>
         <th>
          {"브라우저와 OS"}
         </th>
         <th>
          {"위치"}
         </th>
         <th>
          {"IP"}
         </th>
         <th>
          {"로그인"}
         </th>
         <th>
          {"마지막 접속"}
         </th>
         <th style={css("width: 96px")}>
          <span style={css("position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)")}>
           {"동작"}
          </span>
         </th>
        </tr>
       </thead>
       <tbody>
        <tr>
         <td colSpan={"8"} style={css("color:var(--text-2)")}>
          {"로그인 세션 조회 미연결"}
         </td>
        </tr>
       </tbody>
      </table>
     </div>
     <div style={css("display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 24px; border-top: 1px solid var(--border-weak); background: var(--canvas)")}>
      <button type={"button"} disabled={true} style={css("height: 32px; padding: 0 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-weight: 500")}>
       {"다른 세션 모두 로그아웃"}
      </button>
     </div>
    </section>
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC6({atFirst, atLast, closeMenu, menuOpen, next, pages, prev, setTheme, slots, theme, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C6-Audit"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|관리|Audit log"} hrefs={"B1-Overview.dc.html|C3-Settings.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"audit"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <div style={css("max-width: 1160px; display: flex; flex-direction: column; gap: 24px")}>
    <div style={css("display: flex; flex-direction: column")}>
     <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
      {"Audit log"}
     </h1>
     <span style={css("color: var(--text-2)")}>
      {"설정, 장애 상태, API 키, 멤버 변경 기록"}
     </span>
    </div>
    <div style={css("display: flex; flex-direction: column; gap: 12px")}>
     <div style={css("display: flex; flex-wrap: wrap; gap: 8px; align-items: center")}>
      <label style={css("position: relative; flex: 1 1 240px; max-width: 320px; display: flex; align-items: center")}>
       <span style={css("position: absolute; left: 10px; display: inline-flex; color: var(--text-2)")}>
        <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} aria-hidden={"true"}>
         <path d={"M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4.5 4.5"} />
        </svg>
       </span>
       <input type={"search"} aria-label={"대상 검색"} placeholder={"대상 검색"} style={css("width: 100%; height: 32px; padding: 0 12px 0 32px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true} />
      </label>
      <select aria-label={"사용자"} style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
       <option>
        {"모든 사용자"}
       </option>
      </select>
      <select aria-label={"동작 유형"} style={css("height: 32px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1)")} disabled={true}>
       <option>
        {"모든 동작"}
       </option>
       <option>
        {"설정 변경"}
       </option>
       <option>
        {"장애 상태 변경"}
       </option>
       <option>
        {"API 키"}
       </option>
       <option>
        {"멤버"}
       </option>
       <option>
        {"데이터 소스"}
       </option>
      </select>
      <div style={css("margin-left: auto")}>
       <TimePicker range={"지난 7일"} />
      </div>
     </div>
     <section aria-label={"감사 기록"} style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow: hidden")} className={"panel"}>
      <div style={css("overflow-x: auto")} className={"scroll-region"} tabIndex={"0"}>
       <table className={"data-table"}>
        <thead>
         <tr>
          <th>
           {"시각"}
          </th>
          <th>
           {"사용자"}
          </th>
          <th>
           {"동작"}
          </th>
          <th>
           {"대상"}
          </th>
          <th>
           {"변경"}
          </th>
          <th>
           {"IP"}
          </th>
         </tr>
        </thead>
        <tbody>
         <tr>
          <td colSpan={6} style={css("color:var(--text-2)")}>
           {"감사 기록 저장소가 연결되지 않았습니다."}
          </td>
         </tr>
        </tbody>
       </table>
      </div>
      <nav aria-label={"페이지"} style={css("display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border-weak)")}>
       <div style={css("display: flex; align-items: center; gap: 4px")}>
        <button type={"button"} onClick={prev} disabled={atFirst} style={css("height: 28px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-size: 13px; font-weight: 500")}>
         {"이전"}
        </button>
        {(pages || []).map((p, i) => <React.Fragment key={i}>
         <button type={"button"} aria-current={p.current} onClick={p.pick} style={css(p.style)}>
          {p.n}
         </button>
        </React.Fragment>)}
        <button type={"button"} onClick={next} disabled={atLast} style={css("height: 28px; padding: 0 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); font-size: 13px; font-weight: 500")}>
         {"다음"}
        </button>
       </div>
      </nav>
     </section>
    </div>
   </div>
  </main>
 </div>
</div>
 );
}

function LayoutC7({closeMenu, menuOpen, setTheme, slots, theme, toggleMenu}) {
 return (
<div className={"g screen-root"} data-theme={theme} style={css("min-height: 100vh; display: flex; flex-direction: column")} data-screen={"C7-States"}>
 <div style={css("position: relative; z-index: 50")} className={"shell-header"}>
  <TopBar crumbs={"홈|관리|상태 화면"} hrefs={"B1-Overview.dc.html|C3-Settings.dc.html|"} theme={theme} onTheme={setTheme} onMenu={toggleMenu} menuOpen={menuOpen} />
 </div>
 <div style={css("flex: 1; display: flex; flex-wrap: wrap; align-items: stretch")} className={"shell-body"}>
  <div style={css("flex: 0 0 auto; position: relative; z-index: 40; background: var(--page)")} className={"shell-sidebar"}>
   <SideNav active={"states"} open={menuOpen} onClose={closeMenu} />
  </div>
  <main style={css("flex: 999 1 560px; min-width: 0; padding: 24px 32px 48px")} className={"page-content"} id={"main-content"} tabIndex={"-1"}>
   <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
    {"상태 화면"}
   </h1>
   {slots.status}
  </main>
 </div>
</div>
 );
}

export const layouts = {"A1-Login":LayoutA1, "A2-Signup":LayoutA2, "A3-Reset":LayoutA3, "A4-Onboarding":LayoutA4, "B8-Model":LayoutB8, "C1-Notifications":LayoutC1, "C2-AlertRules":LayoutC2, "C3-Settings":LayoutC3, "C4-Team":LayoutC4, "C5-Account":LayoutC5, "C6-Audit":LayoutC6, "C7-States":LayoutC7};
