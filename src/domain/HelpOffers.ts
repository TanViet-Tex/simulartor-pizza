import {campaignEventRoll,campaignEventSeed} from './CampaignEvents';

/** A separate save-stable channel keeps the one-time Linh offer occasional. */
export function helpOfferEligible(seed:number):boolean {
  return campaignEventRoll((seed^campaignEventSeed('Linh:help-offer'))>>>0,2)<.25;
}
