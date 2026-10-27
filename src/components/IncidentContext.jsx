import React, {useState} from 'react';
import {TopBar, SideNav} from './navigation.jsx';
import {findIncident, faultLabels, statusLabels, incidentHref, logHref, incidentRange, formatTime, matchesIncidentLog} from '../incidents.js';
import {logRows} from '../logs.js';

export function IncidentContext({id, logs = false, theme: initialTheme}) {
 const incident = findIncident(id);
 const [theme,setTheme] = useState(initialTheme);
 const [menu,setMenu] = useState(()=>!matchMedia('(max-width:1023px)').matches);
 const [level,setLevel] = useState('all');
 const range = incident && incidentRange(incident);
 const rows = incident ? logRows.filter(row=>matchesIncidentLog(incident,row) && (level==='all'||row[1]===level)) : [];
 return <div className="g screen-root" data-theme={theme}>
  <div className="shell-header"><TopBar crumbs={`홈|장애|${id}${logs?'|관련 로그':''}`} hrefs={`B1-Overview|B3-Incidents|B4-Incident?id=${encodeURIComponent(id)}`} theme={theme} onTheme={setTheme} onMenu={()=>setMenu(!menu)} menuOpen={menu}/></div>
  <div className="shell-body" style={{display:'flex',minHeight:'calc(100vh - 80px)'}}>
   <div className="shell-sidebar"><SideNav active={logs?'logs':'incidents'} open={menu} onClose={()=>setMenu(false)}/></div>
   <main id="main-content" tabIndex={-1} className="page-content incident-context">
    {!incident ? <><h1 className="page-title">장애를 찾을 수 없습니다</h1><p>존재하지 않는 장애 ID입니다: {id}</p><a href="#B3-Incidents">장애 목록으로 돌아가기</a></> : <>
     <a href={logs?incidentHref(id):'#B3-Incidents'}>{logs?'← 장애 상세로 돌아가기':'← 장애 목록으로 돌아가기'}</a>
     <header><p className="secondary-text">{id} · {statusLabels[incident.status]}</p><h1 className="page-title">{logs?`${id} 관련 로그`:`${incident.target} · ${faultLabels[incident.fault]}`}</h1></header>
     <section className="panel context-summary" aria-label="장애 조사 범위">
      <div><strong>대상 서비스</strong><p>{incident.services.join(', ')}</p></div>
      <div><strong>장애 구간 · Asia/Seoul (UTC+09:00)</strong><p>{formatTime(range.start)} ~ {formatTime(range.end)}{incident.status==='open'?' (데모 관측 시점)':''}</p></div>
      <div><strong>영향 서비스</strong><p>{incident.impact}개</p></div>
     </section>
     {logs ? <>
      <section className="panel context-summary"><h2 className="section-title">적용된 조회 조건</h2><code>{`{namespace="sentrix", app=~"${incident.services.join('|')}"}`}</code><p className="secondary-text">위 서비스와 장애 구간에 해당하는 예시 로그만 표시합니다. 실시간 조회는 연결 전입니다.</p></section>
      <div className="context-filter"><label>로그 수준 <select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">전체</option><option value="error">error</option><option value="warn">warning</option><option value="info">info</option></select></label><span role="status">로그 {rows.length}건</span></div>
      <section className="panel context-summary" aria-label="관련 로그 결과">{rows.length ? rows.map(row=><details key={row[0]+row[2]} className="context-log"><summary><time>{row[0]}</time> · <strong>{row[1]}</strong> · {row[3]}</summary><p>{row[4]}</p><p className="secondary-text">Pod: {row[2]}{row[5] && ` · Trace ID: ${row[5]}`}</p></details>) : <p>선택한 서비스·시간·로그 수준에 해당하는 예시 로그가 없습니다. 실제 로그의 존재 여부는 데이터 소스 연결 후 확인할 수 있습니다.</p>}</section>
     </> : <>
      <section className="panel context-summary"><h2 className="section-title">1순위 원인 후보</h2><p>{incident.target} · {faultLabels[incident.fault]}</p><p>점수 {incident.score.toFixed(2)} · 지속 시간 {Math.floor(incident.duration/60)}분 {incident.duration%60}초 · 감지 {incident.detected}</p><p className="secondary-text">이 장애의 상세 차트·분석 근거는 데모에 포함되지 않았습니다.</p><a className="ui-button" href={logHref(id)}>관련 로그</a></section>
     </>}
    </>}
   </main>
  </div>
 </div>;
}
