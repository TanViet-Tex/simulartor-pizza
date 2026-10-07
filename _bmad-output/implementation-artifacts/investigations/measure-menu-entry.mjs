import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:360,height:640}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4175/?perf=1');
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.menuTargets?.includes('menu-start'),{timeout:30000});
 await page.waitForFunction(()=>!JSON.parse(document.querySelector('canvas').dataset.menuTargets).find(t=>t.id==='menu-start').disabled);
 const first=await page.evaluate(()=>{
  const game=window.pizzaPerformance.game,marks={};window.entryMarks=marks;
  game.events.on('poststep',()=>{const scene=game.scene.getScene('CozyScene');if(scene&&!marks.attached){marks.attached=true;marks.attachedAt=performance.now();const create=scene.create;scene.create=function(){marks.createStarted=performance.now();return create.call(this);};scene.events.on('create',()=>marks.createComplete=performance.now());}});
  const canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect(),t=JSON.parse(canvas.dataset.menuTargets).find(t=>t.id==='menu-start');
  marks.click=performance.now();return {x:r.x+(t.x+t.width/2)*r.width/360,y:r.y+(t.y+t.height/2)*r.height/640};
 });
 await page.mouse.click(first.x,first.y);
 await page.waitForFunction(()=>window.entryMarks.createComplete,{timeout:60000});
 console.log(JSON.stringify(await page.evaluate(()=>({marks:window.entryMarks,assets:performance.getEntriesByType('resource').filter(e=>e.startTime>=window.entryMarks.click).map(e=>({name:decodeURI(e.name.split('/assets/')[1]??e.name),ms:Math.round(e.duration),bytes:e.decodedBodySize})),snapshot:window.pizzaPerformance.snapshot()})),null,2));
 console.log(JSON.stringify({errors}));
 await page.evaluate(()=>{window.pizzaPerformance.game.scene.getScene('CozyScene').returnToMenu();});
 await page.waitForFunction(()=>JSON.parse(document.querySelector('canvas').dataset.menuTargets||'[]').some(t=>t.id==='menu-continue'&&!t.disabled));
 const resume=await page.evaluate(()=>{const marks=window.entryMarks;for(const key of Object.keys(marks))delete marks[key];marks.attached=true;const manager=window.pizzaPerformance.game.scene,add=manager.add;manager.add=function(key,scene,...args){if(key==='CozyScene'){const create=scene.create;scene.create=function(){marks.createStarted=performance.now();const result=create.call(this);marks.createComplete=performance.now();return result;};}return add.call(this,key,scene,...args);};const c=document.querySelector('canvas'),r=c.getBoundingClientRect(),t=JSON.parse(c.dataset.menuTargets).find(t=>t.id==='menu-continue');marks.click=performance.now();return{x:r.x+(t.x+t.width/2)*r.width/360,y:r.y+(t.y+t.height/2)*r.height/640};});
 await page.mouse.click(resume.x,resume.y);
 await page.waitForFunction(()=>window.entryMarks.createComplete);
 console.log(JSON.stringify(await page.evaluate(()=>({warmContinue:window.entryMarks})),null,2));
} finally {await browser.close();}
