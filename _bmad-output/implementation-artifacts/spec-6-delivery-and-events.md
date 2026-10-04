---
title: 'Epic 6 — App giao hàng, đơn nhiều pizza và sự kiện ngày'
type: feature
created: '2026-10-04'
status: done
baseline_commit: 1516b49
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

## Intent

<frozen-after-approval>
Yêu cầu tiếp theo của người dùng: **bấm Giao bánh là hoàn tất, không có thời gian giao**. Quyết định này thay phần đếm giờ chuyến/đến trễ trong quy tắc trước. Vẫn book và chờ shipper tới lấy; nhân viên nhận đủ hộp chốt đơn ngay, thời gian trở về thuộc chu kỳ nhân viên đã yêu cầu.
Người dùng yêu cầu Epic 6 và chốt hai luồng: chưa thuê nhân viên → nhận đơn app → book shipper → làm pizza → đóng hộp → shipper tới lấy → giao; đã thuê nhân viên → nhận đơn app → làm/đóng hộp → nhân viên nhận đơn đi giao → quay về nhận đơn tiếp. Giao bằng đồng hồ simulation, không bản đồ lái xe. App từ ngày5, không có đơn app trước khi bật trong chuẩn bị. Hỗ trợ đơn1–3pizza cùng công thức, feedback trễ/sai và mưa/cao điểm/lễ hội. Giữ UI, một lò, cap4/nâng6, catalog/FEFO/save cũ và background/Pause hiện hành. Không thêm nghiệp vụ tuyển/lương/đào tạo của Epic8; nhánh nhân viên qua availability port, chỉ hoạt động khi hệ thống nhân sự thật cung cấp nhân viên, không giả người đã thuê.
</frozen-after-approval>

## Cấu hình tạm và quy tắc cụ thể

Các số dưới đây là cấu hình triển khai để chơi thử, chưa phải balance đã duyệt. Đã hỏi lựa chọn cách giao; nếu người dùng cung cấp thông số khác sẽ thay config. App miễn phí từ ngày5, mặc định tắt cho save cũ; bật/tắt chỉ chuẩn bị, xác nhận rồi atomic checkpoint. Không biến Wi-Fi/nhân viên E07/E08 thành nghiệp vụ đã triển khai.

- Khi chưa có nhân viên, phải bấm Book shipper trước bake cho đơn app. Chờ shipper tới10s simulation (mưa15s); tới sớm thì đợi bánh, bánh xong sớm thì đợi rider. Đủ hộp và rider tới: bấm Giao bánh hoàn tất đơn/nhận tiền ngay, giải phóng shipper, không chuyến/countdown sau giao. Một booking tại một thời điểm; phí5xu lúc bấm giao, doanh thu gross/phí riêng/net cash; lặp không nhận tiền/phí lần2. Phí/thời gian chờ tạm cần playtest.
- Với availability port báo nhân viên giao đã thuê: không book, nhân viên rảnh nhận đủ hộp và bấm Giao hoàn tất ngay; quay về20s (mưa30s), nhận đơn tiếp sau trở về. Phí shipper0, lương thuộc Epic8. Availability thật hiện tại false vì chưa có tuyển; unit qua fixture xác minh nhánh này. Không thêm thuê giả/nhân viên miễn phí vào UI.
- Hạn đơn app90s từ lúc nhận đến bấm Giao. Chưa giao khi hết hạn: hủy/1sao như bỏ đơn, nguyên liệu đã dùng không hoàn. Không phát sinh phạt đến trễ do không còn thời gian chuyến. Báo cáo cũ vẫn đọc được. App không mặc cả/khách giúp; chấm/XP/mục tiêu một lượt/đơn, lượng pizza bán riêng. Mission phô mai vẫn theo outcome đơn.
- Đơn app 1–3 bánh cùng công thức, lấy từ menu đã sở hữu đang bán. Từng bánh dùng CozyOrder hiện có; tiêu hao actual FEFO đúng một lần tại bake. Đóng hộp và bấm Giao bánh: tích lũy bánh vào đơn, chưa đủ thì tạo bánh tiếp; đủ thì gửi nếu courier rảnh. Mỗi phần có feedback đúng món/chín/hộp, kết quả cả đơn lấy sao thấp nhất cộng phạt giao trễ; không giao nhầm nguồn vào app hay app vào khách quầy. Giữ xác nhận giao sai hiện có khi phù hợp; thiếu hộp không gửi.
- Giao xong trả slot/giải phóng shipper ngay; chỉ nhân viên đang về còn chặn closeDay theo chu kỳ đã yêu cầu. Booking đang đợi không chặn chốt; hủy cùng đơn chốt/hết hạn. Tick booking/return trong grace/sau clock cuối khi cần; không khách mới sau duration. Save chỉ chứa setting app/báo cáo đã chốt, không active order/roster giả.
- Ngày1–5 bình thường; từ6 chu kỳ4ngày:6mưa,7cao điểm,8bình thường,9lễ hội rồi lặp. Mưa giảm khách quầy khoảng30%, app tăng từ2lên3 cơ hội nếu đã bật; chưa bật không tạo đơn app. Cao điểm/lễ hội thêm2/3 cơ hội quầy, không vượt sức chứa. Lễ hội từ9 có một đơn app3bánh; app thường luân phiên1/2bánh. Cơ hội có ID ổn định, xử lý một lần, max30 outcome/ngày. Event/settings đóng băng lúc mở ca, không random/replay lợi ích.

## Code Map

- `src/config/deliveryEvents.ts`: thông số trên, dự báo ngày, mở app, schedule transform.
- `src/runtime/CozyRuntime.ts`: app setting/booking/pickup/return/packed parts, availability port, thanh toán tức thì/clock boundaries.
- `src/runtime/CozyCampaignSession.ts`: bật app qua transaction chuẩn bị hiện có, retry/CAS.
- `src/domain/CozyCheckpoint.ts`, `DayAccounts.ts`: optional app/events/sold-pizza/fee metadata, validate equations và migration schema2-compatible (không mất/checksum save v1/v2).
- `src/presentation/OrderQueue.ts`: source app/quantity/packed/countdown, tên đủ8recipes.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: nút App trong hàng tiêu đề Tiện nghi, dùng khung2nút, không di chuyển sáu thẻ/header/footer. Queue dùng icon điện thoại; detail/các nút bếp giữ bounds. Modal app ghi dự báo/thông số/hoàn tất ngay; vùng status trong detail chỉ báo chờ pickup/nhân viên về, không thêm hàng/tab/countdown chuyến.
- `ReferenceSummary.ts`: phí và số pizza đọc report thật trong finance/detail hiện có, không thêm thẻ tổng kết.

## Tasks & Acceptance

- [x] Config/schedule: day5app gate, app off không sinh, owned menu, event transforms deterministic/cap.
- [x] Full runtime: nhận → book → bake/consume từng bánh → box/pack → rider tới → Giao/nhận tiền ngay một lần; availability staff → giao tức thì/return/rảnh. Wrong/unboxed/expire/busy và shift close.
- [x] App setting lưu atomic/retry/reload, save cũ off và giữ money/lots/recipes; báo cáo fees/pizzas/XP/mục tiêu đúng, compact history không phình.
- [x] UI đúng theme/bounds/phone, app settings/forecast/countdown/quantity/feedback đọc state thật, 360×640 không tràn.
- [x] Unit focused đầy đủ edges; E2E day5toggle/đa bánh/giao tức thì/fees/save, mưaappoff/hạn giao, Pause/background; build/review.

## Verification

Không full Playwright matrix. Kiểm tra Chromium360×640 và units runtime/checkpoint/stock/progression/campaign/lifecycle. Không sửa prototype campaign luật3ngày riêng hoặc full30day story.

Kết quả sau yêu cầu giao tức thì: `npm run build-nolog` đạt; 100 unit hiện hành đạt trong13file (12 Epic6). Sáu test lịch sử CozyDelivery thất bại từ trước, đã xác minh cả sáu trên baseline1516b49 trong cây nguồn tạm; giữ nguyên và ghi deferred-work, không đổi luật. Chromium360×640: 4 Epic6 đạt khi kiểm tra lại trên code giao tức thì; 6 Pause/background/Menu đã đạt trong lượt trước. Ảnh renderer App/Book/lượng2/giá100xu/hoàn tất ngay đã xem, không đổi bounds/phong cách. Nhánh nhân viên qua unit dependency, roster thuê thật còn E08.

## Review và bản sửa

Ba review độc lập (blind/edge/acceptance) không phát hiện sai phương trình tiền/save/tiêu hao. Đã sửa default delivery command ID theo phần đóng hộp và launch để không kẹt đơn nhiều bánh; thêm regression không truyền command ID. Đã giữ courier countdown khi xem đơn khác và E2E xác minh. Localize bake guard; dự báo chuẩn bị dùng event ngày sắp mở, không timing ca vừa chốt; UI giá cả đơn nhân lượng bánh, phí nhân viên0. Giữ test giao quầy cũ thay vì ghi đè bởi Epic6. Hai nghi vấn blind về schedule metadata/oven cleanup được xác minh bằng validator spread và các regression đa bánh đã đạt.

Yêu cầu tiếp theo bỏ thời gian giao đã ghi vào Intent/rules và triển khai: settlement đồng bộ trong dispatch Giao, shipper rảnh ngay, return nhân viên riêng20/30s. Review edge xác minh không trả tiền trùng và default command/expiry/return không hồi quy. Không áp dụng phạt đến trễ cho đơn mới; báo cáo cũ vẫn giữ nguyên.

## Suggested Review Order

**Luồng đơn và chuyến giao**

- Bật app, book trước bake và đóng băng nhân viên đầu ca.
  [CozyRuntime.ts:46](../../src/runtime/CozyRuntime.ts#L46)
- Đóng hộp từng bánh rồi giao tức thì, thu net/chấm cả đơn một lần.
  [CozyRuntime.ts:485](../../src/runtime/CozyRuntime.ts#L485)

**Lưu và giao diện**

- Cài đặt app dùng pipeline checkpoint chuẩn bị, cùng retry/CAS.
  [CozyCampaignSession.ts:71](../../src/runtime/CozyCampaignSession.ts#L71)
- Metadata optional giữ save cũ và kiểm tra doanh thu/phí/lượng bánh.
  [CozyCheckpoint.ts:31](../../src/domain/CozyCheckpoint.ts#L31)
- Book và trạng thái courier nằm trong khung đơn hiện có.
  [CozyScene.ts:495](../../src/scenes/CozyScene.ts#L495)

**Cấu hình và kiểm tra**

- Phí/thời gian tạm và lịch sự kiện xác định theo ngày.
  [deliveryEvents.ts:4](../../src/config/deliveryEvents.ts#L4)
- Kiểm tra booking, nhiều bánh, staff return, pause, phí và atomic retry.
  [CozyEpic6.test.ts:1](../../src/runtime/CozyEpic6.test.ts#L1)
- Thao tác thật, native save/reload và giao tức thì ở360×640.
  [epic6-delivery.spec.ts:20](../../tests/epic6-delivery.spec.ts#L20)

