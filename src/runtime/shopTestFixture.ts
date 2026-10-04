import {CozyRuntime} from './CozyRuntime';
import type {CozyCheckpoint} from '../domain/CozyCheckpoint';
let cache:CozyCheckpoint|null=null;
/** Earned cash and real reports keep persistence tests honest. */
export function fundedShopCheckpoint():CozyCheckpoint {
 if(cache)return structuredClone(cache);
 const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:180,grace:120,slots:Array.from({length:15},(_,i)=>({id:`earned-${day}-${i}`,at:i*10,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})});
 r.configureMenu('mushroom',100,false);
 for(let day=1;r.state.cash<18000&&day<100;day++){
  for(const ingredient of ['dough','sauce','cheese'] as const)r.buy(ingredient,15);
  if(day===1)r.openShop();else r.openNextDay();r.dismissThanks();
  for(let i=0;i<15;i++){
   r.dismissThanks();
   for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
   r.dispatch({type:'bake'});for(let t=0;t<140;t++)r.advance(50);
   r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver',commandId:`earned-${day}-${i}`});r.continueShift();
   if(i<14)for(let t=0;t<60;t++)r.advance(50);
  }
  r.closeDay();
 }
 cache=r.exportCheckpoint();return structuredClone(cache);
}
