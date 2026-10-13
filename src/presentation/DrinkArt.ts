import type {DrinkId} from '../config/drinkCatalog';

/** Shared illustrated bottles, with an actual printed label for each drink. */
export function drawDrinkBottle(ctx:CanvasRenderingContext2D,id:DrinkId,x:number,y:number,width:number,height:number):void {
  ctx.save();ctx.translate(x,y);ctx.scale(width/40,height/60);
  ctx.fillStyle='rgba(77,39,16,.16)';ctx.beginPath();ctx.ellipse(20,55,14,3,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=1.8;ctx.strokeStyle='#623619';
  ctx.fillStyle=id==='water'?'#b1e0eb':id==='orange'?'#eda337':'#553026';
  ctx.beginPath();ctx.roundRect(9,14,22,40,6);ctx.fill();ctx.stroke();
  ctx.fillStyle=id==='water'?'#b1e0eb':id==='orange'?'#eda337':'#553026';ctx.fillRect(15,6,10,13);ctx.strokeRect(15,6,10,13);
  ctx.fillStyle=id==='water'?'#368fb0':id==='orange'?'#488442':'#c44436';ctx.beginPath();ctx.roundRect(14,3,12,6,2);ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.roundRect(12,19,3,29,2);ctx.fill();
  ctx.fillStyle=id==='cola'?'#b6372d':'#fff1d6';ctx.beginPath();ctx.roundRect(9,28,22,17,2);ctx.fill();ctx.stroke();
  ctx.fillStyle=id==='cola'?'#fff4dc':'#3b4b31';ctx.font='bold 8px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(id==='water'?'SUỐI':id==='orange'?'CAM':'Coca',20,36);
  if(id==='orange'){ctx.fillStyle='#faad26';ctx.beginPath();ctx.arc(20,43,3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}
