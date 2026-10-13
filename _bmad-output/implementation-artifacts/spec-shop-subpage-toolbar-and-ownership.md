---
title: 'Bỏ thanh trên mục con Quán và ghi sở hữu màu xanh'
type: feature
created: '2026-10-13'
status: done
route: one-shot
---

# Bỏ thanh trên mục con Quán và ghi sở hữu màu xanh

## Intent

> Chỉnh tiếp cùng ngày: người dùng yêu cầu dồn body lên để bỏ khoảng trống và chuyển nhãn sở hữu lên góc trên bên phải. Geometry/vị trí nhãn hiện hành theo [spec-shop-compact-top-right-ownership.md](spec-shop-compact-top-right-ownership.md); phần giữ khoảng trống bên dưới chỉ ghi nhận lượt triển khai trước.

**Problem:** Người dùng yêu cầu bỏ phần Quay lại/Quản lý quán phía trên các mục con theo ảnh, và ghi Đã sở hữu màu xanh khi sản phẩm đã mua.

**Approach:** Xóa toolbar và hit shop-back tại ShopScreenUI; footer Về quản lý quán tiếp tục điều hướng. Giữ toàn bộ geometry thẻ/viewport/tabs/header/nav. Nhãn sở hữu xanh từ dữ liệu thật cho công thức, trang trí/tiện nghi (cả đang đặt), tủ lạnh và cấp nâng đã mua. Lò đã nâng giữ hành động nâng tiếp; nhân viên giữ trạng thái thuê10ngày thay vì sở hữu vĩnh viễn. Đồ nhập kho và dịch vụ mua lặp lại giữ thao tác hiện có.

## Kết quả hoàn thành

- Đã bỏ thanh trên cả6mục con, không còn hit ẩn; quay về qua footer.
- Đã đồng bộ nhãn Đã sở hữu xanh, giá/tiền/ownership/save và giao dịch không đổi.
- Hoàn thành2026-10-13. Build/typecheck đạt;2E2E tập trung Chromium360×640 đạt qua lượt cuối: sáu màn/nav/cuộn và giao dịch/màu xanh/reload. Không chạy full matrix. Readiness của fixture đợi scene chơi sau tải menu.
- Ảnh kiểm tra: [Thiết bị đã sở hữu](ui-baseline/shop-toolbar-ownership-2026-10-13/shop-equipment-owned-green.png), [Trang trí đã sở hữu](ui-baseline/shop-toolbar-ownership-2026-10-13/shop-decoration-owned-green.png). Chữ xanh được kiểm tra từ fillText/fillStyle thật trong Canvas2D, không chỉ metadata sở hữu.
- Review độc lập không tìm thấy lỗi được xác nhận. Đồng bộ project-context và UI baseline theo yêu cầu mới.

## Suggested Review Order

- Bỏ toolbar và giữ footer quay lại.
  [ShopScreenUI.ts:11](../../src/presentation/ShopScreenUI.ts#L11)
- Nhãn sở hữu từ dữ liệu thật, màu xanh theo nền giấy/nút.
  [ShopScreens.ts:19](../../src/presentation/ShopScreens.ts#L19)
- Kiểm tra sáu màn, mua/đặt/cất và màu chữ khi vẽ thật.
  [reference-shop-screens.spec.ts:99](../../tests/reference-shop-screens.spec.ts#L99)
