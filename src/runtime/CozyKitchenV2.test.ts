import {fundedShopCheckpoint} from './shopTestFixture';
import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {type CozyScheduleDependencies} from './CozyRuntime';
import {STOCK_INGREDIENTS,type StockIngredient} from '../domain/CozyStock';
const time=(r:CozyRuntime,n:number)=>{for(let i=0;i<n*20;i++)r.advance(50);};
const schedule=(kind:'regular'|'bargain'='regular',count=1):CozyScheduleDependencies=>({schedule:day=>({day,duration:180,grace:120,slots:Array.from({length:count},(_,i)=>({id:'test-'+i,at:i,kind,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:false}))})});
function oven(r:CozyRuntime,ingredients:readonly StockIngredient[]=['dough','sauce','cheese']){for(const ingredient of ingredients)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(true);}
describe('direct kitchen gameplay',()=>{
  it.each([true,false])('returning customers respect the discount decision=%s',accept=>{
    const deps:CozyScheduleDependencies={schedule:day=>({day,duration:180,grace:120,slots:[{id:'discount',at:0,kind:'bargain',opportunity:'commercial',commercialOrdinal:1,takeaway:false},{id:'return',at:20,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:false}]})};
    const r=new CozyRuntime(false,true,deps);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);
    r.openShop();const original=r.selectedTicket!.avatarIndex;
    oven(r);time(r,6);r.dispatch({type:'extract'});r.dispatch({type:'deliver'});r.resolveBargain(accept);
    time(r,14);expect(r.selectedTicket).not.toBeNull();
    if(accept)expect(r.selectedTicket!.avatarIndex).toBe(original);
    else expect(r.tickets.every(t=>t.avatarIndex!==original)).toBe(true);
  });
  it('shows the next arriving order after a delivery without requiring a continue tap',()=>{
    const deps:CozyScheduleDependencies={schedule:day=>({day,duration:180,grace:120,slots:[0,20].map((at,i)=>({id:'next-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:false}))})};
    const r=new CozyRuntime(false,true,deps);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);
    r.openShop();oven(r);time(r,6);r.dispatch({type:'extract'});r.dispatch({type:'deliver'});
    expect(r.shopPhase).toBe('delivered');time(r,14);
    expect(r.shopPhase).toBe('making');expect(r.selectedTicket).not.toBeNull();expect(r.tickets).toHaveLength(1);
  });
  it('lets a bargain customer order an affordable discounted price before asking at delivery',()=>{
    const r=new CozyRuntime(false,true,schedule('bargain'));r.setMenuPrice('cheese',110);r.openShop();
    expect(r.tickets).toHaveLength(1);expect(r.selectedTicket!.finalPrice).toBe(55);expect(r.bargainPending).toBeNull();
  });
  it('receives four orders with zero stock and reserves only actual assembly at bake',()=>{
    const r=new CozyRuntime(false,true,schedule('regular',7));expect(r.openShop()).toBe(true);time(r,6);
    expect(r.tickets).toHaveLength(4);expect(r.reserved('dough')).toBe(0);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);
    expect(r.selectTicket(r.tickets[3].id)).toBe(true);expect(r.selectedTicketId).toBe(r.tickets[3].id);
  });
  it('bakes eight mixed ingredients, consumes each once and scores wrong recipe on delivery',()=>{
    const r=new CozyRuntime(false,true,schedule());const ids=STOCK_INGREDIENTS.slice(0,8);for(const id of ids)expect(r.buy(id,1)).toBe(true);
    const cash=r.state.cash;expect(r.openShop()).toBe(true);oven(r,ids);expect(r.dispatch({type:'bake'})).toBe(false);
    for(const id of ids)expect(r.owned(id)).toBe(0);time(r,6);expect(r.dispatch({type:'extract'})).toBe(true);
    expect(r.dispatch({type:'deliver',commandId:'mixed'})).toBe(true);expect(r.deliveryPending).not.toBeNull();expect(r.confirmDelivery()).toBe(true);
    expect(r.lastResult!.stars).toBeLessThan(5);expect(r.lastResult!.reasons.join(' ')).toContain('Sai công thức');expect(r.state.cash).toBeGreaterThan(cash);
  });
  it('orders rush once at premium, waits five simulation seconds, freezes on pause and blocks closing',()=>{
    const r=new CozyRuntime(false,true,schedule());r.openShop();const price=r.expressPrice('dough');
    const modal=r.acquirePause('order');expect(r.dispatch({type:'express.order',ingredient:'dough',quantity:2,commandId:'rush'})).toBe(true);
    expect(r.dispatch({type:'express.order',ingredient:'dough',quantity:2,commandId:'rush'})).toBe(false);expect(r.state.cash).toBe(300-2*price);
    time(r,10);expect(r.expressOrders[0].remaining).toBe(5);expect(r.closeDay()).toBe(false);modal.release();time(r,4.95);expect(r.owned('dough')).toBe(0);time(r,.05);
    expect(r.owned('dough')).toBe(2);expect(r.expressOrders).toEqual([]);time(r,1);expect(r.owned('dough')).toBe(2);expect(r.closeDay()).toBe(true);
    expect(r.daySummary!.purchases).toBe(2*price);expect(r.daySummary!.cost).toBe(0);
  });
  it('uses inclusive six to eight seconds and burns immediately after eight',()=>{
    const r=new CozyRuntime(false,true,schedule());for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openShop();oven(r);time(r,8);expect(r.state.stage).toBe('baking');time(r,.05);expect(r.state.stage).toBe('burnt');
    expect(r.bakeTiming).toMatchObject({perfectStart:6,perfectEnd:8});
  });
  it.each([true,false])('asks bargain only after cooking and delivery, decision=%s settles exactly once',accept=>{
    const r=new CozyRuntime(false,true,schedule('bargain'));for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.openShop();expect(r.bargainPending).toBeNull();oven(r);time(r,6);r.dispatch({type:'extract'});
    const cash=r.state.cash;expect(r.dispatch({type:'deliver',commandId:'discount'})).toBe(true);expect(r.state.cash).toBe(cash);expect(r.bargainPending).not.toBeNull();
    expect(r.resolveBargain(accept)).toBe(true);expect(r.lastResult!.price).toBe(accept?45:50);if(!accept)expect(r.lastResult!.stars).toBeLessThan(3);
    expect(r.customerMemory[accept?'accepted':'declined']).toHaveLength(1);expect(r.resolveBargain(accept)).toBe(false);expect(r.state.cash).toBe(cash+(accept?45:50));
  });
  it('upgrades queue to six only in preparation and prevents duplicate charges',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(),false,schedule('regular',7))!;expect(r.dispatch({type:'shop.upgrade',kind:'queue',commandId:'seats'})).toBe(true);const cash=r.state.cash;
    expect(r.dispatch({type:'shop.upgrade',kind:'queue',commandId:'seats'})).toBe(false);expect(r.state.cash).toBe(cash);r.openShop();time(r,6);expect(r.tickets).toHaveLength(6);expect(r.queueCapacity).toBe(6);
    expect(r.dispatch({type:'shop.upgrade',kind:'oven',commandId:'hot'})).toBe(false);
  });
  it('persists an oven upgrade, then uses four to six seconds without charging it twice',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(),false,schedule())!;const cash=r.state.cash;expect(r.upgradeShop('oven','oven-1')).toBe(true);
    const saved=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(saved)!;expect(loaded).not.toBeNull();expect(loaded.ovenLevel).toBe(1);expect(loaded.state.cash).toBe(cash-2000);
    for(const id of ['dough','sauce','cheese'] as const)loaded.buy(id,1);loaded.openShop();time(loaded,10);oven(loaded);time(loaded,4);expect(loaded.dispatch({type:'extract'})).toBe(true);expect(loaded.state.stage).toBe('ready');
    loaded.closeDay();expect(loaded.daySummary!.accounts.capitalPurchases).toBe(2000);expect(loaded.daySummary!.accounts.endingCash).toBe(loaded.state.cash);
    const restored=CozyRuntime.restoreCheckpoint(loaded.exportCheckpoint())!;expect(restored.ovenLevel).toBe(1);expect(restored.state.cash).toBe(loaded.state.cash);
  });
  it('keeps the oven owner when switching customers and consumes only that pizza',()=>{
    const r=new CozyRuntime(false,true,schedule('regular',2));for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openShop();const first=r.selectedTicketId;oven(r);time(r,1);
    const second=r.tickets.find(t=>t.id!==first)!;r.selectTicket(second.id);expect(r.ovenOwner).toBe(first);expect(r.state.stage).toBe('assembly');expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
    expect(r.dispatch({type:'bake'})).toBe(false);expect(r.owned('dough')).toBe(1);time(r,5);r.selectPizza(first);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.ovenOwner).toBeNull();
  });
});
