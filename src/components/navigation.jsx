import {publicView,publicRoutes} from '../live/public-view.js';
import React, { useEffect, useRef, useState } from 'react';
import { useDesign } from '../live/DesignContext.jsx';
import { Button, Dialog, Icon } from './controls.jsx';

export const destinations = [
 ['B1-Overview','개요','서비스 상태, Anomaly score'], ['B2-ServiceMap','Service map','서비스와 연결'],
 ['B3-Incidents','장애','장애 목록, 상태와 원인'], ['B5-Service','서비스 상세','서비스 지표'],
 ['B6-Trace','Trace','요청 및 서비스 호출'], ['B7-Logs','로그','Loki'], ['B9-LogSpace','로그 의미 공간','임베딩, 새 문장, 실험 비교'], ['C3-Settings','설정','관측 환경, 데이터 소스'], ['B8-Model','모델 평가','순위'], ['C1-Notifications','알림 기록','감지, 회복'], ['C2-AlertRules','Alert rules','규칙'], ['C4-Team','팀과 권한','팀'], ['C5-Account','프로필','계정'], ['C6-Audit','Audit log','감사'], ['C7-States','시스템 상태','모니터링']
];
const groups = [
 ['overview','홈','B1-Overview','home'], ['map','Service map','B2-ServiceMap','map'],
 ['incidents','장애','B3-Incidents','bell', [['incidents','장애 목록','B3-Incidents'],['rules','Alert rules','C2-AlertRules'],['alerts','알림 기록','C1-Notifications']]],
 ['explore','Explore','B6-Trace','explore', [['trace','Trace','B6-Trace'],['logs','로그','B7-Logs'],['logspace','로그 의미 공간','B9-LogSpace']]],
 ['model','모델 평가','B8-Model','model'], ['admin','관리','C3-Settings','settings', [['settings','설정','C3-Settings'],['team','팀과 권한','C4-Team'],['audit','Audit log','C6-Audit'],['states','시스템 상태','C7-States']]]
];
function NavLinks({active, onNavigate, live, environment}) {
 const [expanded, setExpanded] = useState({});
 const navigationGroups = publicView ? groups.filter(g=>publicRoutes.has(g[2])).map(([k,l,r,i,c])=>[k,l,r,i,c?.filter(item=>publicRoutes.has(item[2]))]) : groups;
 return <nav aria-label="주 메뉴" className="side-nav"><div className="nav-caption">워크스페이스</div>{navigationGroups.map(([key,label,route,icon,children]) => {
  const selected = key === active || children?.some(([k]) => k === active);
  const isOpen = expanded[key] ?? selected;
  return <div className="nav-group" key={key}><div className="nav-item">
   <a href={`#${route}`} className={`nav-link ${selected ? 'is-current' : ''}`} aria-current={key === active ? 'page' : undefined} onClick={onNavigate}><Icon name={icon}/><span>{label}</span></a>
   {children && <button className="nav-expand" aria-label={`${label} ${isOpen ? '접기' : '펼치기'}`} aria-expanded={!!isOpen} onClick={() => setExpanded({...expanded,[key]:!isOpen})}><Icon name="chevron" className={isOpen ? 'rotate' : ''}/></button>}
  </div>{children && isOpen && <div className="nav-children">{children.map(([k,l,r]) => <a key={k} href={`#${r}`} className={`nav-link ${k === active ? 'is-current' : ''}`} aria-current={k === active ? 'page' : undefined} onClick={onNavigate}>{l}</a>)}</div>}</div>;
 })}<div className="nav-footer"><span>{live?(environment?.name || '환경 미선택'):'환경 미선택'}</span><span>{live?(environment?`namespace ${environment.namespace}`:'환경을 등록하세요'):'namespace sentrix'}</span>{live&&!publicView&&<a href="#A4-Onboarding" onClick={onNavigate}>환경 등록</a>}</div></nav>;
}
export function SideNav({active, open, onClose, live = false, environment}) {
 const design=useDesign();live=!!design||live;environment=design?.environment||environment;
 const [compact, setCompact] = useState(() => matchMedia('(max-width: 1023px)').matches);
 useEffect(() => { const m = matchMedia('(max-width: 1023px)'); const update = () => {setCompact(m.matches); onClose?.();}; m.addEventListener('change',update); return () => m.removeEventListener('change',update); },[onClose]);
 if (!open) return null;
 return compact ? <Dialog title="메뉴" drawer onClose={onClose}><NavLinks active={active} onNavigate={onClose} live={live} environment={environment}/></Dialog> : <NavLinks active={active} live={live} environment={environment}/>;
}
export function TopBar({crumbs = '홈', hrefs = '', theme = 'light', onTheme, onMenu, menuOpen}) {
 const design=useDesign();
 const [panel, setPanel] = useState(null), [query,setQuery] = useState(''), [read,setRead] = useState(false);
 const user = useRef(null), bell = useRef(null), env = useRef(null);
 useEffect(() => { const shortcut = e => { if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){e.preventDefault();setPanel('search');} };window.addEventListener('keydown',shortcut);return () => window.removeEventListener('keydown',shortcut); },[]);
 const labels = (design?.route==='B5-Service'?`홈|서비스|${design.service}`:design?.route==='B4-Incident'&&design.incidentId?'홈|장애|'+design.incidentId.slice(0,8):crumbs).split('|'), links = hrefs.split('|');
 const results = destinations.filter(row => (!publicView||publicRoutes.has(row[0])) && row.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const close = () => setPanel(null);
 return <header className="top-bar">
  <Button variant="ghost" className="icon-button" icon="menu" aria-label="메뉴 열기 또는 닫기" aria-expanded={!!menuOpen} onClick={onMenu}/>
  <a href="#B1-Overview" className="brand-mark" aria-label="SentriX 홈">X</a>
  <nav className="breadcrumbs" aria-label="현재 위치">{labels.map((label,i) => <React.Fragment key={i}>{i > 0 && <span className="crumb-divider">/</span>}{links[i] && i < labels.length-1 ? <a href={'#'+links[i].replace('.dc.html','')}>{label}</a> : <span aria-current={i === labels.length-1 ? 'page' : undefined}>{label}</span>}</React.Fragment>)}</nav>
  <div className="top-actions">
   <button className="search-trigger" onClick={()=>setPanel('search')} aria-label="화면 검색" aria-haspopup="dialog"><Icon name="search"/><span>화면 검색</span><kbd>⌘ K</kbd></button>
   <button ref={env} className="environment-trigger" onClick={()=>setPanel('env')} aria-expanded={panel==='env'} aria-haspopup="dialog"><span>{design?(design.environment?.name||'환경 선택'):'환경 미선택'}</span><Icon name="chevron" size={14}/></button>
   <a className="icon-button notification-trigger" aria-label="알림 기록" href="#C1-Notifications"><Icon name="bell"/></a>
   <button ref={user} className="avatar-button" aria-label="프로필 메뉴" aria-haspopup="dialog" aria-expanded={panel==='user'} onClick={()=>setPanel('user')}>—</button>
  </div>
  {panel==='search' && <Dialog title="화면 검색" onClose={close} className="search-dialog"><form onSubmit={e=>{e.preventDefault();if(results.length){location.hash=results[0][0];close();}}}><label className="search-field"><Icon name="search"/><input autoFocus type="search" aria-label="화면 또는 서비스 검색" placeholder="화면, 서비스, 장애 ID 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label></form><div className="search-results">{results.length ? results.map(([route,label,description])=><a href={`#${route}`} key={route} onClick={close}><strong>{label}</strong><span>{description}</span></a>) : <div className="empty-message"><strong>검색 결과가 없습니다</strong><span>다른 화면 이름이나 서비스 이름을 입력하세요.</span></div>}</div></Dialog>}
  {panel==='env' && <Dialog title="관측 환경" anchor={env} onClose={close}>{design?.items.map(item=><button key={item.id} className="workspace-option" onClick={()=>{design.select(String(item.id));close();}}><strong>{item.name}</strong><span>namespace {item.namespace}</span></button>)}{!publicView&&<a href="#A4-Onboarding" onClick={close}>환경 등록</a>}</Dialog>}
  {panel==='user' && <Dialog title="화면 설정" anchor={user} onClose={close}><a href="#C5-Account" onClick={close}>프로필</a> <button role="menuitem" className="ui-button" onClick={()=>onTheme?.(theme==='dark'?'light':'dark')}>테마 {theme==='dark'?'다크':'라이트'}</button></Dialog>}
 </header>;
}
