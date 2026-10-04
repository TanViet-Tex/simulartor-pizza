import {describe,expect,it} from 'vitest';
import {CozyStock} from './CozyStock';

describe('dated exact reservations',()=>{
  it('pins FEFO lots per ticket even when newer reservation bakes first',()=>{
    const s=new CozyStock();for(const id of ['dough','sauce','cheese'] as const)s.buy(id,1,1);
    s.settle(1);for(const id of ['dough','sauce','cheese'] as const)s.buy(id,1,2);
    expect(s.reserve('A','cheese',100,2)).toBe(true);expect(s.reserve('B','cheese',100,2)).toBe(true);
    expect(s.reserve('C','cheese',100,2)).toBe(false);
    expect(s.commit('B',['dough','sauce','cheese'],2)).toBe(true);
    expect(s.ledger(2).consumed).toBe(17);expect(s.lots.every(l=>l.day===1)).toBe(true);
    expect(s.available('dough',2)).toBe(0);expect(s.reserved('dough',2)).toBe(1);
    expect(s.commit('A',['dough','sauce','cheese'],2)).toBe(true);expect(s.ledger(2).consumed).toBe(32);
    expect(s.lots).toEqual([]);
  });
  it('excludes past expiry and future purchases, but includes the expiry day',()=>{
    const s=new CozyStock();for(const id of ['dough','sauce','cheese','mushroom'] as const)s.buy(id,1,1);
    s.buy('mushroom',1,3);
    expect(s.owned('mushroom',2)).toBe(0);expect(s.reserve('future','mushroom',100,2)).toBe(false);
    expect(s.reserve('last-day','cheese',100,2)).toBe(true);
    const before=s.lots;expect(s.commit('last-day',['dough','sauce','cheese'],3)).toBe(false);
    expect(s.lots).toEqual(before);expect(s.ledger(3).consumed).toBe(0);
    expect(s.reserve('old','cheese',100,3)).toBe(false);
  });
  it('preflights invalid input without partial consumption and releases subset holds',()=>{
    const s=new CozyStock();for(const id of ['dough','sauce','cheese','mushroom'] as const)s.buy(id,1);
    expect(s.reserve('A','mushroom',100,1)).toBe(true);const lots=s.lots;
    for(const list of [[],['dough','dough'],['dough','bad']] as const)expect(s.commit('A',list as never,1)).toBe(false);
    for(const day of [0,4,NaN,1.5])expect(s.commit('A',['dough'],day)).toBe(false);
    expect(s.lots).toEqual(lots);expect(s.ledger(1).consumed).toBe(0);
    expect(s.commit('A',['dough'],1)).toBe(true);expect(s.available('cheese',1)).toBe(1);
    expect(s.commit('A',['sauce'],1)).toBe(false);expect(s.ledger(1).consumed).toBe(5);
  });
  it('rejects an invalid recipe or day, and never leaves partial holds on shortage',()=>{
    const s=new CozyStock();s.buy('dough',2);
    expect(s.reserve('A','cheese',10,1)).toBe(false);expect(s.reserved('dough',1)).toBe(0);
    expect(s.reserve('B','bad' as never,10,1)).toBe(false);
    for(const day of [0,4,NaN])expect(s.reserve('C','cheese',10,day)).toBe(false);
  });
});
