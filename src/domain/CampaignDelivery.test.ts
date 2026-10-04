import { expect, it } from 'vitest';
import { DemoGame } from './demo';
function shop(){const g=new DemoGame();for(const ingredient of ['dough','sauce','cheese','mushroom'])g.dispatch({type:'buy',ingredient,quantity:5});g.dispatch({type:'open'});g.tick(10);return g;}
function pizza(g:DemoGame){for(const ingredient of ['dough','sauce','cheese'])g.dispatch({type:'ingredient',ingredient});g.dispatch({type:'bake'});g.tick(3.1);g.dispatch({type:'remove'});}
it('rejects unconsented incorrect delivery and resolves a captured target once',()=>{
  const g=shop();pizza(g);g.tick(46.9);const target=g.state.tickets[2]!;
  const cash=g.state.cash,source=g.state.pizza!.ticketId;
  expect(g.dispatch({type:'deliver',targetId:target.id,sourceId:source,commandId:'d1'}).ok).toBe(false);expect(g.state.cash).toBe(cash);expect(g.state.pizza).not.toBeNull();
  expect(g.dispatch({type:'deliver',targetId:target.id,sourceId:source,commandId:'d1',confirmed:true}).ok).toBe(true);
  expect(g.state.cash).toBe(cash+65);expect(g.state.ratings).toEqual([2]);
  expect(g.dispatch({type:'deliver',targetId:'1-0',sourceId:source,commandId:'d1',confirmed:true}).ok).toBe(false);expect(g.state.cash).toBe(cash+65);
  g.dispatch({type:'select',id:source});pizza(g);
  expect(g.dispatch({type:'deliver',targetId:source,sourceId:source,commandId:'d1',confirmed:true}).ok).toBe(false);
  expect(g.state.pizza).not.toBeNull();expect(g.state.cash).toBe(cash+65);
});
it('keeps a consumed pizza after owner timeout, rejects stale targets and discards without refund',()=>{
  const g=shop();pizza(g);const id=g.state.pizza!.ticketId;g.state.tickets.forEach(t=>t.remaining=1);g.tick(2);
  expect(g.state.pizza).not.toBeNull();expect(g.state.tickets).toHaveLength(0);
  const cash=g.state.cash,cost=g.state.cost;
  expect(g.dispatch({type:'box'}).ok).toBe(false);
  expect(g.dispatch({type:'deliver',targetId:id,sourceId:id,commandId:'expired',confirmed:true}).ok).toBe(false);
  expect(g.state.pizza).not.toBeNull();expect(g.state.cash).toBe(cash);
  expect(g.dispatch({type:'discard'}).ok).toBe(true);expect(g.state.cost).toBe(cost);
});
