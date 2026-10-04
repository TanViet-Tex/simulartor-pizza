import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, UI_THEME } from './theme';
const luminance=(hex:string)=>{
  const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
describe('approved cartoon theme',()=>{
  it('keeps nested tokens immutable and preserves portrait touch/typography contract',()=>{
    for(const object of [UI_THEME,...Object.values(UI_THEME).filter(v=>typeof v==='object')])expect(Object.isFrozen(object)).toBe(true);
    expect(UI_THEME.minTouch).toBe(48);expect(UI_THEME.typography.letterSpacing).toBe(0);
    expect(UI_THEME.colors.green).toBe(0x35be48);expect(UI_THEME.spacing).toEqual([4,8,12,16,24]);
  });
  it.each(CONTRAST_PAIRS)('$name has sufficient contrast',({foreground,background,minimum})=>{
    const a=luminance(foreground),b=luminance(background);
    expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(minimum);
  });
});
