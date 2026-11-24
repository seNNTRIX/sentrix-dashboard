import React, {useEffect, useRef, useState} from 'react';
import recordedExperimentHtml from './recorded-log-embedding.html?raw';

// This file contains only the masked checkoutservice experiment published by sentrix-demo.
export default function RecordedLogExperiment() {
  const frame = useRef(null);
  const [height, setHeight] = useState(760);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function resize(event) {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'sentrix-recorded-log-height') return;
      if (Number.isSafeInteger(event.data.height) && event.data.height > 0) {
        setHeight(event.data.height);
      }
    }
    window.addEventListener('message', resize);
    return () => window.removeEventListener('message', resize);
  }, []);

  return <section className="panel" aria-label="저장된 로그 실험">
    {loading && <p role="status" style={{padding:16}}>저장된 실험을 불러오는 중…</p>}
    <iframe ref={frame} title="저장된 checkoutservice Pod 중단 실험의 로그 의미 공간"
      srcDoc={recordedExperimentHtml} sandbox="allow-scripts" referrerPolicy="no-referrer"
      onLoad={() => setLoading(false)}
      style={{width:'100%', height, border:0, display:'block', borderRadius:'inherit'}} />
  </section>;
}
