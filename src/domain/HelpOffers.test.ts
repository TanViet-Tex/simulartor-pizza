import {expect,it} from 'vitest';
import {helpOfferEligible} from './HelpOffers';

it('keeps help eligibility stable with an occasional quarter of campaigns',()=>{
  const values=Array.from({length:1000},(_,seed)=>helpOfferEligible(seed));
  expect(values.filter(Boolean).length).toBeGreaterThan(200);
  expect(values.filter(Boolean).length).toBeLessThan(300);
  for(let seed=0;seed<1000;seed++)expect(helpOfferEligible(seed)).toBe(values[seed]);
});
