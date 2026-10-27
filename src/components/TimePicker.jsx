import React, { useRef, useState } from 'react';
import { validateRange } from '../time-range.js';
import { Button, Dialog, Toast, useNotice } from './controls.jsx';

export const quickRanges = ['지난 5분','지난 15분','지난 30분','지난 1시간','지난 3시간','지난 6시간','지난 12시간','지난 24시간','지난 7일'];
export function TimePicker({range = '지난 1시간'}) {
 const [label,setLabel]=useState(range), [open,setOpen]=useState(false), [query,setQuery]=useState('');
 const [start,setStart]=useState('2026-10-27T14:02'), [end,setEnd]=useState('2026-10-27T14:32'), [error,setError]=useState('');
 const [notice,notify]=useNotice(); const trigger=useRef(null);
 const ranges=quickRanges.filter(r=>r.includes(query.trim()));
 const select = value => {setLabel(value);setOpen(false);notify('시간 범위를 선택했습니다. 표시 데이터는 데모 예시입니다.');};
 return <div className="time-controls">
  <div className="button-group"><button ref={trigger} className="ui-button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><span className="time-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg></span><span>{label}</span><span aria-hidden="true">⌄</span></button><Button icon="expand" className="icon-button" aria-label="시간 범위 넓히기" disabled={label===quickRanges.at(-1)} onClick={()=>select(quickRanges[Math.min(quickRanges.indexOf(label)+1,quickRanges.length-1)])}/></div>
  <Button icon="refresh" aria-label="새로고침" onClick={()=>notify('데모 데이터를 확인했습니다. 실시간 수집은 연결 전입니다.')}>새로고침</Button>
  {open && <Dialog title="시간 범위" anchor={trigger} onClose={()=>setOpen(false)} className="time-dialog"><div className="time-dialog-body"><form className="range-form" onSubmit={e=>{e.preventDefault();const message=validateRange(start,end);setError(message);if(!message)select(`${start.replace('T',' ')} ~ ${end.replace('T',' ')}`);}}>
   <h3>직접 지정</h3><label>시작<input type="datetime-local" value={start} onChange={e=>{setStart(e.target.value);setError('');}} required aria-invalid={!!error} aria-describedby={error?'range-error':undefined}/></label><label>끝<input type="datetime-local" value={end} onChange={e=>{setEnd(e.target.value);setError('');}} required aria-invalid={!!error} aria-describedby={error?'range-error':undefined}/></label>
   {error && <p id="range-error" className="field-error" role="alert">{error}</p>}<Button type="submit" variant="primary">시간 범위 적용</Button><p className="secondary-text">Asia/Seoul, UTC+09:00<br/>현재 차트는 예시 데이터를 표시합니다.</p>
  </form><div className="quick-ranges"><h3>빠른 범위</h3><input type="search" aria-label="빠른 범위 검색" placeholder="범위 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="range-options">{ranges.map(r=><button key={r} aria-pressed={label===r} onClick={()=>select(r)}>{r}</button>)}{!ranges.length && <p className="secondary-text">일치하는 범위가 없습니다.</p>}</div></div></div></Dialog>}
  <Toast>{notice}</Toast>
 </div>;
}
