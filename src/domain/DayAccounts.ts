import type {CozyInventory} from './CozyStock';

export interface DayAccountsInput {
  startingCash:number;openingInventoryValue:number;sales:number;purchases:number;
  consumed:number;expired:number;rent:number;inventory:CozyInventory;previousProfit:number;
  supportFunds?:number;rewards?:number;giftCost?:number;capitalPurchases?:number;deliveryFees?:number;wages?:number;wagesPaid?:number;eventLoss?:number;
}

/** Purchases move cash into stock; consumption and spoilage expense that stock once. */
export function closeAccounts(input:DayAccountsInput){
  const rewards=input.rewards??0,wages=input.wages??0,wagesPaid=input.wagesPaid??wages,repairs=0,other=(input.deliveryFees??0)+(input.eventLoss??0);
  const operatingCosts=input.rent+wages+repairs+other;
  const profit=input.sales-input.consumed-input.expired-operatingCosts;
  const {previousProfit,...values}=input;
  return {...values,inventory:structuredClone(input.inventory),rewards,giftCost:input.giftCost??0,wages,wagesPaid,repairs,other,
    capitalPurchases:input.capitalPurchases??0,
    endingCash:input.startingCash+(input.supportFunds??0)+input.sales+rewards-input.purchases-input.rent-wagesPaid-repairs-other-(input.capitalPurchases??0),
    profit,cumulativeProfit:previousProfit+profit,
    zeroReasons:{wages:wages?'Lương phát sinh trong ngày; tiền thực trả và nợ lương ghi riêng.':'Không có nhân viên trong ca.',repairs:'Chưa có thiết bị hỏng.',rewards:rewards?'Thưởng VIP/mục tiêu/nhiệm vụ/lời cảm ơn đã nhận, tách khỏi bán pizza.':'Chưa có VIP, mục tiêu, nhiệm vụ hoặc lời cảm ơn đủ điều kiện nhận thưởng trong ca.',other:other?'Phí shipper và tổn thất sự kiện phát sinh, tách khỏi doanh thu bán pizza.':'Không có chi phí khác trong ca này.'}};
}
export type DayAccounts=ReturnType<typeof closeAccounts>;
