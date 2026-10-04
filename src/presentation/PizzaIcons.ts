import type Phaser from 'phaser';

// Original reusable SVG icons. No emoji, remote fonts, or baked-in UI text.
const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="gold" x2=".3" y2="1"><stop stop-color="#fff0ae"/><stop offset="1" stop-color="#efaf48"/></linearGradient><linearGradient id="red" x2=".5" y2="1"><stop stop-color="#ff855d"/><stop offset="1" stop-color="#cd3229"/></linearGradient></defs>${body}</svg>`;
const cheese = Array.from({length:24},(_,i)=>{const a=i*2.4,r=8+Math.sqrt(i/24)*27,x=50+Math.cos(a)*r,y=51+Math.sin(a)*r;return `<path d="M${x-7} ${y-3}l14 6" stroke="${i%3?'#ffe596':'#ffbf4f'}" stroke-width="5" stroke-linecap="round"/>`;}).join('');
const sausage = [[30,60],[59,64],[54,33]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="19" ry="15" transform="rotate(-28 ${x} ${y})" fill="#ed795c" stroke="#aa3f32" stroke-width="3"/><circle cx="${x-5}" cy="${y-4}" r="3" fill="#ffbd94"/><circle cx="${x+7}" cy="${y+3}" r="2" fill="#ffbd94"/>`).join('');
const lock = '<path d="M36 47V33a14 14 0 0 1 28 0v14" fill="none" stroke="#e7dacf" stroke-width="7"/><rect x="27" y="43" width="46" height="38" rx="9" fill="#e7dacf"/><circle cx="50" cy="59" r="5" fill="#756154"/><path d="M50 62v7" stroke="#756154" stroke-width="4"/>';
const portrait = '<path d="M15 99Q13 67 50 64Q88 67 86 99" fill="#64916a" stroke="#3d5040" stroke-width="3"/><path d="M37 67l13 17 14-17" fill="#fff0d6"/><ellipse cx="50" cy="42" rx="29" ry="33" fill="#53362d"/><ellipse cx="50" cy="48" rx="23" ry="28" fill="#ffcca0"/><path d="M25 40Q18 12 41 14Q55 0 69 17Q86 20 76 45L65 28Q45 41 40 26Q33 42 25 40" fill="#50362d" stroke="#352720" stroke-width="3"/><path d="M34 49q5-7 10 0m13 0q5-7 10 0" fill="none" stroke="#4d302b" stroke-width="3" stroke-linecap="round"/><ellipse cx="32" cy="57" rx="5" ry="3" fill="#ec937e"/><ellipse cx="68" cy="57" rx="5" ry="3" fill="#ec937e"/><path d="M42 60q9 15 18 0Z" fill="#a3453d"/><path d="M45 62h12" stroke="#fff5df" stroke-width="3"/>';
export const PIZZA_ICONS: Record<string,string> = {
  coin:'<circle cx="50" cy="50" r="43" fill="url(#gold)" stroke="#a76121" stroke-width="6"/><circle cx="50" cy="50" r="33" fill="none" stroke="#ffeeb1" stroke-width="4"/><path d="M63 32q-25-15-26 5q0 10 15 13q18 4 11 16q-10 12-28 0M50 20v60" fill="none" stroke="#fff2c1" stroke-width="6" stroke-linecap="round"/>',
  ledger:'<path d="M27 14h39l12 14v58H27Z" fill="#fff0d1" stroke="#87532d" stroke-width="5"/><path d="M38 35h27M38 48h27M38 61h21M38 74h15" stroke="#b97444" stroke-width="5" stroke-linecap="round"/>',
  basket:'<path d="M21 43h60l-9 40H30Z" fill="#bf8550" stroke="#663a23" stroke-width="5"/><path d="M33 43Q34 5 51 12Q69 11 69 43M40 52v21M52 52v21M64 52v21" fill="none" stroke="#663a23" stroke-width="5" stroke-linecap="round"/>',
  crate:'<rect x="18" y="25" width="65" height="59" rx="5" fill="#c88d52" stroke="#6c4225" stroke-width="5"/><path d="M21 42h60M21 66h60M34 27v56M67 27v56" stroke="#86502a" stroke-width="5"/><path d="M29 31h42" stroke="#f4cf92" stroke-width="4"/>',
  storefront:'<path d="M24 40h52v43H24Z" fill="#edc592" stroke="#754229" stroke-width="5"/><path d="M17 44l13-27h40l13 27q-7 12-16 0q-8 12-17 0q-9 12-17 0q-10 12-16 0Z" fill="#c96d42" stroke="#754229" stroke-width="4"/><path d="M43 82V59h18v23" fill="#90603b"/>',
  checklist:'<rect x="23" y="20" width="54" height="68" rx="6" fill="#fff0d1" stroke="#87532d" stroke-width="5"/><rect x="39" y="11" width="23" height="15" rx="5" fill="#b47a45" stroke="#87532d" stroke-width="4"/><path d="M34 42l5 5 10-13M34 64l5 5 10-13" fill="none" stroke="#608440" stroke-width="5"/><path d="M54 43h13M54 65h13" stroke="#87532d" stroke-width="4"/>',
  dough:'<ellipse cx="50" cy="59" rx="40" ry="29" fill="#9c552f"/><ellipse cx="50" cy="53" rx="40" ry="30" fill="url(#gold)" stroke="#b27539" stroke-width="3"/><ellipse cx="50" cy="50" rx="32" ry="22" fill="#ffe1a0"/><path d="M24 42q19-16 41-5" fill="none" stroke="#fff1c4" stroke-width="5" stroke-linecap="round"/>',
  cheese,
  sausage,
  mushroom:'<g stroke="#ad7955" stroke-width="2"><path d="M41 47l-7 31q15 13 28 0l-5-31" fill="#f7dfba"/><path d="M15 48Q18 9 51 16Q86 15 86 48Q55 66 15 48" fill="#d1a079"/><path d="M22 45Q32 23 51 23" fill="none" stroke="#f5d8b4" stroke-width="6" stroke-linecap="round"/><path d="M62 61q26-24 33 0q-4 9-16 7l-5 19-12-2 6-20Z" fill="#f2d7b1"/></g>',
  pepper:'<path d="M50 25C22 5 11 32 25 47C0 64 27 87 44 71C59 97 89 74 74 54C101 35 76 12 58 29Z" fill="#75b62c" stroke="#397820" stroke-width="5"/><path d="M49 38C30 22 25 37 38 49C19 64 36 72 48 57C64 79 77 63 61 51C84 38 65 27 55 41" fill="#365f22" stroke="#9bd049" stroke-width="3"/>',
  onion:'<g fill="none" stroke-width="8"><ellipse cx="47" cy="55" rx="30" ry="34" stroke="#b752a5" transform="rotate(-25 47 55)"/><ellipse cx="47" cy="55" rx="20" ry="25" stroke="#ecc0de" transform="rotate(-25 47 55)"/><ellipse cx="68" cy="62" rx="17" ry="25" stroke="#cd86c3" transform="rotate(25 68 62)"/></g>',
  sauce:'<path d="M39 24h22l9 16v45q-20 11-40 0V40Z" fill="url(#red)" stroke="#98382c" stroke-width="3"/><rect x="36" y="21" width="28" height="12" rx="4" fill="#fff2dd"/><path d="M46 22V8q4-4 8 0v14" fill="#fff7ea" stroke="#cfbaa5" stroke-width="2"/><rect x="38" y="48" width="24" height="27" rx="4" fill="#fff1cc"/><circle cx="50" cy="62" r="8" fill="#e94a31"/><path d="M50 55l-5-4 6 1 4-4-1 7" fill="#4d8739"/><path d="M36 39v38" stroke="#ffb69a" stroke-width="3" stroke-linecap="round"/>',
  avatar:portrait,
  'avatar-queue':`<defs><clipPath id="portrait-circle"><circle cx="50" cy="50" r="48"/></clipPath></defs><circle cx="50" cy="50" r="48" fill="#f2d6ab"/><g clip-path="url(#portrait-circle)">${portrait}</g>`,
  phone:'<circle cx="50" cy="50" r="48" fill="#3876ba"/><circle cx="42" cy="35" r="30" fill="#4d91d3" opacity=".4"/><rect x="32" y="18" width="36" height="64" rx="8" fill="#fff7e8"/><rect x="38" y="29" width="24" height="38" rx="3" fill="#3876ba"/><path d="M44 23h12" stroke="#3876ba" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="74" r="3" fill="#3876ba"/><path d="M43 49l5 5 10-13" fill="none" stroke="#fff7e8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  lock,
  'queue-lock':'<path d="M33 44V31.5a17 17 0 0 1 34 0V44" fill="none" stroke="#756154" stroke-width="7"/><rect x="22" y="41" width="56" height="46" rx="10" fill="#e7dacf" stroke="#756154" stroke-width="4"/><circle cx="50" cy="60" r="6" fill="#756154"/><path d="M50 65v9" stroke="#756154" stroke-width="5" stroke-linecap="round"/>',
  box:'<path d="M17 36l33-17 33 17v37L50 89 17 73Z" fill="#fff0d1" stroke="#87532d" stroke-width="5" stroke-linejoin="round"/><path d="M17 36l33 17 33-17M50 53v36M34 27l33 17v17" fill="none" stroke="#b97444" stroke-width="5" stroke-linejoin="round"/>',
  deliver:'<path d="M15 63h63v17H15Z" fill="#fff6e7"/><path d="M20 58a27 27 0 0 1 54 0Z" fill="#fff6e7"/><circle cx="47" cy="26" r="5" fill="#fff6e7"/><path d="M69 26h17m-8-8 8 8-8 8" fill="none" stroke="#fff6e7" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  user:'<circle cx="50" cy="32" r="17" fill="#613d34"/><path d="M20 81v-9a30 30 0 0 1 60 0v9Z" fill="#613d34"/>',
  trash:'<path d="M26 29h48M40 22h20M32 33l4 48h28l4-48M44 40v30M56 40v30" fill="none" stroke="#fff3df" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  bell:'<path d="M19 67a31 31 0 0 1 62 0Z" fill="#fff6e7"/><path d="M16 77h68" stroke="#fff6e7" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="29" r="5" fill="#fff6e7"/>',
};

// Shared bottle silhouette keeps the sauce shelf visually consistent.
for(const [name,body,edge,mark] of [
  ['white','#f5dfaa','#bda274','#e8bd68'],
  ['bbq','#884631','#4e2b22','#c27b44'],
  ['pesto','#79a94a','#42632c','#396f32'],
  ['hot','#e77b35','#9b4226','#b82e27'],
]){
  PIZZA_ICONS[`sauce-${name}`]=PIZZA_ICONS.sauce
    .replace('url(#red)',body).replace('#98382c',edge).replace('#e94a31',mark);
}

export const PIZZA_ICON_MANIFEST = Object.freeze(Object.entries(PIZZA_ICONS).map(([name,body]) => Object.freeze({
  key: `pizza-icon-${name}`,
  url: name === 'sauce' ? 'assets/ui/sauce.svg' : `data:image/svg+xml;base64,${btoa(wrap(body))}`,
  type: 'svg' as const,
})));

export function preloadPizzaIcons(scene:Phaser.Scene):void {
  for (const {key,url} of PIZZA_ICON_MANIFEST) {
    if(!scene.textures.exists(key))scene.load.svg(key,url.startsWith('data:') ? url : `${import.meta.env.BASE_URL}${url}`,{width:256,height:256});
  }
}
