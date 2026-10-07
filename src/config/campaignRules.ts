export const CAMPAIGN_LAST_DAY = 30;
export const INITIAL_CASH = 500;
export const LEGACY_INITIAL_CASH = 300;

export function campaignDayLabel(day:number,endDay=CAMPAIGN_LAST_DAY):string {
  return `Ngày ${day}/${endDay}`;
}
