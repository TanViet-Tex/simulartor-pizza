import {describe,it,expect} from 'vitest';
import {CozyStock,ingredientExpiry,validateStockSnapshot} from './CozyStock';
import {NON_EXPIRING_DAY} from '../config/ingredientCatalog';

describe('refrigerated stock',()=>{
  it('keeps old saves and sauce normalization compatible',()=>{
    const stock=new CozyStock();stock.buy('mushroom',2);stock.buy('dough',2);stock.buy('sauce',1);
    const old=stock.exportCheckpoint();old.lots.find(l=>l.ingredient==='sauce')!.expiry=2;
    const restored=CozyStock.restore(old)!;
    expect(restored.exportCheckpoint().refrigeration).toBeUndefined();
    expect(restored.lots.map(l=>l.expiry)).toEqual([1,2,NON_EXPIRING_DAY]);
    expect(restored.settle(1).expired).toBe(10);
  });
  it('extends inclusive shelf life of usable existing lots once without changing value or reservations',()=>{
    const stock=new CozyStock();stock.buy('mushroom',2);stock.buy('dough',2);stock.buy('sauce',2);
    expect(stock.reserveIngredients('held',['dough','sauce'],100,1)).toBe(true);
    const before=stock.inventorySnapshot(),cash=stock.cash;
    expect(stock.enableRefrigeration(1)).toBe(true);
    expect(stock.lots.map(l=>l.expiry)).toEqual([4,8,NON_EXPIRING_DAY]);
    expect(stock.inventorySnapshot().units).toBe(before.units);expect(stock.inventorySnapshot().value).toBe(before.value);
    expect(stock.cash).toBe(cash);expect(stock.reserved('dough')).toBe(1);
    expect(stock.commit('held',['dough','sauce'],1)).toBe(true);expect(stock.ledger(1).consumed).toBe(8);
    expect(stock.enableRefrigeration(1)).toBe(false);
    const restored=CozyStock.restore(stock.exportCheckpoint())!;
    expect(restored.lots.map(l=>l.expiry)).toEqual([4,8,NON_EXPIRING_DAY]);
    expect(restored.enableRefrigeration(2)).toBe(false);
    expect(restored.available('mushroom',4)).toBe(2);expect(restored.available('mushroom',5)).toBe(0);
  });
  it('never revives expired or disposed food',()=>{
    const stock=new CozyStock();stock.buy('mushroom',2,1);stock.buy('dough',2,1);
    expect(stock.enableRefrigeration(2)).toBe(true);
    expect(stock.lots.map(l=>l.expiry)).toEqual([1,8]);expect(stock.available('mushroom',2)).toBe(0);
    expect(CozyStock.restore(stock.exportCheckpoint())!.available('mushroom',2)).toBe(0);
    const disposed=new CozyStock();disposed.buy('mushroom',1,1);disposed.settle(1);disposed.enableRefrigeration(2);
    expect(disposed.lots).toEqual([]);
  });
  it('applies to new ordinary, bulk and express purchases without changing purchase prices',()=>{
    const normal=new CozyStock(),cold=new CozyStock();normal.receive(1000);cold.receive(1000);cold.enableRefrigeration(1);
    for(const stock of [normal,cold]){
      expect(stock.buy('mushroom',1,1)).toBe(true);
      expect(stock.buyAll([{ingredient:'dough',quantity:2,unitPrice:stock.purchasePrice('dough',1)}],1)).toBe(true);
      expect(stock.orderExpress('urgent','cheese',1,1)).not.toBeNull();expect(stock.receiveExpress('urgent')).toBe(true);
    }
    expect(cold.lots.map(l=>l.expiry)).toEqual([4,8,8]);expect(cold.cash).toBe(normal.cash);
    expect(cold.ledger(1)).toEqual(normal.ledger(1));expect(cold.lots.map(l=>l.unitCost)).toEqual(normal.lots.map(l=>l.unitCost));
    expect(CozyStock.restore(cold.exportCheckpoint())).not.toBeNull();
  });
  it('requires valid refrigeration metadata for extended expiry and rejects tampered dates',()=>{
    const stock=new CozyStock();stock.buy('dough',1);const old=stock.exportCheckpoint();old.lots[0].expiry=8;
    expect(validateStockSnapshot(old)).toBeNull();stock.enableRefrigeration(1);
    const saved=stock.exportCheckpoint();expect(validateStockSnapshot(saved)).not.toBeNull();
    expect(validateStockSnapshot({...saved,refrigeration:{multiplier:8,acquiredDay:1}})).toBeNull();
    expect(validateStockSnapshot({...saved,refrigeration:{multiplier:4,acquiredDay:0}})).toBeNull();
    expect(validateStockSnapshot({...saved,refrigeration:{multiplier:4,acquiredDay:1,extra:true}})).toBeNull();
    saved.lots[0].expiry=9;expect(validateStockSnapshot(saved)).toBeNull();
    expect(ingredientExpiry('mushroom',3,4)).toBe(6);expect(ingredientExpiry('dough',3,4)).toBe(10);
  });
  it('preserves pending express identity while refrigerating its food once',()=>{
    const stock=new CozyStock();const first=stock.orderExpress('pending','mushroom',2,1)!;
    stock.enableRefrigeration(1);const retried=stock.orderExpress('pending','mushroom',2,1)!;
    expect(retried.total).toBe(first.total);expect(retried.expiry).toBe(4);
    expect(stock.receiveExpress('pending')).toBe(true);expect(stock.receiveExpress('pending')).toBe(false);
    expect(stock.lots[0].quantity).toBe(2);expect(stock.lots[0].expiry).toBe(4);
  });
});
