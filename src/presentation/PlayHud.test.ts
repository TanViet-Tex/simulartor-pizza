import { expect, it } from 'vitest';
import { PLAY_BANDS, timerText } from './PlayHud';
it('preserves the approved kitchen layout for zero through three tickets',()=>{
  expect(PLAY_BANDS).toEqual({status:{y:0,height:48},tickets:{y:48,height:112},work:{y:160,height:251},actions:{y:411,height:229}});
  const bands=Object.values(PLAY_BANDS);expect(bands.reduce((sum,b)=>sum+b.height,0)).toBe(640);
  bands.slice(1).forEach((band,i)=>expect(band.y).toBe(bands[i].y+bands[i].height));
});
it('formats stable m:ss deadline and oven text including boundaries',()=>{
  expect([0,-1,.05,3,59.1,60,121].map(timerText)).toEqual(['0:00','0:00','0:01','0:03','1:00','1:00','2:01']);
});
