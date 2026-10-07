---
title: 'Epic 8 — nhân viên, nhiệm vụ ẩn và khách đặc biệt'
date: '2026-10-07'
status: decisions-partially-confirmed
---

# Epic 8 — quyết định mới

Đã triển khai ngày phụ bếp bận theo seed, miễn lương ngày bận và giữ nợ cũ. Nhiệm vụ ẩn được chọn là giúp người vô gia cư mua vé số một lần/30 ngày: 5/10/20 tờ, 30 xu/tờ, tất cả tờ mua nhận300xu/tờ cuối ngày. Xem spec-fridge-and-prep-absence.md và spec-advertising-and-lottery-help.md. Các gợi ý khác dưới đây vẫn để sau, không triển khai.

- Không đào tạo nhân viên; chỉ thuê theo nghề, làm công việc và trả lương khi kết thúc ngày. Giữ luồng lương đã triển khai, không tự thêm tăng lương/mệt/giữ người.
- Không thêm công thức gia truyền. Các đề xuất cũ về nhánh này không còn thuộc phần cần triển khai.
- Đã triển khai: sau 5–7 ngày làm, phụ bếp bận một ngày; ngày bận miễn lương nhưng giữ nợ cũ, không thao tác tự động.
- Khách nổi tiếng có chào bằng thảm đỏ; thực thi phần avatar/khung/hiệu ứng/thoại theo [spec khách đặc biệt](spec-special-customer-presentation.md). Chưa voice, chưa thêm hiệu ứng kinh tế KOL hoặc thưởng mới.

## Gợi ý nhiệm vụ ẩn — chưa duyệt hoặc triển khai

| Ý tưởng | Điều kiện gợi ý | Nội dung chơi |
|---|---|---|
| Bữa tối cho người thân | Một khách quay lại sau vài ngày | Chọn giúp một phần pizza hoặc bán bình thường; ghi rõ chi phí trước quyết định |
| Chiếc bánh thất lạc | Khách hỏi lại món từng đặt | Tìm đúng món từ gợi ý; chỉ chọn trong menu đã mở |
| Người khách cuối ca | Một lượt đã nằm trong lịch gần đóng cửa | Hoàn thành đơn trước hạn hiện có; không kéo dài ca hoặc thêm lượt |
| Hẹn ngày trở lại | Phục vụ tốt cùng khách qua nhiều ngày | Mở lời thoại/đoạn truyện tiếp theo, không tự thêm công thức |
| Bài đánh giá bí mật | Một nhân vật hư cấu ghé quán như khách thường | Sau giao đúng đơn mới tiết lộ người đánh giá; thưởng/tác dụng cần duyệt |

Mọi điều kiện/tần suất/thưởng/ảnh hưởng uy tín trên đều là đề xuất để người dùng chọn. Không tạo nhiệm vụ hoặc thưởng từ bảng này trong code. Không chặn kết thúc chiến dịch nếu bỏ lỡ nhiệm vụ ẩn. Khi viết story phải chốt lựa chọn, hậu quả, đường mở món và lưu claim chống lặp.
