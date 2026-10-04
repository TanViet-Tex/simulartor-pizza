import type {RecipeId} from './recipeCatalog';
import type {CustomerKind} from './ordinaryCustomers';

export type ScheduleRecipe=RecipeId;
export type ScheduleEligibility=Readonly<{regularDay1Stars:number|null;regularLatestStars:number|null;helpSucceeded:boolean;referral:boolean}>;
export type ScheduleSlot=Readonly<{id:string;at:number;kind:CustomerKind;opportunity:'commercial'|'help'|'referral';commercialOrdinal:number|null;takeaway:boolean}>;
export type CozySchedule=Readonly<{day:number;duration:number;grace:number;slots:readonly ScheduleSlot[]}>;
export type ScheduleFactory=(day:number,eligibility:ScheduleEligibility)=>CozySchedule;
const onTick=(seconds:number)=>Number.isFinite(seconds)&&Math.abs(seconds*20-Math.round(seconds*20))<1e-8;

export function validateCozySchedule(input:CozySchedule):CozySchedule {
  if(!Number.isInteger(input.day)||input.day<1||input.day>1000000||!onTick(input.duration)||input.duration<=0||!onTick(input.grace)||input.grace<0)throw new Error('Invalid Cozy schedule');
  const ids=new Set<string>();let last=-1;
  const slots=input.slots.map(slot=>{
    if(!slot.id.trim()||ids.has(slot.id)||!onTick(slot.at)||slot.at<0||slot.at>=input.duration||slot.at<=last||!['regular','hurry','picky','bargain'].includes(slot.kind)||!['commercial','help','referral'].includes(slot.opportunity)||typeof slot.takeaway!=='boolean'||(slot.opportunity==='help'?(slot.commercialOrdinal!==null||slot.takeaway):(!Number.isInteger(slot.commercialOrdinal)||slot.commercialOrdinal!<=0)))throw new Error('Invalid Cozy schedule slot');
    ids.add(slot.id);last=slot.at;return Object.freeze({...slot});
  });
  return Object.freeze({...input,slots:Object.freeze(slots)});
}

const DAYS=Object.freeze([
  Object.freeze({duration:180,times:Object.freeze([10,35,60,85,110,135])}),
  Object.freeze({duration:210,times:Object.freeze(Array.from({length:8},(_,i)=>10+22*i))}),
  Object.freeze({duration:240,times:Object.freeze(Array.from({length:10},(_,i)=>10+20*i))}),
]);

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
  const definition=DAYS[Math.min(2,day-1)];if(!definition||!Number.isSafeInteger(day)||day>1000000)throw new Error('Invalid campaign day');
  let commercialOrdinal=0;
  const slots:ScheduleSlot[]=definition.times.map((at,i)=>{
    const help=day===2&&i===0&&eligibility.regularDay1Stars!==null&&eligibility.regularDay1Stars>=3;
    const returns=day>=3&&i===0&&(eligibility.helpSucceeded||(eligibility.regularLatestStars!==null&&eligibility.regularLatestStars>=4));
    const kind:CustomerKind=day===1?(['regular','picky','bargain','picky','bargain','bargain'] as const)[i]:i===0?(help||returns?'regular':'bargain'):(['hurry','picky','bargain'] as const)[(i-1)%3];
    if(!help)commercialOrdinal++;
    return {id:`day-${day}-slot-${i+1}`,at,kind,opportunity:help?'help':'commercial',commercialOrdinal:help?null:commercialOrdinal,takeaway:!help&&commercialOrdinal%3===0};
  });
  if(day>=3&&eligibility.referral){commercialOrdinal++;slots.push({id:`day-${day}-referral`,at:210,kind:'hurry',opportunity:'referral',commercialOrdinal,takeaway:commercialOrdinal%3===0});}
  return validateCozySchedule({day,duration:definition.duration,grace:120,slots});
};
