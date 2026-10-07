import {INTERACTIVE_TUTORIAL_IDS} from '../config/interactiveTutorial';
export type TutorialProgress=Readonly<{version:1;index:number;status:'active'|'completed'|'skipped'}>;
export function validateTutorialProgress(value:unknown):TutorialProgress|null {
  if(!value||typeof value!=='object')return null;
  const p=value as TutorialProgress;
  if(p.version!==1||!Number.isSafeInteger(p.index)||p.index<0||p.index>=INTERACTIVE_TUTORIAL_IDS.length||!['active','completed','skipped'].includes(p.status)||p.status==='completed'&&p.index!==INTERACTIVE_TUTORIAL_IDS.length-1)return null;
  return {version:1,index:p.index,status:p.status};
}
