import {RECIPE_CATALOG} from '../config/recipeCatalog';
import {drinkDefinition} from '../config/drinkCatalog';
import Phaser from 'phaser';
import type {CozyDaySummary,CozyReview} from '../domain/CozyCheckpoint';
import {ingredientName} from '../domain/CozyStock';
import {customerPortraitFrame,customerPortraitFit} from './CustomerPortraits';
import {UI_THEME} from './theme';
import {drawHubShell} from './HubHeader';
import {uiCanvas,UI_RASTER_SCALE} from './UiRaster';
import {HubCanvasUI} from './HubCanvasUI';

export const SUMMARY_ART=[
  {key:'reference-summary',url:'assets/references/bảng tổng kết.png'},
  {key:'reference-reviews',url:'assets/references/Bảng đánh giá pizza ngày 1.png'},
  {key:'reference-finance',url:'assets/references/bảng doanh thu chi tiết.png'},
] as const;
type Rect={x:number;y:number;width:number;height:number};
type Hit=(id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void)=>void;
const ink='#2a160b',wood='#623619',green='#245020';
const recipeNames=Object.fromEntries(RECIPE_CATALOG.map(r=>[r.id,r.name]));
let scrollSerial=0;
export function preloadSummaryArt(scene:Phaser.Scene):void{for(const art of SUMMARY_ART)if(!scene.textures.exists(art.key))scene.load.image(art.key,`${import.meta.env.BASE_URL}${art.url}`);}

/** Native reference borders and illustrations only. Sample labels never enter a frame. */
export class ReferenceSummary {
  constructor(private readonly scene:Phaser.Scene,private readonly layer:Phaser.GameObjects.Container,private readonly hit:Hit,private readonly textScale=1){}
  text(x:number,y:number,value:string,size=12,color=ink,width=0,center=false,scaled=false):Phaser.GameObjects.Text{
    const text=this.scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size*(scaled?this.textScale:1)}px`,fontStyle:'bold',color,lineSpacing:2,...(width?{wordWrap:{width,useAdvancedWrap:true}}:{})}).setResolution(UI_RASTER_SCALE);
    if(center)text.setOrigin(.5,0);this.layer.add(text);return text;
  }
  private crop(key:string,source:Rect,target:Rect):Phaser.GameObjects.Image{
    const texture=this.scene.textures.get(key),name=`crop-${source.x}-${source.y}-${source.width}-${source.height}`;
    if(!texture.has(name))texture.add(name,0,source.x,source.y,source.width,source.height);
    const image=this.scene.add.image(target.x,target.y,key,name).setOrigin(0).setDisplaySize(target.width,target.height);this.layer.add(image);return image;
  }
  frame(key:string,source:Rect,target:Rect):void{
    const corner=key==='reference-summary'?28:52,d=corner*target.width/source.width,edge=10,t=edge*target.width/source.width;
    // Round the paper too, so transparent outer corners expose the backdrop.
    const paperKey=`summary-paper-${target.width}-${target.height}-${d}`;
    if(!this.scene.textures.exists(paperKey)){
      const paper=uiCanvas(this.scene,paperKey,Math.ceil(target.width),Math.ceil(target.height)),ctx=paper.context;
      ctx.beginPath();ctx.roundRect(0,0,target.width,target.height,d);ctx.clip();
      ctx.drawImage(this.scene.textures.get('reference-summary').getSourceImage() as HTMLImageElement,875,390,10,12,0,0,target.width,target.height);paper.refresh();
    }
    this.layer.add(this.scene.add.image(target.x,target.y,paperKey).setOrigin(0).setDisplaySize(target.width,target.height));
    for(const [sx,sy,sw,sh,x,y,w,h] of [
      [source.x+corner,source.y,source.width-2*corner,edge,target.x+d,target.y,target.width-2*d,t],
      [source.x+corner,source.y+source.height-edge,source.width-2*corner,edge,target.x+d,target.y+target.height-t,target.width-2*d,t],
      [source.x,source.y+corner,edge,source.height-2*corner,target.x,target.y+d,t,target.height-2*d],
      [source.x+source.width-edge,source.y+corner,edge,source.height-2*corner,target.x+target.width-t,target.y+d,t,target.height-2*d],
    ])this.crop(key,{x:sx,y:sy,width:sw,height:sh},{x,y,width:w,height:h});
    for(let index=0;index<4;index++){
      const right=index===1||index===2,bottom=index>=2,flip=!bottom&&right&&key!=='reference-summary';
      const sx=right?source.x+source.width-corner:source.x,sy=bottom||flip?source.y+source.height-corner:source.y;
      const name=`summary-corner-${key}-${sx}-${sy}-${corner}-${index}`;
      if(!this.scene.textures.exists(name)){
        const texture=this.scene.textures.createCanvas(name,corner,corner)!,ctx=texture.context;
        ctx.save();if(flip){ctx.translate(0,corner);ctx.scale(1,-1);}
        ctx.drawImage(this.scene.textures.get(key).getSourceImage() as HTMLImageElement,sx,sy,corner,corner,0,0,corner,corner);ctx.restore();
        ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.roundRect(0,0,corner,corner,[0,1,2,3].map(i=>i===index?corner:0));ctx.fill();ctx.globalCompositeOperation='source-over';texture.refresh();
      }
      this.layer.add(this.scene.add.image(right?target.x+target.width-d:target.x,bottom?target.y+target.height-d:target.y,name).setOrigin(0).setDisplaySize(d,d));
    }
  }
  private icon(source:Rect,x:number,y:number,w:number,h=w):void{this.crop('reference-summary',source,{x,y,width:w,height:h});}
  private line(x:number,y:number,w:number):void{const g=this.scene.add.graphics().lineStyle(1,0xd3b48a).lineBetween(x,y,x+w,y).setData('summaryLine',{x,y,width:w});this.layer.add(g);}
  private avatar(review:CozyReview,x:number,y:number,size:number):Phaser.GameObjects.GameObject[]{
    const g=this.scene.add.graphics().fillStyle(0xefc08c).fillCircle(x+size/2,y+size/2,size/2).setData('summaryCircle',{x,y,size});this.layer.add(g);
    if(review.avatarIndex===undefined){const placeholder=this.text(x+size/2,y+size*.19,'?',size*.6,wood,0,true);return [g,placeholder];}
    const {key,frame}=customerPortraitFrame(review.avatarIndex),texture=this.scene.textures.get(key);
    if(!texture.has(frame)){const placeholder=this.text(x+size/2,y+size*.19,'?',size*.6,wood,0,true);return [g,placeholder];}
    const f=texture.get(frame),fit=customerPortraitFit(f.realWidth,f.realHeight,size*.95);
    const image=this.scene.add.image(x+size/2,y+size/2,key,frame).setDisplaySize(fit.width,fit.height);this.layer.add(image);return [g,image];
  }
  private reviewRow(review:CozyReview,x:number,y:number,width:number,compact=false):Phaser.GameObjects.GameObject[]{
    const before=this.layer.list.length;
    this.avatar(review,x,y+3,compact?28:38);
    const left=x+(compact?35:47);
    if(!compact){
      const name=this.text(left,y+2,review.name,14,ink,width-52,false,true);
      const stacked=this.textScale>1||name.width>100;
      const stars=this.text(stacked?left:left+104,stacked?name.y+name.height+5:y+2,'★'.repeat(review.stars)+'☆'.repeat(5-review.stars),14,'#d68d19',width-52,false,true);
      let reasonY=stacked?stars.y+stars.height+5:y+26;
      for(const reason of review.reasons.length?review.reasons:['Đúng món và chín vừa.']){
        const text=this.text(left,reasonY,reason,12,wood,width-52,false,true);reasonY+=text.height+4;
      }
      return this.layer.list.slice(before);
    }
    const name=this.text(left,y+2,review.name,compact?11:14);
    this.ellipsis(name,compact?83:100);
    this.text(left+(compact?87:104),y+2,'★'.repeat(review.stars)+'☆'.repeat(5-review.stars),compact?11:14,'#d68d19');
    const fullReason=review.reasons.join(', ')||'Đúng món và chín vừa.';
    const reason=this.text(left,y+17,fullReason.length>180?fullReason.slice(0,180)+'…':fullReason,10,wood);
    if(compact)this.ellipsis(reason,width-40);
    return this.layer.list.slice(before);
  }
  private ellipsis(text:Phaser.GameObjects.Text,width:number):void{
    const value=text.text;if(text.width<=width)return;let low=0,high=value.length;
    while(low<high){const mid=Math.ceil((low+high)/2);text.setText(value.slice(0,mid)+'…');if(text.width<=width)low=mid;else high=mid-1;}
    text.setText(value.slice(0,low)+'…');
  }
  summary(input:{report:CozyDaySummary|null;day:number;cash:number;xp:number;previousXp:number;stockUnits:number;ending:boolean;paused:boolean;footer:{id:string;title:string;enabled:boolean;action:()=>void};tab:(id:'summary'|'market'|'stock'|'shop'|'missions')=>void;pause:()=>void;finance:()=>void;reviews:()=>void}):void{
    const {report:r}=input;
    drawHubShell(this.scene,this.layer,this.hit,{title:r?`Kết thúc ngày ${r.day}`:'Chuẩn bị mở tiệm',subtitle:r?`Ngày ${input.day} · Cấp ${input.xp>=150?3:input.xp>=60?2:1}`:`Ngày ${input.day} chưa bắt đầu`,cash:input.cash,pause:input.pause,active:'summary',tab:input.tab});
    this.frame('reference-summary',{x:20,y:338,width:902,height:369},{x:8,y:130,width:344,height:139});
    this.text(21,141,'Lợi nhuận hôm nay',19);
    this.text(64,164,r?`${r.profit>0?'+':''}${r.profit} xu`:'Chưa mở ca',28,r&&r.profit<0?'#af4630':green,220);
    this.icon({x:571,y:352,width:270,height:154},254,141,82,49);
    this.text(292,189,'Chi tiết ›',11,wood,91,true);this.hit('summary-finance-open',247,174,92,35,!!r,input.finance);
    this.line(20,207,320);
    const figures=[['Doanh thu',r?.revenue??0,{x:67,y:529,width:79,height:84}],['Giá vốn',r?.cost??0,{x:367,y:527,width:88,height:87}],['Chi phí khác',r?r.expired+r.accounts.rent+r.accounts.wages+r.accounts.repairs+r.accounts.other:0,{x:656,y:527,width:72,height:86}]] as const;
    figures.forEach(([title,value,source],i)=>{const x=18+i*109;this.icon(source,x,213,28,30);this.text(x+32,213,title,10);this.text(x+32,227,`${value} xu`,15);this.hit(`summary-figure-${i}`,x,210,103,34,!!r,input.finance);});
    this.text(23,249,`Nhập kho: ${r?.purchases??0} xu · Dòng tiền riêng`,11,wood,313);
    this.frame('reference-summary',{x:20,y:720,width:902,height:192},{x:8,y:276,width:344,height:73});
    this.text(21,284,'Thống kê phục vụ',16);
    const served=[['đơn hoàn thành',r?.delivered??0,{x:56,y:792,width:88,height:99}],['pizza đã bán',r?.salesByRecipe?.reduce((n,row)=>n+row.quantity,0)??r?.delivered??0,{x:359,y:792,width:93,height:99}],['khách bỏ đi',r?.abandoned??0,{x:649,y:793,width:85,height:96}]] as const;
    served.forEach(([title,value,source],i)=>{const x=21+i*109;this.icon(source,x,308,26,31);this.text(x+53,303,String(value),22,i===0?green:'#b3482c',0,true);this.text(x+66,331,title,10,wood,87,true);});
    this.frame('reference-summary',{x:20,y:927,width:902,height:255},{x:8,y:356,width:344,height:97});
    this.text(21,365,'Khách nói gì?',17);this.text(297,367,r?.rating==null?'☆ Chưa có':`★ ${r.rating.toFixed(1)} / 5`,11,green,100,true);
    const recent=r?.reviews.slice(-2).reverse()??[];
    if(!recent.length)this.text(24,394,'Chưa có đánh giá',13,wood);
    recent.forEach((review,i)=>this.reviewRow(review,21,390+i*27,315,true));
    this.text(298,437,'Xem tất cả ›',10,wood,95,true);this.hit('summary-reviews-open',252,422,93,28,true,input.reviews);
    this.scene.game.canvas.dataset.summaryRecentReviews=JSON.stringify(recent);
    this.frame('reference-summary',{x:20,y:1195,width:902,height:233},{x:8,y:459,width:344,height:86});
    this.text(21,468,'Tiến độ hôm nay',16);
    const xp=r?.progression.xp??input.xp,level=xp>=150?3:xp>=60?2:1,next=level===1?60:150,base=level===1?0:level===2?60:150;
    this.icon({x:54,y:1250,width:88,height:83},20,491,31,30);this.text(58,497,`Cấp ${level}`,12);this.text(124,491,`+${Math.max(0,xp-input.previousXp)} XP`,14,green);
    const bar=this.scene.add.graphics().fillStyle(0xd9c7a8).fillRoundedRect(124,510,166,8,4).fillStyle(0x608341).fillRoundedRect(124,510,Math.max(5,166*(level===3?1:Math.min(1,(xp-base)/(next-base)))),8,4);this.layer.add(bar);
    this.text(296,506,level===3?`${xp} XP`:`${xp}/${next}`,10,wood,49);
    this.text(23,526,r?`${r.goal.status==='completed'?'✓':'○'} ${r.goal.description}`:'Mục tiêu được tính khi mở ca bán.',10,wood,308);
    this.frame('reference-summary',{x:20,y:1428,width:902,height:88},{x:8,y:551,width:344,height:32});
    this.icon({x:46,y:1434,width:140,height:74},17,554,40,23);this.text(66,559,input.stockUnits?`Kho còn ${input.stockUnits} phần · Kiểm tra nguyên liệu ›`:'Kho trống · Kiểm tra nguyên liệu ›',11,wood,275);this.hit('summary-stock-alert',10,549,340,33,true,()=>input.tab('stock'));
    const footerKey=`summary-footer-${scrollSerial++}`,footer=uiCanvas(this.scene,footerKey,360,50);footer.context.translate(0,-590);
    new HubCanvasUI(this.scene,footer.context,this.hit).footer(input.footer);footer.refresh();
    const footerImage=this.scene.add.image(0,590,footerKey).setOrigin(0).setDisplaySize(360,50);this.layer.add(footerImage);footerImage.once('destroy',()=>this.scene.textures.remove(footerKey));
    this.scene.game.canvas.dataset.referenceSummary=JSON.stringify({profit:r?.profit??null,stockUnits:input.stockUnits,xp,day:r?.day??input.day});
  }
  modalFrame(kind:'reviews'|'finance',day:number):Rect{
    const source=kind==='reviews'?{x:92,y:303,width:760,height:1094}:{x:92,y:167,width:760,height:1438};
    this.frame(`reference-${kind}`,source,{x:18,y:kind==='reviews'?80:44,width:324,height:kind==='reviews'?480:552});
    this.crop(`reference-${kind}`,kind==='reviews'?{x:138,y:328,width:162,height:104}:{x:142,y:191,width:151,height:96},{x:32,y:kind==='reviews'?92:57,width:40,height:27});
    this.crop(`reference-${kind}`,kind==='reviews'?{x:714,y:340,width:39,height:65}:{x:689,y:210,width:43,height:73},{x:281,y:kind==='reviews'?106:70,width:13,height:23});
    this.text(177,kind==='reviews'?99:65,`${kind==='reviews'?'Đánh giá':'Thu chi'} ngày ${day}`,23,ink,242,true);
    // Original native × roundel is decorative; the hit target belongs to the scene.
    this.crop(`reference-${kind}`,kind==='reviews'?{x:775,y:322,width:61,height:64}:{x:774,y:186,width:62,height:64},{x:304,y:kind==='reviews'?87:51,width:25,height:26});
    return kind==='reviews'?{x:31,y:202,width:290,height:332}:{x:31,y:152,width:290,height:409};
  }
  reviewModal(reviews:readonly CozyReview[],day:number,filter:'all'|'5'|'4'|'low',setFilter:(filter:'all'|'5'|'4'|'low')=>void):void{
    const viewport=this.modalFrame('reviews',day),rating=reviews.length?reviews.reduce((n,r)=>n+r.stars,0)/reviews.length:null;
    const pill=this.scene.add.graphics().fillStyle(0xe9ebcf).fillRoundedRect(45,134,270,30,15).lineStyle(1,0xc4cea7).strokeRoundedRect(45,134,270,30,15);this.layer.add(pill);
    if(rating!==null){pill.fillStyle(0x608341).fillRoundedRect(49,138,125,23,12);this.text(111,141,`★ ${rating.toFixed(1)} / 5`,16,'#fff0d5',120,true);}
    else this.text(50,142,'Chưa có đánh giá',12,wood,139);
    this.text(191,144,`${reviews.length} lượt đánh giá`,12,wood,120);
    const filters=[['all','Tất cả'],['5','5 sao'],['4','4 sao'],['low','1–3 sao']] as const;
    filters.forEach(([id,title],i)=>{const x=32+i*73;const g=this.scene.add.graphics().fillStyle(id===filter?0xb85b37:0xf4dfbd).fillRoundedRect(x,171,69,25,10);this.layer.add(g);this.text(x+34,178,title,11,id===filter?'#fff0d5':ink,68,true);this.hit(`summary-review-filter-${id}`,x,168,69,28,true,()=>setFilter(id));});
    const filtered=reviews.filter(r=>filter==='all'||filter==='low'?filter==='all'||r.stars<=3:r.stars===Number(filter));
    const elements:{object:Phaser.GameObjects.GameObject;y:number}[]=[];let y=viewport.y;
    if(!filtered.length){this.text(45,viewport.y+25,reviews.length?'Không có đánh giá ở mức sao này.':'Chưa có đánh giá',14,wood,258);}
    for(const review of [...filtered].reverse()){
      const row=this.reviewRow(review,39,y,272);for(const object of row)elements.push({object,y:(object as unknown as {y:number}).y});
      const rowHeight=Math.max(91,...row.filter(o=>o instanceof Phaser.GameObjects.Text).map(o=>(o as Phaser.GameObjects.Text).y+(o as Phaser.GameObjects.Text).height-y+15));
      const before=this.layer.list.length;this.line(39,y+rowHeight-8,273);const object=this.layer.list[before];elements.push({object,y:0});y+=rowHeight;
    }
    this.scroll(viewport,elements,Math.max(0,y-viewport.y));this.text(180,538,'Kéo để xem thêm đánh giá',10,wood,277,true);
  }
  financeModal(report:CozyDaySummary):void{
    const viewport=this.modalFrame('finance',report.day),a=report.accounts;
    const drinkSales=report.reviews.flatMap(r=>r.soldDrink?[`${drinkDefinition(r.soldDrink.id).name} × 1   ${r.soldDrink.price} xu`]:[]);
    const pill=this.scene.add.graphics().fillStyle(0xe9ebcf).fillRoundedRect(31,103,290,40,12).lineStyle(1,0xc4cea7).strokeRoundedRect(31,103,290,40,12);this.layer.add(pill);
    this.text(180,115,`Lợi nhuận: ${report.profit>0?'+':''}${report.profit} xu`,20,report.profit<0?'#ad432e':green,280,true);
    const sections:[string,string[]][]=[
      ...(a.rewards?[[`Thưởng · ${a.rewards} xu`,[`VIP: ${report.reviews.reduce((sum,review)=>sum+(review.vip?.coins??0),0)} xu`,...(report.lotteryPrize?[`Vé số: ${report.lotteryPrize} xu`]:[]),`Mục tiêu/nhiệm vụ/lời cảm ơn: ${a.rewards-report.reviews.reduce((sum,review)=>sum+(review.vip?.coins??0),0)-(report.lotteryPrize??0)} xu`,'Thưởng là dòng tiền riêng, không cộng doanh thu pizza hoặc lợi nhuận bán hàng.']] as [string,string[]]]:[]),
      [`Doanh thu · ${a.sales} xu`,[...(report.salesByRecipe===undefined?['Bản lưu cũ chưa có chi tiết theo món.']:report.salesByRecipe.length?report.salesByRecipe.map(r=>`${recipeNames[r.recipe]} × ${r.quantity}   ${r.revenue} xu`):drinkSales.length?[]:['Chưa có món bán thành công.']),...drinkSales]],
      [`Giá vốn nguyên liệu · ${a.consumed} xu`,[...(report.costByIngredient===undefined?['Bản lưu cũ chưa có chi tiết nguyên liệu.']:report.costByIngredient.length?report.costByIngredient.map(r=>`${ingredientName(r.ingredient)}   ${r.cost} xu`):report.drinkCost?[]:['Chưa dùng nguyên liệu.']),...(report.drinkCost?[`Nước đã phục vụ: ${report.drinkCost} xu`]:[])]],
      ['Chi phí khác',[`Thuê quán: ${a.rent} xu`,`Lương: ${a.wages} xu`,`Sửa chữa: ${a.repairs} xu`,`Phí giao hàng: ${report.deliveryFees??0} xu`,...(a.eventLoss?[`Sự kiện A: ${a.eventLoss} xu`]:[]),`Khác: ${a.other-(report.deliveryFees??0)-(a.eventLoss??0)} xu`,`Hàng hết hạn: ${a.expired} xu`,'Bánh cháy/bỏ đã nằm trong giá vốn, không trừ lần hai.']],
      ['Đối chiếu lợi nhuận',[`${a.sales} − ${a.consumed} − ${a.expired} − ${a.rent+a.wages+a.repairs+a.other} = ${a.profit} xu`,`Giá vốn món tặng: ${a.giftCost} xu, đã tính trong giá vốn.`]],
      ['Dòng tiền riêng',[`Số dư đầu ngày: ${a.startingCash} xu`,`Tiền bán hàng: +${a.sales} xu`,`Thưởng: +${a.rewards} xu`,...(a.supportFunds?[`Hỗ trợ test: +${a.supportFunds} xu`]:[]),`Nhập kho: −${a.purchases} xu`,`Nâng cấp / thuê người: −${a.capitalPurchases??0} xu`,`Lương thực trả: ${a.wagesPaid??a.wages} xu`,`Lương chưa trả: ${report.payroll?.endingArrears??0} xu`,`Chi phí đã trả: −${a.rent+(a.wagesPaid??a.wages)+a.repairs+a.other} xu`,`Số dư cuối ngày: ${a.endingCash} xu`]],
      ['Đối chiếu tồn kho',[`Đầu ${a.openingInventoryValue} + nhập ${a.purchases} = dùng ${a.consumed} + hết hạn ${a.expired} + cuối ${a.inventory.value} xu`,'Nhập kho không trừ thêm vào lợi nhuận. Báo cáo này giữ nguyên khi mua cho ngày sau.']],
    ];
    const elements:{object:Phaser.GameObjects.GameObject;y:number}[]=[];let y=viewport.y;
    for(const [title,lines] of sections){
      const start=y,index=elements.length;
      const header=this.text(41,y+8,title,16,ink,272,false,true);elements.push({object:header,y:header.y});y+=header.height+18;
      for(const line of lines){const text=this.text(45,y,line,13,wood,265,false,true);elements.push({object:text,y:text.y});y+=text.height+10;}y+=14;
      const panel=this.scene.add.graphics().setData('summaryPanel',{x:viewport.x,y:start,width:viewport.width,height:y-start-7});this.layer.add(panel);elements.splice(index,0,{object:panel,y:0});
    }
    this.scroll(viewport,elements,y-viewport.y);this.text(180,572,'Số liệu thật của ngày đã chốt',10,wood,278,true);
  }
  private scroll(viewport:Rect,elements:{object:Phaser.GameObjects.GameObject;y:number}[],contentHeight:number):void{
    // A viewport-sized texture avoids both legacy masks and GPU texture-size
    // limits for long lists. Keep detached row sources, redraw only the window.
    const key=`summary-scroll-${scrollSerial++}`;
    const texture=uiCanvas(this.scene,key,viewport.width,Math.ceil(viewport.height));
    this.scene.game.canvas.dataset.summaryBodyTexture=JSON.stringify({width:viewport.width,height:Math.ceil(viewport.height)});
    const context=texture.context,draws:((context:CanvasRenderingContext2D)=>void)[]=[],canvases:HTMLCanvasElement[]=[];
    const textValues:string[]=[];
    for(const {object} of elements){
      if(object instanceof Phaser.GameObjects.Graphics){
        const circle=object.getData('summaryCircle') as {x:number;y:number;size:number}|undefined;
        const line=object.getData('summaryLine') as {x:number;y:number;width:number}|undefined;
        const panel=object.getData('summaryPanel') as Rect|undefined;
        if(panel)draws.push(ctx=>{ctx.fillStyle='#fff6e5';ctx.strokeStyle='#dcc7a5';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(panel.x+.5,panel.y+.5,panel.width-1,panel.height-1,10);ctx.fill();ctx.stroke();});
        if(circle)draws.push(ctx=>{ctx.fillStyle='#efc08c';ctx.beginPath();ctx.arc(circle.x+circle.size/2,circle.y+circle.size/2,circle.size/2,0,Math.PI*2);ctx.fill();});
        if(line)draws.push(ctx=>{ctx.strokeStyle='#d3b48a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(line.x,line.y);ctx.lineTo(line.x+line.width,line.y);ctx.stroke();});
      }else if(object instanceof Phaser.GameObjects.Text){
        const bounds=object.getBounds(),source=document.createElement('canvas');source.width=object.canvas.width;source.height=object.canvas.height;source.getContext('2d')!.drawImage(object.canvas,0,0);canvases.push(source);
        draws.push(ctx=>ctx.drawImage(source,bounds.x,bounds.y,bounds.width,bounds.height));textValues.push(object.text);
      }else if(object instanceof Phaser.GameObjects.Image){
        const bounds=object.getBounds(),frame=object.frame,source=object.texture.getSourceImage() as HTMLImageElement;
        draws.push(ctx=>ctx.drawImage(source,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,bounds.x,bounds.y,bounds.width,bounds.height));
      }
      this.layer.remove(object,true);
    }
    const body=this.scene.add.image(viewport.x,viewport.y,key).setOrigin(0).setDisplaySize(viewport.width,Math.ceil(viewport.height));this.layer.add(body);
    this.scene.game.canvas.dataset.summaryModalText=JSON.stringify(textValues);
    this.scene.game.canvas.dataset.summaryBodyTextScale=String(this.textScale);
    const zone=this.scene.add.zone(viewport.x,viewport.y,viewport.width,viewport.height).setOrigin(0).setDepth(11).setInteractive();this.layer.add(zone);
    zone.once('destroy',()=>{this.scene.textures.remove(key);for(const canvas of canvases){canvas.width=0;canvas.height=0;}});
    const region={...viewport,offset:0,max:Math.max(0,contentHeight-viewport.height)},regions=JSON.parse(this.scene.game.canvas.dataset.modalScroll||'[]');regions.push(region);
    const publish=()=>{this.scene.game.canvas.dataset.modalScroll=JSON.stringify(regions);};
    const paint=()=>{context.setTransform(UI_RASTER_SCALE,0,0,UI_RASTER_SCALE,0,0);context.clearRect(0,0,viewport.width,Math.ceil(viewport.height));context.translate(-viewport.x,-viewport.y-region.offset);for(const draw of draws)draw(context);texture.refresh();};paint();publish();
    const scroll=(delta:number)=>{region.offset=Phaser.Math.Clamp(region.offset+delta,0,region.max);paint();publish();};let last:number|undefined;
    zone.on('pointerdown',(p:Phaser.Input.Pointer)=>last=p.y);zone.on('pointermove',(p:Phaser.Input.Pointer)=>{if(p.isDown&&last!==undefined){scroll(last-p.y);last=p.y;}});zone.on('pointerup',()=>last=undefined);zone.on('pointerout',()=>last=undefined);zone.on('wheel',(_p:unknown,_x:number,dy:number)=>scroll(dy));
  }
}
