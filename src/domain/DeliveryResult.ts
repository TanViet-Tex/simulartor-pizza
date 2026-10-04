export interface DeliveryCheck {
  expected: readonly string[]; actual: readonly string[]; takeaway: boolean; boxed: boolean;
  quality: 'good' | 'raw' | 'burnt'; remaining: number; patience: number; extraPenalty: number;
}
export function deliveryResult(check: DeliveryCheck) {
  const recipeWrong = check.expected.length !== check.actual.length || !check.expected.every(id => check.actual.includes(id));
  const unboxed = check.takeaway && !check.boxed;
  const reasons: string[] = [];
  if (recipeWrong) reasons.push('Sai công thức');
  if (unboxed) reasons.push('Đơn mang đi chưa đóng hộp');
  if (check.quality !== 'good') reasons.push(check.quality === 'raw' ? 'Bánh còn sống' : 'Bánh bị cháy');
  if (check.remaining < check.patience / 2) reasons.push('Giao sau nửa thời gian kiên nhẫn');
  if (recipeWrong && check.extraPenalty) reasons.push('Khách khó tính: sai công thức');
  const mismatch = recipeWrong || unboxed;
  const stars = Math.max(1, Math.min(5, 5 - (mismatch ? 2 : 0) - (recipeWrong ? check.extraPenalty : 0) - (check.quality !== 'good' ? 2 : 0) - (check.remaining < check.patience / 2 ? 1 : 0)));
  return { stars, reasons, mismatch };
}
