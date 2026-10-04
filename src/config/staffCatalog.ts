export const STAFF_ROLES=['prep','oven','box','delivery'] as const;
export type StaffRole=typeof STAFF_ROLES[number];
export const STAFF_RULES=Object.freeze({unlockDay:8,hirePrice:2000,dailyWage:200,prepSeconds:.30,ovenSeconds:.25,boxSeconds:.30,deliverySeconds:.30});
export const STAFF_CATALOG=Object.freeze(STAFF_ROLES.map((role,index)=>Object.freeze({role,name:['Phụ bếp','Thợ nướng','Đóng hộp','Giao hàng'][index],price:STAFF_RULES.hirePrice,dailyWage:STAFF_RULES.dailyWage,unlockDay:STAFF_RULES.unlockDay})));
