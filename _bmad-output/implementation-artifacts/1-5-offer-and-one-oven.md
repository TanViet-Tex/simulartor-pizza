---
title: 'Story 1.5 — Đơn tự tạo và một lò nướng'
type: feature
created: '2026-10-01'
status: review
baseline_commit: NO_VCS
context: []
---
# Story 1.5 — Đơn tự tạo và một lò nướng

> Cập nhật yêu cầu 2026-10-01 theo người dùng. Bản Accept/Decline chung đã hoàn thành trước đó; thay đổi dưới đây mới sửa tài liệu, chưa áp dụng vào code. Story được mở lại ở `ready-for-dev` để không coi bản cũ là đáp ứng hợp đồng mới.

## Code Map
- `src/runtime/CozyRuntime.ts`: offer, ticket, lò có chủ sở hữu và giữ kho khi làm lại.
- `src/domain/CozyOrder.ts`: chất lượng bánh và chuyển trạng thái.
- `src/scenes/CozyScene.ts`: khách, lò, offer và xác nhận bỏ bánh.
- `src/runtime/CozyTickets.test.ts`, `tests/story15.spec.ts`: kiểm tra biên và thao tác mobile.

## Scope
Giữ giao diện cartoon, hướng dẫn, freeplay và campaign. Ca thương mại có tối đa 3 ticket, một lò dùng chung; lò thứ hai vẫn khóa. Khách thường, vội và khó tính tự vào theo lịch mô phỏng, tự tạo đơn hợp lệ, giữ kho và bắt đầu kiên nhẫn đúng một lần; không có Accept/Decline và không pause lúc đến. Khách vội/khó tính khác ở kiên nhẫn và mức phạt theo cấu hình. Thiếu chỗ, giá không hợp lệ hoặc thiếu kho thì không tạo ticket, hiện lý do và không đổi món. Khách mặc cả có lựa chọn riêng về giá (Story 2.1); khách quen xin giúp giữ Help / Decline vì là lựa chọn cốt truyện (Story 4.3). Khách quen mua bình thường tự tạo đơn như khách thường. Chỉ hai lựa chọn đặc biệt có pause riêng, chưa tạo ticket/giữ kho/tính kiên nhẫn trước khi đồng ý. Giữ mốc dưới 3 giây sống, 3–5 chín vừa, quá 5 cháy, thang 7 giây. Không mở rộng quy tắc giao sai của Story 1.6.

## Tasks & Acceptance
- [x] `src/runtime/CozyRuntime.ts`: Khi khách thường/vội/khó tính đến hợp lệ, tự tạo một ticket, giữ kho và tính kiên nhẫn nguyên tử; không pause/Accept/Decline. Xử lý lại cùng lượt đến không tạo ticket trùng. Giới hạn 3 ticket, hiện lỗi cục bộ khi không thể tạo; tên, thời gian và loại khách đúng cấu hình.
- [x] `src/runtime/CozyRuntime.ts`: Khi chọn ticket, giữ riêng công thức/assembly, lò chỉ chứa một pizza có chủ sở hữu; bake trùng hoặc lò bận không tiêu hao thêm. Không đổi pizza khi đổi ticket.
- [x] `src/domain/CozyOrder.ts`: Khi lấy bánh trước 3 giây là sống; 3–5 là chín vừa; sau 5 cháy. Chỉ bánh chín được đóng hộp. Được bỏ bánh sống/chín/cháy qua xác nhận; hủy xác nhận giữ nguyên trạng thái; xác nhận không hoàn kho, làm lại giữ kho mới.
- [x] `src/scenes/CozyScene.ts`: Hiển thị 3 khách và ticket tự tạo, đơn được chọn, một lò dùng chung và thanh nhiệt; bỏ modal/nút Accept/Decline cho khách thường/vội/khó tính. Giữ thông báo lỗi và xác nhận bỏ/làm lại, nút tối thiểu 48px. Lựa chọn giá và Help / Decline chỉ thuộc luồng đặc biệt.
- [x] Unit/E2E bổ sung lịch đến tự tạo đơn không pause, chống tạo trùng, giữ kho, khác biệt kiên nhẫn/mức phạt và không có Accept/Decline ở luồng thường; hồi quy capacity, chủ lò, biên 3/5, bỏ/làm lại ở 360×640, 390×844, 412×915.

## Verification
Các kết quả sau là bằng chứng của hợp đồng Accept/Decline trước cập nhật, không chứng minh luồng tự tạo đơn mới. Các task chưa đánh dấu ở trên cần triển khai và kiểm thử lại.
Build cuối và 66 unit tests đạt. Matrix Chromium/WebKit × 360×640, 390×844, 412×915: 34 E2E đạt, 8 lượt được bỏ qua có chủ đích (mushroom/decline chỉ chạy trên 360×640 mỗi engine). Hai kiểm tra giá tiền và Tiếp tục ca trên build cuối cũng đạt. Luồng mua/giữ kho trước đó đạt cả sáu cấu hình. Đã xem ảnh màn hình hai ticket/lò ở 390×844 và WebKit 412×915.


## Design Notes
Lịch prototype hiện tại là 20 giây/lượt và kiên nhẫn nền 60 giây; đây là mô tả bản code cũ, không thay thế cấu hình nhóm khách trong GDD. Hợp đồng mới bắt đầu kiên nhẫn khi ticket tự tạo, hoặc sau quyết định giá/Help cho khách đặc biệt. Cảnh báo nhiệt từ giây 4 tới 5 vẫn cho phép lấy bánh chín. Mua thêm giữ các ticket hiện có. Kết quả giao món có nút tiếp tục ca, giữ tiền/kho; cần chọn rõ ticket tiếp theo để lần chạm giao thứ hai không tự giao khách khác.

Đã rà soát bằng ba lượt độc lập. Sửa vị trí xác nhận bỏ bánh tránh chạm đúp vô tình xác nhận; từ chối làm lại quá deadline trước khi giữ kho; sửa lựa chọn công thức khi mua thêm; thêm tiếp tục ca và tránh giao lặp sang ticket khác. Ticket đã dùng nguyên liệu hiện vẫn giữ ở 0s; việc đóng ticket hết giờ sau sản xuất và quy tắc giao sai thuộc Story 1.6. Hết giờ trước sử dụng vẫn hoàn reservation đúng một lần.



## Suggested Review Order

- Offer và lịch ca: [CozyRuntime.ts:83](../../src/runtime/CozyRuntime.ts#L83).
- Bỏ bánh và giữ kho mới: [CozyRuntime.ts:132](../../src/runtime/CozyRuntime.ts#L132).
- Lò có chủ riêng và khách: [CozyScene.ts:157](../../src/scenes/CozyScene.ts#L157).
- Xác nhận bỏ bánh: [CozyScene.ts:277](../../src/scenes/CozyScene.ts#L277).
- Biên và chống lặp: [CozyTickets.test.ts:7](../../src/runtime/CozyTickets.test.ts#L7).
- Chạm mobile: [story15.spec.ts:13](../../tests/story15.spec.ts#L13).

## Dev Agent Record

### Implementation Notes

- Continued the existing automatic-arrival implementation in `CozyRuntime`; retained per-ticket assembly, oven ownership, discard confirmation and fresh-stock remake.
- Completed the corresponding campaign path in `DemoGame`: ordinary arrivals create tickets and reserve stock atomically, preserve selection, consume scheduled slots once, and show capacity/stock/price rejection reasons. Ordinary arrivals keep the simulation running.
- Only bargaining and Help / Decline create pending offers. These choices freeze simulated time and do not reserve ingredients before agreement. A shared ticket-creation handler also protects special-choice acceptance against duplicate holds.
- Customer patience and the existing picky wrong-order penalty use `ORDINARY_CUSTOMERS`. Delivery scoring behavior was preserved rather than extended into Story 1.6.
- Updated special-choice labels, disabled agreement when ingredients are missing, corrected campaign instructions to automatic orders and 3–5-second baking, and fixed the customer-label separator.
- Added campaign arrival/choice/penalty regressions and a mobile test covering three automatic customers, three reservations, preserved selection, no Accept/Decline and 48px ticket controls.

### Debug Log

- Confirmed the new campaign tests failed against the old Accept/Decline path before implementation (6 failures).
- `uv` is unavailable; resolved the workflow customization manually from its defaults. No team/personal overrides were present.
- Parallel E2E execution produced startup timeouts and delayed taps. Restarted verification with the Playwright CLI directly and one worker; npm on this host strips forwarded flag arguments.

### Completion Notes

- Completed the automatic-order contract. Current results supersede the historical Accept/Decline evidence in the Verification section above.
- Final build and TypeScript check passed; all 71 unit tests passed. Story 1.5 E2E cases passed on Chromium/WebKit at 360x640, 390x844 and 412x915 (20 passed, 4 intentional shortage-case skips). Campaign automatic-order touch flows passed on all six configurations.
- Inspected the three-customer screenshot at 360x640: readable customer/ticket controls, patience indicators, selected order and one shared oven.
- Stopped the broad Playwright run after the user clarified test cadence. No full-suite completion is claimed. The redundant focused rerun was also stopped because its cases had already passed.
- Recorded the user-confirmed cadence in project-context.md: focused tests during stories/small UI edits; full multi-browser/multi-viewport Playwright only at Epic 1 completion or before release.

## File List

- `src/domain/CozyOrder.ts`
- `src/domain/CozyOrder.test.ts`
- `src/config/ordinaryCustomers.ts`
- `src/runtime/CozyRuntime.ts`
- `src/runtime/CozyTickets.test.ts`
- `src/runtime/CozyShop.test.ts`
- `src/scenes/CozyScene.ts`
- `src/scenes/BootScene.ts`
- `src/domain/demo.ts`
- `src/domain/demo.test.ts`
- `src/domain/AutomaticOrders.test.ts`
- `tests/story15.spec.ts`
- `tests/gameplay.spec.ts`
- `tests/shop.spec.ts`
- `_bmad-output/implementation-artifacts/1-5-offer-and-one-oven.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/project-context.md`

## Change Log

- 2026-10-01: Continued Story 1.5 under the automatic-order contract, completed campaign ordinary arrivals and special-choice presentation, and added unit/mobile regressions.



