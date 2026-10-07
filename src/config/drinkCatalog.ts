export const DRINK_CATALOG=Object.freeze([
 {id:'water',name:'Nước suối',purchasePrice:8,salePrice:20,color:0x70bce0},
 {id:'cola',name:'Coca',purchasePrice:10,salePrice:25,color:0xbb2c2f},
 {id:'orange',name:'Nước cam',purchasePrice:12,salePrice:30,color:0xf2a13b},
].map(item=>Object.freeze(item)));
export type DrinkId='water'|'cola'|'orange';
export const drinkDefinition=(id:DrinkId)=>DRINK_CATALOG.find(item=>item.id===id)!;
