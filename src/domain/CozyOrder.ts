import { recipeIngredients, recipePrice, type StockRecipe,type StockIngredient } from './CozyStock';
export type CozyIngredient = StockIngredient;
export { BAKE_TIMING as COZY_BAKE } from '../config/bakeTiming';
import { bakeTiming } from '../config/bakeTiming';
import {INITIAL_CASH} from '../config/campaignRules';
import {isFinishingSauce,type FinishingSauce} from '../config/ingredientCatalog';
export type CozyStage = 'assembly' | 'baking' | 'raw' | 'burnt' | 'ready' | 'boxed' | 'delivered';
export type CozyIntent = { type: 'ingredient'; ingredient: CozyIngredient } | { type: 'deliver'; sourceId?: string; targetId?: string; commandId?: string } | { type: 'bake' | 'extract' | 'discard' | 'box' | 'reset' };
export interface CozyState {
  stage: CozyStage;
  ingredients: CozyIngredient[];
  finishingSauces: FinishingSauce[];
  extracted: boolean;
  ovenSeconds: number;
  cash: number;
  reputation: number;
  energy: number;
  feedback: string;
}

const fresh = (): CozyState => ({ stage: 'assembly', ingredients: [], finishingSauces: [], extracted:false, ovenSeconds: 0, cash: INITIAL_CASH, reputation: 50, energy: 80, feedback: 'Một chiếc pizza phô mai mang đi.' });

// This isolated fixture never reads or writes a campaign checkpoint.
export class CozyOrder {
  private current = fresh();
  readonly timing;
  constructor(private readonly practice = false, private readonly recipe: StockRecipe = 'cheese', private readonly allowRaw = false, level: number = 0) { this.timing = bakeTiming(level); }
  get bakeReady(): boolean { return this.current.ingredients.includes('dough'); }
  get state(): Readonly<CozyState> { return this.current; }
  canUseIngredient(id:CozyIngredient):boolean {
    const s=this.current;
    return isFinishingSauce(id)
      ? s.extracted&&['raw','ready','burnt'].includes(s.stage)&&!s.finishingSauces.includes(id)
      : s.stage==='assembly'&&(id==='dough'||s.ingredients.includes('dough'));
  }
  /** Cancel an uncommitted pack confirmation without rebuilding or consuming this pizza. */
  reopenUnpackedBox():boolean {if(this.current.stage!=='boxed'||!this.current.extracted)return false;this.current.stage='ready';return true;}
  dispatch(intent: CozyIntent): boolean {
    const s = this.current;
    if (intent.type === 'reset') { this.current = fresh(); return true; }
    if(intent.type==='ingredient'&&isFinishingSauce(intent.ingredient)){
      if(!s.extracted||!['raw','ready','burnt'].includes(s.stage)||s.finishingSauces.includes(intent.ingredient))return false;
      s.finishingSauces=[...s.finishingSauces,intent.ingredient];return true;
    }
    if (intent.type === 'ingredient' && s.stage === 'assembly') {
      if(!this.canUseIngredient(intent.ingredient))return false;
      s.ingredients = intent.ingredient==='dough'&&s.ingredients.includes('dough') ? [] : s.ingredients.includes(intent.ingredient) ? s.ingredients.filter(i => i !== intent.ingredient) : [...s.ingredients, intent.ingredient];
      s.feedback = this.bakeReady ? 'Có đế bánh rồi. Chạm lò để nướng.' : 'Thêm đế bánh để nướng nhé.';
      return true;
    }
    if (intent.type === 'bake' && s.stage === 'assembly' && this.bakeReady) {
      s.stage = 'baking'; s.feedback = 'Lò đang nướng. Thơm quá!'; return true;
    }
    if (intent.type === 'extract' && !s.extracted && ['baking','burnt'].includes(s.stage) && (this.allowRaw || s.ovenSeconds >= this.timing.perfectStart)) {
      s.extracted=true;s.stage = s.ovenSeconds > this.timing.perfectEnd?'burnt':s.ovenSeconds < this.timing.perfectStart ? 'raw' : 'ready'; s.feedback = s.stage === 'raw' ? 'Bánh còn sống. Bỏ bánh để làm lại.' : s.stage==='burnt'?'Bánh cháy rồi!':'Bánh chín vừa! Đóng hộp cho khách nhé.'; return true;
    }
    if (intent.type === 'discard' && ['raw','ready','boxed','burnt'].includes(s.stage)) {
      s.stage = 'assembly'; s.ingredients = [];s.finishingSauces=[];s.extracted=false; s.ovenSeconds = 0; s.feedback = 'Làm lại một chiếc bánh mới nhé.'; return true;
    }
    if (intent.type === 'box' && s.stage === 'ready') { s.stage = 'boxed'; s.feedback = 'Đã đóng hộp, sẵn sàng giao Linh.'; return true; }
    if (intent.type === 'deliver' && (s.stage === 'boxed' || this.allowRaw && ['raw','ready','burnt'].includes(s.stage))) {
      const quality = s.stage;
      s.stage = 'delivered';
      const required = recipeIngredients(this.recipe);
      const correct = required.length === s.ingredients.length && required.every(id => s.ingredients.includes(id)) && quality !== 'raw' && quality !== 'burnt';
      if (!this.practice) { if (correct) { s.cash += recipePrice(this.recipe); s.reputation++; } else { s.reputation = Math.max(0, s.reputation - 1); } s.energy -= 5; }
      s.feedback = correct ? 'Linh: “Thơm quá! Cảm ơn bạn nhé!”' : 'Linh: “Bánh này không đúng món mình đặt.”'; return true;
    }
    return false;
  }
  tick(seconds: number): void {
    if (this.current.stage !== 'baking' || !Number.isFinite(seconds) || seconds <= 0) return;
    this.current.ovenSeconds = Math.min(this.timing.gaugeEnd, Math.round((this.current.ovenSeconds + seconds) * 1e6) / 1e6);
    if (this.current.ovenSeconds > this.timing.perfectEnd) {
      this.current.stage = 'burnt'; this.current.feedback = 'Bánh cháy rồi! Bỏ bánh để làm lại.';
    }
  }
}
