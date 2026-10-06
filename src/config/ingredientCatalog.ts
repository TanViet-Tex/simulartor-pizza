/** Retains existing prices and shelf life. */
const entries = [
  { id: 'dough', name: 'Đế bánh', basePrice: 5, color: 0xe8c783 },
  { id: 'sauce', name: 'Sốt cà chua', basePrice: 3, color: 0xb9362b },
  { id: 'cheese', name: 'Phô mai', basePrice: 7, color: 0xf4cf59 },
  { id: 'mushroom', name: 'Nấm', basePrice: 5, color: 0xd3b7a3 },
  { id: 'sausage', name: 'Xúc xích', basePrice: 10, color: 0xb86369 },

  { id: 'sauce-white', name: 'Sốt kem trắng', basePrice: 4, color: 0xffe2b8 },
  { id: 'sauce-bbq', name: 'Sốt BBQ', basePrice: 4, color: 0x873d28 },
  { id: 'sauce-pesto', name: 'Sốt pesto', basePrice: 4, color: 0x75a631 },
  { id: 'sauce-hot', name: 'Sốt cay', basePrice: 4, color: 0xdf582d },
  { id: 'pepperoni', name: 'Pepperoni', basePrice: 10, color: 0xbd392f },
  { id: 'pepper', name: 'Ớt chuông', basePrice: 5, color: 0x428e33 },
  { id: 'onion', name: 'Hành tây', basePrice: 4, color: 0xc886be },
  { id: 'corn', name: 'Bắp', basePrice: 4, color: 0xffce42 },
  { id: 'olive', name: 'Ô liu', basePrice: 5, color: 0x333934 },
  { id: 'chicken', name: 'Thịt gà', basePrice: 10, color: 0xdc9b58 },
  { id: 'shrimp', name: 'Tôm', basePrice: 12, color: 0xf67851 },
  { id: 'squid', name: 'Mực', basePrice: 12, color: 0xf4b5a7 },
  { id: 'ham', name: 'Giăm bông', basePrice: 10, color: 0xf19792 },
  { id: 'pineapple', name: 'Dứa', basePrice: 5, color: 0xfacf45 },
] as const;
export type IngredientId=typeof entries[number]['id'];
export const FINISHING_SAUCES = ['sauce-white','sauce-pesto','sauce-hot'] as const;
export type FinishingSauce = typeof FINISHING_SAUCES[number];
export function isFinishingSauce(id:string):id is FinishingSauce { return (FINISHING_SAUCES as readonly string[]).includes(id); }
export function isNonExpiring(id:string):boolean { return id.startsWith('sauce'); }
export const NON_EXPIRING_DAY = 1000001;
export const INGREDIENT_CATALOG=entries.map(item=>({...item,unit:'ph\u1ea7n' as const,icon:item.id,expiryOffset:item.id==='mushroom'||item.id==='sausage'?0:1,group:item.id==='dough'?'dough':item.id.startsWith('sauce')?'sauce':item.id==='cheese'?'cheese':['sausage','pepperoni','chicken','ham'].includes(item.id)?'meat':['shrimp','squid'].includes(item.id)?'seafood':'vegetable'}));
