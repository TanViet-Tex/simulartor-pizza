---
title: 'Cuộn mượt danh sách Chợ và Kho'
type: bugfix
created: '2026-10-06'
status: done
baseline_commit: 'abea9791dc2d8de26cd05eb20dfe93a9b9ebe4b7'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người chơi thấy danh sách Chợ/Kho giật khi kéo hoặc cuộn xuống. Hiện mỗi thay đổi offset đánh dấu toàn scene dirty, hủy lớp hiển thị rồi vẽ lại toàn hub và tạo canvas texture mới, bao gồm header/footer không thay đổi.

**Approach:** Giữ danh sách và input tồn tại trong một phiên tab; cuộn chỉ dịch cửa sổ nhìn, cập nhật thanh cuộn và vùng chạm theo offset. Chỉ dựng lại khi dữ liệu, bộ lọc, modal hoặc tab thực sự đổi. Phân biệt kéo danh sách với chạm mua/xem chi tiết.

## Boundaries & Constraints

**Always:** Giữ hình, màu, header/năm tab, kích thước viewport, hàng nguyên liệu, nút và footer theo UI đã duyệt. Giữ dữ liệu thật 19 nguyên liệu, giới hạn số lượng, giá, tồn, FEFO, modal và pause leases. Cuộn không thay tiền/kho/save. Cleanup listener/texture khi rời tab, shutdown hoặc destroy. Hoạt động với wheel và chạm kéo.

**Ask First:** Chỉ khi giải pháp cần thay bố cục/hình ảnh đã duyệt hoặc thay nghiệp vụ mua/lưu.

**Never:** Không giảm chất lượng ảnh, đổi theme, thêm dependency hoặc chuyển gameplay sang DOM. Không chạy full browser/viewport matrix. Không mở lại epic đã done chỉ vì sửa scroll.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Kéo danh sách | Pointer xuống trong viewport rồi di chuyển | Offset liên tục theo khoảng kéo; không kích hoạt thao tác hàng khi vượt ngưỡng kéo | Clamp đầu/cuối |
| Wheel dồn | Nhiều wheel event trước frame tiếp | Cộng delta trên offset mới nhất, không lấy offset cũ trong closure | Clamp, bỏ delta nếu đang modal |
| Tap hàng | Chạm rồi nhả không vượt ngưỡng | Đúng lượng/mua/xem lô theo hàng đang hiển thị | Giữ enabled nghiệp vụ |
| Hàng một phần | Hàng cắt ở mép viewport | Hiển thị phần nằm trong khung; vùng chạm không tràn header/footer | Giữ ưu tiên vùng nút nhìn thấy |
| Modal/Pause | Đang mua, xem lô, nhập số hoặc pause | Không cuộn nền, không leak hành động sau đóng modal | Kết thúc gesture cũ |
| Bộ lọc ngắn | Dữ liệu vừa viewport hoặc rỗng | Offset hợp lệ, không thumb/drag giả | Offset clamp về 0 |
| Rời tab | Kéo rồi đổi tab hoặc shutdown | Listener/texture được thu hồi; không kéo tab khác | Reset gesture |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts:709` và `:718`: scroll callbacks đang đặt dirty; scene draw phá layer và tạo lại hub.
- `src/presentation/ReferenceMarket.ts`: raster toàn hub mỗi lần draw; wheel đóng trên offset cũ; hành động mua đang dùng pointerdown qua scene hit.
- `src/presentation/ReferenceStock.ts`: raster toàn hub mỗi lần draw, pointerup detail và drag threshold dùng startY.
- `src/scenes/CozyScene.ts:247`: hitZones được tái sử dụng nhưng controls/visibleActions/tapRects được dựng lại; cần cập nhật đồng bộ khi scroll.
- `src/presentation/HubCanvasUI.ts`: painter hiện hành dùng để giữ hình thức hàng.
- `tests/reference-market.spec.ts`: fixture game thật và regression mua/lọc/scroll/modal.

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/HubListScroll.ts` — thêm controller dùng chung cho offset mới nhất, clamp, gesture threshold, batching theo frame và cleanup.
- [x] `src/presentation/ReferenceMarket.ts`, `ReferenceStock.ts` — raster nội dung danh sách một lần khi dựng tab/dữ liệu; dùng cửa sổ texture/clip hiện hành để dịch offset, giữ static hub và cập nhật thumb. Không tạo texture mới cho từng chuyển động.
- [x] `src/scenes/CozyScene.ts` — lưu offset nhưng không dirty do scroll; đồng bộ controls/hit zones/visible actions và datasets mà không chồng bản ghi. Deferred tap trong hai viewport phải giữ đúng action/enable sau scroll; khi modal đổi vẫn dùng full redraw để giữ input/pause guard.
- [x] `src/presentation/HubListScroll.test.ts` — kiểm tra wheel dồn, clamp, ngưỡng kéo, pause và kết thúc gesture.
- [x] `tests/reference-market.spec.ts` — thêm kiểm tra Chợ/Kho kéo liên tục, không mua/mở lô ngoài ý muốn, không recreate list texture, click đúng hàng sau scroll, modal chặn nền, cleanup khi chuyển tab.

**Acceptance Criteria:**
- Given tab không đổi dữ liệu, when cuộn qua nhiều frame, then texture/image danh sách và vùng input vẫn giữ identity, số texture/listener không tăng.
- Given cùng fixture và cùng chuỗi kéo, when so trước/sau, then giảm dựng lại hub và không phát sinh page error; báo số đo local, không tuyên bố chứng nhận máy thật.
- Given danh sách ở đầu/cuối, when chụp viewport, then giữ hình và kích thước đã duyệt, không lộ nội dung ngoài khung.
- Given mua/xem lô sau scroll, when xác nhận, then đúng ID và tiền/tồn thay đúng luật hiện có một lần.

## Spec Change Log

## Design Notes

Ưu tiên dịch cửa sổ nhìn trên nội dung raster sẵn hơn là vẽ canvas rồi upload texture mỗi pointermove. Nội dung thay đổi vẫn dựng lại theo luồng scene hiện có. Không thêm quán tính trong đợt này: trước hết sửa chi phí redraw và thao tác kéo/tap. Kiểm tra texture crop thực tế bằng browser vì biên clip WebGL phải giữ ảnh hàng hiện tại.

## Verification

- `npm run build-nolog` — TypeScript và build đạt.
- `node node_modules/vitest/vitest.mjs run src/presentation/HubListScroll.test.ts` — controller edge cases đạt.
- `node node_modules/@playwright/test/cli.js test tests/reference-market.spec.ts --project=chromium-360x640` — kiểm tra tập trung, mua/scroll/modal đạt.
- Lưu số đo redraw/texture identity và ảnh viewport riêng, không ghi đè UI baseline.

## Verified Result

Build,4unit và9E2E tập trung đạt. Ba review độc lập hoàn tất; lỗi phân loại nút modal nhập số đã sửa và kiểm tra bằng tap. Cùng chuỗi kéo24bước, hai tab từ24texture rebuild và hàng nghìn object mới về0; xem [báo cáo](hub-scroll-performance-report.md). Không chứng nhận FPS trên điện thoại thật.

## Suggested Review Order

- Giữ ảnh danh sách, chỉ đổi crop và offset.
  [HubListWindow.ts:8](../../src/presentation/HubListWindow.ts#L8)
- Batch wheel và phân biệt tap/kéo.
  [HubListScroll.ts:2](../../src/presentation/HubListScroll.ts#L2)
- Đồng bộ vùng bấm và giữ nút modal độc lập.
  [CozyScene.ts:248](../../src/scenes/CozyScene.ts#L248)
- Kiểm tra identity, thao tác sau cuộn và cleanup.
  [reference-market.spec.ts:242](../../tests/reference-market.spec.ts#L242)

