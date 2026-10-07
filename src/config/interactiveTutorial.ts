export const INTERACTIVE_TUTORIAL_IDS = ['customer','order','sample','dough','sauce','cheese','bake','warming','extract','box','deliver','complete','summary-sales','summary-costs','summary-profit','summary-reviews','market-ingredients','market-prices','market-quantity','market-forecast','market-basket','stock-owned','stock-usable','stock-expiry','shop-menu','shop-decoration','shop-equipment','shop-amenities','shop-expansion','shop-staff','missions-goal','missions-progress','missions-reward','ready'] as const;
export type InteractiveTutorialId=typeof INTERACTIVE_TUTORIAL_IDS[number];
// Keep saved indices stable; detailed management steps are collapsed into their first step.
export const VISIBLE_TUTORIAL_INDICES=[0,1,2,3,4,5,6,7,8,9,10,11,12,16,21,24,25,26,27,28,29,30,33] as const;
export function visibleTutorialIndex(index:number):number{return [...VISIBLE_TUTORIAL_INDICES].reverse().find(value=>value<=index)??0;}
export function interactiveTutorialPhase(index:number):'intro'|'practice'|'management' {return index<3?'intro':index<12?'practice':'management';}

const messages:Record<InteractiveTutorialId,string>={
  customer:'Đây là khách đang chờ bạn phục vụ.',order:'Xem món và số lượng khách yêu cầu tại đây.',sample:'Đây là món bạn cần làm cho khách.',
  dough:'Chạm vào đế bánh để bắt đầu.',sauce:'Thêm tương cà lên đế bánh.',cheese:'Thêm phô mai để hoàn thành phần nguyên liệu.',bake:'Đưa pizza vào lò.',warming:'Chờ bánh chín vàng. Lấy bánh ra trước khi bị cháy.',extract:'Bánh đã chín! Chạm lò để lấy bánh ra.',box:'Chạm Đóng hộp để chuẩn bị giao bánh.',deliver:'Giao đúng đơn cho khách để nhận tiền.',complete:'Tiền bán bánh sẽ được cộng tại đây. Bài tập không thay đổi tiền thật.',
  'summary-sales':'Tổng kết: xem doanh thu, chi phí và đánh giá sau mỗi ngày bán.',
  'summary-costs':'Chi phí gồm giá vốn và phí khác. Các số liệu thật sẽ có sau ca bán.',
  'summary-profit':'Lợi nhuận là doanh thu trừ chi phí. Chưa bán nên chưa có kết quả.',
  'summary-reviews':'Đánh giá khách xuất hiện sau khi phục vụ. Hiện chưa có đánh giá.',
  'market-ingredients':'Chợ: mua nguyên liệu và xem gợi ý cần mua trước khi mở quán.',
  'market-prices':'Đây là giá nhập mỗi phần và số lượng đang có trong kho.',
  'market-quantity':'Chọn số lượng muốn mua bằng nút −, + hoặc ô số lượng.',
  'market-forecast':'Gợi ý dựa trên lịch khách, menu và kho, có cộng phần dự phòng.',
  'market-basket':'Mua tất cả sẽ hiện giỏ hàng để bạn xác nhận. Hướng dẫn không tự mua.',
  'stock-owned':'Kho: xem nguyên liệu còn dùng được và hạn sử dụng.',
  'stock-usable':'Chỉ phần còn dùng được mới phục vụ khách; phần giữ cho đơn được ghi riêng.',
  'stock-expiry':'Xem hạn từng lô tại đây. Sốt không hết hạn; lô hết hạn không dùng được.',
  'shop-menu':'Menu & giá bán: chọn món bán, chỉnh giá và mua công thức trong chuẩn bị.',
  'shop-decoration':'Trang trí: mua rồi Đặt để tăng khách. Cất sẽ ngừng hiệu ứng.',
  'shop-equipment':'Thiết bị: nâng lò, nhập nước và mua tủ lạnh bảo quản lâu gấp 4.',
  'shop-amenities':'Tiện nghi: mua và đặt để khách chờ lâu hơn. App giao hàng mở từ ngày 5.',
  'shop-expansion':'Mở rộng quán: thêm ô khách 4→5→6; bonus khách +10% rồi tổng +30%.',
  'shop-staff':'Nhân viên: thuê theo nghề, trả lương cuối ngày. Phụ bếp bận được miễn lương.',
  'missions-goal':'Nhiệm vụ: xem mục tiêu và tiến độ. Đạt yêu cầu sẽ tự nhận thưởng.',
  'missions-progress':'Tiến độ tăng khi bạn phục vụ đúng yêu cầu của nhiệm vụ.',
  'missions-reward':'Thưởng được cộng tự động một lần khi đạt luật; không cần bấm nhận.',
  ready:'Bạn đã sẵn sàng! Mua đủ nguyên liệu rồi bắt đầu ngày đầu tiên.',
};
export const INTERACTIVE_TUTORIAL_STEPS=INTERACTIVE_TUTORIAL_IDS.map((id,index)=>Object.freeze({id,text:messages[id],phase:interactiveTutorialPhase(index),manual:index<3||index>=11}));
