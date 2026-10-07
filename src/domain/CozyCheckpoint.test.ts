import {describe,it,expect} from 'vitest';
import {CozyRuntime} from '../runtime/CozyRuntime';
import {validateCozyCheckpoint} from './CozyCheckpoint';
import {CozyStock} from './CozyStock';
import {cozyViability} from './CozyViability';
import {ORDER_TEST_SCHEDULE} from '../runtime/cozyScheduleFixture';
function boundary(){const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.openShop();r.closeDay();return r.exportCheckpoint();}
describe('Cozy latest boundary validation',()=>{
  it('migrates old saves and preserves preparation purchases alongside an upgrade',()=>{
    const oldUpgrade=new CozyRuntime(false,true).exportCheckpoint();oldUpgrade.stock.cash-=150;oldUpgrade.upgrades={ovenLevel:1,queueLevel:0,spent:150,pendingSpent:150};const r=CozyRuntime.restoreCheckpoint(oldUpgrade)!;r.buy('dough',2);expect(r.upgradePrice('oven')).toBe(5000);
    const saved=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(saved)!;
    expect(loaded.state.cash).toBe(140);expect(loaded.owned('dough')).toBe(2);expect(loaded.ovenLevel).toBe(1);
    expect(loaded.openShop()).toBe(true);loaded.closeDay();expect(loaded.daySummary!.accounts.endingCash).toBe(120);
    const old=new CozyRuntime(false,true).exportCheckpoint() as Record<string,unknown>;delete old.upgrades;delete old.customerMemory;
    expect(CozyRuntime.restoreCheckpoint(old)?.queueCapacity).toBe(4);
    expect(CozyRuntime.restoreCheckpoint(old)?.ovenLevel).toBe(0);
  });
  it('reconstructs detached stock/books and an unclosed next day, without tickets or reservations',()=>{
    const s=boundary(),r=CozyRuntime.restoreCheckpoint(s)!;expect(r.day).toBe(2);expect(r.shopPhase).toBe('preparation');expect(r.tickets).toEqual([]);expect(r.reserved('cheese')).toBe(0);expect(r.state.cash).toBe(s.stock.cash);expect(r.completedReports).toHaveLength(1);expect(r.closeDay()).toBe(false);s.stock.cash=999;expect(r.state.cash).not.toBe(999);
  });
  it('keeps FEFO lot identity and rejects corrupt cost, quantity, day, books, claims and report economics',()=>{
    const original=boundary();const mutations:((s:typeof original)=>void)[]=[s=>{s.stock.lots[0].unitCost++;},s=>{s.stock.lots[0].quantity=-1;},s=>{s.stock.books[0].purchases++;},s=>{s.stock.settlements[0].expired++;},s=>{s.progression.claims.push('unknown');},s=>{s.reports[0].cash++;},s=>{s.day=1;},s=>{s.help.decision='accepted';},s=>{s.prices.cheese=141;}];
    for(const mutate of mutations){const s=structuredClone(original);mutate(s);expect(validateCozyCheckpoint(s)).toBeNull();}expect(CozyStock.restore(original.stock)?.lots).toEqual(original.stock.lots);
  });
  it('returns null for malformed JSON shapes instead of throwing',()=>{
    const s=boundary();for(const value of [null,[],{...s,reports:[null]},{...s,reports:[{...s.reports[0],reviews:[null]}]},{...s,reports:[{...s.reports[0],accounts:{inventory:{lots:[null]}}}]},{...s,progression:{goals:[null]}},{...s,stock:{lots:[null]}},{...s,help:[]}]){expect(()=>validateCozyCheckpoint(value)).not.toThrow();expect(validateCozyCheckpoint(value)).toBeNull();}
  });
  it('rejects ledger history and closing inventory that disagree with the boundary',()=>{
    const original=boundary();
    for(const mutate of [
      (s:typeof original)=>{s.reports[0].accounts.cumulativeProfit++;},
      (s:typeof original)=>{s.reports[0].accounts.openingInventoryValue++;},
      (s:typeof original)=>{s.stock.lots[0].quantity++;},
    ]){const s=structuredClone(original);mutate(s);expect(validateCozyCheckpoint(s)).toBeNull();}
  });
  it('uses independent rent and missing-unit thresholds, including a cheaper unlocked omitted recipe',()=>{
    expect(cozyViability(19,2,['cheese'],()=>1)).toMatchObject({viable:false,cause:'rent',missing:1});expect(cozyViability(20,2,['cheese'],()=>1).viable).toBe(true);
    expect(cozyViability(20,2,['cheese'],()=>0)).toMatchObject({viable:true,ingredientCost:17});expect(cozyViability(20,2,['sausage'],()=>0)).toMatchObject({viable:false,cause:'ingredients',missing:8});expect(cozyViability(20,2,['sausage','cheese'],()=>0)).toMatchObject({viable:true,recipe:'cheese'});
  });
  it('continues Day3 at a valid Day4 boundary without replaying closed days',()=>{
    const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);
    for(let day=1;day<=3;day++){for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);if(day===1)r.openShop();else r.openNextDay();r.resolveLottery(0);expect(r.closeDay()).toBe(true);}
    const s=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(s)!;expect(s).toMatchObject({day:4,terminal:false});expect(loaded.day).toBe(4);expect(loaded.daySummary).toBeNull();expect(loaded.openNextDay()).toBe(false);expect(loaded.openShop()).toBe(true);expect(loaded.dispatch({type:'reset'})).toBe(false);
  });
});
