import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyStock} from '../domain/CozyStock';
import {CozyOrder} from '../domain/CozyOrder';
import {FINISHING_SAUCES} from '../config/ingredientCatalog';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,validateSaveEnvelope} from '../infrastructure/CozySaveRepository';
const deps={schedule:(day:number)=>({day,duration:180,grace:120,slots:[{id:'one',at:0,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:1,takeaway:true}]})};
function prepared(){const r=new CozyRuntime(false,true,deps);for(const id of ['dough','sauce','cheese',...FINISHING_SAUCES] as const)expect(r.buy(id,2)).toBe(true);r.openShop();for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});return r;}
describe('finishing sauces and persistent sauce lots',()=>{
 it('resets finishing use per app pizza and records both portions in one delivered order',()=>{
 const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'app-'+day,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true,source:day>=5?'app':'shop',quantity:day>=5?2:1}]}),resolveRecipe:()=> 'cheese'});
 r.configureMenu('mushroom',100,false);
 for(let day=1;day<=4;day++){
   for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,1)).toBe(true);
   expect(day===1?r.openShop():r.openNextDay()).toBe(true);r.dismissThanks();
   for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
   r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});r.dispatch({type:'box'});expect(r.dispatch({type:'deliver'})).toBe(true);r.continueShift();r.closeDay();
 }
 expect(r.configureDeliveryApp(true,'on')).toBe(true);for(const id of ['dough','sauce','cheese','sauce-white'] as const)expect(r.buy(id,2)).toBe(true);
 r.openNextDay();expect(r.bookShipper(r.selectedTicketId,'book')).toBe(true);
 for(let part=0;part<2;part++){
   expect(r.state.finishingSauces).toEqual([]);for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
   r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});
   const lease=r.acquirePause('user');expect(r.dispatch({type:'ingredient',ingredient:'sauce-white'})).toBe(false);lease.release();
   expect(r.dispatch({type:'ingredient',ingredient:'sauce-white'})).toBe(true);expect(r.dispatch({type:'ingredient',ingredient:'sauce-white'})).toBe(false);
   r.dispatch({type:'box'});expect(r.dispatch({type:'deliver'})).toBe(true);
 }
 expect(r.owned('sauce-white')).toBe(0);expect(r.lastResult?.stars).toBe(5);r.closeDay();expect(r.daySummary).toMatchObject({pizzasSold:2,cost:42});
 });
 it('rejects assembly/oven/boxed additions and consumes each finishing portion once without recipe changes',()=>{
 const r=prepared();for(const ingredient of FINISHING_SAUCES)expect(r.dispatch({type:'ingredient',ingredient})).toBe(false);
 r.dispatch({type:'bake'});expect(r.dispatch({type:'ingredient',ingredient:'sauce-white'})).toBe(false);r.advanceElapsed(6000);r.dispatch({type:'extract'});
 for(const ingredient of FINISHING_SAUCES){expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);expect(r.dispatch({type:'ingredient',ingredient})).toBe(false);expect(r.owned(ingredient)).toBe(1);}
 expect(r.state.ingredients).toEqual(['dough','sauce','cheese']);expect(r.state.finishingSauces).toEqual([...FINISHING_SAUCES]);r.dispatch({type:'box'});expect(r.dispatch({type:'ingredient',ingredient:'sauce-white'})).toBe(false);expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.lastResult?.stars).toBe(5);expect(r.progression.cheeseSales).toBe(1);r.closeDay();expect(r.daySummary?.cost).toBe(27);
 });
 it('retains burned quality after owner extraction and permits a drizzle only then',()=>{
 const r=prepared();r.dispatch({type:'bake'});r.advanceElapsed(8500);expect(r.state.stage).toBe('burnt');expect(r.state.extracted).toBe(false);expect(r.deliverySource).toBeNull();expect(r.dispatch({type:'ingredient',ingredient:'sauce-pesto'})).toBe(false);expect(r.dispatch({type:'deliver'})).toBe(false);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.deliverySource?.stage).toBe('burnt');expect(r.ovenOwner).toBeNull();expect(r.dispatch({type:'ingredient',ingredient:'sauce-pesto'})).toBe(true);r.advanceElapsed(1000);expect(r.state).toMatchObject({stage:'burnt',ovenSeconds:8.05,extracted:true});
 });
 it.each([0,1,2])('freezes extracted appearance and clears finishing state on discard, oven level %s',level=>{
 const o=new CozyOrder(false,'cheese',true,level);o.dispatch({type:'ingredient',ingredient:'dough'});o.dispatch({type:'bake'});o.tick(o.timing.perfectStart);o.dispatch({type:'extract'});o.dispatch({type:'ingredient',ingredient:'sauce-hot'});o.tick(100);expect(o.state.ovenSeconds).toBe(o.timing.perfectStart);o.dispatch({type:'discard'});expect(o.state.finishingSauces).toEqual([]);expect(o.state.extracted).toBe(false);
 });
 it('retains all five sauces at settlement and restores only valid legacy expiries without mutating input',()=>{
 const stock=new CozyStock();for(const id of ['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'] as const)stock.buy(id,2);stock.buy('mushroom',1);const snapshot=stock.exportCheckpoint();for(const lot of snapshot.lots)if(lot.ingredient.startsWith('sauce'))lot.expiry=lot.day+1;
 const old=JSON.stringify(snapshot),restored=CozyStock.restore(snapshot)!;expect(JSON.stringify(snapshot)).toBe(old);expect(restored.settle(1).expired).toBe(5);expect(restored.settle(2).expired).toBe(0);expect(restored.lots).toHaveLength(5);for(const lot of restored.lots)expect(lot.expiry).toBe(1000001);snapshot.lots[0].expiry=3;expect(CozyStock.restore(snapshot)).toBeNull();
 });
 it('normalizes valid preparation checkpoints and rejects invented expiry',()=>{
 const r=new CozyRuntime(false,true);r.buy('sauce-white',2);const saved=r.exportCheckpoint();saved.stock.lots[0].expiry=2;const before=JSON.stringify(saved),loaded=validateCozyCheckpoint(saved)!;expect(loaded).not.toBeNull();expect(loaded.stock.lots[0]).toMatchObject({quantity:2,expiry:1000001});expect(JSON.stringify(saved)).toBe(before);saved.stock.lots[0].expiry=10;expect(validateCozyCheckpoint(saved)).toBeNull();
 });
 it('checks the original checksum before normalizing historical sauce lots and report copies',()=>{
 const r=new CozyRuntime(false,true,deps);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openShop();r.closeDay();const payload=r.exportCheckpoint();
 for(const lot of payload.stock.lots)if(lot.ingredient.startsWith('sauce'))lot.expiry=lot.day+1;
 for(const report of payload.reports)for(const lot of report.accounts.inventory.lots)if(lot.ingredient.startsWith('sauce'))lot.expiry=lot.day+1;
 const envelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'sauce-save',commitId:'sauce-boundary',revision:1,checksum:checkpointChecksum(payload),payload};const original=JSON.stringify(envelope),loaded=validateSaveEnvelope(envelope);
 expect('ok' in loaded).toBe(false);if('ok' in loaded)throw new Error('valid migration rejected');
 expect(loaded.payload.stock.lots.find(l=>l.ingredient==='sauce')?.expiry).toBe(1000001);expect(loaded.payload.reports[0].accounts.inventory.lots.find(l=>l.ingredient==='sauce')?.expiry).toBe(1000001);expect(JSON.stringify(envelope)).toBe(original);
 envelope.payload.stock.lots[0].quantity++;expect(validateSaveEnvelope(envelope)).toMatchObject({ok:false,code:'corrupt'});
 });
});
