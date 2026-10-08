---
title: 'Nền ảnh chung cho năm màn quản lý'
type: feature
created: '2026-10-08'
status: done
baseline_commit: 54ff6fc1c63f6e5bde614648a98e835154714298
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tổng kết, Chợ, Kho, Quán và Nhiệm vụ đang dùng nền gỗ vẽ bằng code. Người dùng yêu cầu thay bằng đúng ảnh đính kèm: nền dọc có mái sọc đỏ kem, đèn, cây, tường gạch và mặt gỗ trống.

**Approach:** Lưu ảnh nguồn trong dự án, đăng ký trong pipeline tải asset của scene boot hiện có, rồi dùng một component nền chung đứng sau toàn bộ UI quản lý. Component tồn tại qua render, đổi tab và cuộn danh sách; chỉ đổi trạng thái hiển thị khi chuyển giữa hub và bếp.

## Boundaries & Constraints

**Always:** Theo yêu cầu tiếp theo đã xác nhận, bảng tiêu đề đặt dưới mái che, Pause/tiền dưới đèn trái/phải, nav ngang vừa tường gỗ; chỉ cụm thẻ nội dung/footer fit trong tường bằng transform đồng nhất; giữ bố cục tương đối, nội dung chữ, số thẻ/tab/footer và chức năng. Vùng bấm, cuộn, focus tutorial và vị trí feedback tiền theo đúng transform. Bếp, modal và ảnh nền giữ nguyên. Nền dùng chế độ cover: scale đồng nhất theo max(width/sourceWidth, height/sourceHeight), căn giữa, phủ kín viewport, chỉ cắt phần dư. Đặt nền ngoài container nội dung bị removeAll(true) khi redraw và ngoài vùng cuộn/mask. Mỗi CozyScene có tối đa một đối tượng nền quản lý, dùng cùng một texture. Dọn listener và object khi shutdown/destroy, không tăng object qua tab, cuộn hoặc mở modal.

**Ask First:** Khi không thể lấy đúng ảnh nguồn đã gửi, yêu cầu file hoặc đường dẫn từ người dùng; không tạo ảnh thay thế hoặc lấy một reference khác. Những thay đổi ngoài nền chung cần yêu cầu riêng.

**Never:** Dùng ảnh này cho màn bán pizza, menu chính hoặc chiến dịch legacy. Kéo méo ảnh, vẽ nền gỗ code đè ảnh, thêm filter làm đổi màu ảnh nguồn, thay đổi gameplay/save, hoặc tạo ảnh nền mới mỗi render.

</frozen-after-approval>

## Code Map

- `src/scenes/StartupScene.ts` — entry gate thực, tải manifest trước khi mở menu/game, có fail/retry asset.
- `src/scenes/CozyScene.ts` — preload fallback cho các fixture/direct scene; draw() dọn layer và vẽ bếp, renderSummary() dọn layer rồi vẽ một trong năm tab quản lý.
- `src/presentation/HubHeader.ts` — paintHubWood() và drawHubShell() hiện tạo nền Tổng kết; header/navigation crop riêng không đổi.
- `src/presentation/HubCanvasUI.ts` — background() hiện gọi paintHubWood(); bốn renderer Chợ/Kho/Quán/Nhiệm vụ gọi nó trước UI.
- `src/presentation/UiRaster.ts` — strengthenIllustrations() tăng tương phản một số art; bảo đảm nền mới giữ đúng màu nguồn.
- `tests/bold-ui-menu.spec.ts` — fixture hub ở 360×640, thao tác tab/menu và ca thật.
- `playwright.config.ts` — chỉ chạy project chromium-360x640 cho phạm vi này.

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/HubWallLayout.ts`, `src/scenes/CozyScene.ts`, `src/presentation/HubListWindow.ts` — tách shell: tiêu đề x80/y25/200×50; Pause x44/y48; tiền x290/y48; nav x22/y80/316×49. Cụm thẻ/footer fit trong tường với transform scale0.88, offset21.6/21.6 tại360×640, dùng transform đồng nhất; chuyển vùng bấm/focus/feedback và input cuộn theo cùng transform, giữ popup/bếp nguyên kích thước.
- [x] `tests/management-background.spec.ts` — xác minh tất cả khung hub nằm trong tường, bấm tab/footer/mua hàng đúng chỗ, cuộn wheel và kéo, modal giữ bounds riêng và bếp giữ nguyên.
- [x] `_bmad-output/project-context.md`, `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md` — cập nhật ảnh căn UI theo steering người dùng đã xác nhận.
- [x] `public/assets/management-background.png` — lưu đúng file ảnh người dùng, kiểm tra kích thước và nội dung, giữ tỷ lệ và chất lượng.
- [x] `src/presentation/ManagementBackground.ts` — khai báo asset manifest và component retained Image với cover, scrollFactor(0), show/hide, cleanup và resize nếu canvas logic đổi.
- [x] `src/scenes/StartupScene.ts` — thêm asset vào manifest Cozy hiện có, sử dụng BASE_URL, giữ fail/retry và không tải thêm cho legacy.
- [x] `src/scenes/CozyScene.ts` — preload fallback có textures.exists guard; tạo component một lần ngoài layer redraw, hiện tại hub, ẩn tại bếp, dọn khi scene kết thúc. Nền thấp hơn các UI/modal/tutorial và không nhận input.
- [x] `src/presentation/HubHeader.ts`, `src/presentation/HubCanvasUI.ts` và bốn renderer reference — bỏ nền gỗ code khỏi shell và canvas quản lý, giữ nền canvas trong suốt; header và navigation vẽ riêng theo vị trí mới, nội dung giữ bố cục tương đối trong body.
- [x] `tests/management-background.spec.ts` — kiểm tra tập trung bằng fixture và entry boot thực; chụp năm tab ở 360×640, kiểm tra instance/texture/scale và scroll, mở ca xác nhận nền ẩn.
- [x] `_bmad-output/project-context.md`, `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md` — ghi đúng thay đổi nền do người dùng yêu cầu và ảnh kiểm chứng; không tự đánh dấu ảnh triển khai đã được duyệt.

**Acceptance Criteria:**
- Given entry bình thường, when boot hoàn tất, then texture nền được tải từ asset cục bộ qua loader hiện có; lỗi tải dùng fail/retry boot hiện có.
- Given hub tại 360×640, when chọn lần lượt năm tab, then đúng ảnh phủ kín màn dưới toàn bộ UI, tỷ lệ ảnh nguyên vẹn, geometry controls theo bố trí header/nav mới và transform body.
- Given danh sách có thể cuộn, when cuộn hoặc chỉnh số lượng gây render lại, then nội dung thay đổi nhưng nền giữ vị trí/scale/object identity và chỉ một nền tồn tại.
- Given hub, when mở Pause/thông báo/tutorial, then UI phủ phía trên nền với input/lease đúng như trước.
- Given hub, when mở ca bán pizza, then nền quản lý ẩn và nền bếp đã duyệt vẫn hiển thị; quay lại hub dùng lại object nền.
- Given scene shutdown/restart, when kiểm tra display list/listener, then không giữ object cũ hoặc tạo bản sao ngoài vòng đời scene.

## Spec Change Log

- 2026-10-08: Người dùng yêu cầu “căn các khung ui vào bên trong mãng tường”; cho phép thay vị trí/tỷ lệ toàn bộ hub theo mảng gỗ, thay giới hạn geometry hub trước đó. KEEP: đúng source ảnh, một nền retained, cover không méo, không đổi bếp/gameplay hoặc nội dung/cấu trúc hub. Hitbox, scroll, focus và feedback phải theo geometry mới; popup giữ kích thước hiện hành.

## Verification

- `npm run build-nolog` — TypeScript và Vite build thành công.
- `npx.cmd playwright test tests/management-background.spec.ts --project=chromium-360x640` — tất cả kiểm tra tập trung đạt.
- Quan sát screenshots năm tab và tab sau cuộn tại 360×640: không có dải nền trống, ảnh không méo, header/nav nằm đúng vị trí người dùng yêu cầu, body fit trong tường, chữ/nút giữ nội dung. Không chạy full đa browser/viewport.

## Implementation evidence

Đúng ảnh nguồn trong references đã được chép byte-for-byte sang public/assets/management-background.png. Build đạt; 10 unit và 3 E2E tập trung Chromium360×640 đạt (2 nền/UI và 1 tutorial). Ba review độc lập không có lỗi code. Ảnh năm tab, cuộn, Pause, bếp và cuối ngày đã xem và lưu trong ui-baseline/management-shell-fit-2026-10-08. Không thay gameplay; geometry hub được căn lại theo xác nhận tiếp theo của người dùng.

## Suggested Review Order

- Component retained dùng một Image với cover và cleanup.
  [ManagementBackground.ts:19](../../src/presentation/ManagementBackground.ts#L19)
- Asset tải qua entry gate, lỗi dùng retry hiện có.
  [StartupScene.ts:65](../../src/scenes/StartupScene.ts#L65)
- Nền hiện tại hub, ẩn khi vẽ bếp.
  [CozyScene.ts:435](../../src/scenes/CozyScene.ts#L435)
- Shell riêng căn tiêu đề dưới mái che, Pause/tiền dưới đèn, nav vừa tường.
  [HubHeader.ts:41](../../src/presentation/HubHeader.ts#L41)
- Kiểm tra retained instance, scroll, bếp và boot retry.
  [management-background.spec.ts:34](../../tests/management-background.spec.ts#L34)
