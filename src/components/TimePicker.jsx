import React, { useRef, useState } from 'react';
import { useDesign } from '../live/DesignContext.jsx';
import { validateRange } from '../time-range.js';
import { Button, Dialog, Toast, useNotice } from './controls.jsx';

export const quickRanges = ['지난 5분','지난 15분','지난 30분','지난 1시간','지난 3시간','지난 6시간','지난 12시간','지난 24시간','지난 7일'];
export function TimePicker({range = '지난 1시간'}) {
 const live=useDesign();
 const [localLabel,setLabel]=useState(range), [open,setOpen]=useState(false), [query,setQuery]=useState('');
 const local=date=>new Date(+date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const [start,setStart]=useState(local(new Date(Date.now()-900000))), [end,setEnd]=useState(local(new Date())), [error,setError]=useState('');
 const [notice,notify]=useNotice(); const trigger=useRef(null);
 const label=live?.rangeLabel||localLabel,available=live?quickRanges.slice(0,-1):quickRanges;
 const ranges=available.filter(r=>r.includes(query.trim()));
 const select = value => {if(live){const index=quickRanges.indexOf(value);try{index>=0?live.changeRange(Date.now()-[300,900,1800,3600,10800,21600,43200,86400][index]*1000,Date.now(),value):live.changeRange(start,end,value);}catch(e){setError(e.message);return;}}else{setLabel(value);notify('시간 범위를 선택했습니다. 표시 데이터는 데모 예시입니다.');}setOpen(false);};
 return <div className="time-controls">
  <div className="button-group"><button ref={trigger} className="ui-button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><span className="time-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg></span><span>{label}</span><span aria-hidden="true">⌄</span></button><Button icon="expand" className="icon-button" aria-label="시간 범위 넓히기" disabled={label===available.at(-1)||!available.includes(label)} onClick={()=>select(available[Math.min(available.indexOf(label)+1,available.length-1)])}/></div>
  <Button icon="refresh" aria-label="새로고침" onClick={()=>live?live.refresh():notify('데모 데이터를 확인했습니다. 실시간 수집은 연결 전입니다.')}>새로고침</Button>
  {open && <Dialog title="시간 범위" anchor={trigger} onClose={()=>setOpen(false)} className="time-dialog"><div className="time-dialog-body"><form className="range-form" onSubmit={e=>{e.preventDefault();const message=validateRange(start,end);setError(message);if(!message)select(`${start.replace('T',' ')} ~ ${end.replace('T',' ')}`);}}>
   <h3>직접 지정</h3><label>시작<input type="datetime-local" value={start} onChange={e=>{setStart(e.target.value);setError('');}} required aria-invalid={!!error} aria-describedby={error?'range-error':undefined}/></label><label>끝<input type="datetime-local" value={end} onChange={e=>{setEnd(e.target.value);setError('');}} required aria-invalid={!!error} aria-describedby={error?'range-error':undefined}/></label>
   {error && <p id="range-error" className="field-error" role="alert">{error}</p>}<Button type="submit" variant="primary">시간 범위 적용</Button><p className="secondary-text">{live?'브라우저 시간대, 최대 24시간. 선택한 기간으로 API를 조회합니다.':'Asia/Seoul, UTC+09:00. 현재 차트는 예시 데이터를 표시합니다.'}</p>
  </form><div className="quick-ranges"><h3>빠른 범위</h3><input type="search" aria-label="빠른 범위 검색" placeholder="범위 검색" value={query} onChange={e=>setQuery(e.target.value)}/><div className="range-options">{ranges.map(r=><button key={r} aria-pressed={label===r} onClick={()=>select(r)}>{r}</button>)}{!ranges.length && <p className="secondary-text">일치하는 범위가 없습니다.</p>}</div></div></div></Dialog>}
  <Toast>{notice}</Toast>
 </div>;
}
