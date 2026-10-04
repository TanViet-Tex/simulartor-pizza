import { expect, it } from 'vitest';
import { deliveryResult, type DeliveryCheck } from './DeliveryResult';
const good: DeliveryCheck = { expected: ['dough','cheese'], actual: ['dough','cheese'], takeaway: true, boxed: true, quality: 'good', remaining: 60, patience: 120, extraPenalty: 0 };
it('combines distinct penalties once and preserves the half-patience boundary', () => {
  expect(deliveryResult(good)).toEqual({stars:5,reasons:[],mismatch:false});
  expect(deliveryResult({...good,actual:['dough'],boxed:false})).toMatchObject({stars:3,mismatch:true});
  expect(deliveryResult({...good,actual:['dough'],boxed:false,quality:'raw',remaining:59,extraPenalty:1}).stars).toBe(1);
  expect(deliveryResult({...good,takeaway:false,boxed:false}).stars).toBe(5);
});
it('picky recipe penalty is explicit and never applies to packaging alone',()=>{
 expect(deliveryResult({...good,extraPenalty:1,boxed:false})).toMatchObject({stars:3,reasons:['Đơn mang đi chưa đóng hộp']});
 expect(deliveryResult({...good,extraPenalty:1,actual:['dough']})).toMatchObject({stars:2,reasons:['Sai công thức','Khách khó tính: sai công thức']});
 for(const wrong of [false,true])for(const boxed of [false,true])for(const quality of ['good','raw','burnt'] as const)for(const remaining of [60,59]){
  const result=deliveryResult({...good,actual:wrong?['dough']:good.actual,boxed,quality,remaining,extraPenalty:1});
  expect(result.stars).toBe(Math.max(1,5-(wrong||!boxed?2:0)-(wrong?1:0)-(quality==='good'?0:2)-(remaining<60?1:0)));
  expect(new Set(result.reasons).size).toBe(result.reasons.length);
 }
});
