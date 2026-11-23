// Only a directly linked client and server span establish an observed service call.
export function sampleTopology(traces) {
 const names = new Set(), paths = new Map();
 for (const trace of traces) {
  const spans = new Map(trace.spans.map(s => [s.spanId,s]));
  for (const span of spans.values()) {
   if (span.service) names.add(span.service);
   const client = spans.get(span.parentSpanId);
   if (span.kind !== 'SERVER' || client?.kind !== 'CLIENT' || !client.service || !span.service) continue;
   const key = JSON.stringify([client.service,span.service]);
   const edge = paths.get(key) || {source:client.service,target:span.service,observedCalls:0,explicitErrorCount:0,durations:[]};
   edge.observedCalls++;
   if (span.status === 'ERROR') edge.explicitErrorCount++;
   if (Number.isFinite(span.durationMs)) edge.durations.push(span.durationMs);
   paths.set(key,edge);
  }
 }
 const edges = Array.from(paths.values(), ({durations,...edge}) => {
  durations.sort((a,b)=>a-b);
  return {...edge,p90Ms:durations[Math.ceil(durations.length*.9)-1]};
 });
 return {nodes:[...names],edges,sampleSize:traces.length};
}

export function sampleIds(items,limit=6) {
 const eligible = items.filter(t=>t.traceId && !/TraceService\/Export|MetricsService\/Export|LogsService\/Export/i.test(t.rootOperation||''));
 const operations = new Set(), chosen = new Set();
 for (const t of eligible) {
  if (!operations.has(t.rootOperation)) { chosen.add(t.traceId); operations.add(t.rootOperation); }
 }
 for (const t of eligible) chosen.add(t.traceId);
 return [...chosen].slice(0,limit);
}

// Keep incoming and outgoing calls distinct. Each neighbour occupies just one slot.
export function focusedTopology(center,edges) {
 const links=edges.filter(e=>e.source===center||e.target===center);
 const incoming=[...new Set(links.filter(e=>e.target===center&&e.source!==center).map(e=>e.source))].sort();
 const outgoing=[...new Set(links.filter(e=>e.source===center&&e.target!==center&&!incoming.includes(e.target)).map(e=>e.target))].sort();
 const height=Math.max(300,96*Math.max(incoming.length,outgoing.length));
 const positions=new Map([[center,[500,height/2]]]);
 for(const [peers,x] of [[incoming,145],[outgoing,855]]) {
  peers.forEach((name,i)=>positions.set(name,[x,height*(i+.5)/peers.length]));
 }
 return {links,positions,height};
}
