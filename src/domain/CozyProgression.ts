export interface GoalStats { delivered:number;sales:number;stars:number[] }
export interface GoalView {day:number;status:'active'|'completed'|'expired';description:string;progress:string;stats:GoalStats}
export interface ProgressionSnapshot {xp:number;cheeseSales:number;unlockDay:number|null;outcomes:string[];claims:string[];goals:GoalView[];mission:'active'|'completed'|'expired'}
export interface ProgressEffects {accepted:boolean;xp:number;coins:number;reputation:number;claims:string[]}
const EMPTY:ProgressEffects={accepted:false,xp:0,coins:0,reputation:0,claims:[]};
const emptyStats=():GoalStats=>({delivered:0,sales:0,stars:[]});
const validDay=(day:number)=>Number.isInteger(day)&&day>=1&&day<=1000000;
function validStats(s:GoalStats){return Number.isInteger(s.delivered)&&s.delivered>=0&&Number.isInteger(s.sales)&&s.sales>=0&&Array.isArray(s.stars)&&s.stars.every(x=>Number.isInteger(x)&&x>=1&&x<=5)&&s.delivered<=s.stars.length;}
export function progressionLevel(xp:number):1|2|3 {return xp>=150?3:xp>=60?2:1;}
function goalView(day:number,stats:GoalStats,status:GoalView['status']='active'):GoalView {
  const average=stats.stars.length?stats.stars.reduce((n,s)=>n+s,0)/stats.stars.length:null;
  return {day,status,stats:structuredClone(stats),description:day===1?'Giao 3 đơn thương mại':day===2?'Bán pizza đạt 200 xu':'Ít nhất 3 đơn kết thúc và trung bình 4 sao',progress:day===1?`${stats.delivered}/3 đơn`:day===2?`${stats.sales}/200 xu`:`${stats.stars.length}/3 đơn · ${average===null?'chưa có sao':average.toFixed(1)+'/4 sao'}`};
}
function goalMet(day:number,s:GoalStats){return day===1?s.delivered>=3:day===2?s.sales>=200:s.stars.length>=3&&s.stars.reduce((n,x)=>n+x,0)>=4*s.stars.length;}

/** Commercial progression returns effects; cash/reputation remain runtime-owned. */
export class CozyProgression {
  private state:ProgressionSnapshot={xp:0,cheeseSales:0,unlockDay:null,outcomes:[],claims:[],goals:[],mission:'active'};
  get snapshot():ProgressionSnapshot {return structuredClone(this.state);}
  get level(){return progressionLevel(this.state.xp);}
  recipeAvailable(recipe:string,day:number){return validDay(day)&&(recipe==='cheese'||recipe==='mushroom'||recipe==='sausage'&&this.state.unlockDay!==null&&day>=this.state.unlockDay);}
  goal(day:number,stats:GoalStats=emptyStats()):GoalView {return structuredClone(this.state.goals.find(g=>g.day===day)??goalView(day,stats));}
  private addXp(amount:number,day:number){const before=this.state.xp;this.state.xp+=amount;if(before<60&&this.state.xp>=60)this.state.unlockDay=day+1;}
  private nextDay(){return this.state.goals.length+1;}
  recordDelivery(input:{id:string;day:number;stars:number;qualifyingCheese:boolean;commercial:boolean}):ProgressEffects {
    if(!input.commercial||!validDay(input.day)||input.day!==this.nextDay()||typeof input.id!=='string'||!input.id.trim()||this.state.outcomes.includes(input.id)||!Number.isInteger(input.stars)||input.stars<1||input.stars>5||typeof input.qualifyingCheese!=='boolean')return {...EMPTY,claims:[]};
    this.state.outcomes.push(input.id);let xp=input.stars>=4?15:10,coins=0,reputation=0;const claims:string[]=[];
    if(input.qualifyingCheese)this.state.cheeseSales++;
    if(this.state.cheeseSales>=8&&!this.state.claims.includes('mission.cheese-8')){
      this.state.mission='completed';this.state.claims.push('mission.cheese-8');claims.push('mission.cheese-8');xp+=20;coins=30;reputation=2;
    }
    this.addXp(xp,input.day);return {accepted:true,xp,coins,reputation,claims};
  }
  closeDay(day:number,stats:GoalStats):ProgressEffects {
    if(!validDay(day)||day!==this.nextDay()||!validStats(stats))return {...EMPTY,claims:[]};
    const complete=goalMet(day,stats),id=`goal.day-${day}`;
    this.state.goals.push(goalView(day,stats,complete?'completed':'expired'));
    const claims=complete?[id]:[];if(complete){this.state.claims.push(id);this.addXp(10,day);}
    
    return {accepted:true,xp:complete?10:0,coins:complete?20:0,reputation:0,claims};
  }
  /** Pure snapshot boundary for future checkpoint integration; performs no storage I/O. */
  static restore(input:unknown):CozyProgression|null {
    if(!input||typeof input!=='object')return null;
    const s=input as ProgressionSnapshot;
    if(!Number.isSafeInteger(s.xp)||s.xp<0||!Number.isSafeInteger(s.cheeseSales)||s.cheeseSales<0||!Array.isArray(s.outcomes)||!Array.isArray(s.claims)||!Array.isArray(s.goals)||s.goals.length>1000000||!['active','completed','expired'].includes(s.mission))return null;
    if(s.outcomes.some(id=>typeof id!=='string'||!id.trim())||new Set(s.outcomes).size!==s.outcomes.length||s.cheeseSales>s.outcomes.length||new Set(s.claims).size!==s.claims.length||s.claims.some(id=>id!=='mission.cheese-8'&&!/^goal.day-[1-9]\d*$/.test(id)))return null;
    if(s.xp<60?s.unlockDay!==null:(!Number.isInteger(s.unlockDay)||s.unlockDay!<2||s.unlockDay!>1000001))return null;
    const claimIds=new Set(s.claims),goalIds=new Set(s.goals.map(g=>`goal.day-${g?.day}`));
    for(let i=0;i<s.goals.length;i++){
      const g=s.goals[i];if(!g||g.day!==i+1||!g.stats||!validStats(g.stats)||g.status!==(goalMet(g.day,g.stats)?'completed':'expired')||claimIds.has(`goal.day-${g.day}`)!==(g.status==='completed'))return null;
    }
    if(s.claims.some(id=>id.startsWith('goal.')&&!goalIds.has(id)))return null;
    if((s.cheeseSales>=8)!==(s.mission==='completed')||s.claims.includes('mission.cheese-8')!==(s.mission==='completed')||s.mission==='expired'&&s.goals.length<3)return null;
    const rewardXp=s.claims.filter(id=>id.startsWith('goal.')).length*10+(s.mission==='completed'?20:0);
    if(s.xp<rewardXp+s.outcomes.length*10||s.xp>rewardXp+s.outcomes.length*15||s.unlockDay!==null&&s.unlockDay>s.goals.length+2)return null;
    const result=new CozyProgression();result.state={xp:s.xp,cheeseSales:s.cheeseSales,unlockDay:s.unlockDay,outcomes:[...s.outcomes],claims:[...s.claims],goals:s.goals.map(g=>goalView(g.day,g.stats,g.status)),mission:s.mission};return result;
  }
}
