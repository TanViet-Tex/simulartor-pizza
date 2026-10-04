export interface CustomerProfile { label:string; patience:number; extraPenalty:number; maxPricePercent:number; discountPercent:number }
export type CustomerKind='regular'|'hurry'|'picky'|'bargain';
export type OrdinaryCustomerKind=Exclude<CustomerKind,'bargain'>;
export function validateCustomerProfiles(input:Record<CustomerKind,CustomerProfile>):Readonly<Record<CustomerKind,Readonly<CustomerProfile>>> {
  const output={} as Record<CustomerKind,Readonly<CustomerProfile>>;
  for(const kind of ['regular','hurry','picky','bargain'] as const){
    const p=input[kind];
    if(!p||!p.label.trim()||!Number.isInteger(p.patience)||p.patience<=0||!Number.isInteger(p.extraPenalty)||p.extraPenalty<0||p.extraPenalty>1||!Number.isInteger(p.maxPricePercent)||p.maxPricePercent<80||p.maxPricePercent>140||!Number.isInteger(p.discountPercent)||p.discountPercent<0||p.discountPercent>100)throw new Error('Invalid customer profile: '+kind);
    output[kind]=Object.freeze({...p});
  }
  return Object.freeze(output);
}
export const CUSTOMER_PROFILES=validateCustomerProfiles({
 regular:{label:'Khách quen',patience:120,extraPenalty:0,maxPricePercent:120,discountPercent:0},
 hurry:{label:'Khách vội',patience:75,extraPenalty:0,maxPricePercent:125,discountPercent:0},
 picky:{label:'Khó tính',patience:100,extraPenalty:1,maxPricePercent:110,discountPercent:0},
 bargain:{label:'Mặc cả',patience:110,extraPenalty:0,maxPricePercent:105,discountPercent:10},
});
export const ORDINARY_CUSTOMERS=Object.freeze({regular:Object.freeze({...CUSTOMER_PROFILES.regular,label:'Khách thường'}),hurry:CUSTOMER_PROFILES.hurry,picky:CUSTOMER_PROFILES.picky});
