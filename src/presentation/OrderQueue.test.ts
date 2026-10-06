import { describe,expect,it } from 'vitest';
import { createOrderQueue, ORDER_DETAIL_PROMPT, ORDER_PANEL, type OrderQueueInput } from './OrderQueue';

const ticket=(n:number,source?:'shop'|'app'):OrderQueueInput=>({id:`cozy-${n}`,name:`Khách ${n}`,recipe:n%2?'cheese':'mushroom',remaining:119.1,source});

describe('compact order queue',()=>{
  it('shows the current mixed pizza, requested sauce, total and packed progress in the existing panel',()=>{
    const queue=createOrderQueue([{...ticket(1),recipe:'mushroom',quantity:2,packed:1,itemIndex:1,requestedSauces:['sauce-pesto'],finalPrice:55,totalPrice:105}], 'cozy-1','cozy-1');
    expect(queue.detail!.lines[1]).toContain('2/2 · Pizza nấm + pesto');
    expect(queue.detail!.lines[1]).toContain('105 xu');
    expect(queue.detail!.lines[2]).toBe('Hộp 1/2 · 2:00');
    expect(ORDER_PANEL).toEqual({x:10,y:161,width:340,height:63});
  });
  it('marks free help explicitly without changing panel geometry or counter packaging',()=>{
    const queue=createOrderQueue([{...ticket(1),help:true,takeaway:false,kindLabel:'Giúp miễn phí',finalPrice:0}],'cozy-1','cozy-1');
    expect(queue.detail!.lines[0]).toContain('Giúp miễn phí');expect(queue.detail!.lines[1]).toContain('Tặng miễn phí');expect(queue.detail!.lines[1]).not.toContain('0 xu');expect(queue.detail!.lines[2]).toContain('Không cần hộp');expect(ORDER_PANEL).toEqual({x:10,y:161,width:340,height:63});
  });
  it('keeps ordering source independent from actual counter service and packaging',()=>{
    const queue=createOrderQueue([{...ticket(1,'app'),takeaway:false}],'cozy-1','cozy-1');
    expect(queue.detail).toMatchObject({sourceLabel:'Qua app',takeaway:false});
    expect(queue.detail!.lines[1]).toContain('Tại quầy');expect(queue.detail!.lines[2]).toContain('Không cần hộp');
  });
  it.each([{kindLabel:'Khách quen',finalPrice:60,maxPricePercent:120},{kindLabel:'Khó tính',finalPrice:71,maxPricePercent:110},{kindLabel:'Mặc cả',finalPrice:68,maxPricePercent:105},{kindLabel:'Khách vội',finalPrice:81,maxPricePercent:125}])('shows selected $kindLabel agreed price and own acceptance limit',profile=>{
    const queue=createOrderQueue([{...ticket(2),...profile}],'cozy-2','cozy-2');
    expect(queue.detail!.lines[0]).toContain(profile.kindLabel);expect(queue.detail!.lines[1]).toContain(`${profile.finalPrice} xu`);expect(queue.detail!.lines[2]).toContain(`Giá ≤${profile.maxPricePercent}%`);
    expect(queue.detail!.sourceLabel).toBe('Tại quán');expect(ORDER_PANEL).toEqual({x:10,y:161,width:340,height:63});
  });
  it('shows no inspected detail or ring for empty queues and automatic production selection',()=>{
    expect(createOrderQueue([])).toEqual({slots:[],detail:null,inspectedId:null});
    const queue=createOrderQueue([ticket(1)],null,'cozy-1');
    expect(queue.detail).toBeNull();expect(queue.slots[0].selected).toBe(false);
    expect(ORDER_DETAIL_PROMPT).toBe('Chọn đơn để xem chi tiết');
  });
  it('retains six supplied identities and sources inside six equal non-overlapping touch cells',()=>{
    const queue=createOrderQueue(Array.from({length:7},(_,i)=>ticket(i+1,i%2?'app':undefined)));
    expect(queue.slots).toHaveLength(6);
    expect(queue.slots.map(s=>[s.id,s.source,s.icon])).toEqual(Array.from({length:6},(_,i)=>[`cozy-${i+1}`,i%2?'app':'shop',i%2?'phone':'avatar']));
    queue.slots.forEach((s,i)=>{
      expect([s.x,s.y,s.width,s.height,s.centerX]).toEqual([12+56*i,79,56,79,40+56*i]);
      expect(s.x+s.width).toBeLessThanOrEqual(352);expect(s.y+s.height).toBeLessThanOrEqual(160);
      // Supported portrait canvases fit at scale >= 1, so every cell remains >=48 CSS px.
      expect(s.width).toBeGreaterThanOrEqual(48);expect(s.height).toBeGreaterThanOrEqual(48);
      if(i)expect(queue.slots[i-1].x+queue.slots[i-1].width).toBe(s.x);
    });
    expect(ORDER_PANEL).toEqual({x:10,y:161,width:340,height:63});
  });
  it('moves matching gold selection and truthful three-line detail together',()=>{
    const orders=[ticket(1),ticket(2,'app')];
    const queue=createOrderQueue(orders,'cozy-2','cozy-2');
    expect(queue.slots.map(s=>s.selected)).toEqual([false,true]);
    expect(queue.detail).toMatchObject({id:'cozy-2',number:'02',name:'Khách 2',source:'app',sourceLabel:'Qua app',recipeLabel:'Pizza nấm',quantity:1,takeaway:true,deadline:'2:00'});
    expect(queue.detail?.lines).toEqual(['#02 · Khách 2 · Qua app','Pizza nấm ×1 · Mang đi','Còn 2:00 · Cần đóng hộp']);
    const next=createOrderQueue(orders,'cozy-1','cozy-1');
    expect(next.slots.map(s=>s.selected)).toEqual([true,false]);expect(next.detail?.sourceLabel).toBe('Tại quán');
  });
  it('clears inspection on delivery, expiry, reset, hidden seventh slot, or a different runtime target',()=>{
    for(const queue of [createOrderQueue([],'cozy-1','cozy-1'),createOrderQueue([{...ticket(1),remaining:0}],'cozy-1','cozy-1'),
      createOrderQueue([ticket(1),ticket(2)],'cozy-1','cozy-2'),createOrderQueue(Array.from({length:7},(_,i)=>ticket(i+1)),'cozy-7','cozy-7')]){
      expect(queue.detail).toBeNull();expect(queue.inspectedId).toBeNull();expect(queue.slots.every(s=>!s.selected)).toBe(true);
    }
  });
  it('keeps order numbers attached to IDs after removal and formats deadline boundaries',()=>{
    const queue=createOrderQueue([{...ticket(2),remaining:.05},{...ticket(4),remaining:60}], 'cozy-4');
    expect(queue.slots.map(s=>[s.number,s.deadline])).toEqual([['02','0:01'],['04','1:00']]);
  });
  it('shows only a real supplied patience fraction and clamps its arc',()=>{
    const queue=createOrderQueue([{...ticket(1),remaining:30,patience:120},{...ticket(2),patience:30},ticket(3)]);
    expect(queue.slots.map(s=>s.patienceRatio)).toEqual([.25,1,null]);
  });
  it('represents the actual Linh practice order without a fabricated deadline or initial inspection',()=>{
    const orders:OrderQueueInput[]=[{id:'practice-linh',name:'Linh',number:'Tập',recipe:'cheese',remaining:null}];
    expect(createOrderQueue(orders).detail).toBeNull();
    expect(createOrderQueue(orders,'practice-linh').detail).toMatchObject({name:'Linh',deadline:'Không giới hạn',source:'shop',takeaway:true});
  });
});
