---
title: 'Tutorial tương tác cho chiến dịch mới'
type: feature
created: '2026-10-07'
status: done
baseline_commit: b6c932e
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user explicitly requests implementation and supplies tutorial content">

## Intent

Mở rộng tutorial/runtime hiện có thành hướng dẫn nhận biết đơn, làm pizza tập và quản lý trước ngày1. Dùng layout thật thay vì dựng màn chơi khác theo ảnh tham khảo. Chỉ tự bắt đầu với game mới; Tiếp tục khôi phục bước đã lưu nếu tutorial đang dở, không khởi động lại từ đầu hoặc tự chạy trên save cũ.

## Boundaries & Constraints

Lớp đen0.7 khoét focus, viền vàng, lời Việt ngắn đặt cạnh và không che thao tác; tiến độ và Bỏ qua hướng dẫn luôn có. Focus lấy bounds UI hiện tại trong canvas360×640, theo scale và offset cuộn. Chặn input/keyboard/scroll ngoài focus và tutorial controls; thao tác thực hành chỉ qua bước khi runtime nhận thành công. Không tự mua, đổi giá, thưởng hoặc tạo báo cáo giả trong giới thiệu quản lý.

12 bước đầu: khách, thông tin đơn, hình pizza mẫu (Tiếp tục); đế, tương cà, phô mai, đưa lò; chờ chín vàng; lấy bánh chín thành công; đóng hộp; giao bánh; số xu (Tiếp tục). Đơn tập phô mai đủ nguyên liệu riêng, không khách mới/kiên nhẫn/cháy, chỉ lò chạy ở bước chờ; tiền/kho/XP/đánh giá/báo cáo thật giữ nguyên.

Quản lý hiển thị Chuẩn bị ngày1, tự chọn tab/đưa vùng cần nói vào viewport. Tổng kết giới thiệu doanh thu/chi phí/lợi nhuận/đánh giá với trạng thái chưa có dữ liệu; Chợ giới thiệu nguyên liệu/giá/lượng/dự báo/mua tất cả; Kho giới thiệu tồn/khả dụng/hạn; Quán giới thiệu đúng6 mục source; Nhiệm vụ giải thích yêu cầu/tiến độ/thưởng tự nhận; cuối focus Mở quán. Nếu thiếu nguyên liệu, sau Tiếp tục cuối chuyển Chợ để người chơi mua thật rồi mở ngày1, không tự mua hoặc mở ca.

Lưu tiến độ/trạng thái hoàn tất qua checkpoint hiện có, retry một commit không ghi lặp. Bỏ qua dọn đơn tập/overlay và chỉ trả pause tutorial đang sở hữu, đưa về chuẩn bị ngày1. Quản lý dùng lease tutorial riêng; không trả lease menu/visibility/orientation/save của chủ khác. Save cũ giữ dữ liệu, không thay luật tiền/kho/chiến dịch, không dependency/âm thanh mới.

## I/O & Edge-Case Matrix

| Trạng thái | Thao tác | Kết quả |
|---|---|---|
| Game mới | Mở hướng dẫn | Bước khách, tiền thật300xu |
| Bước tương cà | Chạm nguyên liệu khác | Không thay bước/đơn tập |
| Chờ chín | Thời gian trôi | Dừng ở chín, không cháy |
| Save dở | Tiếp tục | Đúng bước đã lưu và đơn tập tương ứng |
| Save cũ/hoàn tất | Tiếp tục | Không tự tutorial |
| Có pause khác | Bỏ qua/tiếp tục | Không trả pause của chủ khác |
| Lưu lỗi | Retry | Cùng payload/commit, chặn thực hành đến khi xong |
| Bước quản lý cuối thiếu đồ | Tiếp tục | Chợ thật, mua tự nguyện; ngày1 chưa chạy |

</frozen-after-approval>

## Code Map

- `src/config/interactiveTutorial.ts`: 34 bước, nội dung và phase chung.
- `src/runtime/CozyRuntime.ts`: mở rộng tutorial hiện có, đơn tập, next/skip, lease.
- `src/domain/CozyCheckpoint.ts`: tiến độ optional, validate/normalize, save cũ.
- `src/runtime/CozyCampaignSession.ts`: khởi tạo/lưu bước/retry cùng pipeline.
- `src/scenes/CozyScene.ts`: route quản lý, resolve bounds thật, input allowlist, render focus.
- `src/presentation/TutorialSpotlight.ts`: overlay/hole/border/card layout.
- `src/runtime/CozyTutorial.test.ts`, test mới liên quan: thực hành và persistence.
- `tests/tutorial.spec.ts`: 360×640 focus/input/skip/continue/no real economy.

## Tasks & Acceptance

- [x] Runtime/tutorial progression/checkpoint/session giữ mô phỏng thật độc lập.
- [x] Spotlight, card, focus và chặn input theo bounds thật; quản lý đủ nội dung.
- [x] Unit kiểm tra sai thao tác/đơn tập/save/retry/lease; Chromium360×640 tập trung.
- [x] Typecheck/build, review và cập nhật context/UI baseline phần được yêu cầu.

Given game mới, when làm đúng12 bước và giới thiệu quản lý, then tiến độ đi theo runtime và ngày1 chưa có đơn/doanh thu giả. Given focus bị scale/cuộn, when render/tap, then vùng sáng và vùng nhận input trùng UI thật. Given skip tại intro/chờ/quản lý, then đơn tập dọn và về chuẩn bị, pause của chủ khác giữ nguyên. Given hướng dẫn đã hoàn tất/save cũ, when Tiếp tục, then không tự hướng dẫn lại.

## Design Notes

Reuse9 bước thực hành cũ và thêm tiến độ tương tác; không tạo scene hoặc tutorial thứ hai. 34 IDs: customer, order, sample, dough, sauce, cheese, bake, warming, extract, box, deliver, complete; summary-sales, summary-costs, summary-profit, summary-reviews; market-ingredients, market-prices, market-quantity, market-forecast, market-basket; stock-owned, stock-usable, stock-expiry; shop-menu, shop-decoration, shop-equipment, shop-amenities, shop-expansion, shop-staff; missions-goal, missions-progress, missions-reward; ready. Quán lấy tên/chức năng thật: Menu & giá bán, Trang trí, Thiết bị, Tiện nghi, Mở rộng quán, Nhân viên.

## Verification

- `npm run build-nolog`: typecheck và build đạt; cảnh báo kích thước chunk Phaser hiện có.
- `npx vitest run src/runtime/CozyInteractiveTutorial.test.ts src/runtime/CozyTutorial.test.ts src/runtime/CozyCampaignSession.test.ts src/domain/CozyCheckpoint.test.ts`: 36 test đạt.
- `npx playwright test tests/tutorial.spec.ts --project=chromium-360x640 --workers=1`: 3 test đạt. Đi hết 34 focus không chồng card, chặn thao tác sai/ngoài focus, lò dừng chín, lưu và khôi phục đúng bước, scale 320×568, bỏ qua và giữ pause khác, mua giỏ thật rồi mở ngày 1.
- Kiểm tra trực quan ảnh 360×640 đế bánh, Chợ và Menu & giá bán; lưu trong mốc UI. Không chạy toàn bộ E2E.
- `git diff --check`: đạt.

## Review

Ba review độc lập: blind, edge-case và acceptance. Đã sửa trạng thái chuẩn bị khi khôi phục completed/skipped, xóa tiến độ tutorial cũ khi reset standalone, và guard reports hỏng trước khi đọc length. Có test chống tái phát. Giữ chặn Pause/Mute ngoài focus theo yêu cầu input của người dùng; lớp pause của chủ khác vẫn ưu tiên khi đang hoạt động. Không còn phát hiện chưa xử lý thuộc phạm vi.

## Suggested Review Order

- Mở rộng máy trạng thái thực hành, quản lý và cleanup lease.
  [CozyRuntime.ts:844](../../src/runtime/CozyRuntime.ts#L844)

- Lưu bước qua commit hiện có; retry giữ payload và runtime.
  [CozyCampaignSession.ts:73](../../src/runtime/CozyCampaignSession.ts#L73)

- Tiến độ optional giữ save cũ và chặn trạng thái không hợp lệ.
  [CozyCheckpoint.ts:112](../../src/domain/CozyCheckpoint.ts#L112)

- Spotlight nhận focus thật, giới thiệu tự chuyển tab, kết thúc sang Chợ.
  [CozyScene.ts:1201](../../src/scenes/CozyScene.ts#L1201)

- Khoét overlay 0.7, viền vàng và đặt card cạnh focus.
  [TutorialSpotlight.ts:15](../../src/presentation/TutorialSpotlight.ts#L15)

- 34 bước tiếng Việt dùng chung tên và phase.
  [interactiveTutorial.ts:1](../../src/config/interactiveTutorial.ts#L1)

- Kiểm chứng cô lập kinh tế, replay, reset và sở hữu pause.
  [CozyInteractiveTutorial.test.ts:7](../../src/runtime/CozyInteractiveTutorial.test.ts#L7)

- Đi toàn bộ hướng dẫn và mở ngày thật tại 360×640.
  [tutorial.spec.ts:17](../../tests/tutorial.spec.ts#L17)
