/** Stable identities follow sheet order, left to right, top to bottom. */
const names = [
 'Linh Gánh Rau','Bếp Béo','Bác Sĩ Bơ','Tí Điện Đóm','Tèo Cờ Lê','Hoa Hòe','Bánh Mì Bự','Cô Giáo Mực','Tí Cặp Sách','Nơ Nhí',
 'Mọt Sách','Phượt Phờ','Kiến Trúc Kính','Nháy Máy','Code Cú','Game Gà','Ván Trượt Vèo','Bóng Rổ Bự','Ông Bảy Bảnh','Bà Tư Tươi',
 'Sếp Sốt','Chị Chốt Đơn','Mẹ Măm Măm','Ba Bế Bé','Cà Phê Cười','Chú Gác Cổng','Cá Cắn Câu','Lá Lém Lỉnh','Áo Dài Duyên','Anh Lãng Tử',
 'Ma Măm Pizza','Ma Mát Mẻ','Ma Má Hồng','Cương Thi Cười','Quỷ Quậy','Sừng Hồng','Chằn Chén','Xương Xí Xọn','Sọ Sành Điệu','Băng Bông',
 'Zombie Zui','Zombie Zẻ','Bí Bự','Bí Bé','Phù Thủy Phô Mai','Pháp Sư Phồng','Ma Cà Chớn','Ma Cà Chua','Sói Sốt','Dơi Dỗi',
 'Mèo Ma Mị','Bóng Bơ','Lửa Lém','Cương Thi Tím','Thần Đèn Đói','Băng Bụng Bự','Lửa Lẩu','Tử Thần Thèm','Búp Bê Bánh','Quỷ Đầu Bếp',
 'Cáo Cam','Cáo Bạc','Mèo Mướp','Hổ Háu','Thỏ Thèm','Hươu Hí Hửng','Hạc Hờn','Rắn Rau','Rồng Rộn','Rồng Riu',
 'Lá Lười','Sen Sốt','Trúc Tròn','Đào Đỏ','Núi Nóng','Nước Ngọt','Mây Mềm','Trăng Tròn','Phượng Phô Mai','Cây Cụ',
 'Khỉ Khều','Nấm Nũng','Gió Gà','Đá Đói','Nước Nham','Bướm Bơ','Sáo Sành','Lụa Lém','Băng Bé','Lá Lạ',
 'Si Sút Sốt','Bảy Bóng Bẩy','Ney Nhún Nhảy','Mập Bắp','Luka Lắc','Salah Sốt','Son Săn Bánh','Haaland Háu','Modric Măm','Bóng Vàng Véo',
 'Lewan Lẩu','Kylian Kem','Tiến Thèm','Hải Hăm','Toàn Topping','Sơn Sốt Cay','Tóc Tiên Tôm','Đen Đế Bánh','Mỹ Măm','Bin Bắp',
 'Bích BBQ','Trúc Trộn','Hòa Hành','Erik Ăn','Đức Dứa','Amee Ăn Mê','Soobin Sốt','Min Mực','Jack Giăm Bông','Vũ Vét Phô Mai',
 'Sắt Sốt','Nước Nướng','Cây Cay','Kiến Kem','Hoa Hồng Ham','Dơi Đế','Băng Bắp','Tím Topping','Lửa Lò','Robot Rau',
 'Sư Tử Sốt','Rồng Rau','Đỏ Đế','Thiên Thần Tôm','Cung Corn','Kiếm Kem','Phù Thủy Phô Mai II','Băng BBQ','Tim Tôm','Ninja Nấm',
 'Trăng Topping','Chớp Cheese','Kính Kem','Ong Ô Liu','Bọ Bắp','Quỷ Quế','Hổ Hành','Pháp Sư Pesto','Ninja Nướng','Alien Ăn',
] as const;
export const CUSTOMER_COUNT=names.length;
export function customerProfile(index:number):{id:number;name:string}{const id=((Math.trunc(index)%CUSTOMER_COUNT)+CUSTOMER_COUNT)%CUSTOMER_COUNT;return {id,name:names[id]};}
