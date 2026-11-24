const whole = value => Number.isSafeInteger(value) && value >= 0;

export function semanticWindow(data, environment, isPublic) {
 if (data?.environmentId !== environment || data.visibility !== (isPublic ? 'public' : 'operator'))
  throw Error('로그 분석의 조회 대상을 확인할 수 없습니다.');
 if (data.status === 'UNAVAILABLE') return data;
 const validPoints = (points, current) => Array.isArray(points) && points.every(point =>
  typeof point.service === 'string' && Number.isFinite(point.x) && Number.isFinite(point.y) && whole(point.count)
  && (isPublic ? !Object.hasOwn(point,'text') : typeof point.text === 'string')
  && (!current || (typeof point.novel === 'boolean' && (point.distance === null || Number.isFinite(point.distance)))));
 if (data.status !== 'OK' || data.windowSeconds !== 30 || !Number.isFinite(Date.parse(data.windowEnd))
  || !Number.isFinite(data.baseline?.start) || !Number.isFinite(data.baseline?.end)
  || !whole(data.novel?.sentences) || !whole(data.novel?.lines) || !Array.isArray(data.services)
  || !data.services.every(s => typeof s.service === 'string' && typeof s.stopped === 'boolean' && whole(s.novelSentences) && whole(s.novelLines))
  || !validPoints(data.points,true) || !validPoints(data.baselinePoints,false))
  throw Error('로그 분석 응답 형식을 확인하세요.');
 return data;
}

export function scopeSemantics(data, allowed, selected = '') {
 if (data?.status !== 'OK') return null;
 const included = name => (!allowed || allowed.includes(name)) && (!selected || name === selected);
 const services = data.services.filter(s => included(s.service));
 return { services, points: data.points.filter(p => included(p.service)), baseline: data.baselinePoints.filter(p => included(p.service)),
  novel: services.reduce((sum,s) => sum+s.novelSentences,0), lines: services.reduce((sum,s) => sum+s.novelLines,0) };
}

// Loki searches the original line. Template masks and the model's body/error join do not occur in that line.
export function semanticLogLink(point,end) {
 const search=(point.text || '').split(/<(?:SERVICE|EMAIL|ID|TIME|IP|POD|NUM)>| \| /)
  .map(s=>s.trim()).filter(Boolean).sort((a,b)=>b.length-a.length)[0];
 const params=new URLSearchParams({service:point.service,windowEnd:end});
 if(search)params.set('search',search.slice(0,200));
 return '#B7-Logs?'+params;
}
