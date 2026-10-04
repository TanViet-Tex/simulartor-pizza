import {shopItem} from '../config/shopCatalog';
import type {ShopItemId} from './ShopEffects';
export type ShopAcquisition={id:ShopItemId;actualPrice:number;placedSlot:ShopItemId|null};
export type ShopCheckpoint={acquired:ShopAcquisition[];spent:number;pendingSpent:number};
export type UpgradeReceipt={kind:'oven'|'queue';level:number;actualPrice:number};
export function validateShopCheckpoint(value:ShopCheckpoint|undefined):ShopCheckpoint|null {
 const s=value??{acquired:[],spent:0,pendingSpent:0};
 if(!s||!Array.isArray(s.acquired)||s.acquired.length>11||!Number.isSafeInteger(s.spent)||s.spent<0||!Number.isSafeInteger(s.pendingSpent)||s.pendingSpent<0||s.pendingSpent>s.spent)return null;
 const ids=new Set<string>();
 for(const entry of s.acquired){const item=shopItem(entry?.id);if(!item||!item.available||item.price===null||entry.actualPrice!==item.price||entry.placedSlot!==null&&entry.placedSlot!==entry.id||ids.has(entry.id))return null;ids.add(entry.id);}
 if(s.spent!==s.acquired.reduce((n,item)=>n+item.actualPrice,0))return null;
 return structuredClone(s);
}
