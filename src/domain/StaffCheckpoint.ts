import {STAFF_ROLES,STAFF_RULES,type StaffRole} from '../config/staffCatalog';
export type StaffAcquisition={role:StaffRole;hiredDay:number;actualPrice:number};
export type StaffCheckpoint={acquired:StaffAcquisition[];spent:number;pendingSpent:number;arrears:number};
export type StaffPayroll={roles:StaffRole[];openingArrears:number;wagesPaid:number;endingArrears:number};
export function emptyStaff():StaffCheckpoint{return {acquired:[],spent:0,pendingSpent:0,arrears:0};}
export function validateStaffCheckpoint(value:StaffCheckpoint|undefined,day:number):StaffCheckpoint|null{
 const s=value??emptyStaff(),integer=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
 if(!s||!Array.isArray(s.acquired)||s.acquired.length>4||!integer(s.spent)||!integer(s.pendingSpent)||s.pendingSpent>s.spent||!integer(s.arrears))return null;
 if(s.acquired.some(a=>!a||!STAFF_ROLES.includes(a.role)||!Number.isSafeInteger(a.hiredDay)||a.hiredDay<STAFF_RULES.unlockDay||a.hiredDay>day||a.actualPrice!==STAFF_RULES.hirePrice)||new Set(s.acquired.map(a=>a.role)).size!==s.acquired.length||s.spent!==s.acquired.length*STAFF_RULES.hirePrice)return null;
 return structuredClone(s);
}
