import {campaignEventRoll,campaignEventSeed,validCampaignEventSeed} from './CampaignEvents';

/** Each full 5–7 working-day block is followed by one day unavailable; reload never rerolls. */
export function prepStaffAbsent(seed:number,hiredDay:number,day:number):boolean {
  if(!validCampaignEventSeed(seed)||!Number.isSafeInteger(hiredDay)||!Number.isSafeInteger(day)||hiredDay<1||day<hiredDay)return false;
  let start=hiredDay;
  for(let cycle=0;start<=day;cycle++){
    const workingDays=5+Math.floor(campaignEventRoll((seed^campaignEventSeed(`prep-absence:${hiredDay}:${cycle}`))>>>0,start)*3);
    const absentDay=start+workingDays;
    if(day<=absentDay)return day===absentDay;
    start=absentDay+1;
  }
  return false;
}
