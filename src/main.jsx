import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { screens } from './screens.jsx';
import { IncidentContext } from './components/IncidentContext.jsx';
import './design.css';
import './responsive.css';

function savedTheme() {
 try { return localStorage.getItem('sentrix-theme') === 'dark' ? 'dark' : 'light'; }
 catch { return 'light'; }
}
class ErrorBoundary extends React.Component {
 state = { error: false };
 static getDerivedStateFromError() { return { error: true }; }
 render() {
  return this.state.error ? <main className="error-page" role="alert"><h1>화면을 불러오지 못했습니다</h1><a href="/">홈으로 돌아가기</a></main> : this.props.children;
 }
}
function App() {
 const [route, setRoute] = useState(location.hash.slice(1) || 'B1-Overview');
 const scrollPositions = useRef({});
 const currentRoute = useRef(route);
 useEffect(() => {
  const update = () => {scrollPositions.current[currentRoute.current] = window.scrollY; const next = location.hash.slice(1) || 'B1-Overview'; currentRoute.current = next; setRoute(next);};
  window.addEventListener('hashchange',update);
  return () => window.removeEventListener('hashchange',update);
 },[]);
 useEffect(() => {
  window.scrollTo(0, scrollPositions.current[route] || 0);
  const heading = document.querySelector('h1');
  document.title = `${heading?.textContent || '대시보드'} · SentriX`;
 },[route]);
 const [page, query = ''] = route.split('?');
 const params = new URLSearchParams(query);
 const id = params.get('id') || 'INC-0142';
 const contextual = page === 'B4-Incident' && id !== 'INC-0142' || page === 'B7-Logs' && params.has('incident');
 const Screen = screens[page];
 return <><a href="#main-content" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>본문으로 건너뛰기</a><aside className="demo-notice">데모 환경 · 예시 데이터 · 서버에 저장되지 않습니다</aside><ErrorBoundary key={route}>{contextual ? <IncidentContext id={page === 'B7-Logs' ? params.get('incident') : id} logs={page === 'B7-Logs'} theme={savedTheme()}/> : Screen ? <Screen theme={savedTheme()}/> : <main className="error-page"><h1>화면을 찾을 수 없습니다</h1><a href="#B1-Overview">개요로 돌아가기</a></main>}</ErrorBoundary></>;
}

// Keyboard navigation is shared by the existing tab and segmented-control patterns.
document.addEventListener('keydown', event => {
 const button = event.target.closest('[role=tab], [role=radio], [role=menuitem]');
 if (!button || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
 const group = button.closest('[role=tablist], [role=radiogroup], [role=menu]');
 if (!group) return;
 const items = [...group.querySelectorAll('[role=tab], [role=radio], [role=menuitem]')].filter(el=>!el.disabled);
 const index = items.indexOf(button), direction = ['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1;
 const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index + direction + items.length) % items.length;
 event.preventDefault(); items[next]?.focus();
 if(button.getAttribute('role') !== 'menuitem') items[next]?.click();
});
new MutationObserver(() => {
 const theme = document.querySelector('.screen-root[data-theme]')?.dataset.theme;
 if (!theme) return;
 document.documentElement.dataset.theme = theme;
 try { localStorage.setItem('sentrix-theme',theme); } catch { /* Private browsing may disallow storage. */ }
}).observe(document.getElementById('root'), {subtree:true,attributes:true,attributeFilter:['data-theme'],childList:true});
createRoot(document.getElementById('root')).render(<App/>);
