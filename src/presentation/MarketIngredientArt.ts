import type Phaser from 'phaser';
import type {StockIngredient} from '../domain/CozyStock';

export const MARKET_INGREDIENT_ART={key:'market-ingredients-transparent',url:'assets/market-ingredients-transparent.png'};
const order:StockIngredient[]=['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot','dough','cheese','mushroom','sausage','pepperoni','pepper','onion','corn','olive','chicken','shrimp','squid','ham','pineapple'];
/** Source has transparent objects arranged in five columns, with hand-checked row extents. */
export function drawMarketIngredient(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,id:StockIngredient,x:number,y:number,width:number,height:number):void{
  const source=scene.textures.get(MARKET_INGREDIENT_ART.key).getSourceImage() as HTMLImageElement;
  const index=order.indexOf(id),row=Math.floor(index/5),cell=source.width/5;
  const extents=[[170,445],[460,680],[720,930],[965,1200]],top=extents[row][0]*source.height/1280,bottom=extents[row][1]*source.height/1280;
  const sourceHeight=bottom-top,scale=Math.min(width/cell,height/sourceHeight);
  ctx.drawImage(source,index%5*cell,top,cell,sourceHeight,x+(width-cell*scale)/2,y+(height-sourceHeight*scale)/2,cell*scale,sourceHeight*scale);
}
