import Phaser from 'phaser';

// Regions measured on the approved 360×640 illustration. Falloff keeps the
// original image continuous: no extracted props, duplicate leaves or empty holes.
const PLANTS = [
  [25, 44, 40, 51], [330, 52, 36, 68], [301, 177, 28, 62],
  [38, 225, 32, 34], [11, 248, 19, 23], [161, 220, 31, 49],
  [190, 256, 20, 25], [25, 283, 26, 25], [94, 292, 31, 33],
  [349, 311, 23, 44], [336, 371, 22, 15], [17, 519, 42, 121],
] as const;
const STEP = 16, COLUMNS = 23, ROWS = 40;
type Point = {x:number;y:number;sign:number;weights:number[]};

/** Deform one continuous copy of the painted background with localized wind. */
export class MenuWind {
  private readonly mesh?:Phaser.GameObjects.Mesh2D;
  private readonly canvasTexture?:Phaser.Textures.CanvasTexture;
  private readonly source:HTMLImageElement|HTMLCanvasElement;
  private readonly points:Point[]=[];
  private readonly sway=new Float64Array(PLANTS.length);
  private readonly vertices:number[]=[];
  private elapsed=0;
  private canvasElapsed=0;
  private moving=false;
  private title: {text:Phaser.GameObjects.Text;x:number;y:number}[]=[];
  private titleImage?:Phaser.GameObjects.Image;

  constructor(scene:Phaser.Scene,key:string){
    this.source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
    const indices:number[]=[];
    for(let row=0;row<=ROWS;row++)for(let col=0;col<=COLUMNS;col++){
      const x=Math.min(360,col*STEP),y=row*STEP;
      const sign=this.edge(x,67,80,282,296)*this.edge(y,43,55,176,189);
      const weights=PLANTS.map(([cx,cy,rx,ry])=>{
        const distance=Math.hypot((x-cx)/rx,(y-cy)/ry);
        const perimeter=this.edge(x,0,16,344,360)*this.edge(y,0,16,624,640);
        return distance<1?Math.pow(1-distance*distance,2)*perimeter:0;
      });
      this.points.push({x,y,sign,weights});this.vertices.push(x,y,x/360,y/640);
      if(row<ROWS&&col<COLUMNS){
        const a=row*(COLUMNS+1)+col,b=a+1,c=a+COLUMNS+1,d=c+1;
        indices.push(a,b,c,0,b,c,d,0);
      }
    }
    if(scene.game.renderer.type===Phaser.WEBGL){
      this.mesh=scene.add.mesh2d(0,0,key,this.vertices,indices,true);
      // Each pair above already shares b,c. Avoid searching/reordering thousands
      // of triangles on each menu reentry.
      this.mesh.indicesOrdered=indices;this.mesh.setUseOrderedIndices(true);
      // Isolate the deforming background from the quad batch used by text and
      // other sprites; Phaser's triangle renderer flushes that separate node.
      this.mesh.setRenderAsTriangles(true);
    }else{
      // Canvas has no Mesh2D: map both triangles of each cell with affine
      // transforms. A unique scene texture is removed on shutdown.
      this.canvasTexture=scene.textures.createCanvas('menu-wind-canvas',720,1280)!;
      scene.add.image(0,0,this.canvasTexture.key).setOrigin(0).setDisplaySize(360,640);
    }
    this.pose(0);
  }
  attachTitle(texts:Phaser.GameObjects.Text[],image:Phaser.GameObjects.Image):void {
    this.titleImage=image;
    this.title=texts.map(text=>({text,x:text.x,y:text.y}));
    this.pose(this.moving?this.elapsed:0);
  }
  setMotion(enabled:boolean,neutral:boolean):void {
    this.moving=enabled;
    if(neutral)this.pose(0);
  }
  update(delta:number):void {
    if(!this.moving)return;
    this.elapsed+=Math.min(delta,50);this.canvasElapsed+=delta;
    if(this.mesh||this.canvasElapsed>=50){this.pose(this.elapsed);this.canvasElapsed=0;}
  }
  private edge(value:number,min:number,innerMin:number,innerMax:number,max:number):number {
    const t=Math.max(0,Math.min(1,(value-min)/(innerMin-min),(max-value)/(max-innerMax)));
    return t*t*(3-2*t);
  }
  private pose(time:number):void {
    const angle=time===0?0:Math.sin(time/1650)*.015;
    for(let i=0;i<PLANTS.length;i++)this.sway[i]=time===0?0:Math.sin(time/(1200+i*43)+i*.71)*3.75;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    this.titleImage?.setRotation(angle);
    for(const item of this.title){
      const x=item.x-180,y=item.y-55;
      item.text.setPosition(180+x*cos-y*sin,55+x*sin+y*cos).setRotation(angle);
    }
    for(let i=0;i<this.points.length;i++){
      const point=this.points[i];let dx=0,dy=0;
      for(let plant=0;plant<PLANTS.length;plant++){
        dx+=point.weights[plant]*this.sway[plant];
        dy+=point.weights[plant]*this.sway[plant]*.16;
      }
      const sx=point.x-180,sy=point.y-55;
      this.vertices[i*4]=point.x+dx+(sx*cos-sy*sin-sx)*point.sign;
      this.vertices[i*4+1]=point.y+dy+(sx*sin+sy*cos-sy)*point.sign;
    }
    if(this.canvasTexture){
      const context=this.canvasTexture.context;
      context.clearRect(0,0,720,1280);
      if(time===0)context.drawImage(this.source,0,0,720,1280);
      else for(let row=0;row<ROWS;row++)for(let col=0;col<COLUMNS;col++){
        const a=(row*(COLUMNS+1)+col)*4,b=a+4,c=a+(COLUMNS+1)*4,d=c+4;
        const width=Math.min(STEP,360-col*STEP),height=STEP;
        this.drawTriangle(context,col,row,width,height,a,b,c,false);
        this.drawTriangle(context,col,row,width,height,b,c,d,true);
      }
      this.canvasTexture.refresh();
    }
  }
  private drawTriangle(context:CanvasRenderingContext2D,col:number,row:number,width:number,height:number,
    first:number,second:number,third:number,lower:boolean):void {
    const v=this.vertices;
    const ax=v[first]*2,ay=v[first+1]*2,bx=v[second]*2,by=v[second+1]*2,cx=v[third]*2,cy=v[third+1]*2;
    context.save();context.beginPath();
    // Overlap clips and sample beyond each cell so antialiased triangle edges
    // remain covered by the continuous source rather than showing a grid.
    const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3;
    for(let i=0;i<3;i++){
      const x=i===0?ax:i===1?bx:cx,y=i===0?ay:i===1?by:cy;
      const distance=Math.hypot(x-mx,y-my),factor=1+1.5/distance;
      if(i===0)context.moveTo(mx+(x-mx)*factor,my+(y-my)*factor);
      else context.lineTo(mx+(x-mx)*factor,my+(y-my)*factor);
    }
    context.closePath();context.clip();
    if(lower)context.setTransform((cx-bx)/width,(cy-by)/width,(cx-ax)/height,(cy-ay)/height,ax+bx-cx,ay+by-cy);
    else context.setTransform((bx-ax)/width,(by-ay)/width,(cx-ax)/height,(cy-ay)/height,ax,ay);
    context.drawImage(this.source,-col*STEP,-row*STEP,360,640);
    context.restore();
  }
  destroy():void {this.moving=false;this.title=[];this.titleImage=undefined;this.canvasTexture?.destroy();}
}
