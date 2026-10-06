// The approved cartoon direction supersedes the initial red-button/2px-radius spec.
export const UI_THEME = Object.freeze({
  colors: Object.freeze({
    hud:0x612820, customer:0x9f4537, dark:0x2b1c14, paper:0xfff0d8,
    ink:0x28150f, border:0xd9a75c, gold:0xffc34c, selected:0xff765f,
    green:0x35be48, greenEdge:0x1d7532, wood:0xb7743d,
  }),
  text: Object.freeze({cream:'#fff0d8',ink:'#28150f',muted:'#f0dfc8',accent:'#ac3022',board:'#321a0d',wood:'#583015'}),
  typography: Object.freeze({fontFamily:'Trebuchet MS, Arial, sans-serif',letterSpacing:0,lineSpacing:0,minSize:9}),
  spacing: Object.freeze([4,8,12,16,24]),
  radii: Object.freeze({tile:9,panel:11,modal:20}),
  minTouch:48,
});

export const CONTRAST_PAIRS = Object.freeze([
  {name:'body',foreground:'#362018',background:'#fff0d8',minimum:4.5},
  {name:'primary',foreground:'#362018',background:'#35be48',minimum:4.5},
  {name:'HUD',foreground:'#fff0d8',background:'#71352e',minimum:4.5},
  {name:'ingredient',foreground:'#fff0d8',background:'#593b28',minimum:4.5},
  {name:'muted',foreground:'#dfceba',background:'#59483f',minimum:4.5},
  {name:'waiting customer',foreground:'#fff0d8',background:'#954a40',minimum:4.5},
  {name:'order accent',foreground:'#ac3022',background:'#fff0d8',minimum:4.5},
  {name:'board',foreground:'#442619',background:'#d99653',minimum:4.5},
  {name:'oven',foreground:'#fff0d8',background:'#a95335',minimum:4.5},
  {name:'clear',foreground:'#fff0d8',background:'#435961',minimum:4.5},
  {name:'panel boundary',foreground:'#c69a6e',background:'#3e291f',minimum:3},
  {name:'selection',foreground:'#ff765f',background:'#593b28',minimum:3},
  {name:'focus',foreground:'#fff0d8',background:'#3e291f',minimum:3},
  {name:'heat marker on warm zone',foreground:'#362018',background:'#c49b52',minimum:3},
  {name:'heat marker on perfect zone',foreground:'#362018',background:'#5bd06a',minimum:3},
]);
