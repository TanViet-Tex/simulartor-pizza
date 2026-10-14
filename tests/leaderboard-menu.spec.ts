import {test,expect,type Page} from '@playwright/test';

async function tap(page:Page,id:string,menu=true){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((row:{id:string;disabled?:boolean;enabled?:boolean})=>row.id===id&&(menu?!row.disabled:row.enabled)),{timeout:20000}).toBe(true);
  const row=JSON.parse(await canvas.getAttribute(attr)??'[]').find((row:{id:string})=>row.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(row.x+row.width/2)*b.width/360,b.y+(row.y+row.height/2)*b.height/640);
}
const name=(page:Page)=>page.getByRole('textbox',{name:'Tên người chơi'});
async function boot(page:Page){await page.goto('/');await expect(page.locator('canvas')).toHaveAttribute('data-menu-dialog','none',{timeout:30000});}

test('name entry validates, cancels without a campaign and starts once with normalized saved name',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/leaderboard',route=>route.fulfill({json:{ok:true,entries:[],self:null}}));
  await boot(page);const canvas=page.locator('canvas');
  await tap(page,'menu-start');await expect(canvas).toHaveAttribute('data-menu-dialog','player-name');
  await name(page).fill('x');await name(page).press('Enter');await expect(canvas).toHaveAttribute('data-player-name-feedback',/2–20/);
  await name(page).press('Escape');await expect(name(page)).toHaveCount(0);await expect(canvas).toHaveAttribute('data-menu-has-session','false');
  await tap(page,'menu-start');await name(page).fill('  Người   chơi  ');await name(page).press('Enter');
  await expect(canvas).toHaveAttribute('data-screen','game',{timeout:30000});await expect(name(page)).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('pizza-leaderboard-player-v1')!).profile.name)).toBe('Người chơi');
  await page.reload();await expect(canvas).toHaveAttribute('data-menu-dialog','none',{timeout:30000});await tap(page,'menu-start');
  await expect(canvas).toHaveAttribute('data-menu-dialog','new-session');await expect(name(page)).toHaveCount(0);
  await tap(page,'menu-new-cancel');await tap(page,'menu-continue');await expect(canvas).toHaveAttribute('data-screen','game');await expect(name(page)).toHaveCount(0);
  await page.reload();await expect(canvas).toHaveAttribute('data-menu-dialog','none',{timeout:30000});await tap(page,'menu-start');await tap(page,'menu-new-confirm');
  await expect(name(page)).toHaveValue('Người chơi');await name(page).press('Escape');await expect(canvas).toHaveAttribute('data-menu-has-session','true');
  expect(errors).toEqual([]);
});

test('online rows paginate safely, highlight own rank and refresh reports unavailable instead of fake rows',async({page},info)=>{
  const profile={id:'11111111-1111-4111-8111-111111111111',token:'a'.repeat(64),name:'Tên của tôi',sequence:1};
  await page.addInitScript(profile=>localStorage.setItem('pizza-leaderboard-player-v1',JSON.stringify({profile,pending:null})),profile);
  const entries=Array.from({length:10},(_,i)=>({id:i===6?profile.id:String(i),name:i===6?profile.name:i===0?'<script>bad</script>':`Người chơi ${i+1}`,cash:100000-i*1000,day:i+1,rank:i+1}));
  let unavailable=false;
  await page.route('**/api/leaderboard',route=>route.fulfill(unavailable?{status:503,json:{code:'unconfigured'}}:{json:{entries,self:entries[6]}}));
  await boot(page);await tap(page,'menu-leaderboard');const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-leaderboard')??'{}').state).toBe('ready');
  expect(JSON.parse((await canvas.getAttribute('data-leaderboard'))!).visible).toHaveLength(5);
  expect(JSON.parse((await canvas.getAttribute('data-labels'))!).some((label:{text:string})=>label.text.includes('Bạn: #7'))).toBe(true);
  await page.screenshot({path:info.outputPath('leaderboard-first-page.png')});
  await tap(page,'leaderboard-next');expect(JSON.parse((await canvas.getAttribute('data-leaderboard'))!).visible.some((row:{id:string})=>row.id===profile.id)).toBe(true);
  await page.screenshot({path:info.outputPath('leaderboard-own-row.png')});
  expect(await page.evaluate(()=>document.querySelectorAll('script').length)).toBe(1);
  unavailable=true;await tap(page,'leaderboard-refresh');await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-leaderboard')??'{}').state).toBe('unconfigured');
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!).map((row:{text:string})=>row.text);expect(labels).toContain('Bảng xếp hạng online chưa được kết nối.');expect(labels).not.toContain('Người chơi 10');
  await canvas.focus();await page.keyboard.press('Escape');await expect(canvas).toHaveAttribute('data-menu-dialog','none');await expect(canvas).not.toHaveAttribute('data-leaderboard',/./);
});

test('mobile keyboard shifts name field with dialog and resize keeps editor until Escape cleanup',async({page},info)=>{
  await page.addInitScript(()=>{const viewport=Object.assign(new EventTarget(),{height:window.innerHeight,offsetTop:0});Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});(window as any).nameViewport=(height:number)=>{viewport.height=height;viewport.dispatchEvent(new Event('resize'));};});
  await boot(page);await tap(page,'menu-start');const canvas=page.locator('canvas');await name(page).fill('Tên giữ lại');const original=(await name(page).boundingBox())!.y;
  await name(page).evaluate(input=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true})));
  await expect(canvas).toHaveAttribute('data-menu-dialog','player-name');
  await page.evaluate(()=>(window as any).nameViewport(360*document.querySelector('canvas')!.getBoundingClientRect().height/640));
  await expect.poll(async()=>Number(await canvas.getAttribute('data-player-name-offset'))).toBeLessThan(0);expect((await name(page).boundingBox())!.y).toBeLessThan(original);
  await page.screenshot({path:info.outputPath('player-name-keyboard.png')});await page.setViewportSize({width:390,height:844});await expect(name(page)).toHaveValue('Tên giữ lại');await expect(canvas).toHaveAttribute('data-menu-dialog','player-name');
  await name(page).press('Escape');await expect(name(page)).toHaveCount(0);await page.evaluate(()=>(window as any).nameViewport(300));await expect(canvas).not.toHaveAttribute('data-player-name-offset',/./);
  await tap(page,'menu-settings');await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
});

test('two isolated browser players see committed shared scores including test-code funds',async({browser})=>{
  test.setTimeout(120000);
  const contexts=await Promise.all([browser.newContext({viewport:{width:360,height:640},hasTouch:true}),browser.newContext({viewport:{width:360,height:640},hasTouch:true})]);
  const scores=new Map<string,{id:string;name:string;cash:number;day:number;rank:number}>();
  try{
    const pages=await Promise.all(contexts.map(context=>context.newPage()));
    for(let i=0;i<pages.length;i++){
      const page=pages[i];
      await page.route('**/api/leaderboard',async route=>{
        const request=route.request();
        if(request.method()==='POST'){
          const {profile,snapshot}=request.postDataJSON();scores.set(profile.id,{id:profile.id,name:profile.name,cash:snapshot.payload.stock.cash,day:snapshot.payload.day,rank:0});await route.fulfill({json:{ok:true}});return;
        }
        const entries=[...scores.values()].sort((a,b)=>b.cash-a.cash||b.day-a.day||a.id.localeCompare(b.id)).map((row,index)=>({...row,rank:index+1}));
        await route.fulfill({json:{entries,self:entries.find(row=>row.id===request.headers()['x-player-id'])??null}});
      });
      // Existing legacy preparation sessions ask for their missing name on Continue.
      await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});
      await tap(page,'pause',false);await tap(page,'main-menu',false);await tap(page,'menu-continue');await name(page).fill(i?'Bạn thứ hai':'Bạn thứ nhất');await name(page).press('Enter');
      await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub');await tap(page,'pause',false);await tap(page,'main-menu',false);
      await tap(page,'menu-leaderboard');await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-leaderboard')??'{}').state).toBe('ready');await tap(page,'leaderboard-back');
    }
    await expect.poll(()=>scores.size).toBe(2);
    const initialCash=[...scores.values()].find(row=>row.name==='Bạn thứ hai')!.cash;
    await tap(pages[1],'menu-settings');await tap(pages[1],'menu-code');await pages[1].getByRole('textbox',{name:'Mã nhận xu'}).fill('VIETVUIVE');await tap(pages[1],'test-code-receive');
    await expect(pages[1].locator('canvas')).toHaveAttribute('data-test-code-feedback',/Đã nhận 100.000/);await tap(pages[1],'test-code-reward-ok');await tap(pages[1],'menu-settings-close');
    await expect.poll(()=>[...scores.values()].find(row=>row.name==='Bạn thứ hai')?.cash).toBe(initialCash+100000);
    for(const page of pages){await tap(page,'menu-leaderboard');await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-leaderboard')??'{}').state).toBe('ready');const view=JSON.parse((await page.locator('canvas').getAttribute('data-leaderboard'))!);expect(view.entries.map((row:{name:string})=>row.name)).toEqual(['Bạn thứ hai','Bạn thứ nhất']);expect(view.entries[0].cash).toBe(initialCash+100000);expect(view.self).not.toBeNull();}
  }finally{await Promise.all(contexts.map(context=>context.close()));}
});
