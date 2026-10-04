import {CozyRuntime} from './CozyRuntime';
import type {CozyCheckpoint} from '../domain/CozyCheckpoint';
const cache=new Map<number,CozyCheckpoint>();
/** Earned cash and real reports keep persistence tests honest. */
export function fundedShopCheckpoint(minCash=18000):CozyCheckpoint {
 const existing=cache.get(minCash);if(existing)return structuredClone(existing);
 const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:350,grace:120,slots:Array.from({length:day===1?15:30},(_,i)=>({id:`earned-${day}-${i}`,at:i*10,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})});
 r.configureMenu('mushroom',100,false);
 for(let day=1;r.state.cash<minCash&&day<=30;day++){
  const count=day===1?15:30;
  for(const ingredient of ['dough','sauce','cheese'] as const)r.buy(ingredient,count);
  if(day===1)r.openShop();else r.openNextDay();r.dismissThanks();
  for(let i=0;i<count;i++){
   r.dismissThanks();
   for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
   r.dispatch({type:'bake'});for(let t=0;t<140;t++)r.advance(50);
   r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver',commandId:`earned-${day}-${i}`});r.continueShift();
   if(i<count-1)for(let t=0;t<60;t++)r.advance(50);
  }
  r.closeDay();
 }
 if(r.state.cash<minCash)throw new Error('Requested fixture funding exceeds the earned 30-day campaign.');
 const checkpoint=r.exportCheckpoint();cache.set(minCash,checkpoint);return structuredClone(checkpoint);
}
