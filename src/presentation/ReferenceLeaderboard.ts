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
    const key=`hub-leaderboard-${serial++}`,texture=uiCanvas(this.scene,key,360,640),ui=new HubCanvasUI(this.scene,texture.context,this.hit),c=HUB_THEME.colors;
    const view=input.view,entries=view.entries.slice(0,10),pages=Math.max(1,Math.ceil(entries.length/5)),page=Math.max(0,Math.min(input.page,pages-1)),rows=view.state==='ready'?entries.slice(page*5,page*5+5):[];
    ui.frame({x:8,y:133,width:344,height:100});
    ui.text(22,147,'Bảng xếp hạng',20);
    ui.text(22,177,'Xếp theo tiền nhiều nhất',13,c.muted);
    ui.text(22,201,view.name?`Người chơi: ${view.name}`:'Đặt tên khi Bắt đầu để lưu hạng của mình.',11,c.muted,false,314);
    ui.frame({x:8,y:240,width:344,height:235});
    if(view.state==='ready'){
      ui.text(22,253,'Hạng',11,c.muted);ui.text(66,253,'Tên',11,c.muted);ui.text(248,253,'Tiền',11,c.muted,true);ui.text(320,253,'Ngày',11,c.muted,true);
      rows.forEach((entry,index)=>{
        const y=280+index*33,own=entry.id===view.self?.id;
        if(own)ui.panel(17,y-4,326,31,'#fff0bd','#d9ad58',5);
        ui.text(23,y,String(entry.rank),12,c.ink,false,35);ui.text(66,y,entry.name,12,c.ink,false,133);
        ui.text(248,y,entry.cash.toLocaleString('vi-VN'),12,c.ink,true,83);ui.text(320,y,String(entry.day),12,c.ink,true,34);
      });
      if(!rows.length)ui.text(180,330,'Chưa có người chơi trong bảng.',13,c.muted,true,305);
      ui.text(180,453,`Top 10 · Trang ${page+1}/${pages}`,11,c.muted,true);
    }else{
      const message=view.state==='loading'?'Đang tải bảng xếp hạng…':view.message||'Bảng xếp hạng chưa được kết nối.';
      // Bound each line so API errors never spill into the shared footer.
      const words=message.split(/\s+/),lines:string[]=[];let line='';
      texture.context.font=`bold 13px ${HUB_THEME.typography.fontFamily}`;
      for(const word of words){const next=line?`${line} ${word}`:word;if(line&&texture.context.measureText(next).width>294){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
      lines.slice(0,5).forEach((value,index)=>ui.text(180,298+index*20,value,13,c.muted,true,294));
    }
    ui.frame({x:8,y:482,width:344,height:97});
    const self=view.state==='ready'?view.self:null;
    ui.text(22,494,self?`Bạn: #${self.rank} · ${self.cash.toLocaleString('vi-VN')} xu · Ngày ${self.day}`:'Chơi và lưu để cập nhật hạng của mình.',12,c.ink,false,314);
    if(view.state==='ready'&&view.message)ui.text(22,514,view.message,10,c.muted,false,314);
    else ui.text(22,514,self?'Dòng vàng đánh dấu người chơi của bạn.':'Dữ liệu được cập nhật online khi đã kết nối.',10,c.muted,false,314);
    const buttons=[{id:'leaderboard-prev',x:18,width:54,title:'‹',enabled:view.state==='ready'&&page>0,action:()=>input.setPage(page-1)},{id:'leaderboard-refresh',x:83,width:194,title:'Làm mới',enabled:input.canRefresh&&view.state!=='loading',action:input.refresh},{id:'leaderboard-next',x:288,width:54,title:'›',enabled:view.state==='ready'&&page<pages-1,action:()=>input.setPage(page+1)}];
    buttons.forEach(button=>{ui.button(button.x,538,button.width,32,button.title,button.enabled);this.hit(button.id,button.x,531,button.width,48,button.enabled,button.action);});
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);this.layer.add(image);image.once('destroy',()=>this.scene.textures.remove(key));
    this.scene.game.canvas.dataset.hubLeaderboard=JSON.stringify({...view,page,visible:rows});
  }
}
