/** Provisional continuation economics; requires future playtesting. */
export const SUPPLIER_THRESHOLD=500;
export const SUPPLIER_DISCOUNT=.10;
export function supplierPrice(base:number,ordinaryPurchased:number){return Math.round(base*(ordinaryPurchased>=SUPPLIER_THRESHOLD?1-SUPPLIER_DISCOUNT:1));}
