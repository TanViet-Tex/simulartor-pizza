import type {RecipeId} from './recipeCatalog';
import type {CustomerKind} from './ordinaryCustomers';

export type ScheduleRecipe=RecipeId;
export type ScheduleEligibility=Readonly<{regularDay1Stars:number|null;regularLatestStars:number|null;helpSucceeded:boolean;referral:boolean;helpOfferEligible?:boolean;queueCapacity?:4|6;customerSeed?:number|string}>;
export type ScheduleSlot=Readonly<{id:string;at:number;kind:CustomerKind;opportunity:'commercial'|'help'|'referral';commercialOrdinal:number|null;takeaway:boolean}>;
export type CozySchedule=Readonly<{day:number;duration:number;grace:number;slots:readonly ScheduleSlot[]}>;
export type ScheduleFactory=(day:number,eligibility:ScheduleEligibility)=>CozySchedule;
const onTick=(seconds:number)=>Number.isFinite(seconds)&&Math.abs(seconds*20-Math.round(seconds*20))<1e-8;

export function validateCozySchedule(input:CozySchedule):CozySchedule {
  if(!Number.isInteger(input.day)||input.day<1||input.day>1000000||!onTick(input.duration)||input.duration<=0||!onTick(input.grace)||input.grace<0)throw new Error('Invalid Cozy schedule');
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
  if(!Number.isSafeInteger(day)||day<1||day>1000000)throw new Error('Invalid campaign day');
  const duration=day===1?180:day===2?210:240,capacity=eligibility.queueCapacity===6?6:4;
  // Grandfathered saves can exceed the 30-day campaign; retain its final density.
  const count=day===1?20:day<=5?40+Math.floor(customerSample(eligibility.customerSeed??0,day)*11):50+2*(Math.min(day,30)-6);
  // Most groups contain one arrival; every eighth group is an occasional burst.
  const groups:number[]=[];
  for(let remaining=count;remaining>0;){const size=Math.min(remaining,(groups.length+1)%8===0?capacity:1);groups.push(size);remaining-=size;}
  const times=groups.flatMap((size,group)=>Array<number>(size).fill(Math.round((10+group*(duration-20)/(groups.length-1))*20)/20));
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
    commercialOrdinal++;let at=210;while(slots.some(slot=>slot.at===at))at=Math.round((at+.05)*20)/20;
    slots.push({id:`day-${day}-referral`,at,kind:'hurry',opportunity:'referral',commercialOrdinal,takeaway:commercialOrdinal%3===0});
  }
  return validateCozySchedule({day,duration,grace:120,slots:slots.sort((a,b)=>a.at-b.at)});
};
