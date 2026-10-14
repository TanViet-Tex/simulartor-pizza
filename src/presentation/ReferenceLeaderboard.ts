import type Phaser from 'phaser';
import type {LeaderboardView} from '../domain/Leaderboard';
import {HubCanvasUI,type HubHit} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {uiCanvas} from './UiRaster';

let serial=0;
/** Management-body painter. The scene owns subscription, page and refresh. */
export class ReferenceLeaderboard {
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit){}
  draw(input:{view:LeaderboardView;page:number;setPage:(page:number)=>void;refresh:()=>void;canRefresh:boolean;footer:{id:string;title:string;enabled:boolean;action:()=>void}}):void {
    const key=`hub-leaderboard-${serial++}`,texture=uiCanvas(this.scene,key,360,640),ctx=texture.context,ui=new HubCanvasUI(this.scene,ctx,this.hit),c=HUB_THEME.colors;
    const view=input.view,entries=view.entries.slice(0,10),pages=Math.max(1,Math.ceil(entries.length/5)),page=Math.max(0,Math.min(input.page,pages-1)),rows=view.state==='ready'?entries.slice(page*5,page*5+5):[];
    const trophy=(x:number,y:number,scale=1)=>{
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineWidth=2;ctx.strokeStyle='#966029';
      ctx.fillStyle='#edbd5e';ctx.beginPath();ctx.roundRect(5,5,31,23,7);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(5,10);ctx.bezierCurveTo(-9,5,-5,28,12,26);ctx.moveTo(36,10);ctx.bezierCurveTo(50,5,46,28,29,26);ctx.stroke();
      ctx.fillStyle='#e2a94a';ctx.fillRect(18,28,5,10);ctx.beginPath();ctx.roundRect(10,37,21,6,2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff1c4';ctx.beginPath();ctx.moveTo(20,9);ctx.lineTo(23,15);ctx.lineTo(30,16);ctx.lineTo(25,21);ctx.lineTo(26,27);ctx.lineTo(20,24);ctx.lineTo(14,27);ctx.lineTo(15,21);ctx.lineTo(10,16);ctx.lineTo(17,15);ctx.closePath();ctx.fill();ctx.restore();
    };
    ui.frame({x:8,y:133,width:344,height:446});
    trophy(24,146,.85);ui.text(71,151,'Top chủ quán',19,c.ink,false,178);
    ui.text(71,179,'Tiền nhiều nhất · Ngày chơi',11,c.muted,false,230);
    ui.panel(276,151,59,25,'#f0ddb0','#c7a26b',8);ui.text(305,158,'TOP 10',10,'#795224',true);
    ctx.save();ctx.strokeStyle='rgba(122,77,39,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(24,202);ctx.lineTo(336,202);ctx.stroke();ctx.restore();
    if(rows.length){
      ui.text(36,216,'Hạng',10,c.muted,true);ui.text(65,216,'Người chơi',10,c.muted);ui.text(251,216,'Tiền',10,c.muted,true);ui.text(322,216,'Ngày',10,c.muted,true);
      rows.forEach((entry,index)=>{
        const y=239+index*43,own=entry.id===view.self?.id,medal=entry.rank<=3;
        ui.panel(18,y,324,38,own?'#e9efce':entry.rank===1?'#fff0c0':'#fff5df',own?'#9fa761':'#dfc8a0',8);
        const fill=entry.rank===1?'#efc25b':entry.rank===2?'#d7dedb':entry.rank===3?'#d6a078':'#efe4cb';
        ctx.save();ctx.fillStyle=fill;ctx.strokeStyle=medal?'#a57a3f':'#d6c19a';ctx.lineWidth=1;
        if(medal){ctx.beginPath();ctx.moveTo(28,y+23);ctx.lineTo(26,y+33);ctx.lineTo(35,y+29);ctx.lineTo(43,y+33);ctx.lineTo(42,y+23);ctx.fill();}
        ctx.beginPath();ctx.arc(35,y+18,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
        ui.text(35,y+11,String(entry.rank),12,'#654520',true,23);
        ui.text(61,y+12,entry.name,13,c.ink,false,144);
        ui.text(251,y+12,entry.cash.toLocaleString('vi-VN'),13,c.ink,true,83);
        ui.text(322,y+12,String(entry.day),11,c.muted,true,27);
      });
      if(view.message)ui.text(180,453,'Kết quả mới chưa đồng bộ · Bấm Làm mới',10,c.muted,true,306);
      ui.text(180,468,`Trang ${page+1} / ${pages}`,10,c.muted,true);
    }else{
      const loading=view.state==='loading',empty=view.state==='ready';
      ctx.save();ctx.fillStyle='#f2e6c9';ctx.beginPath();ctx.ellipse(180,318,61,57,0,0,Math.PI*2);ctx.fill();ctx.restore();
      trophy(151,282,1.4);
      const title=loading?'Đang tải xếp hạng…':empty?'Chưa có ai trên bảng':view.state==='error'?'Chưa tải được bảng':'Bảng xếp hạng chưa kết nối';
      const caption=loading?'Đợi một chút để cập nhật bảng.':empty?'Chơi và lưu ngày đầu để bắt đầu.':view.state==='error'?'Tiến độ vẫn được lưu trên máy.':'Bạn vẫn có thể tiếp tục chơi.';
      ui.text(180,385,title,17,c.ink,true,300);ui.text(180,417,caption,12,c.muted,true,302);
    }
    const self=view.state==='ready'?view.self:null;
    ui.panel(18,485,324,43,'#f3e4bd','#cfb17a',8);
    ctx.save();ctx.fillStyle='#7d8b55';ctx.beginPath();ctx.arc(38,506,13,0,Math.PI*2);ctx.fill();ctx.restore();ui.text(38,499,'Bạn',10,'#fff9e8',true,25);
    const ownTitle=self?'Hạng của bạn':view.state==='ready'?'Bạn chưa có hạng':view.state==='loading'?'Đang tải hạng của bạn':'Hạng của bạn';
    ui.text(59,492,ownTitle,12,c.ink,false,211);
    ui.text(59,510,self?`${self.cash.toLocaleString('vi-VN')} xu · Ngày ${self.day}`:view.name||'Đặt tên khi Bắt đầu',10,c.muted,false,214);
    ui.text(314,498,self?`#${self.rank}`:'—',16,'#7c5727',true,45);
    const buttons=[{id:'leaderboard-prev',x:18,width:54,title:'‹',enabled:view.state==='ready'&&page>0,action:()=>input.setPage(page-1)},{id:'leaderboard-refresh',x:83,width:194,title:'Làm mới',enabled:input.canRefresh&&view.state!=='loading',action:input.refresh},{id:'leaderboard-next',x:288,width:54,title:'›',enabled:view.state==='ready'&&page<pages-1,action:()=>input.setPage(page+1)}];
    buttons.forEach(button=>{ui.button(button.x,538,button.width,32,button.title,button.enabled);this.hit(button.id,button.x,531,button.width,48,button.enabled,button.action);});
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);this.layer.add(image);image.once('destroy',()=>this.scene.textures.remove(key));
    this.scene.game.canvas.dataset.hubLeaderboard=JSON.stringify({...view,page,visible:rows});
  }
}
