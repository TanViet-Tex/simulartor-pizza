import {STAFF_ROLES,STAFF_RULES,type StaffRole} from '../config/staffCatalog.js';
export type StaffAcquisition={role:StaffRole;hiredDay:number;actualPrice:number};
export type StaffTerm={role:StaffRole;startDay:number;actualPrice:number};
export type StaffContracts={version:2;fromDay:number;terms:StaffTerm[];declined:StaffRole[]};
export type StaffCheckpoint={acquired:StaffAcquisition[];spent:number;pendingSpent:number;arrears:number;contracts?:StaffContracts};
export type StaffPayroll={roles:StaffRole[];openingArrears:number;wagesPaid:number;endingArrears:number};
export function emptyStaff():StaffCheckpoint{return {acquired:[],spent:0,pendingSpent:0,arrears:0,contracts:{version:2,fromDay:1,terms:[],declined:[]}};}
export function staffTerm(staff:StaffCheckpoint,role:StaffRole,day:number){return [...(staff.contracts?.terms??[])].reverse().find(term=>term.role===role&&term.startDay<=day);}
export function staffContractRoles(staff:StaffCheckpoint,day:number):StaffRole[]{
 return staff.acquired.filter(a=>a.hiredDay<=day&&(!staff.contracts||day<staff.contracts.fromDay||staff.contracts.terms.some(term=>term.role===a.role&&term.startDay<=day&&day<term.startDay+STAFF_RULES.hireDays))).map(a=>a.role);
}
// Original acquisitions remain immutable receipts. The first paid term is already
// included in acquired; subsequent terms are additional renewal receipts.
export function staffRenewals(staff:StaffCheckpoint){return staff.contracts?.terms.filter(term=>staff.contracts!.terms.find(first=>first.role===term.role)!==term)??[];}
export function staffPurchasesForDay(staff:StaffCheckpoint,day:number){return staff.acquired.filter(a=>a.hiredDay===day).reduce((sum,a)=>sum+a.actualPrice,0)+staffRenewals(staff).filter(term=>term.startDay===day).reduce((sum,term)=>sum+term.actualPrice,0);}
export function migrateStaffContracts(staff:StaffCheckpoint,day:number):StaffCheckpoint{
 if(staff.contracts)return staff;
 return {...staff,contracts:{version:2,fromDay:day,terms:staff.acquired.map(a=>({role:a.role,startDay:day,actualPrice:0})),declined:[]}};
}
export function validateStaffCheckpoint(value:StaffCheckpoint|undefined,day:number,terminal=false):StaffCheckpoint|null{
 const s=value??{acquired:[],spent:0,pendingSpent:0,arrears:0},integer=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
 if(!s||!Array.isArray(s.acquired)||s.acquired.length>4||!integer(s.spent)||!integer(s.pendingSpent)||s.pendingSpent>s.spent||!integer(s.arrears))return null;
 if(s.acquired.some(a=>!a||!STAFF_ROLES.includes(a.role)||!Number.isSafeInteger(a.hiredDay)||a.hiredDay<1||a.hiredDay>day||a.actualPrice!==STAFF_RULES.hirePrice)||new Set(s.acquired.map(a=>a.role)).size!==s.acquired.length)return null;
 const c=s.contracts;
 if(c){
  if(c.version!==2||!Number.isSafeInteger(c.fromDay)||c.fromDay<1||c.fromDay>day+(terminal?1:0)||!Array.isArray(c.terms)||c.terms.length>4*(Math.floor(day/STAFF_RULES.hireDays)+2)||!Array.isArray(c.declined)||new Set(c.declined).size!==c.declined.length||c.declined.some(role=>!STAFF_ROLES.includes(role)))return null;
  if(c.terms.some(term=>!term||!s.acquired.some(a=>a.role===term.role)||!Number.isSafeInteger(term.startDay)||term.startDay<c.fromDay||term.startDay>day+(terminal&&term.actualPrice===0?1:0)||![0,STAFF_RULES.hirePrice].includes(term.actualPrice)))return null;
  for(const a of s.acquired){
   const terms=c.terms.filter(term=>term.role===a.role),first=terms[0];
   if(!first||!(first.actualPrice===0?first.startDay===c.fromDay&&a.hiredDay<=c.fromDay:first.startDay===a.hiredDay&&a.hiredDay>=c.fromDay)||terms.slice(1).some((term,i)=>term.actualPrice!==STAFF_RULES.hirePrice||term.startDay<terms[i].startDay+STAFF_RULES.hireDays))return null;
  }
  const prepDay=day+(terminal?1:0);
  if(c.declined.some(role=>{const term=staffTerm(s,role,prepDay);return !term||prepDay<term.startDay+STAFF_RULES.hireDays;}))return null;
 }
 if(s.spent!==s.acquired.length*STAFF_RULES.hirePrice+staffRenewals(s).reduce((sum,term)=>sum+term.actualPrice,0))return null;
 return structuredClone(s);
}
