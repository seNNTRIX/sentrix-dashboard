import React from 'react';
import {css,routeHref} from '../styles.js';
import {TimePicker} from '../components/TimePicker.jsx';
export function IncidentListLayout({empty, fault, faults, hDur, hScore, hStart, iDur, iScore, iStart, onFault, onQ, onSvc, q, rows, services, sortDur, sortScore, sortStart, statusOpts, summary, svc}){return <>
<div style={css("display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between")}>
 <h1 style={css("margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: -0.01em")} className={"page-title"}>
  {"장애"}
 </h1>
 <a href={routeHref("C2-AlertRules.dc.html")} style={css("height: 32px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); color: var(--text); font-weight: 500; text-decoration: none")}>
  {"Alert rules\n        "}
 </a>
</div>
<div className="incident-filters" style={css("display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: flex-end")}>
 <label style={css("display: flex; flex-direction: column; gap: 4px; flex: 1 1 240px; max-width: 360px")}>
  <span style={css("font-size: 13px; font-weight: 500")}>
   {"검색"}
  </span>
  <span style={css("position: relative; display: flex; align-items: center")}>
   <span style={css("position: absolute; left: 8px; display: inline-flex; color: var(--text-2)")}>
    <svg width={"14"} height={"14"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} aria-hidden={"true"}>
     <path d={"M17.5 11a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0M16 16l4.5 4.5"} />
    </svg>
   </span>
   <input type={"search"} placeholder={"장애 검색"} value={q} onChange={onQ} style={css("width: 100%; height: 32px; padding: 0 8px 0 28px; border: 1px solid var(--border); border-radius: 6px; background: var(--page)")} aria-label={"장애 검색"} />
  </span>
 </label>
 <div style={css("display: flex; flex-direction: column; gap: 4px")}>
  <span style={css("font-size: 13px; font-weight: 500")}>
   {"상태"}
  </span>
  <div role={"radiogroup"} aria-label={"상태"} style={css("display: inline-flex; padding: 2px; gap: 2px; border-radius: 8px; background: var(--bg2)")} className={"segmented-control"}>
   {(statusOpts || []).map((o, i) => <React.Fragment key={i}>
    <button type={"button"} role={"radio"} aria-checked={o.checked} onClick={o.pick} style={css(o.style)}>
     {o.label}
    </button>
   </React.Fragment>)}
  </div>
 </div>
 <label style={css("display: flex; flex-direction: column; gap: 4px")}>
  <span style={css("font-size: 13px; font-weight: 500")}>
   {"장애 유형"}
  </span>
  <select value={fault} onChange={onFault} style={css("height: 32px; min-width: 150px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--page)")}>
   <option value={""}>
    {"전체"}
   </option>
   {(faults || []).map((choice, i) => <React.Fragment key={i}>
    <option value={choice}>
     {choice}
    </option>
   </React.Fragment>)}
  </select>
 </label>
 <label style={css("display: flex; flex-direction: column; gap: 4px")}>
  <span style={css("font-size: 13px; font-weight: 500")}>
   {"서비스"}
  </span>
  <select value={svc} onChange={onSvc} style={css("height: 32px; min-width: 180px; padding: 0 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--page)")}>
   <option value={""}>
    {"전체"}
   </option>
   {(services || []).map((choice, i) => <React.Fragment key={i}>
    <option value={choice}>
     {choice}
    </option>
   </React.Fragment>)}
  </select>
 </label>
 <div style={css("margin-left: auto")}>
  <TimePicker range={"지난 7일"} />
 </div>
</div>
<div style={css("color: var(--text-2)")}>
 {summary}
</div>
<section style={css("background: var(--bg1); border: 1px solid var(--border-weak); border-radius: 8px; overflow-x: auto")} className={"panel scroll-region"} tabIndex={"0"}>
 <div style={css("min-width: 860px")}>
  <div role={"row"} style={css("display: grid; grid-template-columns: 40px 110px minmax(0, 1fr) 80px 120px 104px; align-items: center; height: 36px; padding: 0 16px 0 8px; border-bottom: 1px solid var(--border-weak); font-size: 13px; font-weight: 500; color: var(--text-2)")}>
   <span />
   <span>
    {"Status"}
   </span>
   <span>
    {"Incident"}
   </span>
   <button type={"button"} onClick={sortScore} aria-label={"점수로 정렬"} style={css(hScore)}>
    <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
     <path d={iScore} />
    </svg>
    {"Score"}
   </button>
   <button type={"button"} onClick={sortStart} aria-label={"시작 시각으로 정렬"} style={css(hStart)}>
    <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
     <path d={iStart} />
    </svg>
    {"Started"}
   </button>
   <button type={"button"} onClick={sortDur} aria-label={"지속 시간으로 정렬"} style={css(hDur)}>
    <svg width={"12"} height={"12"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2.2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"}>
     <path d={iDur} />
    </svg>
    {"Duration"}
   </button>
  </div>
  {(rows || []).map((r, i) => <React.Fragment key={i}>
   <div style={css("border-bottom: 1px solid var(--border-weak)")}>
    <div style={css("display: grid; grid-template-columns: 40px 110px minmax(0, 1fr) 80px 120px 104px; align-items: center; min-height: 64px; padding: 12px 16px 12px 8px")}>
     <button type={"button"} onClick={r.toggle} aria-expanded={r.expanded} aria-label={r.toggleLabel} style={css("width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 4px; background: none; color: var(--text-2)")}>
      <svg width={"16"} height={"16"} viewBox={"0 0 24 24"} fill={"none"} stroke={"currentColor"} strokeWidth={"2"} strokeLinecap={"round"} strokeLinejoin={"round"} aria-hidden={"true"} style={css(r.chev)}>
       <path d={"M9 6l6 6-6 6"} />
      </svg>
     </button>
     <span>
      <span style={css(r.stateStyle)}>
       {r.stateLabel}
      </span>
     </span>
     <div style={css("min-width: 0; display: flex; flex-direction: column; gap: 2px")}>
      <a href={routeHref(r.href)} style={css("overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); font-weight: 500")}>
       {r.title}
      </a>
      <div style={css("display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; line-height: 20px; color: var(--text-2)")}>
       <span>
        {r.id}
       </span>
       <span>
        {r.faultLabel}
       </span>
       <span>
        {r.service}
       </span>
      </div>
     </div>
     <span style={css("text-align: right; font-size: 14px; line-height: 22px; color: var(--text); font-variant-numeric: tabular-nums")}>
      {r.score}
     </span>
     <span style={css("text-align: right; font-size: 14px; line-height: 22px; color: var(--text-2); font-variant-numeric: tabular-nums")}>
      {r.start}
     </span>
     <span style={css("text-align: right; font-size: 14px; line-height: 22px; color: var(--text-2); font-variant-numeric: tabular-nums")}>
      {r.dur}
     </span>
    </div>
    {r.open && <>
     <div style={css("margin: 0 8px 12px 158px; padding: 12px 16px; border-radius: 8px; background: var(--bg2); display: flex; flex-wrap: wrap; align-items: center; gap: 12px 32px")}>
      <div style={css("display: flex; flex-direction: column; min-width: 0")}>
       <span style={css("font-size: 12px; line-height: 18px; color: var(--text-2)")}>
        {"1순위 원인 후보"}
       </span>
       <span style={css("font-size: 13px; line-height: 20px; font-weight: 500")}>
        {r.target}
       </span>
      </div>
      <div style={css("display: flex; flex-direction: column")}>
       <span style={css("font-size: 12px; line-height: 18px; color: var(--text-2)")}>
        {"장애 유형"}
       </span>
       <span style={css("font-size: 13px; line-height: 20px")}>
        {r.faultLabel}
       </span>
      </div>
      <div style={css("display: flex; flex-direction: column")}>
       <span style={css("font-size: 12px; line-height: 18px; color: var(--text-2)")}>
        {"관측 서비스"}
       </span>
       <span style={css("font-size: 13px; line-height: 20px")}>
        {r.service}
       </span>
      </div>
      <div style={css("display: flex; flex-direction: column")}>
       <span style={css("font-size: 12px; line-height: 18px; color: var(--text-2)")}>
        {"감지"}
       </span>
       <span style={css("font-size: 13px; line-height: 20px; font-variant-numeric: tabular-nums")}>
        {r.detect}
       </span>
      </div>
      <a href={routeHref(r.href)} style={css("margin-left: auto; height: 32px; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg1); color: var(--text); font-weight: 500; text-decoration: none")}>
       {"원인 분석 열기"}
      </a>
     </div>
    </>}
   </div>
  </React.Fragment>)}
  {empty && <>
   <div style={css("padding: 32px 16px; text-align: center; color: var(--text-2)")}>
    {"조건에 맞는 장애가 없습니다."}
   </div>
  </>}
 </div>
</section>
</>;}
