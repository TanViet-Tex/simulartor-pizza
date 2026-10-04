import {INGREDIENT_CATALOG} from '../config/ingredientCatalog';
import { BAKE_TIMING } from '../config/bakeTiming';
import { ORDINARY_CUSTOMERS } from '../config/ordinaryCustomers';
import { deliveryResult } from './DeliveryResult';
export const ingredients = INGREDIENT_CATALOG.slice(0,5).map(({id,name,basePrice,color})=>({id,name,basePrice,color}));
export const recipes = [
  { id: 'cheese', name: 'Phô mai', price: 50, ingredients: ['dough', 'sauce', 'cheese'] },
  { id: 'mushroom', name: 'Nấm', price: 65, ingredients: ['dough', 'sauce', 'cheese', 'mushroom'] },
  { id: 'sausage', name: 'Xúc xích', price: 75, ingredients: ['dough', 'sauce', 'cheese', 'sausage'] },
];
export interface Lot { id: number; ingredient: string; quantity: number; cost: number; expires: number }
export interface Ticket { id: string; recipe: string; kind: string; price: number; remaining: number; patience: number; takeaway: boolean; help: boolean; reserved: string[]; started: boolean }
export interface Summary { day: number; revenue: number; purchases: number; cost: number; expired: number; rent: number; rewards: number; profit: number; delivered: number; rating: number | null; goal: boolean; ending: string | null }
export interface Campaign {
  day: number; phase: 'market' | 'shop' | 'summary' | 'end'; cash: number; xp: number; reputation: number; relationship: number; cheeseSales: number;
  time: number; duration: number; tickets: Ticket[]; offer: Ticket | null; selected: string | null;
  pizza: null | { ticketId: string; ingredients: string[]; stage: 'assembly' | 'baking' | 'ready'; elapsed: number; quality: string; boxed: boolean };
  summary: Summary | null; lots: Lot[]; message: string; revision: number; prices: Record<string, number>; unlocked: string[];
  revenue: number; purchases: number; cost: number; rewards: number; delivered: number; ratings: number[]; totalProfit: number;
  regularRating: number; helped: boolean; regularBonus: boolean; regularDay: number; missionReward: boolean; referral: boolean; cursor: number; pricePenalty: number; nextLot: number;
}
export type Command = { type: string; [key: string]: unknown };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const recipe = (id: string) => recipes.find(r => r.id === id)!;
export class DemoGame {
  state: Campaign;
  private deliveredCommands = new Set<string>();
  constructor(saved?: Campaign) {
    this.state = saved ? structuredClone(saved) : {
      day: 1, phase: 'market', cash: 300, xp: 0, reputation: 50, relationship: 0, cheeseSales: 0,
      time: 0, duration: 180, tickets: [], offer: null, selected: null, pizza: null, summary: null, lots: [], message: '', revision: 0,
      prices: { cheese: 50, mushroom: 65, sausage: 75 }, unlocked: ['cheese', 'mushroom'], revenue: 0, purchases: 0, cost: 0, rewards: 0, delivered: 0,
      ratings: [], totalProfit: 0, regularRating: 0, helped: false, regularBonus: false, regularDay: 0, missionReward: false, referral: false, cursor: 0, pricePenalty: 0, nextLot: 1,
    };
  }
  snapshot(): Campaign { return structuredClone(this.state); }
  stock(id: string): number { return this.state.lots.filter(l => l.ingredient === id && l.expires >= this.state.day).reduce((n, l) => n + l.quantity, 0); }
  available(id: string): number { return this.stock(id) - this.state.tickets.reduce((n, t) => n + t.reserved.filter(i => i === id).length, 0); }
  price(id: string): number { return Math.round((ingredients.find(i => i.id === id)?.basePrice ?? 0) * [1, 1.1, 0.9][this.state.day - 1]); }
  private result(ok: boolean, message = '') { this.state.message = message; this.state.revision++; return { ok, message }; }
  dispatch(command: Command): { ok: boolean; message?: string } {
    const s = this.state;
    if (command.type === 'next') {
      if (s.phase !== 'summary') return this.result(false, 'Ngày chưa được chốt.');
      this.state = this.nextDayCheckpoint(); return this.result(true);
    }
    if (s.phase === 'market') {
      if (command.type === 'buy') {
        const id = String(command.ingredient); const qty = Number(command.quantity);
        if (!ingredients.some(i => i.id === id) || !Number.isInteger(qty) || qty < 1 || qty > 100) return this.result(false, 'Số lượng không hợp lệ.');
        if (id === 'sausage' && !s.unlocked.includes('sausage')) return this.result(false, 'Mở từ ngày sau khi đạt cấp 2.');
        const cost = this.price(id) * qty;
        if (s.cash < cost) return this.result(false, 'Không đủ tiền.');
        s.cash -= cost; s.purchases += cost;
        s.lots.push({ id: s.nextLot++, ingredient: id, quantity: qty, cost: this.price(id), expires: s.day + (['mushroom', 'sausage'].includes(id) ? 0 : 1) });
        return this.result(true, 'Đã nhập nguyên liệu.');
      }
      if (command.type === 'price') {
        const r = recipes.find(r => r.id === command.recipe); const value = Number(command.value);
        if (!r || !Number.isInteger(value) || value < Math.round(r.price * .8) || value > Math.round(r.price * 1.4)) return this.result(false, 'Giá ngoài khoảng cho phép.');
        s.prices[r.id] = value; return this.result(true);
      }
      if (command.type === 'open') {
        if (!s.unlocked.some(id => recipe(id).ingredients.every(i => this.available(i) >= 1))) return this.result(false, 'Cần đủ nguyên liệu cho một pizza.');
        s.phase = 'shop'; return this.result(true, 'Quán đã mở cửa!');
      }
      return this.result(false);
    }
    if (s.phase !== 'shop') return this.result(false);
    if (s.offer) {
      if (command.type === 'decline') { s.offer = null; return this.result(true, 'Hẹn khách lần sau.'); }
      if (command.type !== 'accept') return this.result(false, 'Hãy trả lời khách trước.');
      const offer = s.offer;
      if (!recipe(offer.recipe).ingredients.every(i => this.available(i) >= 1)) return this.result(false, 'Không đủ nguyên liệu để nhận đơn.');
      if (!this.createTicket(offer)) return this.result(false, 'Không đủ chỗ hoặc nguyên liệu để nhận đơn.');
      s.offer = null;
      return this.result(true, offer.help ? 'Một chiếc pizza dành tặng khách quen.' : 'Đã nhận đơn và giữ nguyên liệu.');
    }
    if (command.type === 'select') {
      if (!s.tickets.some(t => t.id === command.id)) return this.result(false);
      s.selected = String(command.id); return this.result(true);
    }
    const ticket = s.tickets.find(t => t.id === (command.type === 'deliver' ? command.targetId ?? s.selected : s.selected));
    if (command.type === 'discard') { s.pizza = null; return this.result(true, 'Đã bỏ bánh. Nguyên liệu đã nướng không được hoàn lại.'); }
    if (!ticket) return this.result(false, 'Chọn phiếu của khách trước.');
    if (command.type === 'ingredient') {
      const id = String(command.ingredient);
      if (!ingredients.some(i => i.id === id)) return this.result(false);
      if (s.pizza && (s.pizza.stage !== 'assembly' || s.pizza.ticketId !== ticket.id)) return this.result(false, 'Hoàn thành hoặc bỏ bánh hiện tại trước.');
      if (s.pizza?.ingredients.includes(id)) return this.result(false, 'Nguyên liệu này đã có.');
      if (this.available(id) + (ticket.reserved.includes(id) ? 1 : 0) < 1) return this.result(false, 'Nguyên liệu đang hết hoặc đã giữ cho đơn khác.');
      s.pizza ??= { ticketId: ticket.id, ingredients: [], stage: 'assembly', elapsed: 0, quality: '', boxed: false };
      s.pizza.ingredients.push(id); return this.result(true);
    }
    const pizza = s.pizza;
    if (!pizza) return this.result(false, 'Hãy chuẩn bị bánh trước.');
    if(!s.tickets.some(t=>t.id===pizza.ticketId))return this.result(false,'Khách đã rời đi. Chỉ có thể bỏ bánh còn lại.');
    if (command.type === 'bake') {
      const owner = s.tickets.find(t => t.id === pizza.ticketId);
      if (pizza.stage !== 'assembly' || !owner || !pizza.ingredients.includes('dough')) return this.result(false, 'Cần có đế bánh.');
      if (!pizza.ingredients.every(id => this.available(id) + (owner.reserved.includes(id) ? 1 : 0) >= 1)) return this.result(false, 'Không đủ nguyên liệu.');
      for (const id of pizza.ingredients) {
        const lot = s.lots.filter(l => l.ingredient === id && l.quantity > 0 && l.expires >= s.day).sort((a, b) => a.expires - b.expires || a.id - b.id)[0];
        lot.quantity--; s.cost += lot.cost;
      }
      owner.reserved = []; owner.started = true; pizza.stage = 'baking'; return this.result(true, 'Nướng 3–5 giây; quá giây 5 bánh cháy.');
    }
    if (command.type === 'remove') {
      if (pizza.stage !== 'baking') return this.result(false);
      pizza.stage = 'ready'; pizza.quality = pizza.elapsed < BAKE_TIMING.perfectStart ? 'raw' : pizza.elapsed > BAKE_TIMING.perfectEnd ? 'burnt' : 'good';
      return this.result(true, pizza.quality === 'good' ? 'Bánh vừa chín!' : 'Bánh chưa đạt, có thể bỏ và làm lại.');
    }
    if (command.type === 'box') { if (pizza.stage !== 'ready' || pizza.quality !== 'good' || pizza.boxed) return this.result(false); pizza.boxed = true; return this.result(true, 'Đã đóng hộp.'); }
    if (command.type === 'deliver') {
      const commandId=String(command.commandId??`deliver:${pizza.ticketId}:${ticket.id}`);
      if(this.deliveredCommands.has(commandId)||ticket.remaining<=0||command.sourceId!==undefined&&command.sourceId!==pizza.ticketId||!s.tickets.some(t=>t.id===pizza.ticketId))return this.result(false,'Khách đã rời đi hoặc đích giao không còn hợp lệ.');
      if (pizza.stage !== 'ready') return this.result(false, 'Lấy bánh khỏi lò trước.');
      const extraPenalty = ticket.kind === 'picky' ? ORDINARY_CUSTOMERS.picky.extraPenalty : 0;
      const result=deliveryResult({expected:recipe(ticket.recipe).ingredients,actual:pizza.ingredients,takeaway:ticket.takeaway,boxed:pizza.boxed,quality:pizza.quality as 'good'|'raw'|'burnt',remaining:ticket.remaining,patience:ticket.patience,extraPenalty});
      if(result.mismatch&&command.confirmed!==true)return this.result(false,'Cần xác nhận: '+result.reasons.join(', '));
      this.deliveredCommands.add(commandId);
      this.close(ticket, result.stars, true, !result.mismatch && pizza.quality === 'good'); s.pizza = null;s.selected=null;
      return this.result(true, ticket.help ? 'Đã hoàn thành lời nhờ của khách.' : `Đã giao: ${result.stars} sao · +${ticket.price} xu${result.reasons.length?' · '+result.reasons.join(', '):''}`);
    }
    return this.result(false);
  }
  private close(ticket: Ticket, score: number, delivered: boolean, helpSuccess = false): void {
    const s = this.state;
    s.tickets = s.tickets.filter(t => t.id !== ticket.id);
    if (s.selected === ticket.id) s.selected = s.tickets[0]?.id ?? null;
    if (ticket.help) { s.helped = delivered && helpSuccess; s.relationship = clamp(s.relationship + (s.helped ? 1 : -1), 0, 3); return; }
    s.ratings.push(score); s.reputation = clamp(s.reputation + (score >= 4 ? 1 : score <= 2 ? -2 : 0), 0, 100);
    if (ticket.kind === 'regular') {
      s.regularRating = score;
      if (score >= 4 && s.regularDay !== s.day) { s.relationship = clamp(s.relationship + 1, 0, 3); s.regularDay = s.day; }
    }
    if (!delivered) return;
    s.cash += ticket.price; s.revenue += ticket.price; s.delivered++; s.xp += score >= 4 ? 15 : 10;
    if (ticket.recipe === 'cheese') s.cheeseSales++;
    if (s.cheeseSales >= 8 && !s.missionReward) { s.missionReward = true; s.cash += 30; s.rewards += 30; s.xp += 20; s.reputation = clamp(s.reputation + 2, 0, 100); }
  }
  tick(seconds: number): void {
    const s = this.state;
    if (s.phase !== 'shop' || s.offer || !Number.isFinite(seconds) || seconds <= 0) return;
    // Small steps preserve scheduled arrivals and deadline ordering in simulated tests.
    let left = seconds;
    while (left > 0 && s.phase === 'shop' && !s.offer) {
      const dt = Math.min(.05, left); left -= dt; s.time += dt;
      if (s.pizza?.stage === 'baking') s.pizza.elapsed += dt;
      for (const ticket of [...s.tickets]) { ticket.remaining -= dt; if (ticket.remaining <= 1e-7) { this.close(ticket, 1, false); s.message = 'Khách hết kiên nhẫn · 1 sao. Bỏ bánh còn lại, không hoàn nguyên liệu.'; } }
      const count = [6, 8, 10][s.day - 1] + (s.day === 3 && s.referral ? 1 : 0);
      const at = s.cursor === 10 ? 210 : 10 + s.cursor * [25, 22, 20][s.day - 1];
      if (s.cursor < count && s.time + 1e-7 >= at && s.time < s.duration) {
        const n = s.cursor++;
        if (s.tickets.length < 3) this.arrive(n);
        else s.message = 'Đã đủ 3 đơn đang chờ. Khách rời quán.';
      }
      if (s.time >= s.duration && (s.tickets.length === 0 || s.time >= s.duration + 120)) this.finish();
    }
    s.revision++;
  }
  private arrive(n: number): void {
    const s = this.state;
    const regular = n === 0 && (s.day === 1 || (s.day === 2 ? s.regularRating >= 3 : s.helped || s.regularRating >= 4));
    const kind = regular ? 'regular' : s.day === 1 ? (n < 3 ? 'picky' : 'bargain') : ['hurry', 'picky', 'bargain'][(n - 1 + 3) % 3];
    let id = regular || n === 10 ? 'cheese' : ['cheese', 'cheese', 'mushroom', 'cheese', 'sausage'][n % 5];
    if (!s.unlocked.includes(id)) id = s.unlocked[0];
    const help = regular && s.day === 2;
    const price = help ? 0 : Math.round(s.prices[id] * (kind === 'bargain' ? .9 : 1));
    const ceiling = { regular: 1.2, picky: 1.1, bargain: 1.05, hurry: 1.25 }[kind]!;
    if (price > recipe(id).price * ceiling) { if (s.pricePenalty < 3) { s.reputation = Math.max(0, s.reputation - 1); s.pricePenalty++; } s.message = 'Khách thấy giá quá cao và rời quán.'; return; }
    if (regular && s.day === 3 && s.relationship >= 2 && !s.regularBonus) { s.regularBonus = true; s.cash += 20; s.rewards += 20; }
    const patience = kind === 'bargain' ? 110 : ORDINARY_CUSTOMERS[kind as keyof typeof ORDINARY_CUSTOMERS].patience;
    const ticket: Ticket = { id: `${s.day}-${n}`, recipe: id, kind, price, remaining: patience, patience, takeaway: !help && (n + 1) % 3 === 0, help, reserved: [], started: false };
    if (help || kind === 'bargain') s.offer = ticket;
    else if (this.createTicket(ticket)) s.message = 'Đã tạo đơn và giữ nguyên liệu.';
    else s.message = 'Không đủ nguyên liệu cho món khách yêu cầu.';
  }
  private createTicket(ticket: Ticket): boolean {
    const s = this.state;
    if (s.tickets.length >= 3 || s.tickets.some(t => t.id === ticket.id) || !recipe(ticket.recipe).ingredients.every(id => this.available(id) >= 1)) return false;
    ticket.reserved = [...recipe(ticket.recipe).ingredients];
    ticket.remaining = ticket.patience;
    s.tickets.push(ticket); s.selected ??= ticket.id;
    return true;
  }
  private finish(): void {
    const s = this.state;
    for (const ticket of [...s.tickets]) this.close(ticket, 1, false);
    const rating = s.ratings.length ? s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length : null;
    const goal = s.day === 1 ? s.delivered >= 3 : s.day === 2 ? s.revenue >= 200 : s.ratings.length >= 3 && (rating ?? 0) >= 4;
    if (goal) { s.cash += 20; s.rewards += 20; s.xp += 10; }
    let expired = 0;
    for (const lot of s.lots) if (lot.expires <= s.day) { expired += lot.quantity * lot.cost; lot.quantity = 0; }
    s.cash -= 20;
    const profit = s.revenue - s.cost - expired - 20; s.totalProfit += profit;
    s.summary = { day: s.day, revenue: s.revenue, purchases: s.purchases, cost: s.cost, expired, rent: 20, rewards: s.rewards, profit, delivered: s.delivered, rating, goal, ending: null };
    s.phase = 'summary'; s.pizza = null; s.offer = null;
    if (s.day === 2) s.referral = s.reputation >= 55;
    if (s.day === 3) s.summary.ending = 'complete';
    else {
      const factor = [1, 1.1, .9][s.day];
      const minimum = Math.min(...recipes.filter(r => s.unlocked.includes(r.id) || s.xp >= 60).map(r => r.ingredients.reduce((sum, id) => sum + (this.stock(id) > 0 ? 0 : Math.round(ingredients.find(i => i.id === id)!.basePrice * factor)), 0)));
      if (s.cash < 20 || s.cash < minimum) s.summary.ending = 'insolvent';
    }
  }
  nextDayCheckpoint(): Campaign {
    const next = this.snapshot();
    if (next.phase !== 'summary' || !next.summary) return next;
    if (next.summary.ending) { next.phase = 'end'; next.selected = null; next.lots = next.lots.filter(l => l.quantity > 0); return next; }
    next.day++; next.phase = 'market'; next.duration = [180, 210, 240][next.day - 1];
    next.time = 0; next.cursor = 0; next.pricePenalty = 0; next.revenue = 0; next.purchases = 0; next.cost = 0; next.rewards = 0; next.delivered = 0; next.ratings = []; next.summary = null; next.message = ''; next.selected = null;
    next.lots = next.lots.filter(l => l.quantity > 0);
    if (next.xp >= 60 && !next.unlocked.includes('sausage')) next.unlocked.push('sausage');
    next.revision++; return next;
  }
}

export function validateCampaign(value: unknown): Campaign {
  if (!value || typeof value !== 'object') throw new Error('Invalid checkpoint');
  const s = value as Campaign;
  const numeric = ['day', 'cash', 'xp', 'reputation', 'relationship', 'cheeseSales', 'time', 'duration', 'revision', 'revenue', 'purchases', 'cost', 'rewards', 'delivered', 'totalProfit', 'regularRating', 'regularDay', 'cursor', 'pricePenalty', 'nextLot'] as const;
  if (numeric.some(k => typeof s[k] !== 'number' || !Number.isFinite(s[k]))) throw new Error('Invalid checkpoint numbers');
  if (!Number.isInteger(s.day) || s.day < 1 || s.day > 3 || !['market', 'end'].includes(s.phase) || s.xp < 0 || s.reputation < 0 || s.reputation > 100 || s.relationship < 0 || s.relationship > 3 || s.cheeseSales < 0 || s.revision < 0) throw new Error('Invalid checkpoint bounds');
  if (['helped', 'regularBonus', 'missionReward', 'referral'].some(k => typeof (s as unknown as Record<string, unknown>)[k] !== 'boolean') || typeof s.message !== 'string') throw new Error('Invalid checkpoint flags');
  if (!Array.isArray(s.tickets) || s.tickets.length !== 0 || s.offer !== null || s.pizza !== null || s.selected !== null) throw new Error('Checkpoint contains active orders');
  if (!Array.isArray(s.unlocked) || !s.unlocked.includes('cheese') || !s.unlocked.includes('mushroom') || new Set(s.unlocked).size !== s.unlocked.length || s.unlocked.some(id => !recipes.some(r => r.id === id)) || !s.prices || recipes.some(r => !Number.isInteger(s.prices[r.id]) || s.prices[r.id] < Math.round(r.price * .8) || s.prices[r.id] > Math.round(r.price * 1.4))) throw new Error('Invalid checkpoint menu');
  if (!Array.isArray(s.lots) || s.lots.some(l => !l || !ingredients.some(i => i.id === l.ingredient) || !Number.isInteger(l.id) || !Number.isInteger(l.quantity) || l.quantity < 0 || !Number.isInteger(l.cost) || l.cost <= 0 || !Number.isInteger(l.expires) || l.expires < s.day || l.expires > 4)) throw new Error('Invalid checkpoint inventory');
  if (!Array.isArray(s.ratings) || s.ratings.some(n => !Number.isInteger(n) || n < 1 || n > 5)) throw new Error('Invalid checkpoint ratings');
  if (s.phase === 'market' && (s.summary !== null || s.time !== 0 || s.cursor !== 0)) throw new Error('Invalid day checkpoint');
  if (s.phase === 'end' && (!s.summary || !['complete', 'insolvent'].includes(s.summary.ending ?? ''))) throw new Error('Invalid final summary');
  if (s.summary) {
    const t = s.summary;
    if (['day', 'revenue', 'purchases', 'cost', 'expired', 'rent', 'rewards', 'profit', 'delivered'].some(key => !Number.isFinite(t[key as keyof Summary])) || t.day !== s.day || typeof t.goal !== 'boolean' || (t.rating !== null && (typeof t.rating !== 'number' || !Number.isFinite(t.rating) || t.rating < 1 || t.rating > 5))) throw new Error('Invalid summary values');
    if ((t.ending === 'complete' && s.day !== 3) || (t.ending === 'insolvent' && s.day === 3)) throw new Error('Invalid ending day');
  }
  if (s.duration !== [180, 210, 240][s.day - 1] || s.time < 0 || s.time > s.duration + 121 || new Set(s.lots.map(l => l.id)).size !== s.lots.length || s.lots.some(l => l.id < 1 || l.id >= s.nextLot)) throw new Error('Invalid checkpoint consistency');
  return structuredClone(s);
}
