const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('ko-KR',{maximumFractionDigits:3}).format(n):'—';
const fieldRows=rows=>rows.map(([k,v])=>({k,v,kStyle:'padding: 0 12px; color: var(--text-2); border-bottom: 1px solid var(--border-weak)',vStyle:'padding: 0 12px; overflow-wrap: anywhere; border-bottom: 1px solid var(--border-weak)'}));
const segment=(sel,i)=>'height: 28px; padding: 0 12px; border: 0; border-radius: 6px; white-space: nowrap; font-size: 13px; '+(sel===i?'background: var(--bg1); box-shadow: var(--shadow-z1); font-weight: 500; color: var(--text)':'background: none; color: var(--text-2)');
export function logLevel(text){try{const x=JSON.parse(text);const l=String(x.level??x.severity??x.severityText??'').toLowerCase();return ['warn','warning'].includes(l)?'warn':['error','fatal'].includes(l)?'error':['info','debug','trace'].includes(l)?'info':'unknown';}catch{return 'unknown';}}
export function chartPath(points,max,height=120){let previous=false;return points.map((p,i)=>{if(!Number.isFinite(p.value)){previous=false;return '';}const cmd=previous?'L':'M';previous=true;return `${cmd}${5+i/Math.max(1,points.length-1)*590},${height-Math.max(0,p.value)/max*height}`;}).join(' ');}
export function chartBars(points,max,height=120){
 const step=600/Math.max(1,points.length),width=step*.72;
 return points.flatMap((p,i)=>{if(!Number.isFinite(p.value))return [];const h=Math.max(0,p.value)/max*height,x=i*step+(step-width)/2;return [`M${x},${height}v${-h}h${width}v${h}Z`];}).join(' ');
}
const tickValues=(range,positions=[0,.5,1])=>positions.map(p=>({label:new Date(+new Date(range.from)+p*(new Date(range.to)-new Date(range.from))).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}),pos:`position:absolute;left:${p*100}%;white-space:nowrap;transform:translateX(${p===1?'-100%':p===0?'0':'-50%'})`}));
export function designValues(view,d){
 const shared={theme:view.state.theme??view.props.theme??'light',menuOpen:view.state.menu,setTheme:theme=>view.setState({theme}),toggleMenu:()=>view.setState({menu:!view.state.menu})};
 if(d.route==='B7-Logs'){
  const sw=view.state.sw,hide=view.state.hide;
  let rows=(d.result.data?.items||[]).map((x,i)=>({...x,i,lvl:logLevel(x.message)})).filter(x=>!hide[x.lvl]);
  if(view.state.dedup===1){const seen=new Set();rows=rows.filter(x=>{const key=JSON.stringify([x.pod,x.container,x.message]);if(seen.has(key))return false;seen.add(key);return true;});}
  if(view.state.order===1)rows=rows.slice().reverse();
  const lines=rows.map(x=>{
   const open=view.state.open===x.i;let text=x.message;if(sw.pretty)try{text=JSON.stringify(JSON.parse(text),null,2);}catch{}
   return {time:x.timestamp,text,open,exp:String(open),hasTrace:false,trace:'',lvl:x.lvl==='unknown'?'—':x.lvl,labels:`pod=${x.pod}`,fields:fieldRows([['namespace',d.environment?.namespace||''],['service',d.result.data.service],['pod',x.pod],['container',x.container],['timestamp',x.timestamp],['message',x.message]]),
    toggle:()=>view.setState({open:open?-1:x.i}),lvStyle:`flex:none;width:40px;font-weight:500;color:var(${x.lvl==='error'?'--error-text':x.lvl==='warn'?'--warning-text':'--text-2'})`,
    row:`display:flex;gap:12px;align-items:flex-start;width:100%;padding:4px 20px;border:0;text-align:left;font-size:12px;line-height:20px;background:${open?'var(--selected)':'none'}`,
    textStyle:`min-width:0;${sw.wrap?'white-space:pre-wrap;overflow-wrap:anywhere':'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'}`};
  });
  return {...shared,vol:{info:'',warn:'',err:''},ticks:tickValues(d.range),levels:[['error','error'],['warn','warning'],['info','info'],['unknown','미분류']].map(([k,label])=>({label,on:String(!hide[k]),toggle:()=>view.setState({hide:{...hide,[k]:!hide[k]}}),style:`display:inline-flex;align-items:center;gap:8px;padding:0;border:0;background:none;color:var(--text-2);${hide[k]?'text-decoration:line-through':''}`,sw:`width:12px;height:2px;background:var(${k==='error'?'--error':k==='warn'?'--warning':'--border'})`})),lines,count:d.result.data?String(lines.length):'—',empty:!lines.length,showTime:sw.time,showLabels:sw.labels,
   switches:[['time','Time'],['labels','Unique labels'],['wrap','Wrap lines'],['pretty','Prettify JSON']].map(([k,label])=>({label,on:String(sw[k]),toggle:()=>view.setState({sw:{...sw,[k]:!sw[k]}}),track:`position:relative;flex:none;width:28px;height:16px;border-radius:8px;background:${sw[k]?'var(--primary)':'var(--border)'}`,knob:`position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--bg1);transform:translateX(${sw[k]?12:0}px)`})),
   dedup:['None','Exact'].map((label,i)=>({label,on:String(view.state.dedup===i),pick:()=>view.setState({dedup:i}),style:segment(view.state.dedup,i)})),orders:['최신 순','오래된 순'].map((label,i)=>({label,on:String(view.state.order===i),pick:()=>view.setState({order:i}),style:segment(view.state.order,i)}))};
 }
 if(d.route==='B6-Trace'){
  const data=d.detail.data,total=data?.durationMs||0,all=data?.spans||[],byId=new Map(all.map(x=>[x.spanId,x]));
  const depth=x=>{let n=0,parent=x.parentSpanId,seen=new Set();while(byId.has(parent)&&!seen.has(parent)){seen.add(parent);n++;parent=byId.get(parent).parentSpanId;}return n;};
  const spans=all.map((x,i)=>{const offset=Math.max(0,new Date(x.startedAt)-new Date(data.startedAt)),left=Math.min(100,offset/Math.max(.001,total)*100),w=Math.min(100-left,Math.max(.1,x.durationMs/Math.max(.001,total)*100)),open=view.state.open===i;
   return {svc:x.service,op:x.operation,dur:fmt(x.durationMs)+' ms',err:x.status==='ERROR',open,exp:String(open),startLabel:x.startedAt,toggle:()=>view.setState({open:open?-1:i}),
    rowStyle:`display:grid;grid-template-columns:360px minmax(0,1fr);width:100%;padding:0;border:0;border-bottom:1px solid var(--border-weak);text-align:left;background:${open?'var(--selected)':'none'}`,
    left:`display:flex;align-items:center;gap:8px;height:36px;min-width:0;padding:0 16px 0 ${24+Math.min(depth(x),8)*16}px`,bar:`position:absolute;top:12px;height:12px;border-radius:3px;left:${left}%;width:${w}%;background:var(${x.status==='ERROR'?'--error':'--border-strong'})`,label:`position:absolute;top:7px;font-size:12px;color:var(--text-2);white-space:nowrap;${left+w>80?'right:8px':`left:calc(${left+w}% + 8px)`}`,
    attrs:fieldRows([['span.id',x.spanId],['parent.span.id',x.parentSpanId||'없음'],['span.kind',x.kind],['status',x.status],['startedAt',x.startedAt],['endedAt',x.endedAt]]),res:fieldRows([['service.name',x.service],['service.namespace',d.environment?.namespace||'']])};});
  return {...shared,qtypes:['Search','Trace ID'].map((label,i)=>({label,on:String((view.state.qt||0)===i),pick:()=>view.setState({qt:i}),style:segment(view.state.qt||0,i)})),run:()=>{if(view.state.qt===1)d.chooseTrace(d.traceId);else d.run();},
   traces:(d.result.data?.items||[]).map(x=>({id:x.traceId,start:new Date(x.startedAt).toLocaleString(),svc:x.rootService||'—',name:x.rootOperation||'—',dur:fmt(x.durationMs)+' ms',spans:data?.traceId===x.traceId?data.spans.length:'—',pick:()=>{view.setState({open:-1});d.chooseTrace(x.traceId);},on:String(d.selected===x.traceId),row:`display:grid;grid-template-columns:180px 180px 160px minmax(0,1fr) 100px 80px;min-height:44px;align-items:center;border-bottom:1px solid var(--border-weak);background:${d.selected===x.traceId?'var(--selected)':'none'}`,durStyle:'padding:0 16px;text-align:right;font-variant-numeric:tabular-nums'})),
   tv:{title:data?'요청 처리 구간':d.detail.loading?'조회 중…':d.detail.error||'요청을 선택하세요',id:data?.traceId||'—',start:data?.startedAt||'—',dur:data?fmt(total)+' ms':'—',services:data?new Set(all.map(x=>x.service)).size:'—',depth:all.length?Math.max(...all.map(depth))+1:'—',count:data?all.length:'—',spans,ruler:[0,.25,.5,.75,1].map(p=>({label:fmt(total*p)+' ms',pos:`position:absolute;top:9px;${p===1?'right:24px':`left:calc(${p*100}% + 6px)`}`}))}};
 }
 const chart=(ids,title,factor=1,unit='')=>{
  const series=ids.map(id=>d.metrics[id]?.data?.points?.map(p=>({...p,value:Number.isFinite(p.value)?p.value*factor:null}))||[]),peak=Math.max(1,...series.flat().map(p=>p.value||0)),scale=10**Math.floor(Math.log10(peak)),max=Math.ceil(peak/scale)*scale;
  const last=series[0].at(-1)?.value,error=ids.map(id=>d.metrics[id]?.error).find(Boolean);
  return {title,now:error||(!d.metrics[ids[0]]?'조회 중…':Number.isFinite(last)?fmt(last)+(unit==='%'?'':' ')+unit:'데이터 없음'),ymax:(max>=1000?fmt(max/1000)+'k':fmt(max))+(unit==='%'?'':' ')+(unit==='req/s'?'/s':unit),aria:title+' 실제 관측값. 누락 구간은 비워 둡니다.',bars:ids[0]==='request_rate'?chartBars(series[0],max):'',barsStyle:'fill:var(--border)',b1:'',b2:'',b1style:'',b2style:'',p1:chartPath(series[0],max),p2:chartPath(series[1]||[],max),p3:chartPath(series[2]||[],max),p1style:'stroke:var(--text)',p2style:'stroke:var(--text-2)',p3style:'stroke:var(--border-strong)',legend:ids.map((id,i)=>({label:id.replace('latency_','').replace('_ms',''),sw:`width:12px;height:2px;background:var(${i===0?'--text':i===1?'--text-2':'--border-strong'})`}))};
 };
 const redCharts=[chart(['request_rate'],'Requests',1,'req/s'),chart(['error_ratio'],'Error rate',100,'%'),chart(['latency_p99_ms','latency_p90_ms','latency_p50_ms'],d.route==='B1-Overview'?'지연':'서버 처리 시간',1,'ms')];
 redCharts[0].legend=[{label:`${d.service} req/s`,sw:'width:12px;height:2px;background:var(--border)'}];
 redCharts[1].legend=[{label:`${d.service} Error rate`,sw:'width:12px;height:2px;background:var(--text)'}];
 if(Number.isFinite(d.metrics.latency_p99_ms?.data?.points?.at(-1)?.value))redCharts[2].now='p99 '+redCharts[2].now;
 return {...shared,ticks:tickValues(d.range,d.route==='B1-Overview'?[0,.2,.4,.6,.8,1]:undefined),ticksShort:tickValues(d.range),redCharts,resCharts:[chart(['cpu_usage_cores'],'CPU 사용량',1,'cores'),{...chart(['unsupported'],'CPU throttling'),now:'API 미연결',ymax:'—',legend:[]},chart(['memory_working_set_bytes'],'메모리',1/1048576,'MiB')],
  kpis:[['현재 상태','미판정','ML 미연결'],['진행 중 장애','—','API 미연결'],...redCharts.map(x=>[x.title,x.now,`${d.service} 기준`])].map(([label,value,note],i)=>({label,value,note,unit:'',cell:`display:flex;flex-direction:column;gap:4px;padding:16px 20px;${i?'border-left:1px solid var(--border-weak)':''}`,valueStyle:'font-size:24px;line-height:32px;font-weight:500'})),
  red:redCharts.map((x,i)=>({...x,p1:i===0?'':x.p1})),miniNodes:[],timeline:(d.inventory||[]).map(x=>({name:x.name,segs:[{tip:'상태 이력 미연결 · 미판정',style:'flex:1;border-radius:2px;background:var(--bg2)'}]})),scoreLine2:'',scoreLine:'',scoreArea:'',stats:[],mini:[]};
}
