import type Phaser from 'phaser';
import type {DrinkId} from '../config/drinkCatalog';
import {drawDrinkBottle} from './DrinkArt';
import {HubCanvasUI,type HubHit} from './HubCanvasUI';
import {uiCanvas} from './UiRaster';

let serial=0;
/** The existing three bottle slots share the management palette and bottle art. */
export function drawDrinkKitchenCells(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,drinks:readonly {id:DrinkId;name:string;quantity:number}[],requested:DrinkId|undefined,attached:boolean,serve:(id:DrinkId)=>void):void {
  const key=`kitchen-drink-cells-${serial++}`,texture=uiCanvas(scene,key,111,63),ui=new HubCanvasUI(scene,texture.context,hit);
  drinks.forEach((drink,i)=>{
    const x=i*37,w=35,h=63,enabled=requested===drink.id&&!attached&&drink.quantity>0,selected=requested===drink.id;
    ui.panel(x,0,w,h,'#fff1d1',selected?(attached?'#4b9247':'#d7a22d'):'#784a2c',6);
    drawDrinkBottle(texture.context,drink.id,x+10,3,16,29);
    const lines=drink.id==='water'?['Nước','suối']:drink.id==='orange'?['Nước','cam']:['Coca'];
    lines.forEach((line,row)=>ui.text(x+w/2,35+row*9,line,8,'#2a160b',true,32));
    ui.text(x+w/2,53,String(drink.quantity),9,drink.quantity?'#245020':'#a43b2e',true,30);
    if(selected&&attached)ui.text(x+28,3,'✓',9,'#247339',true,10);
    hit('drink-'+drink.id,238+x,376,w,h,enabled,()=>serve(drink.id));
  });
  texture.refresh();const image=scene.add.image(238,376,key).setOrigin(0).setDisplaySize(111,63);layer.add(image);
  image.once('destroy',()=>scene.textures.remove(key));
  scene.game.canvas.dataset.drinkCells=JSON.stringify(drinks.map(drink=>({...drink,requested:drink.id===requested,attached:drink.id===requested&&attached})));
}
