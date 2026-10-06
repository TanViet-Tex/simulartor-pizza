import {chromium} from '@playwright/test';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:360,height:640}});
 page.on('pageerror',error=>console.log('PAGEERROR',error.stack));
 await page.goto('http://127.0.0.1:4175/?mode=shop&perf=1');
 const tap=async(id,menu=false)=>{await page.waitForFunction(({id,menu})=>JSON.parse(document.querySelector('canvas')?.dataset[menu?'menuTargets':'controls']||'[]').some(c=>c.id===id&&!c.disabled&&c.enabled!==false),{id,menu});const p=await page.evaluate(({id,menu})=>{const c=document.querySelector('canvas'),b=c.getBoundingClientRect(),t=JSON.parse(c.dataset[menu?'menuTargets':'controls']).find(t=>t.id===id);return{x:b.x+(t.x+t.width/2)*b.width/360,y:b.y+(t.y+t.height/2)*b.height/640};},{id,menu});await page.mouse.click(p.x,p.y);};
 await tap('summary-tab-market');
 for(const tab of ['market','stock']){
  if(tab==='stock')await tap('summary-tab-stock');
  await page.waitForTimeout(300);
  await page.screenshot({path:`_bmad-output/implementation-artifacts/scroll-verification/${tab}-start.png`,timeout:60000});
  await page.evaluate(()=>window.pizzaPerformance.reset());
  const before=await page.evaluate(()=>({snapshot:window.pizzaPerformance.snapshot(),keys:Object.keys(window.pizzaPerformance.game.textures.list).filter(k=>/^(market|stock)-(window|list)/.test(k))}));
  await page.mouse.move(120,475);await page.mouse.down();
  for(let i=1;i<=24;i++){await page.mouse.move(120,475-i*9);await page.waitForTimeout(20);}
  await page.mouse.up();await page.waitForTimeout(100);
  const after=await page.evaluate(tab=>({snapshot:window.pizzaPerformance.snapshot(),keys:Object.keys(window.pizzaPerformance.game.textures.list).filter(k=>/^(market|stock)-(window|list)/.test(k)),scroll:JSON.parse(document.querySelector('canvas').dataset[tab+'Scroll']||'null'),screen:document.querySelector('canvas').dataset.screen,tab:document.querySelector('canvas').dataset.summaryTab}),tab);
  console.log(JSON.stringify({tab,before,after}));
  await page.mouse.move(120,350);await page.mouse.wheel(0,10000);await page.waitForTimeout(150);
  await page.screenshot({path:`_bmad-output/implementation-artifacts/scroll-verification/${tab}-end.png`,timeout:60000});
 }
}finally{await browser.close();}
