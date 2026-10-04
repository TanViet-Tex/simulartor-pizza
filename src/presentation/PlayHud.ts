// Preserve the approved kitchen layout; Story 1.7 adds protection, not a reflow.
export const PLAY_BANDS=Object.freeze({status:{y:0,height:48},tickets:{y:48,height:112},work:{y:160,height:251},actions:{y:411,height:229}});
export function timerText(seconds:number):string{
  const whole=Math.max(0,Math.ceil(seconds));
  return `${Math.floor(whole/60)}:${String(whole%60).padStart(2,'0')}`;
}
