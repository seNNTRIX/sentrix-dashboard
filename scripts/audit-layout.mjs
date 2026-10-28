import {chromium} from '@playwright/test';
import fs from 'node:fs';
const baseURL=process.env.UI_BASE_URL || 'http://127.0.0.1:5173/';
fs.mkdirSync('artifacts/ui-after',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const page=await browser.newPage();
page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR'))errors.push(m.text())});
try {
const failures=[];
for(const width of [390,768,1440]){
 await page.setViewportSize({width,height:960});
 for(const file of fs.readdirSync('design/screens').filter(f=>/^(A|B|C|Main).*\.html$/.test(f))){
  const route=file.replace('.dc.html','');
  await page.goto(baseURL+'?demo=1&audit='+width+'#'+route,{waitUntil:'domcontentloaded'});
  await page.locator('h1').first().waitFor();
  const result=await page.evaluate(()=>{
   const main=document.querySelector('main'), b=main?.getBoundingClientRect();
   const outside=[...document.querySelectorAll('main button, main input, main h1, main h2, header button')].filter(el=>{
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return false;
    for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement)if(['auto','scroll'].includes(getComputedStyle(p).overflowX))return false;
    return r.left < -1 || r.right>innerWidth+1;
   }).map(e=>e.textContent.trim().slice(0,50)||e.getAttribute('aria-label'));
   return {scroll:document.documentElement.scrollWidth, viewport:innerWidth, main:b?{width:b.width,left:b.left}:null, outside};
  });
  if(result.scroll>width || result.outside.length || result.main?.width<width/2 || await page.getByText('화면을 불러오지 못했습니다',{exact:true}).count())failures.push({route,width,...result});
  if(['B1-Overview','B2-ServiceMap','B3-Incidents','B4-Incident','C3-Settings'].includes(route))await page.screenshot({path:`artifacts/ui-after/${route}-${width}.png`,fullPage:true});
 }
 console.log('Completed viewport',width);
}
console.log(JSON.stringify({errors:[...new Set(errors)],failures},null,2));

if(errors.length||failures.length)process.exitCode=1;

} finally { await browser.close(); }
