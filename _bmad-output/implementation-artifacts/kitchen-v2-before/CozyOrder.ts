import { recipeIngredients, recipePrice, type StockRecipe,type StockIngredient } from './CozyStock';
export type CozyIngredient = StockIngredient;
export { BAKE_TIMING as COZY_BAKE } from '../config/bakeTiming';
import { BAKE_TIMING as COZY_BAKE } from '../config/bakeTiming';
export type CozyStage = 'assembly' | 'baking' | 'raw' | 'burnt' | 'ready' | 'boxed' | 'delivered';
export type CozyIntent = { type: 'ingredient'; ingredient: CozyIngredient } | { type: 'deliver'; sourceId?: string; targetId?: string; commandId?: string } | { type: 'bake' | 'extract' | 'discard' | 'box' | 'reset' };
export interface CozyState {
  stage: CozyStage;
  ingredients: CozyIngredient[];
  ovenSeconds: number;
  cash: number;
  reputation: number;
  energy: number;
  feedback: string;
}

const fresh = (): CozyState => ({ stage: 'assembly', ingredients: [], ovenSeconds: 0, cash: 300, reputation: 50, energy: 80, feedback: 'Một chiếc pizza phô mai mang đi.' });

// This isolated fixture never reads or writes a campaign checkpoint.
export class CozyOrder {
  private current = fresh();
  constructor(private readonly practice = false, private readonly recipe: StockRecipe = 'cheese', private readonly allowRaw = false) {}
  get bakeReady(): boolean { const required = recipeIngredients(this.recipe); return required.length === this.current.ingredients.length && required.every(id => this.current.ingredients.includes(id)); }
  get state(): Readonly<CozyState> { return this.current; }
  dispatch(intent: CozyIntent): boolean {
    const s = this.current;
    if (intent.type === 'reset') { this.current = fresh(); return true; }
    if (intent.type === 'ingredient' && s.stage === 'assembly') {
      s.ingredients = s.ingredients.includes(intent.ingredient) ? s.ingredients.filter(i => i !== intent.ingredient) : [...s.ingredients, intent.ingredient];
      s.feedback = this.bakeReady ? 'Đủ nguyên liệu rồi. Nướng thôi!' : 'Thêm đủ nguyên liệu theo đơn nhé.';
      return true;
    }
    if (intent.type === 'bake' && s.stage === 'assembly' && this.bakeReady) {
      s.stage = 'baking'; s.feedback = 'Lò đang nướng. Thơm quá!'; return true;
    }
    if (intent.type === 'extract' && s.stage === 'baking' && (this.allowRaw || s.ovenSeconds >= COZY_BAKE.perfectStart) && s.ovenSeconds <= COZY_BAKE.perfectEnd) {
      s.stage = s.ovenSeconds < COZY_BAKE.perfectStart ? 'raw' : 'ready'; s.feedback = s.stage === 'raw' ? 'Bánh còn sống. Bỏ bánh để làm lại.' : 'Bánh chín vừa! Đóng hộp cho khách nhé.'; return true;
    }
    if (intent.type === 'discard' && (s.stage === 'burnt' || this.allowRaw && ['raw', 'ready'].includes(s.stage))) {
      s.stage = 'assembly'; s.ingredients = []; s.ovenSeconds = 0; s.feedback = 'Làm lại một chiếc bánh mới nhé.'; return true;
    }
    if (intent.type === 'box' && s.stage === 'ready') { s.stage = 'boxed'; s.feedback = 'Đã đóng hộp, sẵn sàng giao Linh.'; return true; }
    if (intent.type === 'deliver' && (s.stage === 'boxed' || this.allowRaw && ['raw','ready','burnt'].includes(s.stage))) {
      s.stage = 'delivered';
      if (!this.practice) { s.cash += recipePrice(this.recipe); s.reputation++; s.energy -= 5; }
      s.feedback = 'Linh: “Thơm quá! Cảm ơn bạn nhé!”'; return true;
    }
    return false;
  }
  tick(seconds: number): void {
    if (this.current.stage !== 'baking' || !Number.isFinite(seconds) || seconds <= 0) return;
    this.current.ovenSeconds = Math.min(COZY_BAKE.gaugeEnd, Math.round((this.current.ovenSeconds + seconds) * 1e6) / 1e6);
    if (this.current.ovenSeconds > COZY_BAKE.perfectEnd) {
      this.current.stage = 'burnt'; this.current.feedback = 'Bánh cháy rồi! Bỏ bánh để làm lại.';
    }
  }
}
