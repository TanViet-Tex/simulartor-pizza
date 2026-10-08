import type Phaser from 'phaser';
import type {ShopScreenInput} from './ReferenceShop';
import type {HubHit} from './HubCanvasUI';
import {ShopScreenUI} from './ShopScreenUI';
import {SHOP_SCREEN_ART,SHOP_PIZZA_CROPS,SHOP_STAFF_CROPS} from './ShopScreenArt';
import {hubListWindow} from './HubListWindow';
import {SHOP_CATALOG} from '../config/shopCatalog';
import {STAFF_CATALOG} from '../config/staffCatalog';
import {SHOP_SCREEN_LAYOUT,HUB_SHELL_LAYOUT} from './HubWallLayout';
let serial=0;
type Action={id:string;title?:string;x:number;y:number;width:number;height:number;enabled:boolean;run:()=>void};
export function drawShopScreen(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,input:ShopScreenInput):void{
  if(input.page==='home')return;
  const page=input.page,filtered=page==='decoration'||page==='staff',viewport=filtered?SHOP_SCREEN_LAYOUT.filteredViewport:SHOP_SCREEN_LAYOUT.viewport;
  const actions:Action[]=[],cards:unknown[]=[];let height=0;
  scene.game.canvas.dataset.shopScreenArt='[]';
  ShopScreenUI.shell(scene,layer,hit,()=>input.open('home'));
  const draw=(ui:ShopScreenUI)=>{
    const action=(id:string,x:number,y:number,w:number,h:number,title:string,enabled:boolean,run:()=>void)=>{
      const cost=id==='summary-upgrade-oven'?input.ovenPrice:id==='shop-fridge-buy'&&!input.fridge?.owned?(input.fridge?.price??3000):id==='summary-upgrade-queue'?input.queuePrice:null;
      const caption=cost!==null&&cost!==undefined&&input.cash<cost?`Thiếu ${cost-input.cash} xu`:title;
      ui.button(x,y,w,h,caption,enabled,12);actions.push({id,title:caption,x,y,width:w,height:h,enabled,run});
    };
    const room=(id:keyof typeof SHOP_SCREEN_ART,y:number,h=120)=>{ui.frame({x:8,y,width:344,height:h+12});const art=SHOP_SCREEN_ART[id];ui.art(id,art.key,art.crop,14,y+6,332,h);};
    if(page==='menu'){
      let y=0;
      for(const recipe of input.recipes){
        const selected=input.selectedRecipe===recipe.id,rowHeight=selected?133:108;
        ui.frame({x:8,y,width:344,height:rowHeight-6});ui.art('recipe-'+recipe.id,'reference-shop-menu',SHOP_PIZZA_CROPS[recipe.id],15,y+9,77,76);
        ui.text(101,y+10,recipe.name,16,'#2a160b',false,231);ui.icon('coin',100,y+34,15);ui.text(120,y+36,`Vốn ${recipe.cost} xu`,10,'#623619');
        actions.push({id:'shop-menu-select-'+recipe.id,x:15,y:y+8,width:78,height:82,enabled:true,run:()=>input.selectRecipe?.(recipe.id)});
        if(recipe.owned){
          ui.text(177,y+36,'Giá bán',10,'#623619');ui.text(287,y+36,'Bán món',10,'#623619');
          action('shop-menu-minus-'+recipe.id,132,y+55,35,32,'−',input.canAct&&recipe.percent>80,()=>input.configure(recipe.id,recipe.percent-5,recipe.enabled));
          ui.panel(170,y+55,68,32,'#fff8e7');ui.text(204,y+61,String(recipe.price),17,'#2a160b',true);
          actions.push({id:'shop-price-'+recipe.id,x:170,y:y+55,width:68,height:32,enabled:input.canAct,run:()=>input.price(recipe.id)});
          action('shop-menu-plus-'+recipe.id,241,y+55,35,32,'+',input.canAct&&recipe.percent<140,()=>input.configure(recipe.id,recipe.percent+5,recipe.enabled));
          ui.panel(287,y+56,48,29,recipe.enabled?'#247339':'#746b5b','#4e5530',14);const ctx=ui.context;ctx.fillStyle='#fff2dd';ctx.beginPath();ctx.arc(recipe.enabled?323:299,y+70.5,10,0,Math.PI*2);ctx.fill();
          actions.push({id:'shop-menu-toggle-'+recipe.id,x:285,y:y+54,width:52,height:34,enabled:input.canAct,run:()=>input.configure(recipe.id,recipe.percent,!recipe.enabled)});
          if(selected){ui.panel(102,y+94,233,27,'#e0ebbd');ui.icon('coin',109,y+98,18);ui.text(132,y+102,`Lãi ${recipe.price-recipe.cost} xu / bánh`,12,'#245020',false,196);}
        }else action('shop-recipe-buy-'+recipe.id,101,y+57,235,34,input.cash<recipe.purchasePrice?`Thiếu ${recipe.purchasePrice-input.cash} xu`:`Mua công thức · ${recipe.purchasePrice} xu`,input.canAct&&input.cash>=recipe.purchasePrice,()=>input.buy(recipe.id));
        cards.push({id:recipe.id,y,height:rowHeight,price:recipe.price,cost:recipe.cost,owned:recipe.owned,enabled:recipe.enabled,selected});y+=rowHeight;
      }
      ui.panel(8,y,344,48,'#e6edc8');ui.text(180,y+8,'Giá 80–140% · Giá cao có thể bị từ chối',11,'#623619',true,324);ui.text(180,y+27,`Áp dụng ca ngày ${input.day} · Đơn cũ giữ giá`,11,'#245020',true,324);height=y+55;
    }else if(page==='decoration'||page==='amenities'){
      room(page==='decoration'?'room':'amenitiesRoom',0);let y=142;
      if(page==='amenities'){action('shop-delivery-app',12,y,336,38,'App giao hàng · '+(input.deliveryApp?.available?(input.deliveryApp.enabled?'Bật':'Tắt'):'Mở ngày 5'),!!input.app,()=>input.app?.());y+=48;}
      const items=SHOP_CATALOG.filter(item=>item.group===page&&(page!=='decoration'||input.filter!=='owned'||input.shop?.acquired.some(entry=>entry.id===item.id)));
      if(!items.length){ui.frame({x:8,y,width:344,height:100});ui.text(180,y+35,'Chưa sở hữu vật phẩm nào',16,'#623619',true,320);y+=110;}
      items.forEach((item,i)=>{const x=8+i%2*176,top=y+Math.floor(i/2)*224,owned=input.shop?.acquired.find(entry=>entry.id===item.id);ui.frame({x,y:top,width:168,height:216});ui.art(item.id,item.artKey,item.crop,x+9,top+9,150,102);ui.text(x+84,top+118,item.name,14,'#2a160b',true,152);
        if(owned)ui.text(x+84,top+140,owned.placedSlot!==null?'Đang đặt':'Đã sở hữu',12,'#245020',true,150);else ui.money(x+18,top+137,item.price??0,12);
        const effect='visitors' in item.effect?`+${Math.round(item.effect.visitors*100)}% khách`:`+${Math.round(('patience' in item.effect?item.effect.patience:item.effect.cooling)*100)}% thời gian chờ`;ui.panel(x+8,top+160,152,17,'#e0ebbd');ui.text(x+84,top+163,effect,10,'#245020',true,148);
        action('shop-item-'+item.id,x+8,top+180,152,32,'Xem chi tiết ›',!!input.item,()=>input.item?.(item.id));cards.push({id:item.id,y:top,height:216,owned:!!owned,placed:!!owned&&owned.placedSlot!==null,price:item.price});});
      y+=Math.ceil(items.length/2)*224;ui.panel(8,y,344,45,'#e0ebbd');ui.text(180,y+9,page==='decoration'?'Đặt vào quán mới có hiệu quả':'Quạt và điều hòa lấy mức cao hơn',12,'#245020',true,328);ui.text(180,y+27,`Khách +${Math.round((input.shop?.effects.visitors??0)*100)}% · Chờ +${Math.round((input.shop?.effects.patience??0)*100)}%`,10,'#245020',true,328);height=y+54;
    }else if(page==='staff'){
      const staff=STAFF_CATALOG.filter(employee=>input.filter!=='working'||input.staff?.acquired.some(entry=>entry.role===employee.role));
      if(!staff.length){ui.frame({x:8,y:0,width:344,height:120});ui.icon('user',158,17,40);ui.text(180,76,'Chưa có nhân viên đang làm',16,'#623619',true,320);height=130;}
      staff.forEach((employee,i)=>{const sourceIndex=STAFF_CATALOG.indexOf(employee),x=8+i%2*176,y=Math.floor(i/2)*276,owned=input.staff?.acquired.some(entry=>entry.role===employee.role),absent=input.staff?.absentRoles?.includes(employee.role);ui.frame({x,y,width:168,height:268});ui.art(employee.role,'reference-shop-staff',SHOP_STAFF_CROPS[sourceIndex],x+8,y+8,152,119);ui.text(x+84,y+135,['Linh','Nam','Mai','Minh'][sourceIndex],20,'#2a160b',true);ui.panel(x+7,y+163,154,22,'#eed3b1');ui.text(x+84,y+169,employee.name,12,'#623619',true,150);ui.art('coin','reference-shop-menu',[263,252,40,42],x+20,y+194,18,19);ui.text(x+44,y+197,`${employee.dailyWage} xu/ngày`,12);ui.text(x+84,y+219,owned?(absent?'Bận hôm nay · Miễn lương':'Đang làm'):input.day<employee.unlockDay?`Mở ngày ${employee.unlockDay}`:`Phí thuê ${employee.price} xu`,10,'#245020',true,154);action('shop-staff-'+employee.role,x+7,y+235,154,32,'Xem hồ sơ ›',!!input.employee,()=>input.employee?.(employee.role));cards.push({id:employee.role,y,height:268,owned:!!owned,absent:!!absent,price:employee.price,wage:employee.dailyWage});});
      height=Math.max(height,Math.ceil(staff.length/2)*276);ui.panel(8,height,344,46,'#e0ebbd');ui.text(180,height+8,`${input.staff?.acquired.length??0} người · Lương ${input.staff?.dailyWages??0} xu/ngày`,12,'#245020',true,325);ui.text(180,height+27,`Lương chưa trả: ${input.staff?.arrears??0} xu`,11,'#623619',true,325);height+=54;
    }else if(page==='equipment'){
      const entries=[{id:'oven',name:'Lò nướng',art:SHOP_SCREEN_ART.oven},{id:'fridge',name:'Tủ lạnh',art:SHOP_SCREEN_ART.fridge},{id:'drinks',name:'Kho nước',art:null}];
      entries.forEach((entry,i)=>{const x=8+i%2*176,y=Math.floor(i/2)*256;ui.frame({x,y,width:168,height:248});ui.text(x+84,y+12,entry.name,18,'#2a160b',true,150);if(entry.art)ui.art(entry.id,entry.art.key,entry.art.crop,x+8,y+41,152,101);else ui.art('drink-tray','reference-drink-tray',[170,80,890,660],x+8,y+41,152,101);
        if(entry.id==='oven'){ui.panel(x+8,y+150,152,25,'#e0ebbd');ui.text(x+84,y+157,`Đang dùng · Cấp ${input.ovenLevel+1}`,12,'#245020',true,148);ui.text(x+84,y+185,`Chín vừa ${['6–8','4–6','2–4'][input.ovenLevel]} giây`,11,'#623619',true,152);action('summary-upgrade-oven',x+8,y+211,152,32,input.ovenPrice===null?'Đã nâng tối đa':`Nâng cấp · ${input.ovenPrice} xu`,input.canAct&&input.ovenPrice!==null&&input.cash>=input.ovenPrice,()=>input.upgrade('oven'));}
        else if(entry.id==='fridge'){ui.text(x+84,y+159,'Bảo quản lâu gấp 4',12,'#245020',true,150);ui.text(x+84,y+184,input.fridge?.owned?'Đã sở hữu':`${input.fridge?.price??3000} xu`,12,'#623619',true);action('shop-fridge-buy',x+8,y+211,152,29,input.fridge?.owned?'Đã sở hữu':'Xem công dụng ›',input.canAct&&!input.fridge?.owned&&input.cash>=(input.fridge?.price??3000),()=>input.buyFridge?.());}
        else{ui.text(x+84,y+159,'Suối · Coca · Cam',12,'#623619',true,150);ui.text(x+84,y+184,'Bán 20 / 25 / 30 xu',11,'#245020',true,150);action('shop-drinks-stock',x+8,y+211,152,29,'Nhập kho nước ›',input.canAct,()=>input.drinks?.());}cards.push({id:entry.id,y,height:248});});height=520;
    }else{
      room('expansionRoom',0,138);ui.text(180,157,`Hiện có ${input.queueCapacity} ô · Khách +${Math.round(input.queueVisitorBonus*100)}%`,13,'#245020',true,324);
      for(let tier=0;tier<2;tier++){const y=188+tier*192,owned=input.queueLevel>tier,current=input.queueLevel===tier,price=tier===0?6000:10000;ui.frame({x:8,y,width:344,height:184});ui.text(180,y+9,`Mở rộng ${tier+1} · ${5+tier} ô khách`,17,'#2a160b',true,320);const before=tier===0?SHOP_SCREEN_ART.before1:SHOP_SCREEN_ART.before2,after=tier===0?SHOP_SCREEN_ART.after1:SHOP_SCREEN_ART.after2;ui.art('expansion-before-'+tier,before.key,before.crop,17,y+39,144,87);ui.art('expansion-after-'+tier,after.key,after.crop,199,y+39,144,87);ui.text(180,y+74,'→',24,'#623619',true);ui.text(180,y+132,`Khách quán +${tier===0?10:30}% · ${price.toLocaleString('vi-VN')} xu`,12,'#245020',true,320);action(current?'summary-upgrade-queue':'shop-expansion-tier-'+tier,20,y+154,320,24,owned?'Đã mở':current?'Xem nâng cấp ›':'Mở sau nâng cấp trước',input.canAct&&current&&input.queuePrice!==null&&input.cash>=price,()=>input.upgrade('queue'));cards.push({id:'queue-'+tier,y,height:184,owned,current,price});}
      action('shop-advertising',12,578,336,42,input.advertising?.bought?'Xem lịch khách hôm nay':'Quảng bá · 100 xu / ngày',input.canAct,()=>input.advertise?.());height=632;
    }
  };
  // Determine content and action geometry once; the retained list texture is moved on scroll.
  const staging=scene.textures.createCanvas(`shop-staging-${serial++}`,720,3000)!;staging.context.scale(2,2);draw(new ShopScreenUI(scene,staging.context,()=>{}));scene.textures.remove(staging.key);
  const cardsSnapshot=cards.slice();scene.game.canvas.dataset.shopScreenArt='[]';
  const key=`shop-screen-list-${serial++}`;
  hubListWindow(scene,layer,{key,viewport,height,offset:input.offset??0,drag:input.drag!,allowed:input.canScroll??(()=>true),paint:(_ui,ctx)=>{actions.length=0;cards.length=0;draw(new ShopScreenUI(scene,ctx,()=>{}));},update:offset=>{
    input.scroll?.(offset);input.sync?.(()=>{for(const action of actions)hit(action.id,action.x,viewport.y+action.y-offset,action.width,action.height,action.enabled,action.run);});
    scene.game.canvas.dataset.shopScroll=JSON.stringify({offset,max:Math.max(0,height-viewport.height),viewport});
    scene.game.canvas.dataset.shopScreenActions=JSON.stringify(actions.map(({run,...action})=>({...action,y:viewport.y+action.y-offset})));
    scene.game.canvas.dataset.shopScreenCards=JSON.stringify(cardsSnapshot.map((card:any)=>({...card,y:viewport.y+card.y-offset})));
  }});
  if(filtered){const key=`shop-screen-tabs-${serial++}`,texture=scene.textures.createCanvas(key,720,128)!;texture.context.scale(2,2);const ui=new ShopScreenUI(scene,texture.context,hit),tabs=page==='decoration'?[['store','Cửa hàng'],['owned','Đã sở hữu']]:[['recruit','Tuyển dụng'],['working','Đang làm']];for(const [i,[id,title]] of tabs.entries()){const x=8+i*176;ui.panel(x,5,168,32,id===input.filter?'#aa4e26':'#fff0d1');ui.text(x+84,14,title,14,id===input.filter?'#fff0d1':'#623619',true,154);hit(`shop-${page}-tab-${id}`,x,SHOP_SCREEN_LAYOUT.tabsY,168,38,true,()=>input.setFilter?.(id));}texture.refresh();const image=scene.add.image(0,SHOP_SCREEN_LAYOUT.tabsY-5,key).setOrigin(0).setDisplaySize(360,64);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));}
  scene.game.canvas.dataset.shopScreen=JSON.stringify({page,header:HUB_SHELL_LAYOUT.title,viewport});scene.game.canvas.dataset.shopPage=page;
}
