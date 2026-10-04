---
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

# Bếp Phaser theo ảnh bán hàng — 2026-10-04

Người dùng yêu cầu triển khai nền sạch từ `public/assets/references/bán hàng.png`, giữ tỷ lệ/bố cục và nối các vùng bấm trong suốt vào gameplay hiện có. Đây là quyền thay đổi riêng màn bếp, không thay menu, hub chuẩn bị/tổng kết hoặc domain.

## Tasks & Acceptance

- [x] Tạo nền raster sạch `public/assets/reference-kitchen-clean.png`: bỏ toàn bộ chữ/số, khách, pizza công thức, lò, icon trên nút hành động; giữ gỗ, kem, đồng, cây, đèn, mái che, sáu khung khách, tám ô món, hai nút và lưới nguyên liệu 5×4. Given nền được tải, when tiền/ngày/khách thay đổi, then nền không chứa dữ liệu cũ.
- [x] `src/presentation/ReferenceKitchenArt.ts` và `StartupScene.ts`: manifest nền/sprite riêng, không dùng nguyên ảnh mẫu làm nền. Given tải lỗi, when startup kiểm tra textures, then không vào game với ảnh thiếu.
- [x] `CozyScene.ts`: cùng canvas logic360×640/FIT cho nền/text/sprites/hit zones. Sáu khung khách chỉ có khách thật; tên/avatar/patience lấy đơn thật. Given resize, when chạm ô thật, then đúng command một lần, không lệch sang hàng/cột bên cạnh.
- [x] HUD ngày/tiền/timer thật; order/tutorial panel mới đúng vị trí; lò trống/có bánh/cháy là ảnh riêng; pizza lắp nguyên liệu và hộp là sprite riêng. Given nướng/đóng hộp/giao, then art phản ánh runtime và không đổi tiền/công thức/timing/luật giao.
- [x] Tám món2×4 và19nguyên liệu+trash5×4 theo ảnh. Given nguyên liệu/món chưa hỗ trợ, then hiển thị khóa, không tự mở gameplay. Given món đã hỗ trợ hoặc đơn đang chọn, then ô món mở thông tin/công thức thật, không giả chức năng. Bảo toàn bánh bỏ/đơn hết giờ/remake/oven-owner.
- [x] Theo bổ sung mới: hai nút dưới thớt chỉ **Đóng hộp** và **Giao bánh**, nhãn cố định. Đủ nguyên liệu chạm lò để nướng; chạm lò đang nướng để lấy bánh theo luật hiện có. Bỏ bánh ở ô xóa, remake/chọn kho ở thớt khi cần. Given hộp đã đóng, when chạm giao, then tiền tăng đúng và đơn hoàn tất đúng một lần. Given thiếu nguyên liệu/lò bận, when chạm lò, then không nướng thêm sai luật.
- [x] Build và browser tập trung với mobile touch360×640/390×844, tutorial, ingredient grid, nướng/hộp/giao, pause/modal chặn input và resize. Không chạy fullmatrix release.

## Assets và quy tắc

Nền sạch được chỉnh bằng imagegen built-in, không chỉnh pixel bằng script. Sprite avatars/ovens/recipe atlas cũng riêng; Phaser atlas frames có thể cắt vùng runtime. Giá/định lượng/khách đến giữ nguyên. Ô5×4 nhỏ theo mẫu được giữ bố cục; hit padding tối thiểu48CSS và vùng hình thật ưu tiên khi padding chồng nhau. Các overlay hiện có giữ logic, chỉ tutorial/order phần bếp đổi vị trí cho panel mới.

Tọa độ canvas: HUD y0..39, khách y73..137; order x10,y143,w340,h41; recipes x14+84i,y190/236,w80,h43; board x12,y290,w216,h113; oven x238,y298/376,w110,h63; actions x14/124,y406,w105,h32; sauces x14+67i,y449,w62,h43; ba hàng còn lại y495/540/584. Dùng constants chung trong renderer và geometry data cho kiểm chứng.

## Verification

Build-nolog/TypeScript đạt. 27 unit test: tutorial/runtime/delivery/order queue đạt. Browser touch Chromium360×640: bảy test cozy/reference-grid/tutorial đạt; Chromium390×844: luồng nướng/hộp/giao, cháy, nestedpause, tutorial, grid/resize đạt. Sáu khách hỗn hợp/app và expired inspection renderer thật đạt; chọn đơn khác không đổi oven-owner đạt. Test bánh nấm/tồn kho thật đạt: trừ đúng bốn nguyên liệu, độ chín đạt, đóng hộp/giao nhận đúng finalPrice. Đồng hồ test chờ arrival/oven runtime thay vì giả định delta Phaser bằng thời gian virtual, timeout180s cho headless; không đổi domain.

Các lỗi được sửa: ID thớt và ô đế trùng làm vùng bấm đè nhau; sai số FIT khiến48CSS thiếu rất nhỏ; nhãn tiếng Việt bị encoding lúc sửa; nhãn/nút giao trùng; khung modal công thức thiếu chiều cao. Touch padding làm tròn lên, ưu tiên vùng hình thật; hai nút đúng yêu cầu mới chỉ Đóng hộp/Giao bánh. Chạm lò chọn đúng oven-owner trước lấy bánh, không dispatch sang đơn khác nếu chọn thất bại. Scene fixture tự preload sprites khi không qua Startup; production vẫn qua asset failure/retry gate. Nền/sprite giữ tỷ lệ đồng nhất.

Ba review độc lập đã được khởi chạy nhưng không hoàn tất vì dịch vụ giới hạn lượt/quyền mạng; đã tự kiểm tra diff, geometry, gate tutorial/modal, recipe locks, oven-owner và command domain, sửa lỗi tìm thấy, kiểm chứng bằng tests trên. Không chứng nhận fullmatrix hoặc thiết bị thật.

Ảnh kiểm chứng: [màn chạm/resize](ui-baseline/kitchen-reference-mobile-2026-10-04.png), [hộp trên thớt](ui-baseline/kitchen-reference-boxed-2026-10-04.png). Đây là ảnh triển khai theo yêu cầu, mốc lịch sử không bị ghi đè.

## Suggested Review Order

- Nền sạch/sprite atlas và metadata frame giữ tỷ lệ.
  [ReferenceKitchenArt.ts](../../src/presentation/ReferenceKitchenArt.ts#L4)
- Dùng một hệ tọa độ cho hình và vùng bấm.
  [ReferenceKitchenLayout.ts](../../src/presentation/ReferenceKitchenLayout.ts#L2)
- Gate tải ảnh trước khi vào game.
  [StartupScene.ts](../../src/scenes/StartupScene.ts#L57)
- Hai nút cố định, chạm lò nướng/lấy; giữ command domain.
  [CozyScene.ts](../../src/scenes/CozyScene.ts#L210)
- Kiểm tra chạm tọa độ hình thật, resize và modal chặn thao tác.
  [reference-kitchen.spec.ts](../../tests/reference-kitchen.spec.ts#L15)
- Ảnh và prompt cuối dùng imagegen built-in.
  [reference-kitchen-art.md](../../public/assets/reference-kitchen-art.md)
