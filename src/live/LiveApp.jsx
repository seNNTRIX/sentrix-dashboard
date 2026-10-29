import React,{useEffect,useState} from 'react';
import {screens} from '../screens.jsx';
import {EnvironmentProvider,useEnvironment} from './EnvironmentContext.jsx';
import {DesignContext} from './DesignContext.jsx';
import {request,environmentPath,queryRange,metricDefinitions} from './api.js';
import {volumeRange,validateVolume} from './log-volume.js';
import {designValues} from './design-values.js';
import './design-binding.css';
export const connectedRoutes=new Set(['B2-ServiceMap','B1-Overview','B5-Service','B6-Trace','B7-Logs','C3-Settings','A4-Onboarding']);
function Connected({route,params,initialTheme}){
 const env=useEnvironment(),{environment}=env;
 const [service,setService]=useState(params.get('service')||'frontend'),[search,setSearch]=useState(''),[limit,setLimit]=useState(route==='B6-Trace'?'20':'100');
 const [range,setRange]=useState(()=>queryRange(Date.now()-900000,Date.now())),[rangeLabel,setRangeLabel]=useState('지난 15분'),[revision,setRevision]=useState(0);
 const [volume,setVolume]=useState({});
 const [result,setResult]=useState({loading:true}),[inventory,setInventory]=useState([]),[metrics,setMetrics]=useState({});
 const [traceId,setTraceId]=useState(params.get('traceId')||''),[selected,setSelected]=useState(''),[detail,setDetail]=useState({}),[detailRevision,setDetailRevision]=useState(0);
 const [inventoryLoading,setInventoryLoading]=useState(true),[inventoryError,setInventoryError]=useState('');
 const [sources,setSources]=useState([]),[sourceError,setSourceError]=useState('');
 const run=()=>{setRevision(n=>n+1);};
 const chooseTrace=id=>{setSelected(id);setDetailRevision(n=>n+1);};
 useEffect(()=>{setService(params.get('service')||'frontend');setSelected('');},[params.get('service'),route]);
 useEffect(()=>{
  if(!environment)return;const abort=new AbortController();setInventory([]);setInventoryLoading(true);setInventoryError('');setSources([]);setSourceError('');
  request(`${environmentPath(environment.id)}/services`,{signal:abort.signal}).then(d=>{if(!abort.signal.aborted){setInventory(d.items||[]);setInventoryLoading(false);}}).catch(e=>{if(!abort.signal.aborted){setInventoryError(e.message);setInventoryLoading(false);}});
  request(`${environmentPath(environment.id)}/data-sources`,{signal:abort.signal}).then(d=>{if(!abort.signal.aborted)setSources(d);}).catch(e=>{if(!abort.signal.aborted)setSourceError(e.message);});
  return()=>abort.abort();
 },[environment?.id,revision]);
 useEffect(()=>{
  setResult({loading:true});setVolume({});setMetrics({});setSelected(route==='B6-Trace'?(params.get('traceId')||''):'');setDetail({});
  if(!environment)return;const abort=new AbortController(),base=environmentPath(environment.id);
  const {stepSeconds,...time}=range;
  if(route==='B7-Logs'||route==='B6-Trace'){
   if(route==='B7-Logs') {
    setVolume({loading:true});
    try {
     const volumeTime=volumeRange(range);
     request(`${base}/logs/volume?${new URLSearchParams({service,search,...volumeTime})}`,{signal:abort.signal})
      .then(data=>{validateVolume(data,environment.id,service,search,volumeTime);if(!abort.signal.aborted)setVolume({data});})
      .catch(e=>{if(!abort.signal.aborted)setVolume({error:e.message});});
    } catch(e) {setVolume({error:e.message});}
   }
   const trace=route==='B6-Trace',filters={service,...time,limit:trace?Math.min(100,+limit):limit,...(trace?{}:{search})};
   request(`${base}/${trace?'traces':'logs'}?${new URLSearchParams(filters)}`,{signal:abort.signal}).then(data=>{
    if(data.environmentId!==environment.id||data.service!==service||!Array.isArray(data.items))throw new Error('조회 응답 형식이 올바르지 않습니다.');
    if(!abort.signal.aborted)setResult({data});
   }).catch(e=>{if(!abort.signal.aborted)setResult({error:e.message});});
  }else if(route==='B1-Overview'||route==='B5-Service'){
   setResult({});
   for(const [metric] of metricDefinitions)request(`${base}/metrics?${new URLSearchParams({service,metric,...range})}`,{signal:abort.signal}).then(data=>{
    if(data.service!==service||data.metric!==metric||!Array.isArray(data.points))throw new Error('지표 응답 형식이 올바르지 않습니다.');
    if(!abort.signal.aborted)setMetrics(old=>({...old,[metric]:{data}}));
   }).catch(e=>{if(!abort.signal.aborted)setMetrics(old=>({...old,[metric]:{error:e.message} }));});
  }else setResult({});
  return()=>abort.abort();
 // Filters are applied with Run query; time and service links apply immediately.
 },[environment?.id,route,range,revision,params.get('service')]);
 useEffect(()=>{
  setDetail(selected?{loading:true}:{});if(!selected||!environment)return;
  const abort=new AbortController();request(`${environmentPath(environment.id)}/traces/${encodeURIComponent(selected)}`,{signal:abort.signal})
   .then(data=>{if(data.traceId!==selected||data.environmentId!==environment.id||!Array.isArray(data.spans))throw new Error('상세 응답 형식이 올바르지 않습니다.');if(!abort.signal.aborted)setDetail({data});})
   .catch(e=>{if(!abort.signal.aborted)setDetail({error:e.message});});return()=>abort.abort();
 },[environment?.id,selected,detailRevision]);
 const changeRange=(from,to,label)=>{setRange(queryRange(from,to));setRangeLabel(label);};
 const refresh=()=>{const seconds={'지난 5분':300,'지난 15분':900,'지난 30분':1800,'지난 1시간':3600,'지난 3시간':10800,'지난 6시간':21600,'지난 12시간':43200,'지난 24시간':86400}[rangeLabel];if(seconds)setRange(queryRange(Date.now()-seconds*1000,Date.now()));else run();};
 const live={...env,route,service,setService,search,setSearch,limit,setLimit,range,rangeLabel,changeRange,refresh,run,revision,result,volume,inventory,inventoryLoading,inventoryError,metrics,traceId,setTraceId,selected,chooseTrace,detail,sources,sourceError};
 live.values=view=>designValues(view,live);
 const Screen=screens[route];
 return <DesignContext.Provider value={live}><Screen theme={initialTheme} tab={route==='C3-Settings'?'데이터 소스':undefined} live={live}/></DesignContext.Provider>;
}
function EnvironmentScreen(props){const {environment}=useEnvironment();return <Connected key={`${props.route}:${props.params.toString()}:${environment?.id||'none'}`} {...props}/>;}
export function LiveApp(props){return <EnvironmentProvider><EnvironmentScreen {...props}/></EnvironmentProvider>;}
