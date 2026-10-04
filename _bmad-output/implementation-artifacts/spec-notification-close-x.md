---
title: 'Dấu × đóng khung thông báo'
type: bugfix
created: '2026-10-04'
status: done
route: one-shot
baseline_commit: NO_VCS
---

## Intent

**Problem:** Vòng tròn góc phải trên ảnh khung2nút chưa có chữ hay chức năng đóng.

**Approach:** Thêm dấu× cân giữa vòng có sẵn và hit target. Dùng callback hủy/đóng/từ chối hiện có trong bếp, menu xác nhận mới và legacy confirm/offer; không thực hiện callback chấp thuận. Khung1 không có vòng này giữ nguyên; recovery/loading không thêm cách bypass.

## Suggested Review Order

- [NotificationFrame.ts](../../src/presentation/NotificationFrame.ts): geometry và chữ× dùng chung.
- [CozyScene.ts](../../src/scenes/CozyScene.ts), [MainMenuScene.ts](../../src/scenes/MainMenuScene.ts), [BootScene.ts](../../src/scenes/BootScene.ts): target dùng callback hủy hiện có.
- [notification-frames.spec.ts](../../tests/notification-frames.spec.ts): dùng× hủy chốt ngày/chiến dịch mới, kiểm tra giữ nguyên state/pause.

## Verification

Build/typecheck đạt;5focused Chromium tests đạt. Đã xem ảnh×cân giữa, hủy chốt ngày/chiến dịch mới không đổi dữ liệu hoặc giải phóng pause khác. Review độc lập phát hiện2lỗi đã sửa: close xác nhận tải save dùng IDsave-prefix để giữ eligibility như nút hủy, legacy targetscale theo48CSS. Khung chờ/recovery bắt buộc không thêm bypass. [Ảnh kiểm chứng](ui-baseline/notification-close-x-2026-10-04.png).
