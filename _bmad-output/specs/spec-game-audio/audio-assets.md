# Asset âm thanh

Tên dưới đây khớp file đã có ngày 2026-10-06; giữ nguyên dấu và cách viết khi tạo URL nạp asset.

| File trong `public/assets/audio/` | Mục đích | Cách phát |
|---|---|---|
| `lò nướng.mp3` | Lò đang nướng | Bắt đầu khi bake thành công; lặp tới khi chín; Pause giữ vị trí; không chồng bản |
| `cài đặt.mp3` | Mở Cài đặt | Một lần mỗi lần mở panel (giả định được ghi trong SPEC) |
| `nhạc nèn bán pizza 2.mp3` | Nhạc nền chính, bài 2 | Mặc định; lặp; đổi được trong Cài đặt |
| `nhac nền bán pizza.mp3` | Nhạc nền bài 1 | Lựa chọn thay thế trong Cài đặt; lặp |
| `sốt.mp3` | Dùng sốt | Chung cho mọi loại sốt; một lần mỗi thao tác thành công |
| `đóng hộp pizza.wav` | Đóng hộp | Một lần khi đóng hộp thành công |
| `tiếng khách đến.wav` | Khách đến | Một lần khi khách thực sự vào hàng chờ; không phát khi chỉ render lại |

Tiếng lò, cài đặt, sốt, đóng hộp và khách đến đều thuộc kênh hiệu ứng. Hai file nhạc nền thuộc Music, có bật/tắt riêng và chỉ một bài hoạt động.
