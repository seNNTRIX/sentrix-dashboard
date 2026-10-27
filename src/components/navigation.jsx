import React, { useEffect, useRef, useState } from 'react';
import { Button, Dialog, Icon } from './controls.jsx';

export const destinations = [
 ['B1-Overview','개요','서비스 상태, Anomaly score'], ['B2-ServiceMap','Service map','서비스와 연결, frontend'],
 ['B3-Incidents','장애','장애 목록, 상태와 원인'], ['B4-Incident','INC-0142','frontend → productcatalogservice 지연'],
 ['B5-Service','서비스 상세','frontend 지표'], ['B6-Trace','Trace','TraceQL, Span'], ['B7-Logs','로그','Loki, error, warning'],
 ['B8-Model','모델 평가','모델 정확도'], ['C1-Notifications','알림 기록','발생과 복구 기록'], ['C2-AlertRules','Alert rules','알림 조건'],
 ['C3-Settings','설정','데이터 소스, API 키, Retention'], ['C4-Team','팀과 권한','멤버와 초대'], ['C5-Account','프로필','계정과 환경 설정'], ['C6-Audit','Audit log','변경 기록'], ['C7-States','상태 화면','연결, 오류와 권한']
];
const groups = [
 ['overview','홈','B1-Overview','home'], ['map','Service map','B2-ServiceMap','map'],
 ['incidents','장애','B3-Incidents','bell', [['incidents','장애 목록','B3-Incidents'],['rules','Alert rules','C2-AlertRules'],['alerts','알림 기록','C1-Notifications']]],
 ['explore','Explore','B6-Trace','explore', [['trace','Trace','B6-Trace'],['logs','로그','B7-Logs']]],
 ['model','모델 평가','B8-Model','model'], ['admin','관리','C3-Settings','settings', [['settings','설정','C3-Settings'],['team','팀과 권한','C4-Team'],['audit','Audit log','C6-Audit'],['states','상태 화면','C7-States']]]
];
function NavLinks({active, onNavigate}) {
 const [expanded, setExpanded] = useState({});
 return <nav aria-label="주 메뉴" className="side-nav"><div className="nav-caption">워크스페이스</div>{groups.map(([key,label,route,icon,children]) => {
  const selected = key === active || children?.some(([k]) => k === active);
  const isOpen = expanded[key] ?? selected;
  return <div className="nav-group" key={key}><div className="nav-item">
   <a href={`#${route}`} className={`nav-link ${selected ? 'is-current' : ''}`} aria-current={key === active ? 'page' : undefined} onClick={onNavigate}><Icon name={icon}/><span>{label}</span></a>
   {children && <button className="nav-expand" aria-label={`${label} ${isOpen ? '접기' : '펼치기'}`} aria-expanded={!!isOpen} onClick={() => setExpanded({...expanded,[key]:!isOpen})}><Icon name="chevron" className={isOpen ? 'rotate' : ''}/></button>}
  </div>{children && isOpen && <div className="nav-children">{children.map(([k,l,r]) => <a key={k} href={`#${r}`} className={`nav-link ${k === active ? 'is-current' : ''}`} aria-current={k === active ? 'page' : undefined} onClick={onNavigate}>{l}</a>)}</div>}</div>;
 })}<div className="nav-footer"><span>online-boutique</span><span>namespace sentrix</span></div></nav>;
}
export function SideNav({active, open, onClose}) {
 const [compact, setCompact] = useState(() => matchMedia('(max-width: 1023px)').matches);
 useEffect(() => { const m = matchMedia('(max-width: 1023px)'); const update = () => {setCompact(m.matches); onClose?.();}; m.addEventListener('change',update); return () => m.removeEventListener('change',update); },[onClose]);
 if (!open) return null;
 return compact ? <Dialog title="메뉴" drawer onClose={onClose}><NavLinks active={active} onNavigate={onClose}/></Dialog> : <NavLinks active={active}/>;
}
export function TopBar({crumbs = '홈', hrefs = '', theme = 'light', onTheme, onMenu, menuOpen}) {
 const [panel, setPanel] = useState(null), [query,setQuery] = useState(''), [read,setRead] = useState(false);
 const user = useRef(null), bell = useRef(null), env = useRef(null);
 useEffect(() => { const shortcut = e => { if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){e.preventDefault();setPanel('search');} };window.addEventListener('keydown',shortcut);return () => window.removeEventListener('keydown',shortcut); },[]);
 const labels = crumbs.split('|'), links = hrefs.split('|');
 const results = destinations.filter(row => row.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const close = () => setPanel(null);
 return <header className="top-bar">
  <Button variant="ghost" className="icon-button" icon="menu" aria-label="메뉴 열기 또는 닫기" aria-expanded={!!menuOpen} onClick={onMenu}/>
  <a href="#B1-Overview" className="brand-mark" aria-label="SentriX 홈">X</a>
  <nav className="breadcrumbs" aria-label="현재 위치">{labels.map((label,i) => <React.Fragment key={i}>{i > 0 && <span className="crumb-divider">/</span>}{links[i] && i < labels.length-1 ? <a href={'#'+links[i].replace('.dc.html','')}>{label}</a> : <span aria-current={i === labels.length-1 ? 'page' : undefined}>{label}</span>}</React.Fragment>)}</nav>
  <div className="top-actions">
   <button className="search-trigger" onClick={()=>setPanel('search')} aria-label="화면 검색" aria-haspopup="dialog"><Icon name="search"/><span>화면 검색</span><kbd>⌘ K</kbd></button>
   <button ref={env} className="environment-trigger" onClick={()=>setPanel('env')} aria-expanded={panel==='env'} aria-haspopup="dialog"><span>online-boutique</span><Icon name="chevron" size={14}/></button>
   <Button variant="ghost" className="icon-button notification-trigger" aria-label={`알림, 읽지 않음 ${read ? 0 : 2}개`} aria-haspopup="dialog" icon="bell" onClick={e=>{bell.current=e.currentTarget;setPanel('bell');}}>{!read && <span className="notification-dot"/>}</Button>
   <button ref={user} className="avatar-button" aria-label="프로필 메뉴" aria-haspopup="dialog" aria-expanded={panel==='user'} onClick={()=>setPanel('user')}>이</button>
  </div>
  {panel==='search' && <Dialog title="화면 검색" onClose={close} className="search-dialog"><form onSubmit={e=>{e.preventDefault();if(results.length){location.hash=results[0][0];close();}}}><label className="search-field"><Icon name="search"/><input autoFocus type="search" aria-label="화면 또는 서비스 검색" placeholder="화면, 서비스, 장애 ID 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label></form><div className="search-results">{results.length ? results.map(([route,label,description])=><a href={`#${route}`} key={route} onClick={close}><strong>{label}</strong><span>{description}</span></a>) : <div className="empty-message"><strong>검색 결과가 없습니다</strong><span>다른 화면 이름이나 서비스 이름을 입력하세요.</span></div>}</div></Dialog>}
  {panel==='env' && <Dialog title="워크스페이스" anchor={env} onClose={close}><div className="workspace-option"><strong>online-boutique</strong><span>namespace sentrix · 현재 선택됨</span></div><p className="secondary-text">데모에서는 이 워크스페이스를 사용합니다.</p></Dialog>}
  {panel==='bell' && <Dialog title="알림" anchor={bell} onClose={close} className="notifications-dialog"><Button variant="ghost" disabled={read} onClick={()=>setRead(true)}>모두 읽음</Button><div className="notification-list">{[['INC-0142 발생','frontend → productcatalogservice Network delay','10분 전','B4-Incident'],['Loki 수집 중단 후 복구','14:05:12부터 42초 동안','26분 전','C3-Settings'],['INC-0141 해결됨','checkoutservice Pod failure','1시간 전','B3-Incidents']].map(([title,body,time,route],i)=><a href={`#${route}`} key={title} onClick={close}><strong className={!read && i<2 ? 'unread' : ''}>{title}</strong><span>{body}</span><small>{time}</small></a>)}</div><a className="text-link" href="#C1-Notifications" onClick={close}>알림 기록 모두 보기</a></Dialog>}
  {panel==='user' && <Dialog title="프로필" anchor={user} onClose={close} className="profile-dialog"><div className="user-summary"><strong>이지훈</strong><span>jihoon.lee@example.ac.kr</span></div><div className="profile-menu" role="menu" aria-label="프로필 작업">{[['프로필','C5-Account'],['알림 기록','C1-Notifications'],['설정','C3-Settings']].map(([text,route])=><a role="menuitem" href={`#${route}`} key={route} onClick={close}>{text}</a>)}<button role="menuitem" onClick={()=>onTheme?.(theme==='dark'?'light':'dark')}><span>테마</span><span>{theme==='dark'?'다크':'라이트'}</span></button><a role="menuitem" href="#A1-Login" onClick={close}>로그아웃</a></div></Dialog>}
 </header>;
}
