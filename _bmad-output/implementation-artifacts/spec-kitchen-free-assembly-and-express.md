---
title: Bếp thao tác trực tiếp, bánh tự phối và đặt hỏa tốc
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

## Intent

**Đính chính luồng mua — yêu cầu mới cùng ngày 2026-10-04, chưa sửa code:** [Chợ mua chủ động, Kho và hỏa tốc bổ sung](requirement-market-stock-and-express-flow.md) thay cách hiểu bỏ mua thường trong bản triển khai này. Giữ tab Chợ mua trước ca/giữa các ngày; mua trừ tiền và nhập Kho, ca dùng tồn đó. Hỏa tốc chỉ là lựa chọn bổ sung khi thiếu trong ca. `status: done` và kết quả kiểm tra bên dưới ghi nhận bản triển khai trước đính chính, không chứng nhận yêu cầu khôi phục Chợ đã làm xong.

Yêu cầu mới của người dùng thay luật/cách trình bày bếp đã triển khai: pizza phải vẽ bằng code theo mọi lớp nguyên liệu; có đế thì được nướng dù sai món, giao mới chấm sai. Khách vào hiện order ngay, chọn khách khác để làm trước. Hai nút Đóng hộp/Giao bánh cố định; bỏ chữ trên thớt và khoanh vàng. Chữ trong ô cần rõ, nằm đúng ô; chạm có phản hồi. Thanh nướng bo tròn trắng→xanh→đỏ; vòng khách xanh, avatar nằm trong vòng.

Khách bình thường tối đa4 đơn; nâng chỗ chờ tối đa6. Lò0 chín6–8s/cháy>8, lò1 4–6s, lò2 2–4s; cùng50ms simulationtick. Avatar lấy150 hình từ năm sheets references, tên vui ổn định. Mặc cả chỉ sau làm xong/giao: đồng ý giảm giá thành khách quay lại; từ chối đánh giá thấp và không trở lại.

## Boundaries

Giữ bố cục ảnh bếp và menu/hub trừ đúng các luồng mới yêu cầu. Scene chỉ presentation/typedintent; runtime/stock sở hữu tiền/kho/lò/quan hệ. Không tự tạo dữ liệu kinh tế giả, không sửa pixel/sinh avatar. Sprite avatar crop bằng metadata Phaser, clip tròn. Save tương thích bản cũ: bổ sung upgrades/customer decisions/catalog identity ở checkpoint ngày, không mất tiền/tiến độ. Đơn đặt hỏa tốc lưu trong phiên, không trừ/lưu lặp.

**Luồng mua hiện hành đã được người dùng đính chính:** Chợ phải giữ mua thường trước ca/giữa các ngày, trừ tiền một lần và nhập Kho; hỏa tốc chỉ bổ sung khi thiếu trong ca, không thay Chợ. Phần code bỏ mua thường trước đây chưa được sửa trong lượt cập nhật tài liệu này. Yêu cầu mới không tự thay điều kiện mở ca/nhận đơn kho0. Giá/nâng cấp tạm tiếp tục dùng cấu hình rõ ràng (lò150/250 xu, hàng chờ200 xu, giá14 nguyên liệu mới trong kitchenEconomy.ts); không dùng giá minh họa ảnh. Bản đầu không tự mở thêm8 công thức bán; mở19 nguyên liệu cho phối sai/custom với món đang hỗ trợ3 loại.

## Code Map

- `src/domain/CozyStock.ts`, `src/domain/CozyOrder.ts`, `src/config/bakeTiming.ts`: catalog19, FEFO, tiêu hao đúng bánh đã phối, cửa sổ lò.
- `src/runtime/CozyRuntime.ts`: nhận4/6 đơn, order tự chọn, deadline, rush order, bargain sau nấu, nâng cấp/đầu ngày.
- `src/domain/CozyCheckpoint.ts`, `src/domain/DayAccounts.ts`: save bổ sung và dòng tiền/giá vốn hỏa tốc không trừ hai lần.
- `src/scenes/CozyScene.ts`, `src/presentation/CozyArt.ts`: vẽ pizza/topping, font ô, animation/chạm, ring/bar, express modal, nâng cấp và customer sprites.
- `src/presentation/CustomerPortraits.ts`, `src/config/customerCatalog.ts`, `src/scenes/StartupScene.ts`: preload/crop150avatar, identity/tên.

## Tasks & Acceptance

- [x] Catalog19/config giá có nguồn rõ; pizza chỉ cần đế để nướng, lượng tiêu hao bám từng nguyên liệu thật, không giữ/trừ recipe yêu cầu thay cho bánh sai.
- [x] Có thể thêm5–8 nguyên liệu rồi nướng; giao sai chấm sai, không trả full thưởng vì label recipe trùng. Tiêu hao/hao hụt/purchase mỗi lần đúng một lần, toggle không mất hàng.
- [x] Bản triển khai trước đính chính cho mở ca/nhận đơn kho0 và hỏa tốc: giá `ceil(giá chợ ×1.6)`, qty/xác nhận/tiền thiếu, 5s clock gameplay, ring tiến độ; nhận hàng một lần. Pause/ẩn tab dừng đồng hồ; không tự mua. **Không dùng dấu hoàn tất này làm bằng chứng khôi phục mua thường ở Chợ.**
- [ ] Yêu cầu sửa luồng mới: giữ Chợ mua chủ động trước ca/giữa ngày → nhập Kho → ca dùng tồn → cuối ngày → Chợ mua chuẩn bị ngày sau; giữ save, hỏa tốc bổ sung. Chỉ ghi tài liệu, chưa sửa code/kiểm chứng.
- [x] Runtime expose upgrades/timing/capacity; lò0/1/2 ranh giới6–8/4–6/2–4 và>maxcháy; nâng chỉ chuẩn bị, giá config, tiền/sở hữu đúng một lần. Save cũ default0/cap4.
- [x] Khách tự hiện thông tin theo đơn thật; chọn đổi thứ tự không đổi oven-owner. Avatar150 source/crop/name stable và save, ring xanh/clip, capacity4/6.
- [x] Mặc cả sau bánh hoàn thành: chưa trả tiền/terminal trước quyết định, accept giá giảm và cờ quay lại, reject giá gốc nhưng đánh giá thấp/không quay lại; double-tap/expiry/close không trả hai lần.
- [x] Pizza vẽ code cho mọi lớp thật; bỏ chữ thớt/yellow highlights, font fit trong ô; thanh nhiệt trắng/xanh/đỏ bo tròn; feedback tap riêng cả tutorial/reduced-motion.
- [x] Focused unit runtime/stock/checkpoint/account và mobile E2E: wrong5–8ingredients, rush5s/pause/doubletap/save, timing ba cấp, capacity, avatar/clipping, arrivalautoorder, selection/ovenowner, bargain cả hai nhánh. Build-nolog đạt; không fullrelease matrix.

## Verification

Build-nolog và63 unit test tập trung đạt. Sáu kiểm tra Chromium360×640/390×844 đạt: hỏa tốc5s/pause/bánh8 lớp sai; đổi khách/giữ oven-owner; tọa độ chạm/resize/modal chặn nền. Bản build cuối được kiểm tra lại hai luồng game trên360×640. Không chạy full browser matrix. Kỳ vọng timing/tutorial cũ được cập nhật theo yêu cầu mới.

## Review findings

Ba lượt review blind/edge/acceptance hoàn tất. Đã sửa mức giá vào quán của khách mặc cả, bỏ bánh đã đóng hộp ở cả campaign/freeplay, khách đến sau giao tự hiện đơn và feedback giao sai thật. Progress arcs dùng graphics động; pizza clip trong lò. Test xác nhận retry lưu nâng cấp không trừ tiền lặp và khoản chi vốn không trừ lợi nhuận.

## Suggested Review Order

- Nối ca, hỏa tốc và chủ bánh trong lò.
  [CozyRuntime.ts:314](../../src/runtime/CozyRuntime.ts#L314)

- Tiêu hao lô theo nguyên liệu thật, nhận hàng một lần.
  [CozyStock.ts:70](../../src/domain/CozyStock.ts#L70)

- Lưu tiền và cấp cùng giao dịch, retry cùng payload.
  [CozyCampaignSession.ts:62](../../src/runtime/CozyCampaignSession.ts#L62)

- Xác thực save cũ/mới và khoản nâng cấp chờ ca sau.
  [CozyCheckpoint.ts:38](../../src/domain/CozyCheckpoint.ts#L38)

- Vẽ bánh, clip avatar/lò, giữ tọa độ vùng chạm.
  [CozyScene.ts:177](../../src/scenes/CozyScene.ts#L177)

- Giá mới tạm được tách khỏi ảnh tham khảo.
  [kitchenEconomy.ts:1](../../src/config/kitchenEconomy.ts#L1)

- Kiểm chứng sai món, hỏa tốc, quay lại và lưu ngày.
  [CozyKitchenV2.test.ts:8](../../src/runtime/CozyKitchenV2.test.ts#L8)
