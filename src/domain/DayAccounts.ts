import type {CozyInventory} from './CozyStock';

export interface DayAccountsInput {
  startingCash:number;openingInventoryValue:number;sales:number;purchases:number;
  consumed:number;expired:number;rent:number;inventory:CozyInventory;previousProfit:number;
  rewards?:number;giftCost?:number;capitalPurchases?:number;
}

/** Purchases move cash into stock; consumption and spoilage expense that stock once. */
export function closeAccounts(input:DayAccountsInput){
  const rewards=input.rewards??0,wages=0,repairs=0,other=0;
  const operatingCosts=input.rent+wages+repairs+other;
  const profit=input.sales-input.consumed-input.expired-operatingCosts;
  const {previousProfit,...values}=input;
  return {...values,inventory:structuredClone(input.inventory),rewards,giftCost:input.giftCost??0,wages,repairs,other,
    capitalPurchases:input.capitalPurchases??0,
    endingCash:input.startingCash+input.sales+rewards-input.purchases-operatingCosts-(input.capitalPurchases??0),
    profit,cumulativeProfit:previousProfit+profit,
    zeroReasons:{wages:'Chưa có nhân viên trong bản demo.',repairs:'Chưa có thiết bị hỏng trong bản demo.',rewards:rewards?'Thưởng mục tiêu/nhiệm vụ/lời cảm ơn đã nhận, tách khỏi bán pizza.':'Chưa có mục tiêu, nhiệm vụ hoặc lời cảm ơn đủ điều kiện nhận thưởng trong ca.',other:'Không có chi phí khác trong ca này.'}};
}
export type DayAccounts=ReturnType<typeof closeAccounts>;
