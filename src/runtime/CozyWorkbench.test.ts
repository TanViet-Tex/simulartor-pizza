import {describe,expect,it} from 'vitest';
import {CozyRuntime,type CozyAudioEffect,type CozyScheduleDependencies} from './CozyRuntime';
import {fundedShopCheckpoint} from './shopTestFixture';

const deps:CozyScheduleDependencies={
  schedule:day=>({day,duration:240,grace:120,slots:[0,20].map((at,i)=>({id:'board-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))}),
  resolveItems:()=>[{recipe:'cheese',price:50,finishingSauces:[]}],
};
function shop(custom:CozyScheduleDependencies=deps){const r=new CozyRuntime(false,true,custom);for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,4)).toBe(true);expect(r.openShop()).toBe(true);return r;}
function cook(r:CozyRuntime){for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(true);r.advanceElapsed(6000);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);}

describe('dough-first single production order',()=>{
  it('rejects toppings without effects and retains ownership after clearing dough',()=>{
    const r=shop(),effects:CozyAudioEffect[]=[];r.subscribeAudio(effect=>effects.push(effect));const stock=JSON.stringify(r.stockLots),cash=r.state.cash;
    expect(r.canUseIngredient('sauce')).toBe(false);expect(r.dispatch({type:'ingredient',ingredient:'sauce'})).toBe(false);expect(effects).toEqual([]);expect(JSON.stringify(r.stockLots)).toBe(stock);expect(r.state.cash).toBe(cash);
    const first=r.selectedTicketId;r.dispatch({type:'ingredient',ingredient:'dough'});r.dispatch({type:'ingredient',ingredient:'sauce'});r.dispatch({type:'ingredient',ingredient:'dough'});
    expect(r.state.ingredients).toEqual([]);expect(r.productionOwnerId).toBe(first);expect(JSON.stringify(r.stockLots)).toBe(stock);
    r.advanceElapsed(20000);const second=r.tickets[1].id;expect(r.selectTicket(second)).toBe(true);expect(r.canUseIngredient('dough')).toBe(false);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);
    expect(r.selectTicket(first)).toBe(true);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
  });
  it('keeps physical art and guards while another customer is inspected, then releases once at handoff',()=>{
    const r=shop(),first=r.selectedTicketId;cook(r);r.advanceElapsed(14000);const second=r.tickets[1].id;
    expect(r.selectTicket(second)).toBe(true);expect(r.state.ingredients).toEqual([]);expect(r.workbenchState?.stage).toBe('boxed');expect(r.productionOwnerId).toBe(first);
    expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);r.selectTicket(first);expect(r.dispatch({type:'deliver',commandId:'handoff'})).toBe(true);
    expect(r.productionOwnerId).toBeNull();expect(r.workbenchState).toBeNull();expect(r.dispatch({type:'deliver',sourceId:first,targetId:first,commandId:'handoff'})).toBe(false);
    r.selectTicket(second);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);expect(r.workbenchState?.stage).toBe('assembly');
  });
  it.each([2,3])('continues %i pizzas inside the owner and settles the whole order once',quantity=>{
    const r=shop({...deps,resolveItems:slot=>Array.from({length:slot.id==='board-0'?quantity:1},()=>({recipe:'cheese',price:50,finishingSauces:[]}))}),first=r.selectedTicketId,cash=r.state.cash;
    r.advanceElapsed(20000);const second=r.tickets[1].id;
    for(let index=0;index<quantity;index++){
      r.selectTicket(first);cook(r);expect(r.selectedTicket?.packed).toBe(index+1);expect(r.productionOwnerId).toBe(first);expect(r.state.cash).toBe(cash);
      r.selectTicket(second);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);
    }
    r.selectTicket(first);expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.state.cash).toBe(cash+50*quantity);expect(r.productionOwnerId).toBeNull();
  });
  it.each([false,true])('releases expired loose dough but requires discard for consumed pizza (%s)',consumed=>{
    const r=shop(),first=r.selectedTicketId;r.dispatch({type:'ingredient',ingredient:'dough'});if(consumed)r.dispatch({type:'bake'});
    r.advanceElapsed(20000);const second=r.tickets[1].id;r.selectTicket(second);r.advanceElapsed(100000);
    expect(r.tickets.map(t=>t.id)).toEqual([second]);expect(r.productionOwnerId).toBe(consumed?first:null);
    if(consumed){expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);expect(r.selectPizza(first)).toBe(true);expect(r.requestDiscard()).toBe(true);expect(r.confirmDiscard()).toBe(true);expect(r.productionOwnerId).toBeNull();r.selectTicket(second);}
    expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
  });
  it('retains the live owner through discard and remake and releases wrong-customer handoff',()=>{
    const r=shop({...deps,resolveItems:slot=>[{recipe:slot.id==='board-0'?'cheese':'mushroom',price:50,finishingSauces:[]}]}),first=r.selectedTicketId;cook(r);expect(r.requestDiscard()).toBe(true);expect(r.confirmDiscard()).toBe(true);expect(r.productionOwnerId).toBe(first);expect(r.remake()).toBe(true);cook(r);
    r.advanceElapsed(8000);const second=r.tickets[1].id;r.selectTicket(second);expect(r.dispatch({type:'deliver',sourceId:first,targetId:second,commandId:'cross'})).toBe(true);
    expect(r.deliveryPending).toMatchObject({sourceId:first,targetId:second});expect(r.productionOwnerId).toBe(first);expect(r.cancelDelivery()).toBe(true);expect(r.productionOwnerId).toBe(first);
    expect(r.dispatch({type:'deliver',sourceId:first,targetId:second,commandId:'cross'})).toBe(true);expect(r.confirmDelivery()).toBe(true);
    expect(r.productionOwnerId).toBeNull();expect(r.workbenchState).toBeNull();expect(r.tickets.map(t=>t.id)).toEqual([first]);r.selectTicket(first);expect(r.remake()).toBe(true);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
  });
  it.each([false,true])('waits for app handoff and permits next production during staff return (%s)',staff=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{...deps,deliveryStaffAvailable:()=>staff,schedule:day=>({day,duration:240,grace:120,slots:[{id:'app',at:0,source:'app',quantity:1,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'counter',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]})})!;
    r.configureDeliveryApp(true,'app');for(const id of ['dough','sauce','cheese'] as const)r.buy(id,3);r.openShop();const first=r.tickets[0].id,second=r.tickets[1].id;
    if(!staff)expect(r.bookShipper(first,'book')).toBe(true);cook(r);const cash=r.state.cash;
    if(!staff){expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.state.cash).toBe(cash);expect(r.productionOwnerId).toBe(first);r.selectTicket(second);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);r.advanceElapsed(4000);r.selectTicket(first);}
    expect(r.dispatch({type:'deliver',commandId:'app-final'})).toBe(true);expect(r.productionOwnerId).toBeNull();expect(r.workbenchState).toBeNull();expect(r.state.cash).toBe(cash+50-(staff?0:5));expect(r.deliveryStatus.phase).toBe(staff?'return':'idle');
    r.selectTicket(second);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);expect(r.productionOwnerId).toBe(second);
  });
  it('cancels an old staff job when manual dough claims another customer, preserving pause and pacing',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{...deps,schedule:day=>({day,duration:240,grace:120,slots:[0,0].map((at,i)=>({id:'staff-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})})!;
    r.hireStaff('prep','prep');for(const id of ['dough','sauce','cheese'] as const)r.buy(id,4);r.openShop();r.advanceElapsed(500);const first=r.tickets[0].id,second=r.tickets[1].id;
    expect(r.staffState.jobs[0].ticketId).toBe(first);r.selectTicket(second);r.dispatch({type:'ingredient',ingredient:'dough'});const lease=r.acquirePause('user');r.advanceElapsed(5000);expect(r.workbenchState?.ingredients).toEqual(['dough']);lease.release();
    r.selectTicket(first);r.advanceElapsed(500);expect(r.productionOwnerId).toBe(second);expect(r.workbenchState?.ingredients).toEqual(['dough']);expect(r.state.ingredients).toEqual([]);r.advanceElapsed(500);expect(r.workbenchState?.ingredients).toEqual(['dough','sauce']);
  });
});
