import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base=process.env.UI_BASE_URL || 'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let empty=false,offline=false,metricError=false,failedTest=false,raceMode=false;
let logFailure=false,traceFailure=false,detailFailure=false;
let readiness='READY', statusAge=5, statusFailure=false;
const environments=[{id:1,name:'Boutique Lab',namespace:'sentrix'},{id:2,name:'Another Lab',namespace:'other'}];
const saved={}, calls=[];
const send=(route,json,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(json)});
await page.route('**/api/v1/**',async route=>{
 const r=route.request(),u=new URL(r.url()),path=u.pathname;calls.push({path,query:u.search,method:r.method()});
 if(offline)return route.abort('connectionrefused');
 if(path==='/api/v1/environments'){
  if(r.method()==='POST') {const body=r.postDataJSON();expect(body).toEqual({name:'New Lab',namespace:'new-lab'});empty=false;const env={id:3,...body};environments.push(env);return send(route,env,201);}
  const current=Number(u.searchParams.get('page')||0);
  return send(route,{items:empty?[]:environments.slice(current,current+1),totalPages:empty?0:environments.length});
 }
 const match=path.match(/\/environments\/(\d+)\/(.*)/),id=Number(match?.[1]),resource=match?.[2];
 if(resource==='data-sources')return send(route,Object.values(saved[id]||{}));
 if(resource?.startsWith('data-sources/')){
  const type=resource.split('/')[1];saved[id]||={};
  if(r.method()==='PUT'){
   const body=r.postDataJSON();expect(typeof body.timeoutSeconds).toBe('number');
   const record={...body,id:id*10,environmentId:id,type,status:'NOT_TESTED',lastCheckedAt:null};saved[id][type]=record;return send(route,record);
  }
  const record={...saved[id][type],status:failedTest?'FAILED':'CONNECTED',lastCheckedAt:new Date().toISOString(),latencyMs:12,httpStatus:failedTest?503:200,failureCode:failedTest?'HTTP_ERROR':null};
  saved[id][type]=record;return send(route,record);
 }
 if(resource==='services')return send(route,{items:(id===2?['billing']:['frontend','checkoutservice']).map(name=>({name,kind:'Deployment',createdAt:'2026-10-01T00:00:00Z'})),queriedAt:new Date().toISOString(),dataStatus:'AVAILABLE'});
 if(resource?.startsWith('services/')&&resource.endsWith('/status')){
  if(statusFailure)return send(route,{code:'PROMETHEUS_UNAVAILABLE'},502);
  const service=resource.split('/')[1],now=Date.now();
  if(raceMode&&service==='frontend')await new Promise(resolve=>setTimeout(resolve,800));
  return send(route,{environmentId:id,service,status:readiness,queriedAt:new Date(now).toISOString(),observedAt:new Date(now-statusAge*1000).toISOString(),maxAgeSeconds:60,
   desiredReplicas:readiness==='SCALED_DOWN'?0:1,replicas:readiness==='SCALED_DOWN'?0:1,readyReplicas:readiness==='UNKNOWN'?null:readiness==='READY'?1:0,availableReplicas:readiness==='UNKNOWN'?null:readiness==='READY'?1:0,
   warnings:readiness==='UNKNOWN'?['STALE_METRICS']:[]}).catch(()=>{});
 }
 if(resource==='logs'){
  if(logFailure)return send(route,{code:'LOKI_UNAVAILABLE'},502);
  const service=u.searchParams.get('service'),search=u.searchParams.get('search');
  return send(route,{environmentId:id,service,limit:Number(u.searchParams.get('limit')),truncated:search!=='missing',warnings:[],items:search==='missing'?[]:[{timestamp:'2026-10-28T08:00:00.000000003Z',timestampNanos:'1793174400000000003',pod:'frontend-pod',container:'server',message:'<script>window.logInjected=true</script> request complete'}]});
 }
 if(resource==='traces'){
  if(traceFailure)return send(route,{code:'TEMPO_UNAVAILABLE'},502);
  return send(route,{environmentId:id,service:u.searchParams.get('service'),limitReached:true,items:u.searchParams.get('service')==='missing'?[]:[{traceId:'11111111111111111111111111111111',startedAt:'2026-10-28T08:00:00Z',durationMs:10,rootService:'frontend',rootOperation:'<script>window.traceInjected=true</script>'}]});
 }
 if(resource?.startsWith('traces/')){
  if(detailFailure)return send(route,{code:'TRACE_NOT_FOUND'},404);
  return send(route,{environmentId:id,traceId:resource.split('/')[1],durationMs:10,startedAt:'2026-10-28T08:00:00Z',warnings:['MISSING_PARENT_SPANS'],spans:[{spanId:'aaaaaaaaaaaaaaaa',parentSpanId:'bbbbbbbbbbbbbbbb',service:'frontend',operation:'<img src=x onerror=alert(1)>',kind:'SERVER',status:'UNSET',durationMs:10,startedAt:'2026-10-28T08:00:00Z',endedAt:'2026-10-28T08:00:00.010Z'}]});
 }
 if(resource==='metrics'){
  if(metricError)return send(route,{code:'PROMETHEUS_TIMEOUT'},504);
  const metric=u.searchParams.get('metric'),from=Date.parse(u.searchParams.get('from')),step=Number(u.searchParams.get('stepSeconds'));
  const service=u.searchParams.get('service');
  const values=metric==='request_rate'?[null,null,null]:metric==='cpu_usage_cores'?(raceMode?(service==='frontend'?[999,999,999]:[2,2,2]):[0,null,0]):metric==='error_ratio'?[0.01,0.02,0.03]:metric==='memory_working_set_bytes'?[41943040,44040192,46137344]:[100,150,200];
  if(raceMode&&service==='frontend')await new Promise(resolve=>setTimeout(resolve,800));
  return send(route,{metric,service,dataStatus:metric==='request_rate'?'NO_DATA':metric==='cpu_usage_cores'?'PARTIAL':'AVAILABLE',warnings:[],points:values.map((value,i)=>({timestamp:new Date(from+i*step*1000).toISOString(),value}))}).catch(()=>{});
 }
 return send(route,{},404);
});
try {
 await page.goto(base+'#B7-Logs');
 await expect(page.getByRole('heading',{name:'로그',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Query A Loki'})).toBeVisible();
 await expect(page.locator('.top-bar .search-trigger')).toBeVisible();
 await expect(page.locator('.live-shell')).toHaveCount(0);
 const logs=page.locator('[aria-labelledby="logs-h"]');
 await expect(logs).toContainText('<script>window.logInjected=true</script>');
 expect(await page.evaluate(()=>window.logInjected)).toBeUndefined();
 await expect(page.locator('.bound-notice')).toContainText('최신 100건만 표시');
 await page.getByLabel('포함 문자열').fill('missing');
 await page.getByRole('button',{name:'Run query',exact:true}).click();
 await expect(logs).toContainText('조건에 맞는 로그가 없습니다');
 logFailure=true;await page.getByRole('button',{name:'Run query',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Loki에 연결할 수 없습니다');
 await expect(logs).not.toContainText('<script>');logFailure=false;
 await page.getByRole('button',{name:'지난 15분',exact:false}).click();
 await page.getByRole('button',{name:'지난 5분',exact:true}).click();
 await expect.poll(()=>calls.filter(c=>c.path.endsWith('/logs')).at(-1)?.query).toContain('limit=100');
 const q=new URLSearchParams(calls.filter(c=>c.path.endsWith('/logs')).at(-1).query);
 expect(Date.parse(q.get('to'))-Date.parse(q.get('from'))).toBe(300000);
 await page.locator('.environment-trigger').click();
 await page.getByRole('button',{name:'Another Lab',exact:false}).click();
 await expect.poll(()=>calls.filter(c=>c.path.endsWith('/logs')).at(-1)?.path).toBe('/api/v1/environments/2/logs');
 await page.locator('.environment-trigger').click();
 await page.getByRole('button',{name:'Boutique Lab',exact:false}).click();
 await page.goto(base+'#B6-Trace?service=frontend');
 await expect(page.getByRole('heading',{name:'Trace',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'11111111111111111111111111111111',exact:true}).click();
 const trace=page.locator('[aria-labelledby="tv-h"]');
 await expect(trace).toContainText('Total spans 1');
 await expect(trace).toContainText('수집되지 않은 부모 구간');
 await trace.getByRole('button',{name:'frontend <img',exact:false}).click();
 await expect(trace).toContainText('UNSET');
 await expect(trace.locator('img')).toHaveCount(0);
 expect(await page.evaluate(()=>window.traceInjected)).toBeUndefined();
 await page.getByRole('radio',{name:'Trace ID',exact:true}).click();
 await page.getByLabel('Trace ID',{exact:true}).fill('11111111111111111111111111111111');
 detailFailure=true;await page.getByRole('button',{name:'Run query',exact:true}).click();
 await expect(trace).toContainText('해당 트레이스를 찾지 못했습니다');
 await expect(trace).not.toContainText('GET /cart');
 detailFailure=false;await page.getByRole('button',{name:'Run query',exact:true}).click();
 await expect(trace).toContainText('Total spans 1');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('radio',{name:'Search',exact:true}).click();
 traceFailure=true;await page.getByRole('button',{name:'Run query',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Tempo에 연결할 수 없습니다');
 await expect(page.getByRole('button',{name:'11111111111111111111111111111111',exact:true})).toHaveCount(0);traceFailure=false;
 await page.goto(base+'#B1-Overview');
 await expect(page.getByRole('heading',{name:'개요',exact:true})).toBeVisible();
 await expect(page.getByText('INC-0142',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Anomaly score'})).toBeVisible();
 await expect(page.locator('[aria-labelledby="score-h"]')).toContainText('ML 모델 미연결');
 const timeline=page.getByRole('region',{name:'서비스 상태',exact:true});
 await expect(timeline).toContainText('상태 이력 미연결');
 await expect(timeline.getByRole('link',{name:'checkoutservice',exact:true})).toHaveAttribute('href','#B5-Service?service=checkoutservice');
 await expect(timeline.locator('.chart-ticks > span')).toHaveCount(6);
 await expect(page.getByRole('region',{name:'서비스 준비 상태'})).toHaveCount(0);
 const requestCard=page.locator('section').filter({has:page.getByRole('heading',{name:'Requests',exact:true})});
 await expect(requestCard).toContainText('frontend req/s');
 await expect(requestCard.locator('.chart-ticks > span')).toHaveCount(3);
 for(const label of await requestCard.locator('.chart-ticks > span').allTextContents())expect(label).toMatch(/^\d{2}:\d{2}$/);
 await expect(page.getByRole('heading',{name:'지연',exact:true})).toBeVisible();

 await page.getByLabel('관측 서비스',{exact:true}).selectOption('checkoutservice');
 await expect.poll(()=>calls.filter(c=>c.path.endsWith('/metrics')).at(-1)?.query).toContain('service=checkoutservice');
 await page.getByRole('link',{name:'서비스 상세',exact:true}).click();
 await expect(page.getByRole('heading',{name:'checkoutservice',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'서비스 준비 상태'})).toContainText('준비 완료');
 statusAge=65;await page.getByRole('button',{name:'상태 새로고침'}).click();
 await expect(page.getByRole('region',{name:'서비스 준비 상태'})).toContainText('확인 불가');
 statusAge=5;statusFailure=true;await page.getByRole('button',{name:'상태 새로고침'}).click();
 await expect(page.getByRole('region',{name:'서비스 준비 상태'})).toContainText('연결할 수 없습니다');
 statusFailure=false;
 await expect(page.getByRole('heading',{name:'자원',exact:true})).toBeVisible();
 await expect(page.locator('[aria-labelledby="pod-h"]')).toContainText('Pod별 상세 API 미연결');
 metricError=true;await page.getByRole('button',{name:'새로고침',exact:true}).click();
 await expect(page.locator('[aria-labelledby="red-h"]')).toContainText('응답 시간이 초과');metricError=false;
 await page.goto(base+'#C3-Settings');
 await expect(page.getByRole('heading',{name:'설정',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Prometheus 미등록 미검사',exact:false}).click();
 const form=page.getByRole('form',{name:'prometheus 설정'});
 await form.getByLabel('이름',{exact:true}).fill('Local Prometheus');
 await form.getByLabel('접속 주소').fill('http://127.0.0.1:9090');
 await form.getByRole('button',{name:'저장 후 테스트'}).click();
 await expect(form).toContainText('연결 테스트에 성공했습니다');
 expect(saved[1].prometheus.baseUrl).toBe('http://127.0.0.1:9090');
 failedTest=true;await form.getByRole('button',{name:'연결 테스트',exact:true}).click();
 await expect(form).toContainText('마지막 검사 실패');
 failedTest=false;await form.getByRole('button',{name:'연결 테스트',exact:true}).click();
 await expect(form).toContainText('마지막 검사 성공');
 await page.reload();await page.getByRole('button',{name:'Prometheus http://127.0.0.1:9090 마지막 검사 성공',exact:false}).click();
 await expect(page.getByRole('form',{name:'prometheus 설정'}).getByLabel('접속 주소')).toHaveValue('http://127.0.0.1:9090');
 await page.getByRole('button',{name:'프로필 메뉴'}).click();
 await page.getByRole('menuitem',{name:'테마 라이트'}).click();
 await expect(page.locator('.screen-root')).toHaveAttribute('data-theme','dark');
 await page.keyboard.press('Escape');await page.reload();
 await expect(page.locator('.screen-root')).toHaveAttribute('data-theme','dark');
 offline=true;await page.reload();await expect(page.getByRole('alert')).toContainText('연결할 수 없습니다');
 offline=false;empty=true;await page.getByRole('button',{name:'다시 연결'}).click();
 await page.goto(base+'#A4-Onboarding');
 await page.getByLabel('환경 이름',{exact:true}).fill('New Lab');
 await page.getByLabel('Namespace',{exact:true}).fill('new-lab');
 await page.getByRole('button',{name:'환경 등록',exact:true}).click();
 await expect(page.getByRole('heading',{name:'설정',exact:true})).toBeVisible();
 await expect(page.locator('.environment-trigger')).toContainText('New Lab');
 expect(errors).toEqual([]);
 fs.mkdirSync('artifacts/design-restored',{recursive:true});
 console.log('PASS original design + APIs: logs, trace waterfall/ID retry, metrics, environment/time changes, save/test/reload, registration, XSS and responsive layout.');
} catch(error){console.error((await page.locator('body').innerText()).slice(-5000));throw error;}finally{await browser.close();}
