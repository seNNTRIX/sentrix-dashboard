import React, { useState } from 'react';
import { request, environmentPath } from './api.js';
import { Button } from '../components/controls.jsx';

const reasons = { TIMEOUT:'응답 시간 초과', DNS_ERROR:'호스트 이름 확인 실패', CONNECTION_FAILED:'접속 실패',
 TLS_ERROR:'인증서 또는 TLS 오류', HTTP_ERROR:'서버 응답 오류', REDIRECT_REJECTED:'다른 주소로의 이동 거부',
 TARGET_NOT_ALLOWED:'서버에서 허용하지 않은 주소', IO_ERROR:'통신 오류' };
const labels = { NOT_TESTED:'미검사', CONNECTED:'마지막 검사 성공', FAILED:'마지막 검사 실패' };

export function SourceForm({ type, initial, environmentId, onSaved }) {
 const [saved,setSaved] = useState(initial), [name,setName] = useState(initial?.name || type);
 const [baseUrl,setUrl] = useState(initial?.baseUrl || ''), [timeoutSeconds,setTimeoutSeconds] = useState(initial?.timeoutSeconds || 5);
 const [busy,setBusy] = useState(''), [error,setError] = useState(''), [notice,setNotice] = useState('');
 const dirty = !saved || name!==saved.name || baseUrl!==saved.baseUrl || +timeoutSeconds!==saved.timeoutSeconds;
 const path = `${environmentPath(environmentId)}/data-sources/${type}`;
 const run = async test => {
  setBusy(test?'test':'save'); setError(''); setNotice('');
  try {
   let result = saved;
   if (dirty) {
    result = await request(path, { method:'PUT', body:{ name, baseUrl, timeoutSeconds:+timeoutSeconds } });
    setSaved(result); setName(result.name); setUrl(result.baseUrl); setTimeoutSeconds(result.timeoutSeconds);
   }
   if (test) { result = await request(`${path}/test`, { method:'POST' }); setSaved(result); }
   onSaved?.();
   setNotice(test ? result.status==='CONNECTED'?'연결 테스트에 성공했습니다.':'연결 테스트 결과를 확인하세요.' : '설정을 저장했습니다.');
  } catch (e) { setError(e.message); } finally { setBusy(''); }
 };
 return <form className="live-panel live-form" aria-label={`${type} 설정`} onSubmit={e=>{e.preventDefault();run(e.nativeEvent.submitter?.value==='test');}}>
  <div className="live-row"><h2>{type === 'prometheus' ? 'Prometheus' : type === 'tempo' ? 'Tempo' : 'Loki'}</h2><span className={`live-badge ${saved?.status==='FAILED'?'is-error':''}`}>{labels[saved?.status] || '미등록'}</span></div>
  <fieldset disabled={!!busy}><label>이름<input required maxLength={100} value={name} onChange={e=>{setName(e.target.value);setNotice('');}}/></label>
   <label>접속 주소<input required type="url" maxLength={2048} placeholder="http://서버주소:포트" value={baseUrl} onChange={e=>{setUrl(e.target.value);setNotice('');}}/></label>
   <label>제한 시간(초)<input required type="number" min={1} max={10} step={1} value={timeoutSeconds} onChange={e=>{setTimeoutSeconds(e.target.value);setNotice('');}}/></label>
   <div className="live-actions"><Button type="submit" value="save">설정 저장</Button><Button type="submit" value="test" variant="primary">{busy==='test'?'검사 중…':dirty?'저장 후 테스트':'연결 테스트'}</Button></div>
  </fieldset>
  {dirty && saved && <p className="secondary-text">수정 중입니다. 아래 검사 결과는 마지막으로 저장한 설정의 결과입니다.</p>}
  {saved?.lastCheckedAt && <p className="secondary-text">검사 시각 {new Date(saved.lastCheckedAt).toLocaleString()} · {saved.latencyMs} ms{saved.httpStatus ? ` · HTTP ${saved.httpStatus}` : ''}</p>}
  {saved?.status==='FAILED' && <p role="status" className="field-error">{reasons[saved.failureCode] || '연결 확인 실패'}</p>}
  {error && <p role="alert" className="field-error">{error}</p>}{notice && <p role="status">{notice}</p>}
 </form>;
}
