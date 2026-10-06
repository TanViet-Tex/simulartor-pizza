export const TEST_CODE='VIETVUIVE';
export const TEST_CODE_COINS=100000;
export type TestCodeReceipt={code:typeof TEST_CODE;coins:typeof TEST_CODE_COINS;day:number};
export const normalizeTestCode=(value:string)=>value.trim().toUpperCase();
export function validTestCodeReceipt(value:unknown,maxDay:number):value is TestCodeReceipt {
  const r=value as TestCodeReceipt;
  return !!r&&r.code===TEST_CODE&&r.coins===TEST_CODE_COINS&&Number.isSafeInteger(r.day)&&r.day>=1&&r.day<=maxDay;
}
