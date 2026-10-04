import {expect,it} from 'vitest';
import {CUSTOMER_PROFILES,validateCustomerProfiles} from '../config/ordinaryCustomers';
import {menuPrice,agreedPrice,priceAccepted,reputationResult,relationshipResult,referralEligibility} from './CustomerProgression';
it('validates profiles and bounded rounded prices',()=>{
 expect(Object.values(CUSTOMER_PROFILES).map(p=>p.patience)).toEqual([120,75,100,110]);
 for(const value of [0,NaN,Infinity])expect(()=>validateCustomerProfiles({...CUSTOMER_PROFILES,regular:{...CUSTOMER_PROFILES.regular,patience:value}})).toThrow();
 expect(menuPrice(65,81)).toBe(53);for(const value of [79,141,NaN])expect(menuPrice(50,value)).toBeNull();
 expect(agreedPrice(65,10)).toBe(59);expect(priceAccepted(60,50,120)).toBe(true);expect(priceAccepted(61,50,120)).toBe(false);
});
it('reports actual reputation clamp delta and distinct bounded relationship',()=>{
 expect(reputationResult(100,5)).toEqual({value:100,delta:0});expect(reputationResult(1,1)).toEqual({value:0,delta:-1});expect(reputationResult(50,3)).toEqual({value:50,delta:0});
 expect(relationshipResult(2,'regular',4,false)).toEqual({value:3,delta:1});expect(relationshipResult(3,'regular',5,false).delta).toBe(0);
 expect(relationshipResult(1,'regular',5,true).delta).toBe(0);expect(relationshipResult(1,'picky',5,false).delta).toBe(0);
 expect(referralEligibility(54).eligible).toBe(false);expect(referralEligibility(55).eligible).toBe(true);
});
