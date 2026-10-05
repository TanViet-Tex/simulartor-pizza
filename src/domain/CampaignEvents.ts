import {CAMPAIGN_EVENT_A,MAX_EVENT_SEED} from '../config/campaignEvents';

export type CampaignLossEvent={id:'A';day:number;loss:200};
export type CampaignEventRoll=(seed:number,day:number)=>number;
export function validCampaignEventSeed(seed:unknown):seed is number {return Number.isSafeInteger(seed)&&Number(seed)>=0&&Number(seed)<=MAX_EVENT_SEED;}
/** Hash the immutable campaign identity, rather than mutable cash, stock or timestamps. */
export function campaignEventSeed(identity:string):number {
  let seed=2166136261;for(const char of identity){seed=Math.imul(seed^char.charCodeAt(0),16777619);}return seed>>>0;
}
/** One independent, deterministic uniform roll per seed/day; no mutable RNG cursor. */
export function campaignEventRoll(seed:number,day:number):number {
  let value=(seed^Math.imul(day,0x9e3779b9))>>>0;
  value=Math.imul(value^(value>>>16),0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);
  return ((value^(value>>>16))>>>0)/4294967296;
}
export function chooseCampaignEvent(seed:number,day:number,history:readonly CampaignLossEvent[],roll:CampaignEventRoll=campaignEventRoll):CampaignLossEvent|null {
  if(!validCampaignEventSeed(seed)||!Number.isSafeInteger(day)||day<1||history.some(event=>event.day===day||event.day===day-1||event.id==='A'&&event.day<day&&day-event.day<CAMPAIGN_EVENT_A.cooldownDays))return null;
  const value=roll(seed,day);
  return Number.isFinite(value)&&value>=0&&value<CAMPAIGN_EVENT_A.probability?{id:'A',day,loss:CAMPAIGN_EVENT_A.loss}:null;
}
