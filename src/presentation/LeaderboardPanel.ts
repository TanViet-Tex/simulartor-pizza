import type Phaser from 'phaser';
import type {LeaderboardMenuActions} from '../domain/Leaderboard';
import {drawModalBackdrop} from './ModalBackdrop';
import {drawNotificationFrame,drawNotificationClose,drawNotificationButton,type NotificationRect} from './NotificationFrame';
import {UI_THEME} from './theme';
import {UI_RASTER_SCALE} from './UiRaster';

export class LeaderboardPanel {
  private page=0;
  constructor(private actions:LeaderboardMenuActions,private changed:()=>void,private close:()=>void){}
  draw(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,register:(id:string,r:NotificationRect,enabled:boolean,action:()=>void)=>void):void{
    drawModalBackdrop(scene,layer);const layout=drawNotificationFrame(scene,layer,'two',85,485),view=this.actions.view();
    const text=(x:number,y:number,value:string,size=13,width=284,color='#362018',origin=.5)=>{const label=scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color,align:origin===0?'left':'center',wordWrap:{width}}).setResolution(UI_RASTER_SCALE).setOrigin(origin,0);layer.add(label);return label;};
    text(180,layout.titleY+8,'Bảng xếp hạng',21).setOrigin(.5);text(180,185,'Tiền nhiều nhất · thêm ngày chơi',12);
    if(view.state==='ready'&&view.message&&view.entries.length){const warning=text(180,200,view.message,10);if(warning.height>14)warning.setScale(14/warning.height);}
    const close=drawNotificationClose(scene,layer,layout);if(close)register('leaderboard-close',close,true,this.close);
    const pages=Math.max(1,Math.ceil(view.entries.length/5));this.page=Math.min(this.page,pages-1);
    const rows=view.entries.slice(this.page*5,this.page*5+5);
    if(view.state==='ready'){
      text(46,216,'Hạng',11,38,'#70583b',0);text(87,216,'Tên',11,116,'#70583b',0);text(224,216,'Tiền',11,67);text(296,216,'Ngày',11,36);
      rows.forEach((entry,index)=>{
        const own=entry.id===view.self?.id,y=241+index*33;
        if(own)layer.add(scene.add.graphics().fillStyle(0xe8d69b,.75).fillRoundedRect(40,y-2,280,31,5));
        text(47,y,String(entry.rank),12,35,'#362018',0);
        const name=text(87,y,entry.name,13,111,'#362018',0);if(name.width>111||name.height>23)name.setScale(Math.min(1,111/name.width,23/name.height));
        const cash=text(224,y,entry.cash.toLocaleString('vi-VN'),12,69);if(cash.width>69||cash.height>23)cash.setScale(Math.min(1,69/cash.width,23/cash.height));
        const day=text(296,y,String(entry.day),12,38);if(day.width>38||day.height>23)day.setScale(Math.min(1,38/day.width,23/day.height));
      });
      if(!rows.length)text(180,274,'Chưa có người chơi trong bảng.');
      if(view.self&&!rows.some(row=>row.id===view.self!.id))text(180,414,`Bạn: #${view.self.rank} · ${view.self.cash.toLocaleString('vi-VN')} xu · Ngày ${view.self.day}`,12);
      else text(180,414,view.self?'Dòng vàng là người chơi của bạn.':'Chơi và lưu để có hạng của mình.',12);
    }else text(180,268,view.state==='loading'?'Đang tải bảng xếp hạng…':view.message||'Bảng xếp hạng chưa được kết nối.',15);
    if(pages>1){
      text(180,447,`${this.page+1}/${pages}`,12);
      for(const [id,x,label,delta] of [['leaderboard-prev',48,'‹',-1],['leaderboard-next',264,'›',1]] as const){const r={x,y:436,width:48,height:32};drawNotificationButton(scene,layer,r.x,r.y,r.width,r.height);text(x+24,440,label,18,40,'#fff0d5');register(id,r,view.state==='ready'&&(delta<0?this.page>0:this.page<pages-1),()=>{this.page+=delta;this.changed();});}
    }
    layout.footer.forEach((r,index)=>{drawNotificationButton(scene,layer,r.x,r.y,r.width,r.height);text(r.x+r.width/2,r.y+r.height/2-10,index?'Làm mới':'Quay lại',16,r.width,'#fff0d5');register(index?'leaderboard-refresh':'leaderboard-back',r,index?view.state!=='loading':true,index?()=>this.actions.refresh():this.close);});
    scene.game.canvas.dataset.leaderboard=JSON.stringify({...view,page:this.page,visible:rows});
  }
}
