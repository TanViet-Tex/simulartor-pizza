---
title: 'Popup nhập mã theo bàn phím mobile và thông báo thưởng'
type: feature
created: '2026-10-06'
status: done
baseline_commit: '124dbc0a5ba275dbba0ff39cca20fd0026e572c4'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bàn phím iPhone làm ô input DOM lệch khỏi popup canvas. Sau nhận mã thành công chưa có thông báo thưởng riêng theo ảnh người dùng cung cấp.

**Approach:** Dùng vùng nhìn thấy thực tế của visualViewport để di chuyển toàn bộ popup nhập mã bằng một offset chung. Khi giao dịch nhận mã lưu thành công, thay nội dung nhập bằng popup thưởng theo `public/assets/references/thông báo nhận tiền.png`, với số xu thật.

## Boundaries & Constraints

**Always:** Khung, tiêu đề, mô tả, input, hai nút và vùng chạm cùng di chuyển. Theo dõi resize/scroll visualViewport và resize cửa sổ; có fallback khi không hỗ trợ. Blur hoặc đóng bàn phím trả về tâm cũ; xóa listener/input khi đóng hoặc đổi scene. Menu và Pause cùng dùng một implementation. Thành công chỉ sau commit; giữ pause lease đến khi đóng thông báo. Người dùng xác nhận giữ thưởng VIETVUIVE 100.000 xu và hiển thị `+100.000 xu`, không lấy 500 từ ảnh mẫu.

**Ask First:** Đổi luật nhận mã, số thưởng, ranh giới lưu hoặc thiết kế phần ngoài popup nhập mã/thưởng.

**Never:** Refactor gameplay/save; đổi âm thanh, vị trí các điều khiển Settings khác; cộng thưởng khi render popup hoặc bấm OK/Đóng; bật popup thành công khi lỗi lưu hoặc mã đã nhận.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Bàn phím mở | Focus input, viewport thấp hơn | Cả popup và DOM cùng offset, nút chạm khớp hình | Ưu tiên visualViewport |
| Safari cuộn | viewport.offsetTop đổi | Đổi vị trí chung theo vùng nhìn thấy | Không cộng offset lặp |
| Bàn phím đóng | viewport khôi phục hoặc input blur | Popup và input về vị trí giữa cũ | Không mất mã đang nhập |
| Không có API | visualViewport không tồn tại | Dùng vùng cửa sổ, popup vẫn hoạt động | Không crash |
| Thành công | Commit mã hợp lệ ready | Bỏ input, đóng bàn phím, hiện popup thưởng một lần | Số thật +100.000 xu |
| Sai/lặp/lỗi lưu | Claim không thành công | Giữ feedback/retry hiện hành | Không popup thưởng |
| Đóng/OK/Escape | Popup thưởng đang mở | Đóng popup, quay lại Settings | Không cộng tiền lần nữa |
| Thoát scene | Popup đang mở | Dọn DOM/listener, trả lease riêng | Không bỏ pause khác |

</frozen-after-approval>

## Code Map

- `src/presentation/TestCodePanel.ts`: input native, redraw và trạng thái nhận thành công dùng chung.
- `src/presentation/NotificationFrame.ts`: khung/nút Phaser, asset preload dùng chung.
- `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts`: vùng chạm modal và ownership vòng đời.
- `public/assets/references/thông báo nhận tiền.png`: mẫu khung, pizza và đồng xu; chữ/số trong ảnh chỉ tham khảo.
- `public/assets/references/Cài đặt tiệm pizza ấm cúng.png`: tham khảo phong cách, không thay các controls ngoài yêu cầu.
- `tests/test-code.spec.ts`: kiểm chứng Menu/Pause, tiền thật, reload và chặn giữa ca.

## Tasks & Acceptance

- [x] `src/presentation/TestCodePanel.ts`: quản lý offset chung canvas/DOM, cập nhật viewport, vùng chạm và cleanup.
- [x] `src/presentation/NotificationFrame.ts` hoặc renderer mới trong presentation: tái sử dụng art thưởng, bỏ số/chữ mẫu để vẽ dữ liệu thật.
- [x] `src/presentation/TestCodePanel.ts`: sau commit chuyển sang thông báo có pizza, đồng xu, tiêu đề “Nhập mã thành công!”, số thưởng, mô tả “Bạn đã nhận được xu thưởng từ mã quà tặng.” và Đóng/OK.
- [x] `tests/test-code.spec.ts` và unit hình học tập trung: viewport thu nhỏ/cuộn/khôi phục, blur, đúng offset DOM/vùng chạm, fallback, hai nút đóng, không thưởng lặp.
- [x] `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`: cập nhật đúng phần popup, lưu ảnh kiểm chứng.

**Acceptance Criteria:**
- Given popup ở Menu hoặc Pause, when bàn phím mở, then khung/input/nút giữ cùng vị trí tương đối.
- Given mã đúng, when save thành công, then popup thưởng ở giữa, input được gỡ và tiền là 100300 từ số dư 300.
- Given popup thưởng, when bấm Đóng hoặc OK, then trở về Settings, tiền không đổi và pause nguồn khác còn nguyên.

## Spec Change Log

## Design Notes

Offset tính từ tọa độ CSS của canvas sang tọa độ game 360×640, áp dụng cả renderer và rect đăng ký input. Backdrop phủ toàn canvas, không dịch cùng khung. Khung thưởng dùng ảnh có sẵn nhưng chữ động và số thực nhận phải tách khỏi chữ mẫu. Nền tối nhẹ giữ alpha hiện hành; ảnh tham khảo đã có phong cách mờ ấm, không yêu cầu blur toàn renderer.

## Verification

- Build TypeScript/Vite.
- Unit hình học viewport và các trường hợp fallback/khôi phục.
- Playwright tập trung Chromium/WebKit portrait cho riêng popup; giả lập visualViewport resize/scroll để kiểm chứng hình học. Không chạy full matrix.
- Kiểm tra ảnh popup thường, popup khi vùng nhìn thấy thu nhỏ và thưởng thành công. Bàn phím Safari thật cần kiểm tra trên iPhone để xác nhận hành vi hệ điều hành.

## Implementation & Results — 2026-10-06

- [Hình học viewport](../../src/presentation/TestCodeViewport.ts) tính offset theo canvas CSS và vùng nhìn thấy. [Panel dùng chung](../../src/presentation/TestCodePanel.ts) lấy một offset mỗi draw, áp dụng vào container Phaser, textbox DOM và mọi rect đăng ký vùng chạm. Listener resize/scroll/focus/blur gom mỗi animation frame và được dọn khi destroy.
- [Renderer thưởng](../../src/presentation/TestCodeReward.ts) cache một CanvasTexture art tĩnh, cắt các lát nguồn bỏ chữ/số mẫu và clip silhouette khung/crest. Chữ, số tiền và hit targets là Phaser động; không đổi domain/save/claim. Không dùng GeometryMask trên container vì Phaser4 WebGL container renderer không áp dụng mask legacy.
- Build TypeScript/Vite đạt (88 modules). 27 unit tập trung đạt: 4 hình học + 23 mã/checkpoint/session hiện hành.
- Bộ tập trung 14 E2E ở Chromium360×640 và WebKit390×844: 13 đạt lần đầu; một test giữa ca gặp thông báo sự kiện A có sẵn. Test đã xử lý thông báo rồi so sánh tiền thực trước/sau từ chối mã. Rerun 6 test thưởng/giữa ca đạt cả hai browser. Sau khi hoàn thiện clipping art, rerun 4 test thưởng đạt để kiểm chứng render cuối và hai nút đóng.
- Đã kiểm tra ảnh [hộp thường](ui-baseline/test-code-mobile-normal.png), [viewport thu nhỏ](ui-baseline/test-code-mobile-keyboard.png) và [thưởng thực nhận](ui-baseline/test-code-received-2026-10-06.png): không lệch input khỏi hộp, tiền +100.000 và chữ/nút đọc rõ. Viewport trong E2E là mô phỏng hình học, không phải bàn phím iOS thật.
- Nếu viewport thấp hơn chiều cao toàn bộ popup, không thể chứa trọn khung chỉ bằng dịch chuyển; giữ đầu hộp nhìn thấy, không tự thu nhỏ phong cách/chữ/nút. Trường hợp chiều cao đúng bằng khung được bỏ margin để khung vừa vùng nhìn thấy.

## Review Results

Ba lượt độc lập (blind, edge case, acceptance) không còn phát hiện được xác nhận. Rủi ro blur khi chạm nút đã kiểm tra: controls nhập mã ở cả Menu/Pause xử lý pointerdown, không chờ pointerup; E2E kiểm chứng nút sau dịch. Không thay luật nhận thưởng hoặc ghi save.

## Suggested Review Order

**Popup và bàn phím**

- Dùng một offset cho cả khung, input và vùng chạm.
  [TestCodePanel.ts:53](../../src/presentation/TestCodePanel.ts#L53)
- Tính dịch chuyển từ vùng nhìn thấy, giữ vị trí cũ khi blur.
  [TestCodeViewport.ts:3](../../src/presentation/TestCodeViewport.ts#L3)
- Gom sự kiện viewport và dọn listener khi đóng.
  [TestCodePanel.ts:19](../../src/presentation/TestCodePanel.ts#L19)

**Thưởng và kiểm chứng**

- Ghép art theo ảnh, cắt nền thừa, vẽ số thưởng thật.
  [TestCodeReward.ts:6](../../src/presentation/TestCodeReward.ts#L6)
- Kiểm chứng hình học, tiền, reload và nút đóng trên hai trình duyệt.
  [test-code.spec.ts:10](../../tests/test-code.spec.ts#L10)
