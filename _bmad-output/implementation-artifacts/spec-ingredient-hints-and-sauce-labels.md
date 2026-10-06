---
title: 'Gợi ý nguyên liệu còn thiếu và nhãn chai sốt'
type: feature
created: '2026-10-06'
status: done
route: one-shot
---

# Gợi ý nguyên liệu còn thiếu và nhãn chai sốt

## Intent

**Problem:** Nhận biết nguyên liệu còn thiếu của pizza trong đơn đang chọn và phân biệt chai sốt.

**Approach:** Nền sáng và viền vàng nằm trong ô cần thêm, dùng công thức của đơn hiện tại trừ nguyên liệu đã đặt. Thêm nguyên liệu bỏ highlight; bỏ nguyên liệu/xóa tất cả hiện lại; đổi đơn dùng pizza riêng của đơn mới. Không gợi ý khi không có đơn hoặc pizza không còn ở bước thêm nguyên liệu. Giữ quyền bấm ô khác, hitbox, bố cục, công thức và luật gameplay; không thêm dấu tích hay trạng thái xanh/đỏ.

Nhãn giấy kem trực tiếp trên thân năm chai, chữ CÀ/KEM/BBQ/PESTO/CAY vừa trong nhãn; tên đầy đủ bên dưới. Giữ hình chai và vị trí ô.

Build đạt. Hai E2E Chromium360×640 kiểm tra thêm/bỏ/xóa, đổi giữa đơn phô mai/nấm, ô không highlight vẫn dùng được, labels và thao tác qua resize/pause. Đã xem ảnh thực tế. Review độc lập phát hiện min-font clamp khiến nhãn tràn; đã sửa bằng scale chữ không wrap. Review lại không còn lỗi. Test thao tác cũ cập nhật dùng toggle Hiệu ứng thay nút âm lượng đã bỏ.

## Suggested Review Order

- Điều kiện thiếu nguyên liệu, viền và nhãn trong ô hiện có: [CozyScene.ts](../../src/scenes/CozyScene.ts#L504).
- Kiểm tra pizza từng đơn và thao tác nguyên liệu: [reference-kitchen.spec.ts](../../tests/reference-kitchen.spec.ts#L48).
