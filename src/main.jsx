import React from 'react';
import { createRoot } from 'react-dom/client';
import { screens } from './screens.jsx';
import './design.css';
import './responsive.css';

class App extends React.Component {
 state = { error: false };
 static getDerivedStateFromError() { return { error: true }; }
 render() { return this.state.error ? <main role="alert"><h1>화면을 불러오지 못했습니다</h1><a href="/">홈으로 돌아가기</a></main> : <><aside className="demo-notice" role="status">데모 환경 · 예시 데이터 · 변경 사항은 서버에 저장되지 않습니다</aside><Router /></>; }
}
function Router() {
 const [route, setRoute] = React.useState(location.hash.slice(1) || 'B1-Overview');
 React.useEffect(() => { const update = () => setRoute(location.hash.slice(1) || 'B1-Overview'); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
 const Screen = screens[route] || screens['B1-Overview'];
 return <Screen key={route} theme={localStorage.getItem('sentrix-theme') || 'light'} />;
}
document.addEventListener('click', event => {
 const link = event.target.closest('a[href]');
 if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 const match = link.getAttribute('href').match(/^([\w-]+)\.dc\.html(?:\?.*)?$/);
 if (match && screens[match[1]]) { event.preventDefault(); location.hash = match[1]; }
});

document.addEventListener('submit', event => event.preventDefault());
new MutationObserver(() => {
 const theme = document.querySelector('.g[data-theme]')?.dataset.theme;
 if (theme) { document.documentElement.dataset.theme = theme; localStorage.setItem('sentrix-theme', theme); }
}).observe(document.getElementById('root'), { subtree: true, attributes: true, attributeFilter: ['data-theme'], childList: true });
createRoot(document.getElementById('root')).render(<App />);
