export const STAFF_ROLES=['prep','oven','box','delivery'] as const;
export type StaffRole=typeof STAFF_ROLES[number];
export const LEGACY_STAFF_DAILY_WAGE=200;
export const STAFF_RULES=Object.freeze({unlockDay:1,hirePrice:2000,hireDays:10,dailyWage:0,prepSeconds:1,ovenSeconds:.25,boxSeconds:.30,deliverySeconds:.30});
export const STAFF_CATALOG=Object.freeze(STAFF_ROLES.map((role,index)=>Object.freeze({role,name:['Phụ bếp','Thợ nướng','Đóng hộp','Giao hàng'][index],price:STAFF_RULES.hirePrice,dailyWage:STAFF_RULES.dailyWage,unlockDay:STAFF_RULES.unlockDay})));
