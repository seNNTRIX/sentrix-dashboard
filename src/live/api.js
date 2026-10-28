const messages = {
 PROMETHEUS_NOT_CONFIGURED: 'Prometheus 연결 설정을 먼저 저장하세요.',
 TARGET_NOT_ALLOWED: '서버에서 허용하지 않은 주소입니다. 연결 설정을 확인하세요.',
 PROMETHEUS_TIMEOUT: 'Prometheus 응답 시간이 초과됐습니다.',
 PROMETHEUS_HTTP_ERROR: 'Prometheus가 조회를 거부했습니다. 연결 설정과 서버 상태를 확인하세요.',
 PROMETHEUS_UNAVAILABLE: 'Prometheus에 연결할 수 없습니다.',
 PROMETHEUS_QUERY_FAILED: 'Prometheus가 지표를 계산하지 못했습니다. 수집 설정을 확인하세요.',
 INVALID_PROMETHEUS_RESPONSE: 'Prometheus 응답 형식이 올바르지 않습니다.',
 RESPONSE_TOO_LARGE: '조회 결과가 너무 큽니다. 조회 기간을 줄이세요.',
 TOO_MANY_SERVICES: '조회 가능한 서비스 수를 초과했습니다.',
 ENVIRONMENT_NOT_FOUND: '등록되지 않은 환경입니다.',
 INVALID_QUERY: '조회 기간과 서비스 이름을 확인하세요.',
 INVALID_METRIC: '지원하지 않는 지표입니다.',
};

export class ApiError extends Error {
 constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
 const controller = new AbortController();
 const cancel = () => controller.abort();
 signal?.addEventListener('abort', cancel, { once: true });
 if (signal?.aborted) cancel();
 const timer = setTimeout(cancel, 20000);
 try {
  const response = await fetch(`/api/v1${path}`, { method, signal: controller.signal,
   headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
   body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
   const fallback = response.status === 400 ? (path==='/environments'?'환경 이름과 namespace 형식을 확인하세요.':'입력값이나 서버의 허용 주소 설정을 확인하세요.')
    : response.status === 404 ? '환경 또는 연결 설정이 없습니다.'
    : response.status === 409 ? (path==='/environments'?'같은 이름의 환경이 이미 있습니다.':'설정이 변경됐습니다. 새로고침 후 다시 시도하세요.')
    : '백엔드 요청에 실패했습니다. 서버 실행 상태를 확인하세요.';
   throw new ApiError(messages[json?.code] || fallback, response.status, json?.code);
  }
  if (json === null) throw new ApiError('서버가 올바른 데이터를 반환하지 않았습니다.', response.status);
  return json;
 } catch (error) {
  if (signal?.aborted || error instanceof ApiError) throw error;
  throw new ApiError(controller.signal.aborted ? '서버 응답 시간이 초과됐습니다.' : '백엔드에 연결할 수 없습니다. 서버 실행 상태를 확인하세요.', 0);
 } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}

export const environmentPath = id => `/environments/${encodeURIComponent(id)}`;
export const metricDefinitions = [
 ['cpu_usage_cores','CPU 사용량','cores',1], ['memory_working_set_bytes','메모리 사용량','MiB',1/1048576],
 ['request_rate','초당 요청','req/s',1], ['error_ratio','오류율','%',100],
 ['latency_p50_ms','p50 지연','ms',1], ['latency_p90_ms','p90 지연','ms',1], ['latency_p99_ms','p99 지연','ms',1],
];

export function queryRange(from, to) {
 const start = new Date(Math.floor(+new Date(from)/1000)*1000), end = new Date(Math.floor(+new Date(to)/1000)*1000);
 const duration = end - start;
 if (!Number.isFinite(duration) || duration <= 0 || duration > 86400000) throw new Error('시작·끝을 확인하세요. 최대 24시간까지 조회할 수 있습니다.');
 return { from: new Date(Math.floor(+start/1000)*1000).toISOString().replace('.000Z','Z'),
  to: new Date(Math.floor(+end/1000)*1000).toISOString().replace('.000Z','Z'),
  stepSeconds: Math.max(30, Math.ceil(duration / 1000 / 1440)) };
}

// Start a new line after missing samples; never draw through a data gap.
export function chartPath(points, factor = 1) {
 const finite = points.filter(p => Number.isFinite(p.value)).map(p => p.value * factor);
 const max = Math.max(1, ...finite), min = Math.min(0, ...finite);
 let previous = false;
 return points.map((point, index) => {
  if (!Number.isFinite(point.value)) { previous = false; return ''; }
  const command = previous ? 'L' : 'M'; previous = true;
  return `${command}${(index / Math.max(1, points.length-1) * 560 + 12).toFixed(2)},${(124 - (point.value * factor - min) / (max-min) * 112).toFixed(2)}`;
 }).join(' ');
}
