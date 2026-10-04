import {describe,it,expect} from 'vitest';
import {stockRows,stockForecast} from './StockPlanning';
describe('stock planning',()=>{
  it('lists all ingredients and excludes expired/future lots and held stock',()=>{
    const rows=stockRows([{id:1,ingredient:'cheese',quantity:8,unitCost:7,day:1,expiry:2},{id:2,ingredient:'cheese',quantity:9,unitCost:7,day:1,expiry:1},{id:3,ingredient:'cheese',quantity:4,unitCost:8,day:3,expiry:4}],2,id=>id==='cheese'?3:0);
    expect(rows).toHaveLength(19);expect(rows.find(r=>r.id==='cheese')).toMatchObject({usable:5,reserved:3});expect(rows.find(r=>r.id==='shrimp')?.usable).toBe(0);expect(rows.find(r=>r.id==='cheese')?.lots).toHaveLength(3);
  });
  it('adds shared recipe needs before subtracting stock once',()=>{
    const plan=stockForecast(['cheese','mushroom'],{cheese:2,mushroom:3},id=>id==='dough'?4:0);
    expect(plan.find(r=>r.id==='dough')).toMatchObject({need:5,available:4,missing:1});expect(plan.some(r=>r.id==='shrimp')).toBe(false);
  });
  it('changes with portions/menu and never recommends a negative purchase',()=>{
    expect(stockForecast(['cheese'],{cheese:1,mushroom:10},()=>20).every(r=>r.missing===0)).toBe(true);expect(stockForecast(['cheese'],{},()=>0)).toEqual([]);
  });
});
