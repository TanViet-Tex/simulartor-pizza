export function menuPrice(reference:number,percent:number):number|null {
 return Number.isFinite(reference)&&reference>0&&Number.isFinite(percent)&&percent>=80&&percent<=140?Math.round(reference*percent/100):null;
}
export function agreedPrice(price:number,discountPercent:number):number{return Math.round(price*(100-discountPercent)/100);}
export function priceAccepted(price:number,reference:number,maxPercent:number):boolean{return price*100<=reference*maxPercent;}
export function reputationResult(current:number,stars:number):{value:number;delta:number}{
 const value=Math.max(0,Math.min(100,current+(stars>=4?1:stars<=2?-2:0)));return {value,delta:value-current};
}
export function relationshipResult(current:number,kind:string,stars:number,alreadyToday:boolean):{value:number;delta:number}{
 const value=kind==='regular'&&stars>=4&&!alreadyToday?Math.min(3,current+1):current;return {value,delta:value-current};
}
export function referralEligibility(reputation:number){return {eligible:reputation>=55,day:3 as const,reason:reputation>=55?'Uy tín cuối ngày 2 đạt 55: đủ điều kiện giới thiệu ngày 3.':'Uy tín cuối ngày 2 chưa đạt 55: chưa đủ điều kiện giới thiệu.'};}
