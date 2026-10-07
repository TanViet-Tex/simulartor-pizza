import {ADVERTISING} from '../config/advertising';
import {validateLotteryDecision,type LotteryDecision} from './LotteryMission';

export type ServiceCheckpoint={advertisingDays:number[];lottery:LotteryDecision|null;lotteryPrizeClaimed:boolean};
export function emptyServices():ServiceCheckpoint{return {advertisingDays:[],lottery:null,lotteryPrizeClaimed:false};}
/** Receipts are bounded by the campaign; absence preserves saves made before this feature. */
export function validateServices(value:unknown,seed:number,day:number,terminal:boolean):ServiceCheckpoint|null {
  if(value===undefined)return emptyServices();
  if(!value||typeof value!=='object')return null;
  const s=value as ServiceCheckpoint;
  if(!Array.isArray(s.advertisingDays)||s.advertisingDays.length>30||s.advertisingDays.some(d=>!Number.isSafeInteger(d)||d<1||d>Math.min(day,30))||new Set(s.advertisingDays).size!==s.advertisingDays.length||typeof s.lotteryPrizeClaimed!=='boolean')return null;
  const lottery=s.lottery===null?null:validateLotteryDecision(s.lottery,seed);
  if(s.lottery!==null&&!lottery||lottery&&lottery.day>day||s.lotteryPrizeClaimed&&(!lottery||!lottery.count)||lottery?.count&&s.lotteryPrizeClaimed!==(lottery.day<day||terminal))return null;
  return {advertisingDays:[...s.advertisingDays],lottery,lotteryPrizeClaimed:s.lotteryPrizeClaimed};
}
export function serviceCostForDay(s:ServiceCheckpoint,day:number):number{return (s.advertisingDays.includes(day)?ADVERTISING.dailyPrice:0)+(s.lottery?.day===day?s.lottery.cost:0);}
export function servicePrizeForDay(s:ServiceCheckpoint,day:number):number{return s.lotteryPrizeClaimed&&s.lottery?.day===day?s.lottery.prize:0;}
