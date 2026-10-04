import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function fixture(page:Page,empty=false,reviewCount=empty?0:12){
  const specifier:string='node:path';const paths:{resolve(path:string):string}=await import(specifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:1000,grace:120,slots:Array.from({length:${reviewCount}},(_,i)=>({id:'slot-'+i,at:i*30,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))}),resolveRecipe:(_s,_e,selected)=>selected});
    for(const ingredient of ['dough','sauce','cheese'])runtime.buy(ingredient,6);
    runtime.openShop();let elapsed=0;
    const advance=seconds=>{for(let i=0;i<seconds*20;i++){runtime.advance(50);elapsed+=.05;}};
    ${empty?'':`for(let i=0;i<${Math.min(3,reviewCount)};i++){
      if(i>0)advance(30*i-elapsed+.1);
      for(const ingredient of ['dough','sauce','cheese'])if(!runtime.dispatch({type:'ingredient',ingredient}))throw Error('Assembly failed');
      if(!runtime.dispatch({type:'bake'}))throw Error('Bake failed');advance(7);
      for(const type of ['extract','box','deliver'])if(!runtime.dispatch({type}))throw Error(type+' failed');
      runtime.continueShift();
    }advance(400-elapsed);`}
    if(!runtime.closeDay())throw Error('Day close failed');
    window.summaryFixture={runtime,report:runtime.daySummary};
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.locator('canvas')).toHaveAttribute('data-screen','day-summary');
}
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-controls')||'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled)).toBe(true);
  const control=JSON.parse(await canvas.getAttribute('data-controls')||'[]').find((c:{id:string})=>c.id===id),bounds=(await canvas.boundingBox())!;
  expect(control.width*bounds.width/360).toBeGreaterThanOrEqual(48);expect(control.height*bounds.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(bounds.x+(control.x+control.width/2)*bounds.width/360,bounds.y+(control.y+control.height/2)*bounds.height/640);
}
async function labels(page:Page){return JSON.parse(await page.locator('canvas').getAttribute('data-labels')||'[]').map((t:{text:string})=>t.text).join('\n');}
async function expectOnlyBodyChanged(page:Page,before:{toString(encoding:'base64'):string},after:{toString(encoding:'base64'):string},region:{x:number;y:number;width:number;height:number}){
  const changed=await page.evaluate(async({before,after,region})=>{
    const pixels=async(encoded:string)=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return {data:ctx.getImageData(0,0,canvas.width,canvas.height).data,width:canvas.width,height:canvas.height};};
    const a=await pixels(before),b=await pixels(after);let outside=0,inside=0;
    for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
      const index=(y*a.width+x)*4;if(![0,1,2,3].some(channel=>a.data[index+channel]!==b.data[index+channel]))continue;
      const logicalX=x*360/a.width,logicalY=y*640/a.height;
      if(logicalX<region.x-2||logicalX>region.x+region.width+2||logicalY<region.y-2||logicalY>region.y+region.height+2)outside++;else inside++;
    }return {outside,inside};
  },{before:before.toString('base64'),after:after.toString('base64'),region});
  expect(changed.outside).toBe(0);expect(changed.inside).toBeGreaterThan(0);
}

test('reference summary uses actual reports and isolates scrollable finance/review overlays',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas');
  const report=JSON.parse(await canvas.getAttribute('data-day-summary')||'{}');
  expect(report).toMatchObject({revenue:150,delivered:3,cost:45,profit:85});expect(report.reviews.length).toBeGreaterThan(2);
  const recent=JSON.parse(await canvas.getAttribute('data-summary-recent-reviews')||'[]');expect(recent).toEqual(report.reviews.slice(-2).reverse());
  expect(await labels(page)).toContain('Lợi nhuận hôm nay');
  await canvas.screenshot({path:info.outputPath('reference-summary.png')});
  await tap(page,'summary-finance-open');await expect(canvas).toHaveAttribute('data-summary-modal','finance');
  expect(await labels(page)).toContain('Thu chi ngày 1');
  const financeRows=JSON.parse(await canvas.getAttribute('data-summary-modal-text')||'[]');
  expect(financeRows).toContain('Phô mai × 3   150 xu');expect(financeRows).toContain(`Số dư cuối ngày: ${report.cash} xu`);
  const controls=JSON.parse(await canvas.getAttribute('data-controls')||'[]');expect(controls.some((c:{id:string})=>c.id==='summary-open-next-day')).toBe(false);
  const bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+300*bounds.width/360,bounds.y+610*bounds.height/640);
  await expect(canvas).toHaveAttribute('data-day','1');await expect(canvas).toHaveAttribute('data-summary-modal','finance');
  const scroll=JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0];expect(scroll.max).toBeGreaterThan(0);
  await page.waitForTimeout(250);const financeBefore=await canvas.screenshot({path:info.outputPath('reference-finance.png')});
  await page.mouse.move(bounds.x+(scroll.x+scroll.width/2)*bounds.width/360,bounds.y+(scroll.y+scroll.height/2)*bounds.height/640);await page.mouse.wheel(0,200);
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0].offset).toBeGreaterThan(0);
  await expectOnlyBodyChanged(page,financeBefore,await canvas.screenshot({path:info.outputPath('reference-finance-scrolled.png')}),scroll);
  await page.evaluate(()=>{document.documentElement.style.fontSize='32px';window.dispatchEvent(new Event('resize'));});
  await expect(canvas).toHaveAttribute('data-summary-body-text-scale','2');
  expect(JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0].max).toBeGreaterThan(scroll.max);
  await page.evaluate(()=>{document.documentElement.style.fontSize='16px';window.dispatchEvent(new Event('resize'));});
  await expect(canvas).toHaveAttribute('data-summary-body-text-scale','1');
  await tap(page,'summary-statement-close');await expect(canvas).toHaveAttribute('data-summary-modal','');
  await tap(page,'summary-reviews-open');await expect(canvas).toHaveAttribute('data-summary-modal','reviews');expect(await labels(page)).toContain('Đánh giá ngày 1');
  const reviewsScroll=JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0];expect(reviewsScroll.max).toBeGreaterThan(0);
  await page.waitForTimeout(250);const reviewsBefore=await canvas.screenshot({path:info.outputPath('reference-reviews.png')});
  await page.mouse.move(bounds.x+(reviewsScroll.x+reviewsScroll.width/2)*bounds.width/360,bounds.y+(reviewsScroll.y+reviewsScroll.height/2)*bounds.height/640);await page.mouse.wheel(0,170);
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0].offset).toBeGreaterThan(0);
  await expectOnlyBodyChanged(page,reviewsBefore,await canvas.screenshot({path:info.outputPath('reference-reviews-scrolled.png')}),reviewsScroll);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
  });
  await tap(page,'summary-reviews-close');await expect(canvas).toHaveAttribute('data-paused','visibility');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await expect(canvas).toHaveAttribute('data-day-summary',JSON.stringify(report));await tap(page,'summary-tab-stock');await expect(canvas).toHaveAttribute('data-summary-tab','stock');
  await tap(page,'summary-tab-summary');await tap(page,'summary-open-next-day');await expect(canvas).toHaveAttribute('data-day','2');await expect(canvas).toHaveAttribute('data-screen','game');
});

test('zero-review report opens an honest empty reviews modal',async({page})=>{
  await fixture(page,true);const canvas=page.locator('canvas');
  const report=JSON.parse(await canvas.getAttribute('data-day-summary')||'{}');expect(report.reviews).toEqual([]);expect(report.rating).toBeNull();
  await tap(page,'summary-reviews-open');expect(await labels(page)).toContain('Chưa có đánh giá');expect(await labels(page)).toContain('0 lượt đánh giá');
  await tap(page,'summary-reviews-close');await expect(canvas).toHaveAttribute('data-paused','');
});

for(const count of [1,2])test(`${count} real reviews are shown without filling extra rows`,async({page})=>{
  await fixture(page,false,count);const canvas=page.locator('canvas');
  const report=JSON.parse(await canvas.getAttribute('data-day-summary')||'{}');expect(report.reviews).toHaveLength(count);
  expect(JSON.parse(await canvas.getAttribute('data-summary-recent-reviews')||'[]')).toEqual(report.reviews.slice(-2).reverse());
  await tap(page,'summary-reviews-open');expect(await labels(page)).toContain(`${count} lượt đánh giá`);
  await tap(page,'summary-reviews-close');await expect(canvas).toHaveAttribute('data-paused','');
});

test('long reviews at 200% use a bounded viewport texture and stay clipped',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');
  await page.evaluate(()=>{
    const fixture=(window as unknown as {summaryFixture:{runtime:{summary:{reviews:{reasons:string[]}[]}}}}).summaryFixture;
    for(const review of fixture.runtime.summary.reviews)review.reasons=Array.from({length:8},(_,i)=>`Nhận xét ${i}: `+'Nội dung dài cần đọc được. '.repeat(18));
    document.documentElement.style.fontSize='32px';window.dispatchEvent(new Event('resize'));
  });
  await tap(page,'summary-reviews-open');await expect(canvas).toHaveAttribute('data-summary-body-text-scale','2');
  const scroll=JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0];expect(scroll.max).toBeGreaterThan(4000);
  const texture=JSON.parse(await canvas.getAttribute('data-summary-body-texture')||'{}');expect(texture.height).toBeLessThanOrEqual(640);expect(texture.width).toBeLessThanOrEqual(360);
  await page.waitForTimeout(250);const before=await canvas.screenshot(),bounds=(await canvas.boundingBox())!;
  await page.mouse.move(bounds.x+(scroll.x+scroll.width/2)*bounds.width/360,bounds.y+(scroll.y+scroll.height/2)*bounds.height/640);await page.mouse.wheel(0,200000);
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0].offset).toBe(scroll.max);
  await expectOnlyBodyChanged(page,before,await canvas.screenshot(),scroll);await tap(page,'summary-reviews-close');
});
