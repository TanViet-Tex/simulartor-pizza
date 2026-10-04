export const CAMPAIGN_LAST_DAY = 30;

export function campaignDayLabel(day:number,endDay=CAMPAIGN_LAST_DAY):string {
  return `Ngày ${day}/${endDay}`;
}
