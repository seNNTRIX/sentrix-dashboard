import {WorkspacePage} from './WorkspacePage.jsx';
import {publicView} from './public-view.js';
import React,{useEffect,useState} from 'react';
import {screens} from '../screens.jsx';
import {EnvironmentProvider,useEnvironment} from './EnvironmentContext.jsx';
import {DesignContext} from './DesignContext.jsx';
import {request,environmentPath,queryRange,metricDefinitions} from './api.js';
import {volumeRange,validateVolume} from './log-volume.js';
import {pollRecords} from './Incidents.jsx';
import {designValues} from './design-values.js';
import './design-binding.css';
export const connectedRoutes=new Set(['A1-Login','A2-Signup','A3-Reset','B3-Incidents','B4-Incident','B2-ServiceMap','B1-Overview','B5-Service','B6-Trace','B7-Logs','C3-Settings','A4-Onboarding','B8-Model','C1-Notifications','C2-AlertRules','C4-Team','C5-Account','C6-Audit','C7-States']);
function Connected({route,params,initialTheme}){
 const env=useEnvironment(),{environment}=env;
 const [serviceChoice,setService]=useState(params.get('service')||'frontend'),[search,setSearch]=useState(''),[limit,setLimit]=useState(route==='B6-Trace'?'20':'100');
 const [range,setRange]=useState(()=>{const end=Date.parse(params.get('at'));return Number.isFinite(end)?queryRange(end-900000,end):queryRange(Date.now()-(route==='B3-Incidents'?86400000:900000),Date.now());}),[rangeLabel,setRangeLabel]=useState(params.has('at')?'장애 발생 구간':route==='B3-Incidents'?'지난 24시간':'지난 15분'),[revision,setRevision]=useState(0);
 const [volume,setVolume]=useState({});
 const [result,setResult]=useState({loading:true}),[inventory,setInventory]=useState([]),[metrics,setMetrics]=useState({});
 const [traceId,setTraceId]=useState(params.get('traceId')||''),[selected,setSelected]=useState(''),[detail,setDetail]=useState({}),[detailRevision,setDetailRevision]=useState(0);
 const [inventoryLoading,setInventoryLoading]=useState(true),[inventoryError,setInventoryError]=useState('');
 const [sources,setSources]=useState([]),[sourceError,setSourceError]=useState('');
 const [policy,setPolicy]=useState(null);
 const applicationServices=policy?.applicationServices;
 const serviceNames=inventory.map(item=>item.name).filter(name=>!applicationServices||applicationServices.includes(name));
 const explore=route==='B6-Trace'||route==='B7-Logs';
 const linkedService=params.get('service');
 // Historical trace links can refer to a deployment no longer in the inventory.
 if(explore&&linkedService&&!serviceNames.includes(linkedService))serviceNames.push(linkedService);
 const exploreService=explore?(serviceNames.includes(serviceChoice)?serviceChoice:serviceNames[0]||''):null;
 const service=exploreService??serviceChoice;
 const [homeChoice,setHomeChoice]=useState(params.get('service')||'frontend');
 const homeService=route==='B1-Overview'?(serviceNames.includes(homeChoice)?homeChoice:serviceNames[0]||''):null;
 const metricService=homeService??service;
 const [loadedMetricService,setLoadedMetricService]=useState(null);
 useEffect(()=>{setMetrics({});setLoadedMetricService(metricService);},[metricService]);
 const run=()=>{setRevision(n=>n+1);};
 const chooseTrace=id=>{setSelected(id);setDetailRevision(n=>n+1);};
 useEffect(()=>{setService(params.get('service')||'frontend');setSelected('');},[params.get('service'),route]);
 useEffect(()=>{
  if(!environment)return;const abort=new AbortController();setInventoryLoading(true);setInventoryError('');setSources([]);setSourceError('');
  request(`${environmentPath(environment.id)}/services`,{signal:abort.signal}).then(d=>{if(!abort.signal.aborted){setInventory(d.items||[]);setInventoryLoading(false);}}).catch(e=>{if(!abort.signal.aborted){setInventoryError(e.message);setInventoryLoading(false);}});
  if(!publicView)request(`${environmentPath(environment.id)}/data-sources`,{signal:abort.signal}).then(d=>{if(!abort.signal.aborted)setSources(d);}).catch(e=>{if(!abort.signal.aborted)setSourceError(e.message);});
  return()=>abort.abort();
 },[environment?.id,revision]);
 useEffect(()=>{
  setResult({loading:true});setVolume({});setSelected(route==='B6-Trace'?(params.get('traceId')||''):'');setDetail({});
  if(!environment)return;const abort=new AbortController(),base=environmentPath(environment.id);
  const {stepSeconds,...time}=range;
  if(explore){
   if(!service){setResult({});return ()=>abort.abort();}
   if(route==='B7-Logs') {
    setVolume({loading:true});
    try {
     const volumeTime=volumeRange(range);
     request(`${base}/logs/volume?${new URLSearchParams({service,search,...volumeTime})}`,{signal:abort.signal})
      .then(data=>{validateVolume(data,environment.id,service,search,volumeTime);if(!abort.signal.aborted)setVolume({data});})
      .catch(e=>{if(!abort.signal.aborted)setVolume({error:e.message});});
    } catch(e) {setVolume({error:e.message});}
   }
   if(publicView&&route==='B7-Logs'){setResult({restricted:true});return ()=>abort.abort();}
   const trace=route==='B6-Trace',filters={service,...time,limit:trace?Math.min(100,+limit):limit,...(trace?{}:{search})};
   request(`${base}/${trace?'traces':'logs'}?${new URLSearchParams(filters)}`,{signal:abort.signal}).then(data=>{
    if(data.environmentId!==environment.id||data.service!==service||!Array.isArray(data.items))throw new Error('조회 응답 형식이 올바르지 않습니다.');
    if(!abort.signal.aborted)setResult({data});
   }).catch(e=>{if(!abort.signal.aborted)setResult({error:e.message});});
  }else if(route==='B1-Overview'||route==='B5-Service'){
   setResult({});
   if(!metricService)return ()=>abort.abort();
   if(environment.recorded){
    request(base+'/observed-calls?'+new URLSearchParams({service:metricService}),{signal:abort.signal}).then(rows=>{
     if(!Array.isArray(rows))throw Error('관측 구간 응답을 확인하세요.');
     const data={};
     const byTime=new Map(rows.map(row=>[Date.parse(row.timestamp),row]));
     for(const metric of ['rate','error','p90']){
      const points=[];
      for(let t=Date.parse(range.from);t<Date.parse(range.to);t+=range.stepSeconds*1000){
       points.push({timestamp:new Date(t).toISOString(),value:byTime.get(Math.floor(t/10000)*10000)?.[metric]??null});
      }
      data[metric]={data:{points}};
     }
     if(!abort.signal.aborted)setMetrics(data);
    }).catch(e=>{if(!abort.signal.aborted)setMetrics(Object.fromEntries(['rate','error','p90'].map(id=>[id,{error:e.message}])));});
   }else
   for(const [metric] of metricDefinitions)request(`${base}/metrics?${new URLSearchParams({service:metricService,metric,...range})}`,{signal:abort.signal}).then(data=>{
    if(data.service!==metricService||data.metric!==metric||!Array.isArray(data.points))throw new Error('지표 응답 형식이 올바르지 않습니다.');
    if(!abort.signal.aborted)setMetrics(old=>({...old,[metric]:{data}}));
   }).catch(e=>{if(!abort.signal.aborted)setMetrics(old=>({...old,[metric]:{error:e.message} }));});
  }else setResult({});
  return()=>abort.abort();
 // Filters are applied with Run query; time and service links apply immediately.
 },[environment?.id,route,range,revision,params.get('service'),homeService,exploreService]);
 useEffect(()=>{
  setDetail(selected?{loading:true}:{});if(!selected||!environment)return;
  const abort=new AbortController();request(`${environmentPath(environment.id)}/traces/${encodeURIComponent(selected)}`,{signal:abort.signal})
   .then(data=>{if(data.traceId!==selected||data.environmentId!==environment.id||!Array.isArray(data.spans))throw new Error('상세 응답 형식이 올바르지 않습니다.');if(!abort.signal.aborted)setDetail({data});})
   .catch(e=>{if(!abort.signal.aborted)setDetail({error:e.message});});return()=>abort.abort();
 },[environment?.id,selected,detailRevision]);
 const [overview,setOverview]=useState(null);
 useEffect(()=>{
  if(location.pathname!=='/display'||environment?.id!==1||!['B1-Overview','B2-ServiceMap','B6-Trace','B7-Logs','B8-Model','C2-AlertRules','C3-Settings','C7-States'].includes(route))return;
  const abort=new AbortController();
  fetch('/display-policy',{signal:abort.signal}).then(r=>r.ok?r.json():null).then(x=>{
   if(!abort.signal.aborted)setPolicy(x);
  }).catch(()=>{});
  return ()=>abort.abort();
 },[environment?.id,route]);
 useEffect(()=>{
  if(!['B1-Overview','B2-ServiceMap','B5-Service'].includes(route)||!environment)return;
  const id=environment.id;
  setOverview(null);
  return pollRecords(new AbortController(),async signal=>{
   try {
    const data=await request(environmentPath(id)+'/overview?limit=100',{signal});
    if(data.environmentId!==id||!Number.isSafeInteger(data.openIncidents)||!Array.isArray(data.recentWindows)) throw new Error('환경 요약 형식을 확인해 주세요.');
    if(!signal.aborted)setOverview(data);
   } catch(e){if(!signal.aborted)setOverview({environmentId:id,error:e.message});}
  });
 },[environment?.id,route,revision]);
 useEffect(()=>{
  if(location.pathname!=='/display'||!['B1-Overview','B2-ServiceMap','B5-Service'].includes(route)||params.has('incidentId')||params.has('traceId')||!rangeLabel.startsWith('지난 '))return;
  const duration=Date.parse(range.to)-Date.parse(range.from);
  const timer=setInterval(()=>{if(!document.hidden)setRange(queryRange(Date.now()-duration,Date.now()));},30000);
  return ()=>clearInterval(timer);
 },[route,rangeLabel,environment?.id]);
 const changeRange=(from,to,label)=>{setRange(queryRange(from,to));setRangeLabel(label);};
 const refresh=()=>{const seconds={'지난 5분':300,'지난 15분':900,'지난 30분':1800,'지난 1시간':3600,'지난 3시간':10800,'지난 6시간':21600,'지난 12시간':43200,'지난 24시간':86400}[rangeLabel];if(seconds)setRange(queryRange(Date.now()-seconds*1000,Date.now()));else run();};
 const live={...env,publicView,modelVersion:policy?.modelVersion,settingsTab:params.get('tab'),threshold:policy?.threshold,applicationServices:policy?.applicationServices,overview:overview?.environmentId===environment?.id?overview:null,incidentId:params.get("incidentId"),jobId:params.get("jobId"),route,service,setService,search,setSearch,limit,setLimit,range,rangeLabel,changeRange,refresh,run,revision,result,volume,inventory,inventoryLoading,inventoryError,serviceNames,metricService,setHomeChoice,metrics:loadedMetricService===metricService?metrics:{},traceId,setTraceId,selected,chooseTrace,detail,sources,sourceError};
 live.values=view=>designValues(view,live);
 const Screen=screens[route]||WorkspacePage;
 return <DesignContext.Provider value={live}><Screen theme={initialTheme} tab={route==='C3-Settings'?'데이터 소스':undefined} live={live}/></DesignContext.Provider>;
}
function EnvironmentScreen(props){const {environment,loading}=useEnvironment();if(location.pathname==='/display'&&loading&&!environment)return <p role="status" className="bound-notice">관측 환경 조회 중…</p>;return <Connected key={`${props.route}:${props.params.toString()}:${environment?.id||'none'}`} {...props}/>;}
export function LiveApp(props){return <EnvironmentProvider><EnvironmentScreen {...props}/></EnvironmentProvider>;}
