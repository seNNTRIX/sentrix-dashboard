import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const base=process.env.UI_BASE_URL || 'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let empty=false,offline=false,metricError=false,failedTest=false,raceMode=false;
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
 await page.goto(base);
 await expect(page.getByRole('heading',{name:'서비스별 개요'})).toBeVisible();
 await expect(page.getByLabel('관측 환경',{exact:true})).toHaveValue('1');
 await expect(page.locator('[data-metric=cpu_usage_cores] .metric-value')).toHaveText('0');
 await expect(page.locator('[data-metric=cpu_usage_cores]')).toContainText('일부 데이터 누락');
 await expect(page.locator('[data-metric=request_rate]')).toContainText('계산 가능한 데이터가 없습니다');
 await expect(page.getByText('INC-0142',{exact:true})).toHaveCount(0);
 await page.getByLabel('조회 기간',{exact:true}).selectOption('86400');
 await expect.poll(()=>calls.filter(c=>c.path.endsWith('/metrics')).at(-1)?.query).toContain('stepSeconds=60');
 await page.getByLabel('조회 기간',{exact:true}).selectOption('custom');
 await page.getByLabel('시작',{exact:true}).fill('2026-10-28T12:00');
 await page.getByLabel('끝',{exact:true}).fill('2026-10-28T11:00');
 await page.getByRole('button',{name:'기간 적용'}).click();
 await expect(page.getByRole('alert')).toContainText('최대 24시간');
 raceMode=true;await page.getByRole('button',{name:'지표 새로고침'}).click();
 await page.getByLabel('서비스',{exact:true}).selectOption('checkoutservice');
 await expect(page).toHaveURL(/service=checkoutservice/);
 await expect(page.locator('[data-metric=cpu_usage_cores] .metric-value')).toHaveText('2');
 await page.waitForTimeout(900); // Allow the deliberately delayed old response to arrive.
 await expect(page.locator('[data-metric=cpu_usage_cores] .metric-value')).toHaveText('2');raceMode=false;
 await page.getByLabel('관측 환경',{exact:true}).selectOption('2');
 await expect(page.getByText('이 환경에서 checkoutservice을 찾지 못했습니다.',{exact:false})).toBeVisible();
 await page.getByLabel('서비스',{exact:true}).selectOption('billing');
 await expect.poll(()=>calls.filter(c=>c.path.endsWith('/metrics')).at(-1)?.path).toContain('/2/metrics');
 metricError=true;await page.getByRole('button',{name:'지표 새로고침'}).click();
 await expect(page.locator('[data-metric=cpu_usage_cores]')).toContainText('응답 시간이 초과');
 await expect(page.locator('[data-metric=cpu_usage_cores] .metric-value')).toHaveCount(0);
 metricError=false;
 await page.goto(base+'#C3-Settings');
 const form=page.getByRole('form',{name:'prometheus 설정'});
 await form.getByLabel('접속 주소').fill('http://127.0.0.1:9090');
 await form.getByRole('button',{name:'저장 후 테스트'}).click();
 await expect(form).toContainText('연결 테스트에 성공했습니다');
 await page.reload();
 await expect(form.getByLabel('접속 주소')).toHaveValue('http://127.0.0.1:9090');
 await expect(form).toContainText('마지막 검사 성공');
 failedTest=true;await form.getByRole('button',{name:'연결 테스트',exact:true}).click();
 await expect(form).toContainText('마지막 검사 실패');
 await expect(form).toContainText('서버 응답 오류');
 await page.getByLabel('관측 환경',{exact:true}).selectOption('1');
 await expect(form.getByLabel('접속 주소')).toHaveValue('');
 await expect(form).toContainText('미등록');
 fs.mkdirSync('artifacts/live',{recursive:true});
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.getByLabel('관측 환경',{exact:true}).evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(0);
  await page.screenshot({path:`artifacts/live/settings-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.goto(base+'#B1-Overview');
 await expect(page.locator('[data-metric=cpu_usage_cores] .metric-value')).toHaveText('0');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  await page.screenshot({path:`artifacts/live/overview-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('button',{name:'테마 변경'}).click();
 await expect(page.locator('.screen-root')).toHaveAttribute('data-theme','dark');
 await page.reload();await expect(page.locator('.screen-root')).toHaveAttribute('data-theme','dark');
 await page.screenshot({path:'artifacts/live/overview-dark.png',fullPage:true});
 offline=true;await page.reload();
 await expect(page.getByRole('heading',{name:'백엔드 연결 확인'})).toBeVisible();
 await expect(page.getByRole('alert')).toContainText('연결할 수 없습니다');
 offline=false;empty=true;await page.getByRole('button',{name:'다시 연결'}).click();
 await expect(page.getByRole('heading',{name:'관측 환경 설정'})).toBeVisible();
 await page.getByLabel('환경 이름',{exact:true}).fill('New Lab');
 await page.getByLabel('Namespace',{exact:true}).fill('new-lab');
 await page.getByRole('button',{name:'환경 등록',exact:true}).click();
 await expect(page.getByRole('heading',{name:'데이터 소스 설정'})).toBeVisible();
 await expect(page.getByLabel('관측 환경',{exact:true})).toHaveValue('3');
 expect(errors).toEqual([]);
 console.log('API UI: pagination, environment isolation, metrics/null/zero, ranges, errors, save/test/reload, registration and responsive layouts passed.');
} catch(error) { fs.mkdirSync('artifacts/live',{recursive:true}); await page.screenshot({path:'artifacts/live/failure.png',fullPage:true}); console.error(await page.locator('body').innerText()); throw error; } finally {await browser.close();}
