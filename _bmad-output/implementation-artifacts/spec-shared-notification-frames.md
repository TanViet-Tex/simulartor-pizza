---
title: 'Đồng bộ thông báo theo hai khung references'
type: feature
created: '2026-10-04'
status: done
baseline_commit: NO_VCS
context: []
---

<frozen-after-approval reason="Người dùng yêu cầu triển khai trực tiếp">

## Intent

**Problem:** Các thông báo/menu xác nhận đang dùng panel vẽ riêng, veil chỉ che một phần bếp. Người dùng đã cung cấp hai ảnh và yêu cầu dùng thống nhất ở tất cả luồng.

**Approach:** Thành phần khung chung từ `public/assets/references/Khung thông báo tiệm pizza ấm cúng.png` (1 nút) và `Hộp thoại thông báo pizza ấm cúng.png` (2 nút), nền ngoài đen hoàn toàn. Nội dung/nút vẫn động theo trạng thái thật.

## Boundaries & Constraints

**Always:** Giữ mọi action ID/callback/enable, pause ownership, transaction/save/retry, keyboard/a11y, cuộn chữ lớn. Khung2 cho hai quyết định; khung1 cho thông tin có một hành động tiếp tục/đóng. Màn có điều khiển nội dung (giá, số lượng, âm thanh, recovery) giữ đầy đủ; chọn1/2 theo hành động footer chính và đặt chức năng phụ trong vùng nội dung. Trạng thái đang lưu/đọc không thêm nút bấm cho phép bypass. Đồng bộ CozyScene và MainMenuScene. Giữ tỷ lệ trang trí/viền hợp lý khi co giãn bằng vùng blank/nine-slice thay vì kéo méo cả ảnh. Vùng chạm không lấn, chữ không ra khỏi giấy, quyết định dài wrap/scale hợp lý.

**Ask First:** Đổi luật gameplay, bỏ chức năng hoặc thêm dữ liệu giả.

**Never:** Không sửa ảnh gốc, avatar/bếp/hub/menu nền khi modal đóng; không triển khai yêu cầu Chợ đang chỉ là tài liệu. Không chuyển hướng dẫn inline trên panel đơn thành modal chặn thao tác học.

## I/O & Edge-Case Matrix

| Scenario | State | Expected |
| --- | --- | --- |
| Thông tin | Ô khóa, công thức/đơn, cảm ơn, hướng dẫn hoàn tất | Khung1, đúng callback đóng/tiếp tục |
| Quyết định | Bỏ/giao sai/mặc cả/giúp/làm lại/chốt ngày | Khung2, cả hai callback/enable cũ |
| Nội dung phức tạp | Hỏa tốc, giá, thu chi, pause, save recovery/error | Khung chung, controls phụ và chức năng giữ nguyên |
| Menu | Settings/new session/loading/error/recovery | Cùng khung chung, main input phía sau khóa |
| Overlay | Bất kỳ modal | Đen toàn canvas, input nền bị chặn |
| Chữ lớn | 200%/nội dung dài | Cuộn trong vùng giấy, nút luôn truy cập được |

</frozen-after-approval>

## Code Map

- `src/presentation/NotificationFrame.ts` (mới): manifest/preload, renderer/layout dùng lại, geometry footer1/2.
- `src/scenes/CozyScene.ts`: veil, các dialog/overlay/success/tutorial complete; giữ market/dayHub làm màn chuẩn bị riêng.
- `src/scenes/MainMenuScene.ts`: drawDialog, preload, buttons/dữ liệu a11y.
- `src/scenes/BootScene.ts`: modal của đường vào legacy `?mode=campaign` nếu còn hoạt động; chỉ đổi khung, không đổi gameplay.
- `tests/notification-frames.spec.ts` (mới): kiểm tra khung/thông tin/quyết định/black backdrop/blocking/resize.

## Tasks & Acceptance

- [x] Tạo thành phần chung tải đúng2PNG và bố trí nội dung/footer.
- [x] Chuyển tất cả modal thông báo/xác nhận ở bếp và menu; giữ callbacks/enable.
- [x] Kiểm tra focused E2E và build; xem ảnh1/2nút, dài/large text; sửa lỗi phát hiện.
- [x] Đồng bộ UI baseline/project context và ảnh kiểm chứng.

**Acceptance Criteria:**
- Given một modal mở, when render, then khung tương ứng1/2 hành động hiện và xung quanh đen, các control nền không thực thi.
- Given xác nhận/hủy hoặc đóng, when chạm nút, then đúng luồng cũ và chỉ giải phóng pause của owner.
- Given menu thông báo hoặc lỗi lưu, when tương tác, then action/save giữ nguyên, không cho bypass đang lưu.
- Given nội dung dài hoặc chữ200%, when đọc/cuộn, then chữ và nút nằm trong vùng giấy, không mất hành động.

## Verification

`npm run build-nolog`; Playwright Chromium390×844 tập trung. Review độc lập3lenses theo skill. Không full matrix.

Kết quả: build/typecheck cuối đạt. 9 test cuối (`notification-frames.spec.ts`5 và `menu.spec.ts`4) đạt; 5 test bếp/queue (`kitchen-v2.spec.ts`2, `queue-locks-actions.spec.ts`3) đạt ở lượt tích hợp. Kiểm tra pixel4góc canvas đen tuyệt đối, input nền bị khóa, hủy không reset, visibility lease còn sau đóng, mute còn trong xác nhận chốt ngày, chữ200% cuộn và nút không di chuyển, legacy tutorial/load error/retry. Đã xem ảnh1/2nút, end-day, lỗi lưu và chữ lớn, lưu6ảnh ngoài test-results. Chỉnh test menu đợi loading kết thúc trước khi kiểm tra main controls; một lượt Tab ở viewport ngắn không ổn định, lượt kiểm tra cuối đạt. Không chạy full matrix.

Review3lenses: bổ sung khung cho legacy loading/error/recovery theo acceptance audit; khôi phục mute sau veil thứ hai theo edge audit; tránh banner phiên tạm chèn vào body modal. Blind review không có lỗi xác nhận. Source audit lại legacy retry xác nhận giữ pending payload, không bypass chờ lưu. Không thay schema hoặc luồng Chợ đang chỉ ghi tài liệu.

## Suggested Review Order

- Khung dùng chung giữ header/footer, chỉ kéo vùng giấy trống.
  [NotificationFrame.ts](../../src/presentation/NotificationFrame.ts)
- Mapping modal giữ IDs/callbacks và chặn input nền.
  [CozyScene.ts](../../src/scenes/CozyScene.ts)
- Menu và retry legacy dùng cùng ảnh, trạng thái chờ khóa hành động.
  [MainMenuScene.ts](../../src/scenes/MainMenuScene.ts), [BootScene.ts](../../src/scenes/BootScene.ts)
- Kiểm tra ảnh, black pixels, pause, keyboard và chữ lớn.
  [notification-frames.spec.ts](../../tests/notification-frames.spec.ts)
