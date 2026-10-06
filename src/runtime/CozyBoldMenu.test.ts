import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import type {StockIngredient} from '../domain/CozyStock';

const sauces=['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'] as const;
describe('always available sauce purchases',()=>{
  it('keeps all five unlocked on fresh, menu-off and restored campaigns across all purchase paths',()=>{
    const fresh=new CozyRuntime(false,true);
    expect(fresh.ownedRecipes).not.toContain('chicken-bbq');
    expect(fresh.configureMenu('cheese',100,false)).toBe(true);
    for(const r of [fresh,CozyRuntime.restoreCheckpoint(fresh.exportCheckpoint())!]){
      for(const id of sauces){expect(r.ingredientAccess(id).unlocked).toBe(true);expect(r.buy(id,1,'single-'+id)).toBe(true);}
      const quote=r.quoteMarketBasket(sauces.map(ingredient=>({ingredient,quantity:1})))!;
      expect(quote).not.toBeNull();expect(r.buyAll(quote.entries,'all-sauces',r.preparationDay)).toBe(true);
      for(const id of sauces)expect(r.owned(id)).toBe(2);
      expect(r.openShop()).toBe(true);
      const before=r.state.cash;
      for(const id of sauces)expect(r.orderExpress(id,1,'express-'+id)).toBe(true);
      expect(r.state.cash).toBeLessThan(before);expect(r.expressOrders).toHaveLength(5);
      const lease=r.acquirePause('user');r.advanceElapsed(6000);for(const id of sauces)expect(r.owned(id)).toBe(2);
      lease.release();r.advanceElapsed(5000);for(const id of sauces)expect(r.owned(id)).toBe(3);
    }
  });
  it('still enforces phase, cash, quantity and non-sauce recipe access',()=>{
    const r=new CozyRuntime(false,true),before=r.exportCheckpoint();
    expect(r.orderExpress('sauce-bbq',1,'before-open')).toBe(false);
    expect(r.buy('sauce-bbq',0)).toBe(false);expect(r.buy('sauce-bbq',100)).toBe(false);
    expect(r.buy('chicken',1)).toBe(false);expect(r.quoteMarketBasket([{ingredient:'sauce-bbq',quantity:101}])).toBeNull();
    expect(r.exportCheckpoint()).toEqual(before);
    const lease=r.acquirePause('user');for(const id of sauces as readonly StockIngredient[])expect(r.buy(id,1)).toBe(false);lease.release();
  });
  it('rejects last-selling, unowned and midshift menu edits without mutating prices',()=>{
    const r=new CozyRuntime(false,true);expect(r.configureMenu('cheese',105,true)).toBe(true);expect(r.configureMenu('mushroom',100,false)).toBe(true);
    const before=r.exportCheckpoint();expect(r.configureMenu('cheese',105,false)).toBe(false);expect(r.configureMenu('sausage',100,true)).toBe(false);expect(r.configureMenu('cheese',145,true)).toBe(false);expect(r.exportCheckpoint()).toEqual(before);
    r.openShop();expect(r.configureMenu('cheese',100,true)).toBe(false);expect(r.customerProgress.pricePercents.cheese).toBe(105);
  });
});
