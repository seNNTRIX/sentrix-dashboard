import {chromium,expect} from '@playwright/test';
const base=process.env.UI_BASE_URL||'http://127.0.0.1:5176/';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const time='2026-11-22T00:00:00Z';
const incident={id:'incident-1',environmentId:1,source:'MANUAL',status:'OPEN',title:'API 연동 테스트',service:'frontend',occurredAt:time,createdAt:time,resolvedAt:null};
const jobs=['SUCCEEDED','RUNNING','QUEUED','BLOCKED_MODEL_UNAVAILABLE','FAILED','CANCELLED'].map((status,i)=>({id:`job-${i+1}`,incidentId:incident.id,environmentId:1,namespace:'sentrix',status,reason:null,createdAt:time,updatedAt:time,windowStart:'2026-11-21T23:59:30Z',windowEnd:time,contractVersion:'v1',featureSchemaVersion:'test-v1',modelVersion:'test-model',startedAt:null,finishedAt:null}));
const result={jobId:'job-1',environmentId:1,namespace:'sentrix',contractVersion:'v1',featureSchemaVersion:'test-v1',modelVersion:'test-model',windowStart:jobs[0].windowStart,windowEnd:time,decision:'ANOMALY',score:0.8,candidates:[{rank:1,kind:'EDGE',source:'frontend',target:'catalog',faultType:'NETWORK_DELAY',score:2.5,evidence:['<script>window.resultInjected=true</script>']},{rank:2,kind:'NODE',service:'catalog',faultType:'CPU',score:0.4,evidence:[]}]};
let resultMode='normal',delayResult=false,resultCalls=0;
const send=(route,value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
await page.route('**/api/v1/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname;
 if(path==='/api/v1/environments')return send(route,{items:[{id:1,name:'Test environment',namespace:'sentrix'}],totalPages:1});
 if(path.endsWith('/services'))return send(route,{items:[{name:'frontend'}]});
 if(path.endsWith('/data-sources'))return send(route,[]);
 if(path.endsWith('/incidents/incident-1'))return send(route,incident);
 if(path.endsWith('/rca-jobs'))return send(route,{items:jobs,totalPages:1});
 const match=path.match(/\/rca-jobs\/(job-\d+)(\/result|\/cancel)?$/);
 if(match){
  const job=jobs.find(j=>j.id===match[1]);
  if(match[2]==='/cancel'){job.status='CANCELLED';job.reason='CANCELLED_BY_USER';return send(route,job);}
  if(match[2]==='/result'){
   resultCalls++;
   if(delayResult)await new Promise(resolve=>setTimeout(resolve,400));
   const body=resultMode==='wrong'?{...result,environmentId:2}:resultMode==='abstain'?{...result,decision:'ABSTAIN',score:null,candidates:[],abstainReason:'INSUFFICIENT_DATA'}:result;
   return send(route,body).catch(()=>{});
  }
  return send(route,job);
 }
 return send(route,{},404);
});
try{
 await page.goto(base+'#B4-Incident?incidentId=incident-1');
 const history=page.getByRole('region',{name:'분석 작업 이력'}),results=page.getByRole('region',{name:'RCA 결과'});
 await expect(page.getByRole('heading',{name:'API 연동 테스트'})).toBeVisible();
 for(const label of ['완료','분석 중','실행 대기','모델 미연결 · 대기','실패','취소됨'])await expect(history.getByRole('cell',{name:label,exact:true})).toBeVisible();
 await expect(history.getByRole('button',{name:'요청 취소',exact:true}).filter({visible:true})).toHaveCount(6);
 expect(await history.getByRole('button',{name:'요청 취소',exact:true}).evaluateAll(nodes=>nodes.filter(n=>!n.disabled).length)).toBe(3);
 await history.getByRole('button',{name:'job-1',exact:true}).click();
 await expect(results).toContainText('호출 경로 · frontend → catalog');
 await expect(results).toContainText('서비스 · catalog');
 await expect(results).toContainText('2.5');
 await expect(results).toContainText('<script>window.resultInjected=true</script>');
 expect(await page.evaluate(()=>window.resultInjected)).toBeUndefined();
 await expect(results).not.toContainText('80%');
 resultMode='abstain';await page.getByRole('button',{name:'기록·분석 새로고침'}).click();
 await expect(results).toContainText('판정 보류');await expect(results).toContainText('INSUFFICIENT_DATA');await expect(results).not.toContainText('frontend → catalog');
 resultMode='wrong';await page.getByRole('button',{name:'기록·분석 새로고침'}).click();
 await expect(history.getByRole('alert')).toContainText('조회 대상');await expect(results).not.toContainText('판정 보류');
 await history.getByRole('button',{name:'job-4',exact:true}).click();
 await expect(history).toContainText('모델 미연결로 이 요청의 분석은 실행되지 않았습니다.');
 const count=resultCalls;await expect(results).toContainText('완료된 분석 결과가 없습니다');expect(resultCalls).toBe(count);
 resultMode='normal';delayResult=true;
 const pending=page.waitForRequest(req=>req.url().endsWith('/job-1/result'));
 await history.getByRole('button',{name:'job-1',exact:true}).click();await pending;
 await history.getByRole('button',{name:'job-4',exact:true}).click();
 await expect(history.getByLabel('선택한 분석 작업')).toContainText('job-4');
 await page.waitForTimeout(500);await expect(results).not.toContainText('frontend → catalog');
 await history.getByRole('row').filter({hasText:'job-2'}).getByRole('button',{name:'요청 취소'}).click();
 await expect(history.getByRole('row').filter({hasText:'job-2'})).toContainText('취소됨');
 expect(errors).toEqual([]);
 console.log('Analysis API UI fixtures passed: six states, cancellation, stored results, stale response, identity validation and escaped evidence.');
}finally{await browser.close();}
