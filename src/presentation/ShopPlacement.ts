import type {ShopItemId} from '../domain/ShopEffects';

/** Normalized positions in the illustrative shop preview, never kitchen controls. */
export const SHOP_INSTALL_LOCATIONS: Record<ShopItemId,{name:string;x:number;y:number;height:number}> = {
 'table-plant':{name:'Bàn trước quầy',x:.24,y:.76,height:24},
 'pizza-painting':{name:'Tường bên phải',x:.70,y:.39,height:27},
 'decorative-light':{name:'Trần giữa quán',x:.49,y:.16,height:23},
 'shop-sign':{name:'Biển trước cửa',x:.89,y:.74,height:28},
 'large-plant':{name:'Góc cửa',x:.05,y:.78,height:29},
 curtains:{name:'Cửa sổ',x:.91,y:.24,height:29},
 'waiting-chair':{name:'Khu ghế đợi',x:.39,y:.88,height:22},
 wifi:{name:'Kệ thiết bị',x:.37,y:.47,height:18},
 fan:{name:'Góc khu đợi',x:.12,y:.66,height:28},
 'air-conditioner':{name:'Tường phía trên',x:.76,y:.12,height:17},
 speaker:{name:'Kệ âm thanh',x:.61,y:.56,height:21},
 'customer-tables':{name:'Khu bàn khách',x:.68,y:.84,height:25},
};
