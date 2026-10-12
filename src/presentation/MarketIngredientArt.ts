import type Phaser from 'phaser';
import type {StockIngredient} from '../domain/CozyStock';

export const MARKET_INGREDIENT_ART={key:'market-ingredients-transparent',url:'assets/market-ingredients-transparent.png'};
export const MARKET_SAUCE_ART={key:'market-sauces-labeled',url:'assets/market-sauces-labeled.png'};
/** The kitchen's existing bottles use the same printed labels as the market atlas. */
export function registerSauceLabelFrames(scene:Phaser.Scene):void{
  if(!scene.textures.exists(MARKET_SAUCE_ART.key))return;
  const texture=scene.textures.get(MARKET_SAUCE_ART.key),source=texture.getSourceImage();
  ['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'].forEach((id,i)=>{
    const name=`label-${id}`;
    if(!texture.has(name))texture.add(name,0,Math.round((76+i*249)*source.width/1280),Math.round(318*source.height/1280),Math.round(106*source.width/1280),Math.round(76*source.height/1280));
  });
}
const order:StockIngredient[]=['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot','dough','cheese','mushroom','sausage','pepperoni','pepper','onion','corn','olive','chicken','shrimp','squid','ham','pineapple'];
/** Source has transparent objects arranged in five columns, with hand-checked row extents. */
export function drawMarketIngredient(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,id:StockIngredient,x:number,y:number,width:number,height:number):void{
  const index=order.indexOf(id),row=Math.floor(index/5);
  const art=row===0&&scene.textures.exists(MARKET_SAUCE_ART.key)?MARKET_SAUCE_ART:MARKET_INGREDIENT_ART;
  const source=scene.textures.get(art.key).getSourceImage() as HTMLImageElement,cell=source.width/5;
  const extents=[[170,445],[460,680],[720,930],[965,1200]],top=extents[row][0]*source.height/1280,bottom=extents[row][1]*source.height/1280;
  const sourceHeight=bottom-top,scale=Math.min(width/cell,height/sourceHeight);
  ctx.drawImage(source,index%5*cell,top,cell,sourceHeight,x+(width-cell*scale)/2,y+(height-sourceHeight*scale)/2,cell*scale,sourceHeight*scale);
}
