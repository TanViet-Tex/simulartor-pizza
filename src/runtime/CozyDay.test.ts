import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
function shop(qty=2){const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,qty);r.openShop();return r;}
function time(r:CozyRuntime,seconds:number){for(let i=0;i<seconds*20;i++)r.advance(50);}
it('settles once, releases reservations, freezes the actual statement and stops clocks',()=>{
  const r=shop();const user=r.acquirePause('user');expect(r.closeDay()).toBe(true);
  expect(r.daySummary).toMatchObject({day:1,revenue:0,purchases:30,cost:0,rent:20,expired:0,profit:-20,delivered:0,abandoned:1,cash:250,rating:1,ending:null});
  expect(r.pauses).toEqual(['user']);user.release();expect(r.reserved('dough')).toBe(0);expect(r.owned('dough')).toBe(2);
  const snapshot=r.daySummary!;snapshot.reviews[0]!.name='fake';snapshot.profit=900;
  expect(r.daySummary!.reviews[0]!.name).toBe('Linh');expect(r.daySummary!.profit).toBe(-20);
  expect(r.closeDay()).toBe(false);expect(r.state.cash).toBe(250);time(r,200);expect(r.tickets).toEqual([]);expect(r.simulationActive).toBe(false);expect(r.dispatch({type:'reset'})).toBe(false);
});
it('books purchases for the next day without changing the closed statement and retains valid lots',()=>{
  const r=shop();r.closeDay();const statement=r.daySummary;
  expect(r.price('mushroom')).toBe(6);expect(r.buy('mushroom',1)).toBe(true);
  expect(r.stockLots.find(l=>l.ingredient==='mushroom')).toMatchObject({day:2,expiry:2,unitCost:6});expect(r.daySummary).toEqual(statement);
  expect(r.openNextDay()).toBe(true);expect(r.openNextDay()).toBe(false);expect(r.day).toBe(2);expect(r.shopPhase).toBe('making');expect(r.state.cash).toBe(244);expect(r.selectedTicketId).toBe('cozy-2');
  r.closeDay();expect(r.daySummary).toMatchObject({day:2,purchases:6,expired:36,cost:0,rent:20,profit:-56});
  expect(r.owned('dough')).toBe(0);expect(r.owned('mushroom')).toBe(0);
});
it('uses actual consumed lot costs and delivery reviews, not total purchase outflow as cost',()=>{
  const r=shop();for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver'});
  expect(r.state.cash).toBe(320);r.closeDay();expect(r.daySummary).toMatchObject({revenue:50,purchases:30,cost:15,profit:15,cash:300,delivered:1,abandoned:0,rating:5});expect(r.daySummary!.reviews[0]).toMatchObject({name:'Linh',stars:5,outcome:'delivered'});
});
it('refuses closure while another owned pause is present and preserves all owner tokens',()=>{
  const r=shop(),user=r.acquirePause('user'),visibility=r.acquirePause('visibility');const cash=r.state.cash;
  expect(r.closeDay()).toBe(false);expect(r.state.cash).toBe(cash);expect(r.tickets).toHaveLength(1);visibility.release();expect(r.closeDay()).toBe(true);expect(r.pauses).toEqual(['user']);expect(r.openNextDay()).toBe(false);user.release();expect(r.openNextDay()).toBe(true);
});
it('accounts expired and pending tickets separately with consumed stock never refunded',()=>{
  const r=shop(10);for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,120);
  const expired=r.events.filter(e=>e.includes('expired:')).length,pending=r.tickets.length;r.closeDay();expect(r.daySummary!.abandoned).toBe(expired+pending);expect(r.daySummary!.cost).toBe(15);expect(r.owned('dough')).toBe(9);expect(r.ovenOwner).toBeNull();
});
it('finishes day three without day four or replay and explains insolvency',()=>{
  const r=shop(1);for(let day=1;day<=3;day++){
    expect(r.day).toBe(day);expect(r.closeDay()).toBe(true);
    if(day<3){for(const id of ['dough','sauce','cheese'] as const)if(!r.owned(id))r.buy(id,1);expect(r.openNextDay()).toBe(true);}
  }
  expect(r.daySummary!.ending).toBe('complete');expect(r.openNextDay()).toBe(false);expect(r.buy('dough',1)).toBe(false);expect(r.dispatch({type:'reset'})).toBe(false);
  const poor=shop(19);expect(poor.closeDay()).toBe(true);expect(poor.daySummary!.ending).toBe('insolvent');expect(poor.openNextDay()).toBe(false);
});
it('refuses closing a preparation that has never opened and keeps empty reviews honest',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);expect(r.closeDay()).toBe(false);expect(r.daySummary).toBeNull();
});

it('clears discarded day-one earnings, counts and reviews on replay before settlement',()=>{
  const r=shop();for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver'});
  expect(r.dispatch({type:'reset'})).toBe(true);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openShop();r.closeDay();
  expect(r.daySummary).toMatchObject({day:1,revenue:0,delivered:0,abandoned:1,purchases:30,cost:0,profit:-20,cash:250});expect(r.daySummary!.reviews).toHaveLength(1);expect(r.daySummary!.reviews[0]!.outcome).toBe('closed');
});

it('allows selecting the affordable next-day menu from summary without changing closed accounts',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.buy('mushroom',53);r.openShop();for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver'});r.continueShift();r.prepareAgain();
  r.selectRecipe('mushroom');r.closeDay();expect(r.state.cash).toBe(50);expect(r.daySummary!.ending).toBeNull();const closed=r.daySummary;
  expect(r.selectRecipe('cheese')).toBe(true);for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,1)).toBe(true);
  expect(r.daySummary).toEqual(closed);expect(r.canOpenNextDay).toBe(true);expect(r.openNextDay()).toBe(true);expect(r.selectedRecipe).toBe('cheese');
});
