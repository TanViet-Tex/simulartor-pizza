export type CodeViewportGeometry={canvasTop:number;canvasHeight:number;visibleTop:number;visibleHeight:number;focused:boolean};
/** One game-space translation for the entire editor and its native textbox. */
export function testCodeViewportOffset(g:CodeViewportGeometry):number {
  if(!g.focused||!Number.isFinite(g.canvasHeight)||g.canvasHeight<=0||!Number.isFinite(g.visibleHeight)||g.visibleHeight<=0)return 0;
  const scale=g.canvasHeight/640,top=g.canvasTop+170*scale,height=330*scale;
  const margin=Math.min(12,Math.max(0,(g.visibleHeight-height)/2));
  const min=g.visibleTop+margin,max=g.visibleTop+g.visibleHeight-height-margin;
  const fitted=Math.max(min,Math.min(top,max));
  return (fitted-top)/scale;
}
