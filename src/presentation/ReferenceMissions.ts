import type Phaser from 'phaser';
import type {CozyRuntime} from '../runtime/CozyRuntime';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
let serial=0;
export class ReferenceMissions{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit){}
  draw(input:{day:number;cash:number;progress:CozyRuntime['progression'];ending:boolean;tab:(id:HubTab)=>void;pause:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}}):void{
    const key=`missions-${serial++}`,texture=this.scene.textures.createCanvas(key,360,640)!,ui=new HubCanvasUI(this.scene,texture.context,this.hit),p=input.progress,c=HUB_THEME.colors;
    ui.background();ui.header({title:'Nhiệm vụ',subtitle:`Ngày ${input.day} · Cấp ${p.level}`,cash:input.cash,pause:input.pause});ui.navigation('missions',input.tab);
    const status=(s:string)=>s==='completed'?'Hoàn thành':s==='expired'?'Đã hết hạn':'Đang thực hiện';
    ui.frame({x:8,y:133,width:344,height:147});ui.text(22,145,`Mục tiêu ngày ${p.goal.day}`,19);ui.text(22,176,p.goal.description,14,c.ink,false,313);ui.text(22,204,p.goal.progress,18,c.muted);
    ui.text(22,235,status(p.goal.status),13,p.goal.status==='completed'?'#345f28':c.muted);
    ui.text(22,257,p.claims.includes(`goal.day-${p.goal.day}`)?'✓ Đã nhận 20 xu + 10 XP':p.goal.status==='expired'?'Không đạt thưởng ngày này':'Thưởng khi chốt ngày: 20 xu + 10 XP',11,c.muted,false,314);
    ui.frame({x:8,y:287,width:344,height:129});ui.text(22,299,'Pizza phô mai được yêu thích',18);ui.text(22,330,`${p.cheeseSales}/8 món đúng công thức`,15,c.muted);ui.text(22,357,status(p.mission),13,p.mission==='completed'?'#345f28':c.muted);
    ui.text(22,386,p.claims.includes('mission.cheese-8')?'✓ Đã nhận 30 xu + 20 XP + 2 uy tín':'Thưởng tự nhận: 30 xu + 20 XP + 2 uy tín',11,c.muted,false,314);
    ui.frame({x:8,y:423,width:344,height:156});ui.text(22,436,`Cấp ${p.level} · ${p.xp} XP`,20);ui.text(22,471,'Mốc cấp: 0 / 60 / 150 XP',13,c.muted);
    ui.text(22,498,'Mua công thức tại Quán → Menu & giá bán.',12,c.muted,false,314);
    const latest=p.goals[p.goals.length-1];
    ui.text(22,525,latest?`Ngày ${latest.day}: ${status(latest.status)} · ${latest.progress}`:'Đơn thương mại: 10 XP; 4–5 sao thêm 5 XP.',11,c.muted,false,314);
    ui.text(22,550,latest?(p.claims.includes(`goal.day-${latest.day}`)?'Ngày đã chốt: nhận 20 xu + 10 XP':'Ngày đã chốt: không đạt thưởng'):input.ending?'Quán thiếu vốn · Xem tổng kết':'Thưởng tự cộng đúng một lần; không cần bấm nhận.',10,c.muted,false,314);
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0);this.layer.add(image);image.once('destroy',()=>this.scene.textures.remove(key));this.scene.game.canvas.dataset.missionsView=JSON.stringify(p);
  }
}
