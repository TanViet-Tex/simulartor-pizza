import type {RecipeId} from './recipeCatalog';
import type {CustomerKind} from './ordinaryCustomers';

export type ScheduleRecipe=RecipeId;
export type ScheduleEligibility=Readonly<{regularDay1Stars:number|null;regularLatestStars:number|null;helpSucceeded:boolean;referral:boolean;helpOfferEligible?:boolean;queueCapacity?:4|6;customerSeed?:number|string}>;
export type ScheduleSlot=Readonly<{id:string;at:number;kind:CustomerKind;opportunity:'commercial'|'help'|'referral';commercialOrdinal:number|null;takeaway:boolean}>;
export type CozySchedule=Readonly<{day:number;duration:number;grace:number;preparation?:number;slots:readonly ScheduleSlot[]}>;
export type ScheduleFactory=(day:number,eligibility:ScheduleEligibility)=>CozySchedule;
const onTick=(seconds:number)=>Number.isFinite(seconds)&&Math.abs(seconds*20-Math.round(seconds*20))<1e-8;

export const COZY_HOURS=Object.freeze({preparation:5,startMinutes:8*60+50,openMinutes:9*60,closeMinutes:21*60,grace:120});
const DAY_BANDS=Object.freeze([
  {through:1,duration:180,min:15,max:20,burst:2},
  {through:5,duration:210,min:22,max:28,burst:2},
  {through:10,duration:240,min:28,max:36,burst:3},
  {through:20,duration:270,min:36,max:46,burst:3},
  {through:1000000,duration:300,min:46,max:60,burst:3},
].map(band=>Object.freeze(band)));
export function cozyDayRules(day:number){
  if(!Number.isSafeInteger(day)||day<1||day>1000000)throw new Error('Invalid campaign day');
  return DAY_BANDS.find(band=>day<=band.through)!;
}
export function cozyClockMinutes(elapsed:number,duration:number,preparationElapsed:number,preparation:number):number{
  if(preparationElapsed<preparation)return Math.floor(COZY_HOURS.startMinutes+(COZY_HOURS.openMinutes-COZY_HOURS.startMinutes)*preparationElapsed/preparation);
  return Math.min(COZY_HOURS.closeMinutes,Math.floor(COZY_HOURS.openMinutes+(COZY_HOURS.closeMinutes-COZY_HOURS.openMinutes)*elapsed/duration));
}
export function formatCozyTime(minutes:number):string{return `${Math.floor(minutes/60).toString().padStart(2,'0')}:${(minutes%60).toString().padStart(2,'0')}`;}

export function validateCozySchedule(input:CozySchedule):CozySchedule {
  if(!Number.isInteger(input.day)||input.day<1||input.day>1000000||!onTick(input.duration)||input.duration<=0||!onTick(input.grace)||input.grace<0||input.preparation!==undefined&&(!onTick(input.preparation)||input.preparation<0))throw new Error('Invalid Cozy schedule');
  const ids=new Set<string>();let last=-1;
  const slots=input.slots.map(slot=>{
    if(!slot.id.trim()||ids.has(slot.id)||!onTick(slot.at)||slot.at<0||slot.at>=input.duration||slot.at<last||!['regular','hurry','picky','bargain'].includes(slot.kind)||!['commercial','help','referral'].includes(slot.opportunity)||typeof slot.takeaway!=='boolean'||(slot.opportunity==='help'?(slot.commercialOrdinal!==null||slot.takeaway):(!Number.isInteger(slot.commercialOrdinal)||slot.commercialOrdinal!<=0)))throw new Error('Invalid Cozy schedule slot');
    ids.add(slot.id);last=slot.at;return Object.freeze({...slot});
  });
  return Object.freeze({...input,slots:Object.freeze(slots)});
}

/** A stable campaign/day sample is shared by forecast and actual arrival opportunities. */
function customerSample(seed:number|string,day:number):number {
  let n=2166136261;for(const c of `${seed}/${day}/customer-count`)n=Math.imul(n^c.charCodeAt(0),16777619);
  n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);
  return ((n^(n>>>16))>>>0)/4294967296;
}

/** The recipe cycle is the published GDD design proposal, not a change to menu artwork. */
const RECIPE_CYCLE:readonly ScheduleRecipe[]=['cheese','cheese','mushroom','cheese','sausage'];
export function resolveScheduleRecipe<R extends ScheduleRecipe>(slot:ScheduleSlot,enabled:readonly R[]):R|null {
  if(!enabled.length)return null;
  if(slot.kind==='regular')return enabled.includes('cheese' as R)?'cheese' as R:null;
  const cycle=enabled.some(id=>!RECIPE_CYCLE.includes(id))?enabled:RECIPE_CYCLE;
  const candidate=slot.opportunity==='referral'?enabled[0]:cycle[((slot.commercialOrdinal??1)-1)%cycle.length];
  return enabled.includes(candidate as R)?candidate as R:enabled[0];
}

export const threeDaySchedule:ScheduleFactory=(day,eligibility)=>{
  const rules=cozyDayRules(day),duration=rules.duration;
  const count=rules.min+Math.floor(customerSample(eligibility.customerSeed??0,day)*(rules.max-rules.min+1));
  // Most groups contain one arrival; every eighth group is an occasional burst.
  const groups:number[]=[];
  for(let remaining=count;remaining>0;){const size=Math.min(remaining,(groups.length+1)%8===0?rules.burst:1);groups.push(size);remaining-=size;}
  // Invert a density curve: 20% early, 60% middle, 20% late. First arrival is opening.
  const times=groups.flatMap((size,group)=>{
    const p=group/(groups.length-1),fraction=p<.2?p/.2*.3:p<.8?.3+(p-.2)/.6*.4:.7+(p-.8)/.2*.3;
    return Array<number>(size).fill(Math.round(fraction*duration*.95*20)/20);
  });
  let commercialOrdinal=0;
  const slots:ScheduleSlot[]=Array.from({length:count},(_,i)=>{
    const at=times[i];
    const help=day===2&&i===0&&eligibility.helpOfferEligible!==false&&eligibility.regularDay1Stars!==null&&eligibility.regularDay1Stars>=3;
    const returns=day>=3&&i===0&&(eligibility.helpSucceeded||(eligibility.regularLatestStars!==null&&eligibility.regularLatestStars>=4));
    const kind:CustomerKind=i===0?(day===1||help||returns?'regular':'hurry'):i%10===9?'bargain':i%2===1?'hurry':'picky';
    if(!help)commercialOrdinal++;
    return {id:`day-${day}-slot-${i+1}`,at,kind,opportunity:help?'help':'commercial',commercialOrdinal:help?null:commercialOrdinal,takeaway:!help&&commercialOrdinal%3===0};
  });
  if(day>=3&&eligibility.referral){
    commercialOrdinal++;let at=Math.round(duration*.875*20)/20;while(slots.some(slot=>slot.at===at))at=Math.round((at+.05)*20)/20;
    slots.push({id:`day-${day}-referral`,at,kind:'hurry',opportunity:'referral',commercialOrdinal,takeaway:commercialOrdinal%3===0});
  }
  return validateCozySchedule({day,duration,preparation:COZY_HOURS.preparation,grace:COZY_HOURS.grace,slots:slots.sort((a,b)=>a.at-b.at)});
};
