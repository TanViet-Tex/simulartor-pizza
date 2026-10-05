---
title: 'Epic 9 — đề xuất VIP, đơn cao trào và kiểm tra kinh tế'
status: draft
date: '2026-10-05'
baseline_commit: 7865e47
---

Khung 30 ngày đã triển khai trong Story 9.1. Luật mới người dùng gửi trong phiên này thay đề xuất mở VIP từ ngày22 và không có thưởng riêng. Những phần ghi đề xuất vẫn chưa được chốt, chưa thay luật runtime.

## Luật người dùng chốt — 2026-10-05

- Sự kiện A: xác suất10%, mất200, cooldown3ngày.
- VIP: mở từ ngày10;10% mỗi lượt khách đủ điều kiện, có thể xuất hiện nhiều lần/ngày; thưởng+500, uy tín+2.
- Sự kiện xấu: tối đa1lần/ngày, không lặp2ngày liên tiếp.

Cooldown được hiểu là khoảng cách ngày tối thiểu3: nếu A xảy ra ngày10, sớm nhất ngày13 mới xét lại. Không thêm loại sự kiện xấu khác. A là sự kiện mất tiền; cooldown riêng vẫn phải qua giới hạn chung của sự kiện xấu. Mưa/cao điểm/lễ hội hiện có là lịch thời tiết/thương mại, chưa tự biến thành khoản mất tiền hoặc thay lịch của chúng.

Người dùng chọn trừ đủ200 kể cả tiền dưới200, cho tiền âm; ví dụ50→-150, không tạo khoản nợ/lãi riêng. Trả lời mới “10% thôi có thể xuất hiện nhiều lần mà” thay tần suất VIP; đã thông báo hiểu giữ1bánh/đơn và hạn100giây. Chỉ giao đúng món, chín và trước hạn mới thưởng thêm500 ngoài tiền bán và+2uy tín. Không giới hạn VIP1/ngày như sự kiện xấu.

Việc xét sự kiện cần ổn định theo campaign/ngày, không bốc lại mỗi frame/mỗi lần mở thông báo hoặc reload để né mất tiền. Một ca chỉ áp dụng một lần. Cooldown và lịch sử phải qua checkpoint cuối ngày, giữ no-midshift-save. Tiền mất ghi chi phí riêng, thưởng VIP ghi rewards riêng; không đưa chúng vào doanh thu pizza hoặc giá vốn nguyên liệu. Retry/chốt/reload không trừ hay thưởng trùng. Không sửa báo cáo lịch sử save cũ.

## Nội dung đề xuất

| Ngày | Đơn đặc biệt | Hạn xử lý |
|---|---|---|
| 1–9 | Giữ lịch và mục tiêu hiện có | Giữ luật hiện có |
| 10–30 | VIP10% mỗi lượt đủ điều kiện,1bánh; có thể nhiều lần/ngày | 100giây |
| 30 | Một đơn cao trào; ba bánh cùng món | 180 giây |

Đơn đặc biệt chỉ gọi công thức người chơi sở hữu và đang bật bán ở đầu ca. Không bắt mua công thức hoặc nâng cấp để được kết thúc. VIP tại quầy không bắt bật app/book shipper, không thu phí giao app. Giữ sáu ô khách và giới hạn thực tế4/6; không ưu tiên VIP bằng cách đẩy khách khác khỏi hàng. Sự xuất hiện cần được xếp trong lịch trước ca, không cộng quá số ô đang dùng. Thưởng riêngVIP500/+2 thay câu không có thưởng riêng của đề xuất cũ.

Đơn nhiều bánh ngày30 vẫn chỉ là đề xuất chưa được duyệt. Nếu được chọn, đóng đủ bánh rồi Giao bánh một lần: số tiền bán bằng giá hiện tại mỗi bánh nhân số bánh, số đơn hoàn thành là1. FEFO/giá vốn tiêu hao mỗi bánh đúng một lần. Đánh giá đơn dựa trên toàn bộ bánh; không lấy bánh cuối để che bánh sai/cháy trước. Không đổi luật kiên nhẫn của khách thường.

Mục tiêu cuối ngày đề xuất: giao đơn đặc biệt đủ số bánh, đúng công thức, bánh chín và trước hạn. Dùng thưởng mục tiêu hiện tại20tiền+10XP, nhận một lần khi chốt ngày. Không đạt vẫn chốt ngày/kết thúc chiến dịch theo9.1. Save cũ/báo cáo cũ giữ nguyên mục tiêu và lịch sử, không tính lại XP/phần thưởng. Không lưu giữa ca.

## XP và công thức đề xuất

Giữ10XP/đơn thương mại, cộng5XP nếu4–5sao; số bánh không nhân XP của đơn. Mục tiêu ngày20tiền+10XP, nhiệm vụ phô mai hiện có giữ nguyên. Công thức mua bằng tiền; không tái đưa điều kiện cấp hoặc ngày mở công thức đã bỏ. Chưa thêm cấp4+ hoặc thiết bị thiếu luật.

## Kiểm tra kinh tế trước thay cấu hình

Kiểm tra các mốc7/14/21/30 bằng báo cáo thật, bao gồm nhập kho, giá vốn, thuê quán, phí app, lương và khoản lương chưa trả; không cộng nhập kho và giá vốn thành hai lần trừ tiền mặt. Các trường hợp: chơi tay cơ bản, mua công thức, thuê1người, thuê đủ4người, nâng lò và đồ. Phân biệt ca bán hết giả định với hiệu quả chơi thực tế; kiểm tra tự động không thay playtest người chơi.

Phát hiện sơ bộ từ cấu hình: giá cơ bản pizza phô mai50; đế5+sốt3+phô mai7=15, biên trước chi phí khác35. Thuê đủ4người mất800/ngày, thuê quán20; cần ít nhất24pizza phô mai/ngày ở giá/cost cơ bản chỉ để bù820, chưa tính phí app, hao hụt hoặc hỏa tốc. Đây là phép tính giới hạn, chưa kết luận cân bằng toàn bộ menu: giá từng ngày, giảm giá nhà cung cấp, loại khách và món khác có thể thay kết quả. Không tự giảm mức lương200 đã chốt để làm số đẹp.

## Điểm tích hợp đã khảo sát

- `src/config/cozySchedule.ts`, `src/config/deliveryEvents.ts`: lịch và slot đã định trước, không sinh món khóa.
- `src/runtime/CozyRuntime.ts`: hiện chỉ đơn app hỗ trợ tích nhiều bánh; VIP tại quầy cần tách đóng đủ bánh khỏi book/handoff app, giữ luật quầy hiện có.
- `src/domain/CozyProgression.ts`: hiện mục tiêu ngày3+ dùng cùng điều kiện đánh giá; lịch mục tiêu mới cần giữ lịch sử save cũ và nhận thưởng một lần.
- `src/domain/CozyCheckpoint.ts`: phải xác thực báo cáo/mục tiêu mới nhưng giữ checksum/migration và reports cũ.
- `src/scenes/CozyScene.ts`: tên/trạng thái/số bánh trong khung đơn hiện có; không thêm hàng/tab/panel hoặc đổi art đã duyệt.

Sau khi chọn thông số, tạo spec triển khai với test ngày21/22/29/30, nhiều bánh đúng/sai/cháy, quá hạn, đầy hàng, Pause, reload/checkpoint và thưởng một lần. Chốt chuẩn bị/mở ca/tiền/kho giữ luồng hiện có.
