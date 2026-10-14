import type Phaser from 'phaser';
import type {DrinkId} from '../config/drinkCatalog';
import {drawDrinkBottle} from './DrinkArt';
import {uiCanvas} from './UiRaster';

type DrinkTicket={id:string;drink?:DrinkId;drinkAttached?:boolean};
export type WorkbenchDrink={ticketId:string;drink:DrinkId};
const BOTTLE_BOUNDS=Object.freeze({x:176,y:304,width:44,height:72});
let serial=0;

/** An existing board owner always wins, including when that owner has left the queue. */
export function selectWorkbenchDrink(tickets:readonly DrinkTicket[],productionOwnerId:string|null|undefined,selectedTicketId:string|null|undefined):WorkbenchDrink|null {
  const id=productionOwnerId??selectedTicketId,ticket=tickets.find(ticket=>ticket.id===id);
  return ticket?.drink&&ticket.drinkAttached?{ticketId:ticket.id,drink:ticket.drink}:null;
}

/** Visual-only companion to the pizza: no inventory mutation or additional hit region. */
export function drawWorkbenchDrink(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,drink:WorkbenchDrink|null):void {
  scene.game.canvas.dataset.workbenchDrink=JSON.stringify(drink?{...drink,...BOTTLE_BOUNDS}:null);
  if(!drink)return;
  const key=`workbench-drink-${serial++}`,bounds=BOTTLE_BOUNDS;
  const texture=uiCanvas(scene,key,bounds.width,bounds.height);
  drawDrinkBottle(texture.context,drink.drink,0,0,bounds.width,bounds.height);
  texture.refresh();
  const image=scene.add.image(bounds.x,bounds.y,key).setOrigin(0).setDisplaySize(bounds.width,bounds.height);
  layer.add(image);
  image.once('destroy',()=>scene.textures.remove(key));
}
