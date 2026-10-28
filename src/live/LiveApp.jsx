import React, { useState } from 'react';
import { EnvironmentProvider, useEnvironment, EnvironmentForm } from './EnvironmentContext.jsx';
import { DataSources } from './DataSources.jsx';
import { ServiceMetrics } from './ServiceMetrics.jsx';
import { Button } from '../components/controls.jsx';
import { SideNav } from '../components/navigation.jsx';
import './live.css';

export const connectedRoutes = new Set(['B1-Overview','B5-Service','C3-Settings','A4-Onboarding']);

function Shell({ route, params, initialTheme }) {
 const [theme,setTheme] = useState(initialTheme), [menu,setMenu] = useState(()=>!matchMedia('(max-width: 1023px)').matches);
 const { items,selected,select,environment,loading,error,reload } = useEnvironment();
 return <div className="g screen-root live-shell" data-theme={theme} data-screen={route}>
  <header className="top-bar shell-header"><Button icon="menu" variant="ghost" className="icon-button" aria-label="메뉴 열기 또는 닫기" onClick={()=>setMenu(v=>!v)} aria-expanded={menu}/><a className="brand-mark" href="#B1-Overview" aria-label="SentriX 홈">X</a><span className="live-brand">SentriX</span>
   <div className="top-actions"><label className="environment-select">관측 환경<select aria-label="관측 환경" value={environment?selected:''} disabled={loading||!items.length} onChange={e=>select(e.target.value)}><option value="" disabled>환경 선택</option>{items.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><Button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-label="테마 변경">{theme==='dark'?'라이트':'다크'}</Button></div>
  </header><div className="shell-body"><aside className="shell-sidebar"><SideNav active={route==='C3-Settings'||route==='A4-Onboarding'?'settings':route==='B5-Service'?'services':'overview'} open={menu} onClose={()=>setMenu(false)} live environment={environment}/></aside>
   <main id="main-content" tabIndex={-1} className="page-content live-content">
    {loading?<><h1 className="page-title">관측 환경</h1><p role="status">환경 목록을 불러오는 중…</p></>:error?<><h1 className="page-title">백엔드 연결 확인</h1><p role="alert" className="field-error">{error}</p><Button onClick={reload}>다시 연결</Button></>:!environment||route==='A4-Onboarding'?<><h1 className="page-title">관측 환경 설정</h1><EnvironmentForm/>{environment&&<a href="#C3-Settings">현재 환경의 데이터 소스 설정</a>}</>:<div key={environment.id} className="live-content">{route==='C3-Settings'?<DataSources/>:<ServiceMetrics route={route} params={params}/>}</div>}
   </main></div>
 </div>;
}

export function LiveApp(props) { return <EnvironmentProvider><Shell {...props}/></EnvironmentProvider>; }
