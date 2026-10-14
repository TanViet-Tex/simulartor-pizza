import type {CozyCheckpoint} from './CozyCheckpoint';

export interface LeaderboardEntry {id:string;name:string;cash:number;day:number;rank:number}
export interface LeaderboardView {
  state:'idle'|'loading'|'ready'|'error'|'unconfigured';
  message:string;entries:LeaderboardEntry[];self:LeaderboardEntry|null;name:string;
}
export interface LeaderboardMenuActions {
  view:()=>LeaderboardView;
  subscribe:(listener:()=>void)=>()=>void;
  refresh:()=>void;
  setName:(value:string)=>string;
}
export interface LeaderboardSnapshot {campaignId:string;revision:number;payload:CozyCheckpoint}
export interface LeaderboardProfile {id:string;token:string;name:string;sequence:number}
export function normalizePlayerName(value:string):string {return value.normalize('NFC').trim().replace(/\s+/gu,' ');}
export function playerNameError(value:string):string {
  const name=normalizePlayerName(value),length=[...name].length;
  return length<2||length>20||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(name)?'Tên cần từ 2–20 ký tự, không chứa ký tự điều khiển.':'';
}
export function isLeaderboardEntry(value:unknown):value is LeaderboardEntry {
  const entry=value as LeaderboardEntry;
  return !!entry&&typeof entry.id==='string'&&typeof entry.name==='string'&&!playerNameError(entry.name)&&Number.isSafeInteger(entry.cash)&&Number.isSafeInteger(entry.day)&&entry.day>=1&&Number.isSafeInteger(entry.rank)&&entry.rank>=1;
}
