import React, { createContext, useContext, useEffect, useState } from 'react';
import { request } from './api.js';

const Context = createContext(null);
export const useEnvironment = () => useContext(Context);
function remembered() { try { return localStorage.getItem('sentrix-environment') || ''; } catch { return ''; } }

export function EnvironmentProvider({ children }) {
 const [items, setItems] = useState([]), [selected, setSelected] = useState(remembered);
 const [loading,setLoading] = useState(true), [error,setError] = useState(''), [revision,setRevision] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  setLoading(true); setError(''); setItems([]);
  (async () => {
   let all = [], page = 0, pages;
   do {
    const result = await request(`/environments?page=${page}&size=50`, { signal: controller.signal });
    if (!Array.isArray(result.items) || !Number.isInteger(result.totalPages) || result.totalPages > 100) throw new Error('환경 목록 응답이 너무 크거나 형식이 올바르지 않습니다.');
    all.push(...result.items); pages = result.totalPages; page++;
   } while (page < pages);
   if (controller.signal.aborted) return;
   setItems(all);
   setSelected(current => all.some(e => String(e.id) === current) ? current : String(all[0]?.id ?? ''));
  })().catch(e => { if (!controller.signal.aborted) setError(e.message); })
   .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [revision]);
 useEffect(() => { try { localStorage.setItem('sentrix-environment', selected); } catch {} }, [selected]);
 const environment = items.find(e => String(e.id) === selected);
 return <Context.Provider value={{ items, environment, selected, loading, error, select: setSelected,
  reload: () => setRevision(n=>n+1), add: item => { setItems(old=>[...old,item]); setSelected(String(item.id)); } }}>{children}</Context.Provider>;
}

export function EnvironmentForm() {
 const { add } = useEnvironment();
 const [name,setName] = useState(''), [namespace,setNamespace] = useState('');
 const [busy,setBusy] = useState(false), [error,setError] = useState('');
 return <form className="live-panel live-form" onSubmit={async e => {
  e.preventDefault(); setBusy(true); setError('');
  try { const item = await request('/environments', { method:'POST', body:{name,namespace} }); add(item); location.hash='C3-Settings'; }
  catch (e) { setError(e.message); } finally { setBusy(false); }
 }}><h2>관측 환경 등록</h2><p className="secondary-text">관측할 환경 이름과 Kubernetes namespace를 등록하세요. 등록 후 데이터 소스 주소를 설정합니다.</p>
  <label>환경 이름<input required maxLength={100} value={name} disabled={busy} onChange={e=>setName(e.target.value)} placeholder="Online Boutique"/></label>
  <label>Namespace<input required maxLength={63} pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?" value={namespace} disabled={busy} onChange={e=>setNamespace(e.target.value)} placeholder="sentrix"/></label>
  {error && <p role="alert" className="field-error">{error}</p>}
  <button className="ui-button ui-button--primary" disabled={busy}>{busy?'등록 중…':'환경 등록'}</button>
 </form>;
}
