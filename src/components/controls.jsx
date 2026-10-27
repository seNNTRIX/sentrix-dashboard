import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function Icon({ name, size = 18, ...props }) {
 const paths = {
  menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6L6 18',
  search: 'M17 10a7 7 0 1 1-14 0a7 7 0 1 1 14 0M15 15l6 6',
  chevron: 'M6 9l6 6 6-6', clock: 'M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0M12 7v5l3 2',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5', bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4',
  home: 'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10', map: 'M8 6a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 8a2 2 0 1 1-4 0a2 2 0 1 1 4 0M12 19a2 2 0 1 1-4 0a2 2 0 1 1 4 0M8 6l8 2M6 8l3 9M17 10l-6 7',
  explore: 'M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0M16 8l-3 5-5 3 3-5z',
  model: 'M9 3h6M10 3v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8',
  settings: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  expand: 'M17 10a7 7 0 1 1-14 0a7 7 0 1 1 14 0M15 15l6 6M7 10h6'
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.settings}/></svg>;
}

export function Button({ variant = 'secondary', icon, children, className = '', ...props }) {
 return <button type="button" className={`ui-button ui-button--${variant} ${className}`} {...props}>{icon && <Icon name={icon}/>} {children}</button>;
}

// The native modal dialog provides focus containment and makes the background inert.
export function Dialog({ title, onClose, children, className = '', anchor, drawer = false }) {
 const ref = useRef(null), heading = useId();
 const closeRef = useRef(onClose); closeRef.current = onClose;
 useEffect(() => {
  const el = ref.current, previous = document.activeElement;
  el.showModal();
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const reposition = () => {
   if (!anchor?.current || innerWidth < 640) return;
   const box = anchor.current.getBoundingClientRect();
   el.style.top = `${Math.min(box.bottom + 8, Math.max(16, innerHeight - el.offsetHeight - 16))}px`;
   el.style.left = `${Math.max(16, Math.min(box.right - el.offsetWidth, innerWidth - el.offsetWidth - 16))}px`;
  };
  reposition(); window.addEventListener('resize', reposition);
  return () => { window.removeEventListener('resize', reposition); el.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
 }, [anchor]);
 return createPortal(<dialog ref={ref} className={`g ui-dialog ${drawer ? 'ui-drawer' : ''} ${anchor ? 'ui-popover' : ''} ${className}`} aria-labelledby={heading}
  onCancel={e => { e.preventDefault(); closeRef.current(); }}
  onClick={e => { if (e.target === e.currentTarget) { const b = e.currentTarget.getBoundingClientRect(); if(e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) closeRef.current(); } }}>
  <div className="ui-dialog-heading"><h2 id={heading}>{title}</h2><Button variant="ghost" className="icon-button" aria-label={`${title} 닫기`} icon="close" onClick={onClose}/></div>
  {children}
 </dialog>, document.body);
}

export function Toast({ children }) {
 return children ? <div className="ui-toast" role="status">{children}</div> : null;
}

export function useNotice() {
 const [notice, setNotice] = useState('');
 useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
 return [notice, setNotice];
}

export function DataViewport({children, label = '데이터'}) {
 const ref=useRef(null), [overflow,setOverflow]=useState(false);
 useEffect(()=>{
  const el=ref.current;
  const measure=()=>setOverflow(el.scrollWidth > el.clientWidth+1);
  const observer=new ResizeObserver(measure);observer.observe(el);
  if(el.firstElementChild)observer.observe(el.firstElementChild);
  measure();return ()=>observer.disconnect();
 },[children]);
 return <div className="data-container">{overflow && <div className="scroll-hint">가로로 스크롤하여 전체 {label} 보기</div>}<div ref={ref} className="data-viewport" tabIndex={overflow?0:undefined} role="region" aria-label={`${label} 가로 스크롤`}>{children}</div></div>;
}

export function AsyncButton({onClick,children,disabled,...props}) {
 const [pending,setPending]=useState(false), [error,setError]=useState('');
 const mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;},[]);
 return <><button {...props} disabled={disabled||pending} aria-busy={pending} onClick={async event=>{
  if(pending)return;
  setPending(true);setError('');
  try {await onClick(event);} catch {if(mounted.current)setError('복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.');}
  finally {if(mounted.current)setPending(false);}
 }}>{pending ? '복사 중…' : children}</button>{error && <span className="field-error" role="alert">{error}</span>}</>;
}

export function ServiceName({name}) {
 return name.endsWith('service') ? <>{name.slice(0,-7)}<wbr/>service</> : name;
}
