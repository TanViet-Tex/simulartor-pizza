import type {CozyDaySummary} from './CozyCheckpoint';
import {progressionLevel,type ProgressionSnapshot} from './CozyProgression';

export type CozyCampaignResults=Readonly<{
  daysCompleted:number;endDay:number;ending:CozyDaySummary['ending'];cash:number;
  xp:number;level:1|2|3;reputation:number;cumulativeProfit:number;revenue:number;
  orders:number;pizzas:number;goalsCompleted:number;missionsCompleted:number;
}>;

/** Reports remain the only persisted source for campaign totals. */
export function cozyCampaignResults(reports:readonly CozyDaySummary[],progression:ProgressionSnapshot,endDay:number):CozyCampaignResults {
  const last=reports[reports.length-1];
  return Object.freeze({daysCompleted:reports.length,endDay,ending:last?.ending??null,cash:last?.cash??300,
    xp:progression.xp,level:progressionLevel(progression.xp),reputation:last?.reputation??50,
    cumulativeProfit:reports.reduce((n,r)=>n+r.profit,0),revenue:reports.reduce((n,r)=>n+r.revenue,0),
    orders:reports.reduce((n,r)=>n+r.delivered,0),
    pizzas:reports.reduce((n,r)=>n+(r.pizzasSold??r.reviews.filter(review=>review.outcome==='delivered').reduce((count,review)=>count+(review.quantity??1),0)),0),
    goalsCompleted:progression.goals.filter(goal=>goal.status==='completed').length,
    missionsCompleted:progression.claims.filter(claim=>claim==='mission.cheese-8').length});
}
