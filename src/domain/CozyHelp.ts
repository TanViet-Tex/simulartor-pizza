/** Only settled narrative choices survive a day checkpoint; active offers/tickets do not. */
export type CozyHelpCheckpoint={decision:'unseen'|'accepted'|'declined';outcome:null|'succeeded'|'failed';claims:string[]};
export function validateHelpCheckpoint(value:unknown):CozyHelpCheckpoint|null {
  if(!value||typeof value!=='object')return null;
  const s=value as CozyHelpCheckpoint;
  if(!['unseen','accepted','declined'].includes(s.decision)||![null,'succeeded','failed'].includes(s.outcome)||!Array.isArray(s.claims)||s.claims.some(id=>id!=='regular.thanks-day-3')||new Set(s.claims).size!==s.claims.length)return null;
  if(s.decision==='accepted'?s.outcome===null:s.outcome!==null)return null;
  return {decision:s.decision,outcome:s.outcome,claims:[...s.claims]};
}
