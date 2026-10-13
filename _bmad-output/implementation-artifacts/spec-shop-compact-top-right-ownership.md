---
title: 'Kéo mục con Quán lên và đặt sở hữu góc trên bên phải'
type: feature
created: '2026-10-13'
status: done
route: one-shot
---

## Intent

**Problem:** Sau khi bỏ toolbar, body vẫn để khoảng trống; nhãn sở hữu đang ở giữa/dưới thẻ thay vì trên bên phải như người dùng muốn.
**Approach:** Kéo body/tabs lên50px logic và tăng viewport cùng lượng, giữ đáy/footer/header/nav. Dùng nhãn xanh gọn ở góc trên bên phải của từng thẻ đã sở hữu theo runtime thật. Chừa chỗ cho tên món/thiết bị/cấp mở rộng; giữ nút mua/nâng tiếp và quyền lưu hiện hành. Nhân viên vẫn hiển thị hợp đồng thuê.

## Kết quả

- Viewport thường8/130/344/450, có lọc8/174/344/406; tabsY130. Nguồn geometry chung đồng bộ hit/clip/cuộn/tutorial.
- Công thức, đồ trang trí/tiện nghi, tủ lạnh, lò đã nâng và cấp mở rộng đã mua có nhãn Đã sở hữu xanh góc phải. Món chưa mua không có nhãn.
- Hoàn thành2026-10-13. Build/typecheck đạt;2E2E tập trung Chromium360×640 đạt qua lượt cuối: sáu màn/geometry/nav/cuộn và mua/đặt/cất/nâng cấp/nhãn xanh/reload. Review độc lập không có lỗi được xác nhận. Không chạy full matrix.
- Ảnh kiểm tra trực quan: [Thiết bị](ui-baseline/shop-compact-badges-2026-10-13/shop-equipment-owned-green.png), [Trang trí](ui-baseline/shop-compact-badges-2026-10-13/shop-decoration-owned-green.png). Nội dung sát nav, nhãn góc phải không che tên, footer giữ vị trí.

## Suggested Review Order

- Vùng nội dung mới, đáy và footer giữ nguyên.
  [HubWallLayout.ts:5](../../src/presentation/HubWallLayout.ts#L5)
- Nhãn sở hữu góc phải và phần tên thẻ.
  [ShopScreens.ts:19](../../src/presentation/ShopScreens.ts#L19)
- Hồi quy geometry/nav/cuộn/giao dịch/reload.
  [reference-shop-screens.spec.ts:99](../../tests/reference-shop-screens.spec.ts#L99)
