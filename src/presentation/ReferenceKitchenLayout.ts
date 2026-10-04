/** One coordinate system for the raster, sprites and transparent touch regions. */
export const REFERENCE_KITCHEN_LAYOUT = Object.freeze({
  width:360,height:640,
  order:{x:10,y:143,w:340,h:41},
  board:{x:12,y:290,w:216,h:113},
  recipe:(index:number)=>({x:14+84*(index%4),y:190+46*Math.floor(index/4),w:80,h:43}),
  customer:(index:number)=>({x:17+55*index,y:74,w:49,h:62,centerX:42+55*index,centerY:97}),
  ingredient:(index:number)=>({x:14+67*(index%5),y:[449,495,540,584][Math.floor(index/5)],w:62,h:43}),
  oven:(index:number)=>({x:238,y:298+78*index,w:110,h:63}),
  action:(index:number)=>({x:14+110*index,y:406,w:105,h:32}),
});
