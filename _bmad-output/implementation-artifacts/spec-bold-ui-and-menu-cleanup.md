---
title: 'Đồng bộ giao diện đậm, rõ và bảng món đúng nội dung'
type: feature
created: 2026-10-07
status: done
baseline_commit: 5b1babe
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval>

## Intent

Triển khai toàn bộ note giao diện vừa được người dùng giao làm: ba ô món đầu không bị thay bởi tên khách/bánh bỏ; mọi sốt mở mua; nút Quay lại đồng bộ theo ảnh; toàn bộ màn/panel dùng màu đậm, chữ rõ; Menu & Giá bán sát ảnh tham chiếu trong dự án.

## Boundaries & Constraints

Always: giữ geometry màn chơi, sáu ô khách, tám ô món, hai lò, hai mươi nguyên liệu, vị trí nút và các tab hiện có. Tăng độ đậm, tương phản và độ nét trên toàn bộ UI (menu, bếp, hub, settings, modal), không chỉ đổi token của một màn. Nút phụ Quay lại/Về Quán dùng nền nâu đen, viền vàng/kem nhiều lớp và chữ kem như ảnh; giữ các nút chính xanh và chức năng. Tất cả năm sốt luôn mở quyền mua, kể cả BBQ/cà chua, không phụ thuộc công thức/menu/restore; giá, tồn kho, không hết hạn và giá vốn giữ nguyên.

Menu & Giá bán được phép chỉnh riêng nội dung thẻ theo ảnh `public/assets/references/Menu và giá bán pizza-1.png`: hình pizza, tên, vốn, cụm −/giá/+, bật bán, lãi dự kiến. Giữ shell hub/tab/footer và ba thẻ mỗi trang với phân trang hiện có, giá/quyền sở hữu/transaction thật. Không dùng số tiền/món mở giả từ ảnh. Chuẩn bị thay giá/toggle qua đường lưu existing campaign session, read-only vẫn disable.

Never: xóa khả năng bỏ bánh hết hạn, đổi luật nướng/giao/khóa bàn, thời gian khách/nhân viên, schema save, tự push, reflow các màn khác hoặc dùng một overlay màu để che nội dung. Note chỉ áp dụng hai mục vừa ghi, không bao gồm dọn tests legacy cũ.

## I/O & Edge-Case Matrix

| State | Action | Expected |
|---|---|---|
| Khách hết hạn có bánh | Xem bảng món | Vẫn tám pizza đúng tên/hình; bỏ bánh được qua thùng rác/vùng bánh hiện có |
| Bánh bỏ thuộc khách khác đang chọn | Bấm bỏ | Chọn đúng bánh cần bỏ, xác nhận thật; không bỏ nhầm bánh sống khác |
| Công thức BBQ chưa sở hữu | Mua sốt BBQ lẻ/bulk/express | Quyền mở; vẫn kiểm tra tiền/ngày/tồn/phase |
| Menu chuẩn bị có món sở hữu | −/+/bật bán | Giá và menu thật cập nhật qua transaction hiện có |
| Món chưa sở hữu/read-only | Chỉnh | Không vượt quyền; mua công thức vẫn dùng quy trình hiện hành |
| Đổi tab/redraw/scale | Quan sát | Chữ nét, đủ dấu, không clip; nút Quay lại thống nhất; cleanup giữ nguyên |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts`: recipes overlays abandoned pizza in first three cells; shared text/buttons, price panel/callbacks.
- `src/runtime/CozyRuntime.ts`: ingredientAccess shared purchase eligibility.
- `src/presentation/ReferenceShop.ts`: three menu cards/page; reference asset and live inputs.
- `src/presentation/HubCanvasUI.ts`, `HubTheme.ts`, `theme.ts`, `HubHeader.ts`: hub canvas text/paint and common tokens.
- `src/presentation/ReferenceSummary.ts`, `ReferenceSettingsArt.ts`, `ModalText.ts`, `NotificationFrame.ts`: other raster/text pathways needing actual sharpness.
- `src/scenes/MainMenuScene.ts`, `src/main.ts`, `src/style.css`: menu art/text and display rendering.

## Tasks & Acceptance

- [x] `CozyScene.ts`: remove recipe-cell hijack, retain expired disposal through existing workbench/trash and test it.
- [x] `CozyRuntime.ts` and focused tests: unlock all sauces consistently for single, bulk, express and save restore.
- [x] Shared theme/render files and scenes: stronger palette/art contrast, high-resolution text/canvas at stable logical dimensions; no per-frame raster rebuilds or texture leaks.
- [x] `HubCanvasUI.ts`, secondary modal and hub actions: shared reference-style rounded dark/gold button, labels fit.
- [x] `ReferenceShop.ts`, scene callbacks: reference-like cards with live price stepper/selling toggle/cost/profit, owned/read-only guards and existing saves.
- [x] Focused unit/browser tests, build, three independent reviews; screenshots of menu/shop/market/stock/missions/summary/kitchen/settings and updated docs.

Given expired pizzas, when drawing recipes, then all eight cells retain catalog content and disposal stays possible. Given any sauce, when calculating access on fresh/restored/menu-changed state, then it remains unlocked. Given preparing or read-only menus, when interacting with card controls, then permitted edits use real runtime/session and rejected edits change nothing. Given UI at 360×640, when traversing screens, then all display pathways render clear high-contrast text and dark/gold secondary buttons without moving existing shell controls.

## Design Notes

The reported names are customer names on deliberate abandoned-pizza overlays, not corrupted catalog/save. Disposal must be moved off recipe cells without losing recovery of historical multiple abandoned pizzas. Prefer a shared raster/text scale capped for memory and explicit display size, so browser CSS does not stretch low-resolution glyphs. Keep antialiasing for illustrations. Reference raster art needs a measured contrast adjustment or palette-aware paint, not only unused theme constants; avoid blanket CSS filter that harms DOM inputs or semantic colors.

## Spec Change Log

2026-10-07: User asked to implement all recent notes together. Full menu reference located locally; retain hub geometry rather than squeezing eight rows into existing three-card viewport.

2026-10-07 review: edge-case review found Phaser Text crop offsets are source pixels even when draw dimensions use resolution. Fixed modal scroll position to compensate in the same units; kept 2× glyphs, viewport geometry and scroll behavior. Added a browser pixel-bounds regression for the actual explanation-text pathway. Blind and acceptance reviews found no other concrete defects.

## Verification

Focused sauce access and menu/workbench behavior units; focused Chromium 360×640 UI captures and interaction tests, production build. No full multi-browser/viewport matrix. Inspect captures for text clipping, contrast and reference conformity; record limitations truthfully.

Results: 52 focused unit tests passed in five files; five focused Chromium 360×640 cases passed, covering all hubs, real menu controls, settings, main menu, expired disposal, closed-day finance and generic explanation scrolling. Screenshots inspected at the real mobile layout viewport; captures live in `ui-baseline/bold-ui-2026-10-07/`. Build passed with the existing Phaser bundle-size warning. Three independent reviews completed; the modal-scroll patch was verified by rendered pixel bounds. High-resolution glyphs/textures use 2× internally; the game's logical canvas remains 360×640, not a new layout.

## Suggested Review Order

- Keep sharper raster layers at the existing logical dimensions.
  [UiRaster.ts:4](../../src/presentation/UiRaster.ts#L4)
- Draw reference-style cards with real price and menu controls.
  [ReferenceShop.ts:65](../../src/presentation/ReferenceShop.ts#L65)
- Save preparation menu changes through the campaign transaction.
  [CozyCampaignSession.ts:82](../../src/runtime/CozyCampaignSession.ts#L82)
- Open all sauces while retaining other ingredient purchase guards.
  [CozyRuntime.ts:461](../../src/runtime/CozyRuntime.ts#L461)
- Recover expired pizzas through workbench disposal, preserving catalog cells.
  [CozyRuntime.ts:717](../../src/runtime/CozyRuntime.ts#L717)
- Compensate Phaser's source-pixel crop offsets when scrolling sharp text.
  [ModalText.ts:15](../../src/presentation/ModalText.ts#L15)
- Verify actual controls and rendered viewport bounds in the browser.
  [bold-ui-menu.spec.ts:28](../../tests/bold-ui-menu.spec.ts#L28)
