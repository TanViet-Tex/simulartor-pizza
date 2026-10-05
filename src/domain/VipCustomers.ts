import {VIP_RULES} from '../config/vipCustomers';
import {campaignEventRoll,campaignEventSeed,validCampaignEventSeed} from './CampaignEvents';

export type VipRoll=(seed:number,day:number,arrivalId:string)=>number;
export type VipReceipt={correct:boolean;quality:'good'|'raw'|'burnt';onTime:boolean;coins:number;reputation:number};
/** A separate channel and immutable slot identity avoid daily-event correlation and rerolls. */
export const vipCustomerRoll:VipRoll=(seed,day,arrivalId)=>campaignEventRoll((seed^campaignEventSeed('VIP:'+arrivalId))>>>0,day);
export function isVipArrival(seed:number,day:number,arrivalId:string,roll:VipRoll=vipCustomerRoll):boolean {
  if(!validCampaignEventSeed(seed)||!Number.isSafeInteger(day)||day<VIP_RULES.opensDay||!arrivalId)return false;
  const value=roll(seed,day,arrivalId);return Number.isFinite(value)&&value>=0&&value<VIP_RULES.probability;
}
export function vipQualifies(receipt:Pick<VipReceipt,'correct'|'quality'|'onTime'>):boolean {return receipt.correct&&receipt.quality==='good'&&receipt.onTime;}
