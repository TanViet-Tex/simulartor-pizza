import type {RecipeId} from './recipeCatalog';
export type SpecialCustomerKind='vip'|'kol'|'attention';
/** fictional marks identity; every line is fictional game writing, including real names. */
export type SpecialCustomer=Readonly<{id:string;name:string;kind:SpecialCustomerKind;portraitIndex:number;fictional:boolean;orderLine:string;orderRecipe?:RecipeId;orderSupported?:boolean;thanksLine:string;thanksSupported?:boolean}>;
type RosterEntry=readonly [name:string,recipe:RecipeId|null,order:string,thanks:string,supported?:boolean];
/** User supplied names/lines in sheet order; VIP/KOL are configurable presentation classes. */
const roster:readonly RosterEntry[]=[
 ['Jack','cheese','Một pizza phô mai nha, hôm nay đói hơi nhiều!','Bánh nóng, phô mai kéo dài, hết sảy!'],
 ['Trường Giang',null,'Cho anh bánh to nha, bụng anh không có nhỏ!','Ngon vậy là anh phải ghé dài dài!'],
 ['Sơn Tùng','pepperoni','Một pepperoni, thêm coca cho đủ bộ!','Bánh này xứng đáng đứng giữa sân khấu!',false],
 ['Trấn Thành','seafood','Cho anh hải sản, nhiều topping chút nha!','Anh định ăn một miếng… mà hết nửa bánh rồi!'],
 ['Hari Won','cheese','Cho em phô mai, kéo sợi dài dài nha!','Em ăn thêm miếng nữa rồi mới về!'],
 ['Mỹ Tâm','mushroom','Một pizza nấm nha, thơm nhẹ thôi!','Bánh ngon, chủ quán lại dễ thương!'],
 ['Đàm Vĩnh Hưng','seafood','Cho anh hải sản, làm thật hoành tráng!','Bánh này lên bàn là phải nổi bật!'],
 ['Hồ Ngọc Hà','vegetable','Pizza rau củ nha, nhiều màu cho đẹp!','Đẹp quá… nhưng vẫn phải ăn thôi!'],
 ['Noo Phước Thịnh','sausage','Một xúc xích nha, anh vừa diễn xong!','Ăn xong đủ sức hát thêm ba bài!'],
 ['Đông Nhi','chicken-bbq','Cho em gà BBQ, thêm nước suối!','Mùi thơm làm em quên luôn giờ về!',false],
 ['Đen Vâu','mushroom','Một bánh nấm, bụng đói thì lòng khó yên.','Bánh tròn, đời vui, bụng no là đủ.'],
 ['HIEUTHUHAI','pepperoni','Một pepperoni, topping đừng ngại nha!','Anh chụp hình trước… thôi ăn trước!'],
 ['Erik','cheese','Cho em pizza phô mai, nướng vàng đẹp nha!','Phô mai kéo sợi còn dài hơn lịch diễn!'],
 ['Đức Phúc','ham-pineapple','Một giăm bông dứa, thêm chút ngọt ngào!','Em định chia đôi… nhưng em đổi ý rồi!'],
 ['Hòa Minzy',null,'Cho chị bánh to, chị đói thiệt đó!','Ngon quá! Cho chị gọi thêm được không?'],
 ['Lan Ngọc','vegetable','Pizza rau củ nha, nhưng phô mai vẫn phải có!','Ăn xong rồi mình mới tính chuyện tập!'],
 ['Ngô Kiến Huy','sausage','Một xúc xích, thêm trà sữa cho anh!','Một tay bánh, một tay nước, quá hợp lý!',false],
 ['Bích Phương','chicken-bbq','Cho chị gà BBQ, chị không muốn chờ lâu đâu!','Thôi được, ngon vậy thì chờ cũng đáng!'],
 ['Phương Ly','ham-pineapple','Một giăm bông dứa, nhìn xinh xinh nha!','Bánh xinh quá, cho em chụp một tấm!'],
 ['Tóc Tiên','seafood','Một hải sản, thêm sốt ăn kèm nha!','Bánh nóng thế này thì phải ăn liền!',false],
];
export const SPECIAL_CUSTOMERS:readonly SpecialCustomer[]=Object.freeze(roster.map(([name,recipe,orderLine,thanksLine,orderSupported],index)=>Object.freeze({id:`special-${index+1}`,name,kind:(index<10?'vip':'kol') as SpecialCustomerKind,portraitIndex:index,fictional:false,...(index===16?{thanksSupported:false}:{}),...(recipe?{orderRecipe:recipe}:{}),...(orderSupported===false?{orderSupported:false}:{}),orderLine,thanksLine})));
export const SPECIAL_PRESENTATION=Object.freeze({welcomeSeconds:2.5,bubbleSeconds:3,opensDay:10,cosmeticProbability:.1});
export const SPECIAL_FRAME_COLORS=Object.freeze({vip:0xffcf54,kol:0xa86deb,attention:0xff7447});
