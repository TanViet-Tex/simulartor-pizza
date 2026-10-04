const fs=require('fs');const path='src/scenes/CozyScene.ts';let s=fs.readFileSync(path,'utf8');
const configs={queueUpgradeDialog:[['queue-upgrade-close'],281,355],expressDialog:[['express-confirm','express-close'],252,433,470],priceDialog:[['market-price-cancel','market-price-save'],246,458,500],statementDialog:[['summary-statement-close'],207,492,520],saveDialog:[['save-reload-confirm','save-reload-cancel'],250,370,460],finalDialog:[['summary-final-close'],236,490,490],newCampaignDialog:[['market-new-cancel','market-new-confirm'],278,350],discardDialog:[['confirm-discard','cancel-discard'],276,332],deliveryDialog:[['confirm-delivery','cancel-delivery'],264,332],bargainDialog:[['accept-bargain','reject-bargain'],260,346],helpDialog:[['accept-help','decline-help'],264,332]};
for(const [name,[ids,start,end,height=420]]of Object.entries(configs)){
 const begin=s.indexOf('  private '+name+'('),next=s.indexOf('\n  private ',begin+10);let body=s.slice(begin,next<0?s.length:next);
 body=body.replace(/this\.veil\(\);this\.graphics\(\);this\.art\.panel\([^;]+;/,`this.notificationFrame(${JSON.stringify(ids)},${start},${end},${height});`);
 if(name==='saveDialog')body=body.replace(`this.notificationFrame(["save-reload-confirm","save-reload-cancel"],250,370,460);`,`this.notificationFrame(this.reloadConfirmation?['save-reload-confirm','save-reload-cancel']:[save.state==='recovery'?'save-recover-confirm':save.canRetry?'save-retry':'save-read-again'],250,510,490);`);
 if(name==='helpDialog')body=body.replace('this.notificationFrame(["accept-help","decline-help"],264,332,420);',"this.notificationFrame(pending?['accept-help','decline-help']:['continue-thanks'],264,332,420);");
 s=s.slice(0,begin)+body+s.slice(next<0?s.length:next);
}
// The backdrop has no baked panel: modal frames are explicit, prep screens retain their own art.
s=s.replace("this.graphics();this.art.rect(0,160,360,480,0x241810,.87);", "this.graphics();this.art.rect(0,0,360,640,0x000000,1);");
s=s.replace(/    this\.graphics\(\);this\.art\.panel\(22,208,316,225[^\n]+\n    const oven=[\s\S]*?this\.label\(180,175,[^\n]+\n/, '');
s=s.replace("this.veil();this.label(180,236,'Bạn đã biết làm pizza!'", "this.notificationFrame(['start-shift'],278,335);this.label(180,236,'Bạn đã biết làm pizza!'");
s=s.replace("    this.veil();const pauses=this.runtime.pauses;", "    const pauses=this.runtime.pauses;this.notificationFrame([pauses.some(p=>p==='user'||p==='visibility'||p==='gap')?'resume':'close-order'],272,537,500);");
s=s.replace("this.button('mute',62,0,70,48", "this.button('mute',62,this.notification?405:0,70,48");
s=s.replace(/    if\(this\.scenePauses\.has\('user'\)&&this\.runtime\.shopOpen\)\{this\.graphics\(\);this\.art\.panel\([^\n]+\n/, '');
s=s.replace("this.graphics();this.art.panel(22,208,316,310,UI.paper,UI.border,20);\n      this.label(180,231,`Kết thúc", "this.notificationFrame(['cancel-end-day','confirm-end-day'],270,365,450);\n      this.label(180,231,`Kết thúc");
s=s.replace("this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);\n      const recipe", "this.notificationFrame(['close-order'],272,398,460);\n      const recipe");
s=s.replace("this.graphics();this.art.panel(22,208,316,330,UI.paper,UI.border,20);", "this.notificationFrame(['close-order'],272,438,480);");
s=s.replace("    this.veil();\n    if(this.runtime.productionActive){\n      this.graphics();this.art.panel(22,208,316,300,UI.paper,UI.border,20);", "    this.notificationFrame([this.runtime.productionActive?'continue-shift':'replay'],285,470,460);\n    if(this.runtime.productionActive){");
s=s.replace("if(this.restartConfirmation){\n      this.label", "if(this.restartConfirmation){\n      this.notificationFrame(['market-cancel-reset','market-confirm-reset'],232,290);\n      this.label");
fs.writeFileSync(path,s);
