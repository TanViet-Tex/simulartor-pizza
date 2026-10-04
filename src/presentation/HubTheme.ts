import {UI_THEME} from './theme';

/** Scoped management-screen tokens. Kitchen/menu keep their approved global theme. */
export const HUB_THEME = Object.freeze({
  colors: Object.freeze({
    ink:'#442412', paper:'#fff3de', border:'#bd8b55', cream:'#fff0d5',
    muted:'#86502b', active:'#b85b37', activeEdge:'#8c4229', wood:'#9c5c35', woodEdge:'#714125',
    action:'#282a28', actionEdge:'#cda974', disabled:'#706659',
    highlight:'#fff9ed', shadow:'#754221', danger:'#b3482c', inset:'#f5dfbe',
    quantity:'#efd2a9', stepperInk:'#6f4023', field:'#fff7e4', track:'#edd4b0', thumb:'#9d7955',
  }),
  typography: Object.freeze({fontFamily:UI_THEME.typography.fontFamily,
    title:23, subtitle:13, section:19, body:14, meta:11, action:13, navigation:11}),
  spacing: Object.freeze({small:4, medium:8, large:12, panel:16}),
  radii: Object.freeze({tile:8, panel:16, button:10}),
  geometry: Object.freeze({width:360, height:640,
    header:Object.freeze({x:77,y:8,width:205,height:65}),
    cash:Object.freeze({x:290,y:14,width:65,height:27}),
    navigation:Object.freeze({x:8,y:78,width:344,height:49}),
    footer:Object.freeze({x:10,y:590,width:340,height:43}),
  }),
});
