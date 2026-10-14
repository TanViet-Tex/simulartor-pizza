import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {CozyRuntime,type CozyScheduleDependencies} from '../src/runtime/CozyRuntime';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>((await data(page,'controls'))||[]).some((c:Control)=>c.id===id&&c.enabled)).toBe(true);
  const c:Control=(await data(page,'controls')).find((c:Control)=>c.id===id),bounds=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(bounds.x+(c.x+c.width/2)*bounds.width/360,bounds.y+(c.y+c.height/2)*bounds.height/640);
}
function savedCampaign(){
  const dependencies:CozyScheduleDependencies={eventSeed:321,eventRoll:()=>1,vipRoll:()=>1,resolveRecipe:()=> 'cheese',schedule:day=>({day,duration:180,grace:120,slots:Array.from({length:day===1?1:2},(_,i)=>({id:`history-${day}-${i}`,at:i*20,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})};
  const runtime=new CozyRuntime(false,true,dependencies);expect(runtime.claimTestCode('VIETVUIVE')).toBe(true);
  for(let day=1;day<=2;day++){
    for(const ingredient of ['dough','sauce','cheese'] as const)expect(runtime.buy(ingredient,3)).toBe(true);
    expect(day===1?runtime.openShop():runtime.openNextDay()).toBe(true);runtime.advanceElapsed(5000);
    if(runtime.lotteryPending)expect(runtime.resolveLottery(0)).toBe(true);
    for(const ingredient of ['dough','sauce','cheese'] as const)expect(runtime.dispatch({type:'ingredient',ingredient})).toBe(true);
    expect(runtime.dispatch({type:'bake'})).toBe(true);runtime.advanceElapsed(4000);
    for(const type of ['extract','box','deliver'] as const)expect(runtime.dispatch({type})).toBe(true);
    expect(runtime.continueShift()).toBe(true);if(day===2)runtime.advanceElapsed(20000);
    expect(runtime.closeDay()).toBe(true);
  }
  return {checkpoint:runtime.exportCheckpoint(),history:runtime.reviewHistory,report:runtime.latestDayReport!};
}
test('saved multi-day reviews and last-day profit survive Continue and repeated reloads',async({page},info)=>{
  test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const fixture=savedCampaign();expect(fixture.history).toMatchObject({total:3,rating:11/3});
  const pathSpecifier:string='node:path',paths=await import(pathSpecifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';
    import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';
    (async()=>{try{
      const repo=new CozySaveRepository(),loaded=await repo.load();
      const result=await repo.commit({campaignId:'review-history',commitId:'two-completed-days',sourceRevision:0,replacementToken:loaded.replacementToken,payload:window.historyCheckpoint});
      if(!result.ok)throw Error(result.message);
      const session=new CozyCampaignSession(repo),runtime=await session.load();
      if(!runtime)throw Error('Session did not restore campaign');
      window.historyLoaded={history:runtime.reviewHistory,report:runtime.latestDayReport};session.destroy();
    }catch(error){window.historySeedError=String(error);}})();
  `},bundle:true,platform:'browser',format:'iife',minify:true,write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.evaluate(checkpoint=>Object.assign(window,{historyCheckpoint:checkpoint}),fixture.checkpoint);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect.poll(()=>page.evaluate(()=>({loaded:(window as any).historyLoaded,error:(window as any).historySeedError}))).toEqual({loaded:{history:fixture.history,report:fixture.report},error:undefined});
  await page.unroute('**/assets/index-*.js');
  for(let reload=0;reload<2;reload++){
    if(reload===0)await page.goto('/');else await page.reload();
    await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu',{timeout:30000});await tap(page,'menu-continue');
    const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});
    await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
    await expect(canvas).toHaveAttribute('data-day','3');
    expect(await data(page,'reference-summary')).toMatchObject({day:2,profit:fixture.report.profit});
    expect(await data(page,'summary-review-history')).toEqual({total:3,rating:11/3});
    expect(await data(page,'summary-recent-reviews')).toEqual(fixture.history.reviews.slice(-2).reverse());
    expect(Number(await canvas.getAttribute('data-cash'))).toBe(fixture.checkpoint.stock.cash);
    expect((await data(page,'controls')).find((c:Control)=>c.id==='summary-open-first-day')?.enabled).toBe(true);
    await tap(page,'summary-finance-open');await expect(canvas).toHaveAttribute('data-summary-modal','finance');
    expect(await canvas.getAttribute('data-summary-modal-title')).toBe('Thu chi ngày 2');
    const rows=await data(page,'summary-finance-rows');expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({label:'Số dư đầu ngày',amount:`${fixture.report.accounts.startingCash} xu`}),
      expect.objectContaining({label:'Số dư cuối ngày',amount:`${fixture.report.accounts.endingCash} xu`}),
    ]));
    await tap(page,'summary-statement-close');await tap(page,'summary-reviews-open');
    await expect(canvas).toHaveAttribute('data-summary-modal','reviews');
    expect(await canvas.getAttribute('data-summary-modal-title')).toBe('Đánh giá tổng hợp');
    expect(await data(page,'summary-reviews')).toMatchObject({total:3,rating:11/3,filter:'all',filtered:3,cumulative:true});
    const text=await data(page,'summary-modal-text');
    for(const review of fixture.history.reviews)expect(text).toContain(review.name);
    await tap(page,'summary-review-filter-5');
    await expect.poll(()=>data(page,'summary-reviews')).toMatchObject({total:3,rating:11/3,filter:'5',filtered:2,cumulative:true});
    const five=await data(page,'summary-modal-text');
    for(const reason of fixture.history.reviews.filter(review=>review.stars===1).flatMap(review=>review.reasons))expect(five.join('\n')).not.toContain(reason);
    await tap(page,'summary-review-filter-low');
    await expect.poll(()=>data(page,'summary-reviews')).toMatchObject({total:3,rating:11/3,filter:'low',filtered:1,cumulative:true});
    const low=await data(page,'summary-modal-text');
    for(const reason of fixture.history.reviews.filter(review=>review.stars===1).flatMap(review=>review.reasons))expect(low.join('\n')).toContain(reason);
    await tap(page,'summary-review-filter-all');
    if(reload===1)await canvas.screenshot({path:info.outputPath('restored-review-history.png')});
    await tap(page,'summary-reviews-close');await expect(canvas).toHaveAttribute('data-paused','');
  }
  await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-summary-tab','market');
  await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
  await expect(page.locator('canvas')).toHaveAttribute('data-day','3');
  expect(errors).toEqual([]);
});
