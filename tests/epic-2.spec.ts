import {expect,test,type Page} from '@playwright/test';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
 await expect.poll(async()=>((await data(page,'controls')) as Control[]).some(c=>c.id===id&&c.enabled)).toBe(true);
 const c=((await data(page,'controls')) as Control[]).find(c=>c.id===id)!,b=(await page.locator('canvas').boundingBox())!;
 expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
 await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await page.clock.runFor(50);
}
async function start(page:Page,suffix=''){
 await page.clock.install();await page.goto('/?mode=shop'+suffix);await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+5000));
 for(const id of ['dough','sauce','cheese','mushroom']){for(let i=0;i<3;i++)await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);}await tap(page,'market-open');await page.clock.runFor(10000);
}
async function serve(page:Page,id:string){
 await tap(page,'ticket-'+id);
 const ticket=(await data(page,'tickets')).find((t:{id:string})=>t.id===id),detail=await data(page,'order-detail');
 expect(detail.lines[1]).toContain(`${ticket.finalPrice} xu`);expect(detail.lines[2]).toContain(`Giá ≤${ticket.maxPricePercent}%`);
 for(const c of ['dough','sauce','cheese',...(ticket.recipe==='mushroom'?['mushroom']:[]),'bake'])await tap(page,c);
 await page.clock.runFor(3100);await tap(page,'extract');if(ticket.takeaway)await tap(page,'box');await tap(page,'deliver');
 if(await page.locator('canvas').getAttribute('data-shop')==='delivered')await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');
}
async function labels(page:Page){return (await data(page,'labels')).map((l:{text:string})=>l.text).join(' ');}
test('canonical Day 1 personalities, final prices and progression retain approved geometry',async({page},info)=>{
 test.setTimeout(480000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);const canvas=page.locator('canvas');
 expect(await data(page,'tickets')).toMatchObject([{kind:'regular',patience:120,finalPrice:50}]);await tap(page,'ticket-cozy-1');
 expect((await data(page,'order-detail')).lines.join(' ')).toContain('Khách quen');
 expect((await data(page,'order-detail')).lines[1]).toContain('50 xu');expect((await data(page,'order-detail')).lines[2]).toContain('Giá ≤120%');
 const initialControls=(await data(page,'controls')) as Control[];
 expect(initialControls.find(c=>c.id==='bake')).toMatchObject({x:8,y:411,width:216,height:48});expect(initialControls.find(c=>c.id==='cheese')).toMatchObject({x:16,y:524,width:60,height:50});
 expect((await data(page,'order-queue'))[0]).toMatchObject({x:12,y:79,width:56,height:79});
 await page.screenshot({path:info.outputPath('epic2-selected-order.png')});
 await serve(page,'cozy-1');expect(await data(page,'result')).toMatchObject({stars:5,price:50,reputationDelta:1,relationshipDelta:1});
 await page.clock.runFor(Math.max(0,(35-(await data(page,'shift-clock')).elapsed)*1000)+50);expect((await data(page,'tickets'))[0]).toMatchObject({kind:'picky',patience:100});await serve(page,'cozy-2');
 await page.clock.runFor(Math.max(0,(60-(await data(page,'shift-clock')).elapsed)*1000)+50);await expect(canvas).toHaveAttribute('data-paused','bargain');
 expect(await data(page,'tickets')).toEqual([]);expect(await data(page,'bargain')).toMatchObject({originalPrice:65,finalPrice:59});
 expect(await labels(page)).toContain('Giảm 10%');await page.screenshot({path:info.outputPath('bargain.png')});
 await tap(page,'accept-bargain');expect((await data(page,'tickets'))[0]).toMatchObject({kind:'bargain',patience:110,finalPrice:59});await serve(page,'cozy-3');
 expect(await data(page,'result')).toMatchObject({stars:5,price:59,reputationDelta:1,relationshipDelta:0});
 await page.clock.runFor(Math.max(0,(85-(await data(page,'shift-clock')).elapsed)*1000)+50);await serve(page,'cozy-4');
 await page.clock.runFor(Math.max(0,(110-(await data(page,'shift-clock')).elapsed)*1000)+50);await tap(page,'accept-bargain');expect(await labels(page)).toContain('Chọn đơn để xem chi tiết');expect(await labels(page)).toContain('Khách chưa thể đặt món.');
 await page.screenshot({path:info.outputPath('active-stock-rejection.png')});await tap(page,'order');expect(await labels(page)).toContain('Còn thiếu:');await tap(page,'close-order');
 await tap(page,'pause');await tap(page,'end-day');await tap(page,'confirm-end-day');
 expect(await data(page,'day-summary')).toMatchObject({revenue:209,delivered:4,rating:5,reputation:54,relationship:1,referral:null});
 const controls=(await data(page,'controls')) as Control[];expect(controls.find(c=>c.id==='summary-open-next-day')).toMatchObject({x:133,y:587,width:214,height:48});
 expect(controls.filter(c=>c.id.startsWith('summary-tab-'))).toHaveLength(5);expect(controls.filter(c=>c.id.startsWith('summary-prepare-'))).toHaveLength(4);
 expect(await labels(page)).toContain('Quan hệ +1');await page.screenshot({path:info.outputPath('epic2-summary.png')});expect(errors).toEqual([]);
});
test('bargain remains frozen and both decisions stay available across tab changes at 200% text',async({page},info)=>{
 test.setTimeout(240000);await start(page);await page.addStyleTag({content:'html { font-size:32px; }'});const canvas=page.locator('canvas');await serve(page,'cozy-1');await page.clock.runFor(57000);
 await expect(canvas).toHaveAttribute('data-paused','bargain');const pending=await data(page,'bargain'),tickets=await data(page,'tickets'),stock=await data(page,'stock');
 await page.clock.runFor(1000);expect(await data(page,'tickets')).toEqual(tickets);expect(await data(page,'stock')).toEqual(stock);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(50);
 await expect(canvas).toHaveAttribute('data-paused','bargain');expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='accept-bargain'&&c.enabled)).toBe(true);
 expect(await data(page,'bargain')).toEqual(pending);
 const regions=await data(page,'modal-scroll');const region=regions.find((r:{max:number})=>r.max>0);expect(region).toBeTruthy();
 const bounds=(await canvas.boundingBox())!,session=await page.context().newCDPSession(page);
 const x=bounds.x+(region.x+region.width/2)*bounds.width/360,startY=bounds.y+(region.y+region.height-5)*bounds.height/640;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:startY}]});await page.clock.runFor(50);
 for(let i=1;i<=5;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:startY-i*8*bounds.height/640}]});await page.clock.runFor(50);}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(50);await session.detach();
 expect((await data(page,'modal-scroll')).find((r:{y:number})=>r.y===region.y).offset).toBeGreaterThan(region.offset);
 for(const id of ['accept-bargain','reject-bargain'])expect(((await data(page,'controls')) as Control[]).find(c=>c.id===id)?.enabled).toBe(true);
 await page.screenshot({path:info.outputPath('bargain-200-percent-swiped.png')});
 const reputation=(await data(page,'customer-progress')).reputation;await tap(page,'reject-bargain');expect(await data(page,'bargain')).toBeNull();expect((await data(page,'customer-progress')).reputation).toBe(reputation);expect(await data(page,'stock')).toEqual(stock);
});
