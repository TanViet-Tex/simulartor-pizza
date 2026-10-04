---
title: Thu gọn thông báo một nút theo nội dung
status: implemented
date: 2026-10-04
---

## Phạm vi

Yêu cầu người dùng: tiêu đề → nội dung → một nút xác nhận; giữ chiều rộng, phong cách, chức năng và nền đen chặn thao tác phía sau. Không sửa gameplay, dữ liệu lưu, panel pause, bảng cài đặt hay hộp lựa chọn hai nút.

## Thực hiện

- `src/presentation/NotificationFrame.ts`: đo chữ để tính chiều cao; panel rộng 332, căn giữa canvas 360×640; khoảng cách 14px, padding giấy 18px sau viền; nút 48px. Giữ tỷ lệ đầu trang trí và viền đáy, co phần giấy trống, ghép nút bằng ba lát ảnh gốc. Nội dung quá dài giới hạn panel 600px và cuộn độc lập.
- `src/scenes/CozyScene.ts`: áp dụng cho thông báo ô chờ khóa, đọc đơn/công thức, hoàn tất hướng dẫn, lời cảm ơn và kết quả có một hành động. Giữ ID, callback, trạng thái bật/tắt và quyền sở hữu pause.
- `src/scenes/BootScene.ts`: áp dụng thông báo chờ/lỗi và hướng dẫn/tiếp tục của campaign legacy.
- `src/scenes/MainMenuScene.ts`: đồng bộ thông báo tải tiến độ một nút; nút vẫn khóa trong lúc tải.
- `tests/notification-frames.spec.ts`: kiểm tra chiều cao theo nội dung, căn giữa, khoảng đệm, nút 48px, nền đen, đóng/tiếp tục, chữ 200% và cuộn nội dung dài.

## Chấp nhận

- Khi thông báo ngắn mở, chiều cao co theo chữ, không giữ vùng giấy trống cũ.
- Khi chữ lớn/nội dung dài, panel vẫn giữa màn hình và nút không bị cuộn theo nội dung.
- Khi đóng thông báo, thực thi hành động cũ; lý do pause khác vẫn được giữ.
- Viền, đầu trang trí và nút không bị ép nhỏ theo toàn ảnh.

## Kiểm tra

Sửa tiếp đường nối viền theo phản hồi: giữ toàn bộ góc trên/dưới; ghép giấy, cạnh thẳng và viền đáy riêng, bỏ lát cắt xuyên góc bo. Cân lại khoảng đệm dưới nút để không chạm viền. Build đạt; hai kiểm tra khung ngắn/dài đạt sau lần sửa này và đã xem/cập nhật ảnh mốc.

`npm run build-nolog` đạt. Sáu kiểm tra trong `tests/notification-frames.spec.ts` đạt trên Chromium 390×844, gồm nội dung dài ở cỡ chữ 200%, nút cố định và giữ pause khi đóng. Đã xem ảnh thông báo ô chờ và cập nhật ảnh mốc một nút. Không chạy full matrix.
