---
title: 'Animation chọn năm tab quản lý'
created: '2026-10-13'
status: done
baseline_commit: 'a05679c'
---

## Yêu cầu

Tổng kết, Chợ, Kho, Quán và Nhiệm vụ chuyển nền vàng nhạt và viền vàng nhẹ trong 150ms. Nhấn co nút về 96% rồi trở lại trong tổng 120ms. Tab đang chọn giữ màu nền; icon không bị tô màu/đổi độ sáng. Giữ bố cục và vùng chạm, không lặp nhấp nháy; giảm chuyển động chuyển trạng thái ngay.

## Thực hiện

- `HubNavigationMotion.ts`: timeline hữu hạn, chuyển nhanh từ trạng thái đang chạy, giảm chuyển động chốt ngay.
- `HubHeader.ts`: theo chỉnh tiếp “cả ô”, vẽ nền/viền quanh toàn bộ ô; phục hồi artwork icon gốc trên nền chọn để không đổi màu/độ sáng. Co quanh tâm trong bounds cũ. Refresh riêng navbar texture.
- `CozyScene.ts`: lưu trạng thái qua redraw, cập nhật riêng navbar trong animation, bỏ touch flash phủ icon cho tab.
- `HubNavigationMotion.test.ts`, `tests/hub-tab-motion.spec.ts`: timing, chọn nhanh, giảm chuyển động, pixel icon, hit bounds và trạng thái không tự lặp.

## Kiểm chứng

Build/typecheck đạt. Hai file unit, 9 test đạt; Chromium 360×640: 1 E2E kiểm tra cả năm tab đạt. Xác nhận nền vàng cả ô, màu nét icon (sai số raster nhỏ), 96% tại60ms/trở lại tại120ms, nền chốt150ms, không tự lặp, bounds không đổi và giảm chuyển động không có flash/animation. Không đổi gameplay hoặc chạy browser matrix.

## Review

Ba lượt rà soát độc lập về code, trường hợp biên và yêu cầu. Đã sửa một P2: crop icon có nền kem tạo ô vuông bên trong nền chọn. Icon nay dùng mặt nạ trong suốt được cache, chỉ loại nền sáng nối với mép crop, giữ chi tiết trắng bên trong hình. Reviewer xác nhận finding đã đóng. E2E thêm kiểm tra pixel nền vàng ở phần trên ô và màu các nét icon, không chỉ đọc trạng thái animation.

## Suggested Review Order

- Timeline chọn và nhấn hữu hạn, giảm chuyển động chốt ngay.
  [HubNavigationMotion.ts:8](../../src/presentation/HubNavigationMotion.ts#L8)
- Mask icon giữ màu gốc trên nền vàng toàn ô.
  [HubHeader.ts:16](../../src/presentation/HubHeader.ts#L16)
- Refresh riêng navbar qua redraw và tương tác tab.
  [CozyScene.ts:284](../../src/scenes/CozyScene.ts#L284)
- Kiểm tra thời gian, chọn nhanh và giảm chuyển động.
  [HubNavigationMotion.test.ts:4](../../src/presentation/HubNavigationMotion.test.ts#L4)
- Kiểm tra pixel nền/icon và vùng chạm trên canvas.
  [hub-tab-motion.spec.ts:43](../../tests/hub-tab-motion.spec.ts#L43)
