import {LOTTERY_MISSION,type LotteryCount} from '../config/lotteryMission';
import {campaignEventRoll,campaignEventSeed,validCampaignEventSeed} from './CampaignEvents';
export type LotteryDecision=Readonly<{day:number;count:0|LotteryCount;cost:number;prize:number}>;
/** One invitation per campaign; purchased tickets all win as specified by the user. */
export function lotteryMissionDay(seed:number):number {
 return LOTTERY_MISSION.minDay+Math.floor(campaignEventRoll((seed^campaignEventSeed('homeless-lottery'))>>>0,1)*(LOTTERY_MISSION.maxDay-LOTTERY_MISSION.minDay+1));
}
export function lotteryDecision(seed:number,day:number,count:number):LotteryDecision|null {
 if(!validCampaignEventSeed(seed)||day!==lotteryMissionDay(seed)||count!==0&&!(LOTTERY_MISSION.counts as readonly number[]).includes(count))return null;
 return Object.freeze({day,count:count as 0|LotteryCount,cost:count*LOTTERY_MISSION.ticketPrice,prize:count*LOTTERY_MISSION.prizePerTicket});
}
export function validateLotteryDecision(value:unknown,seed:number):LotteryDecision|null {
 if(!value||typeof value!=='object')return null;
 const r=value as LotteryDecision,expected=lotteryDecision(seed,r.day,r.count);
 return expected&&r.cost===expected.cost&&r.prize===expected.prize?expected:null;
}
