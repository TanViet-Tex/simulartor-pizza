/** Uniformly fit body frames; the header and navigation use world coordinates. */
export const HUB_WALL_BOUNDS=Object.freeze({x:22,y:130,width:316,height:450});
export const HUB_WALL_SCALE=.88;
/** Shop subpages share the hub shell and its compact body frame. */
export const SHOP_SCREEN_LAYOUT=Object.freeze({
  viewport:Object.freeze({x:8,y:130,width:344,height:450}),
  filteredViewport:Object.freeze({x:8,y:174,width:344,height:406}),
  tabsY:130,
});
export const HUB_WALL_LAYOUT=Object.freeze({x:21.6,y:21.6,scale:HUB_WALL_SCALE,width:360*HUB_WALL_SCALE,height:640*HUB_WALL_SCALE});
export const HUB_SHELL_LAYOUT=Object.freeze({
  title:Object.freeze({x:80,y:25,width:200,height:50}),
  pause:Object.freeze({x:44,y:48,width:31,height:28}),
  cash:Object.freeze({x:290,y:48,width:65,height:28}),
  navigation:Object.freeze({x:22,y:80,width:316,height:49}),
});
export function hubWallPoint(x:number,y:number):{x:number;y:number}{
  return {x:HUB_WALL_LAYOUT.x+x*HUB_WALL_SCALE,y:HUB_WALL_LAYOUT.y+y*HUB_WALL_SCALE};
}
export function hubWallRect(x:number,y:number,width:number,height:number):{x:number;y:number;width:number;height:number}{
  return {...hubWallPoint(x,y),width:width*HUB_WALL_SCALE,height:height*HUB_WALL_SCALE};
}
