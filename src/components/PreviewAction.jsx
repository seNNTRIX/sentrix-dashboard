import React, {useState} from 'react';
import {Dialog} from './controls.jsx';

// An unimplemented backend action should explain its availability, not look broken.
export function PreviewAction({children, ...props}) {
 const [open,setOpen]=useState(false);
 return <><button {...props} type="button" aria-label={props['aria-label'] ? `${props['aria-label']} · 연결 필요` : undefined} title="API 연결 후 사용할 수 있는 기능입니다" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{children}<span className="demo-badge">연결 필요</span></button>{open && <Dialog title="데모에서 제공하지 않는 작업" onClose={()=>setOpen(false)}><p className="secondary-text">이 작업은 실제 API 연결 후 사용할 수 있습니다. 현재 화면에서는 예시 데이터를 확인할 수 있습니다.</p><button className="ui-button ui-button--primary" onClick={()=>setOpen(false)}>확인</button></Dialog>}</>;
}
