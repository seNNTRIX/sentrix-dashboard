import {publicView,publicRoutes} from './live/public-view.js';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LiveApp, connectedRoutes } from './live/LiveApp.jsx';
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
 const [hash, setHash] = useState(location.hash.slice(1) || 'B1-Overview');
 const [requested, query = ''] = hash.split('?');
 const route=publicView&&!publicRoutes.has(requested)?'B1-Overview':requested;
 const params = new URLSearchParams(query);
 const live = connectedRoutes.has(route);
 useEffect(() => {
  const update = () => {setHash(location.hash.slice(1) || 'B1-Overview');window.scrollTo(0,0);};
  window.addEventListener('hashchange',update);
  return () => window.removeEventListener('hashchange',update);
 },[]);
 useEffect(() => {
  const heading = document.querySelector('h1');
  const titles = { "B3-Incidents":"장애 기록", "B4-Incident":"장애 기록 상세", 'B2-ServiceMap':'Service map', 'B6-Trace':'Trace', 'B7-Logs':'로그', 'B1-Overview':'개요', 'B5-Service':'서비스 상세', 'C3-Settings':'설정', 'A4-Onboarding':'관측 환경 설정' };
  document.title = `${live ? (titles[route]||heading?.textContent||'대시보드') : heading?.textContent || '대시보드'} · SentriX`;
 },[route,live]);
 return <><a href="#main-content" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>본문으로 건너뛰기</a><ErrorBoundary key={route}>{live ? <LiveApp route={route} params={params} initialTheme={savedTheme()}/> : <main className="error-page"><h1>사용할 수 없는 화면입니다</h1><a href="#B1-Overview">개요로 돌아가기</a></main>}</ErrorBoundary></>;
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
