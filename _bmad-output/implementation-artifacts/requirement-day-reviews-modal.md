---
title: 'Khách nói gì — hai đánh giá gần nhất và modal xem tất cả'
date: '2026-10-04'
status: implemented
requested_by: user
scope: summary-reviews-modal
---

# Khách nói gì — đánh giá của đúng ngày đang xem

**Đã triển khai ngày 2026-10-04**, sau khi người dùng yêu cầu làm Tổng kết theo ảnh và ghi chú. Dùng `public/assets/references/Bảng đánh giá pizza ngày 1.png` làm mẫu, với đánh giá thật của đúng ngày. Xem [spec và bằng chứng kiểm tra](spec-reference-summary-and-details.md).

Yêu cầu triển khai mới cho phép thay riêng Tổng kết và hai bảng chi tiết theo ảnh. Bếp, menu và renderer bốn tab còn lại giữ nguyên; số liệu mẫu trong ảnh không trở thành dữ liệu mặc định.

## Thẻ trên màn tổng kết

- Trong mục **“Khách nói gì?”**, chỉ hiển thị **2 đánh giá gần nhất của ngày đang xem**. Nếu ngày chỉ có một đánh giá thì hiển thị một; không thêm đánh giá giả để đủ hai.
- Thêm nút **“Xem tất cả ›”** để mở modal đánh giá của ngày đó.
- Không đổi các phần khác của màn tổng kết, bếp, menu hoặc các tab. Giữ style **kem–gỗ–viền đồng** hiện tại; yêu cầu này không duyệt thiết kế lại toàn bộ màn theo ảnh tham khảo.

## Modal

- Tiêu đề chính xác: **“Đánh giá ngày {day}”**, với `{day}` là ngày của báo cáo tổng kết đang mở.
- Hiển thị **điểm trung bình**, **tổng lượt đánh giá** và danh sách cuộn **toàn bộ đánh giá của đúng ngày đó**. Điểm/tổng lượt được tính trên toàn bộ tập đánh giá của ngày, không chỉ hai dòng trên thẻ và không tính theo số khách duy nhất.
- Mỗi dòng gồm **avatar, tên, sao, nhận xét**; dùng dữ liệu đánh giá thật. Hai dòng gần nhất trên thẻ thuộc cùng tập dữ liệu với modal, theo thứ tự phát sinh đánh giá, không chọn theo điểm sao.
- Có nút đóng **×**. Vùng chạm nút mở/đóng đạt tối thiểu 48×48 CSS px theo quy tắc dự án.
- Khi mở, nền phía sau **làm tối và không nhận thao tác**: chạm/kéo không kích hoạt tab, nút mua hàng, mở ngày mới hoặc nội dung tổng kết phía dưới. Chỉ danh sách trong modal cuộn; tiêu đề và nút đóng vẫn dễ truy cập.
- Khi đóng, trở về đúng màn/tab/ngày đã mở modal, không thay đổi số liệu hoặc tiến độ. Không giải phóng pause do nguồn khác sở hữu.
- Giữ style **kem–gỗ–viền đồng** đồng bộ với màn hiện tại.

## Ràng buộc dữ liệu và trạng thái trống

- Chỉ đọc tập đánh giá của báo cáo ngày đang xem; không trộn đánh giá ngày khác, không lấy toàn bộ lịch sử chiến dịch làm danh sách của một ngày.
- Không hardcode tên, avatar khách khác, số sao, câu nhận xét, điểm trung bình hoặc tổng lượt để giống ảnh mẫu.
- Khi chưa có đánh giá, ghi **“Chưa có đánh giá”**, tổng lượt bằng 0 và không hiển thị điểm trung bình giả. Không tạo đánh giá từ tutorial hoặc trước ca đầu tiên. Nếu mở modal ở trạng thái này thì dùng cùng trạng thái trống, danh sách không có dòng giả.

## Tiêu chí kiểm tra

1. Với hơn hai đánh giá trong một ngày, thẻ chỉ có hai đánh giá gần nhất; modal có đủ mọi đánh giá của ngày, điểm trung bình và tổng lượt khớp dữ liệu thật.
2. Với dữ liệu nhiều ngày, mở ngày nào chỉ thấy đánh giá của ngày đó.
3. Với 0/1/2 đánh giá, hiển thị đúng số dòng thật và trạng thái trống tương ứng.
4. Danh sách dài cuộn trong modal; nút × đóng được; chạm/kéo phía sau không kích hoạt hành động nền.
5. Đóng modal giữ đúng ngày/tab/số liệu và quyền sở hữu pause; style và các phần UI ngoài phạm vi không đổi.

Nguồn bố cục hiện hành: [mốc UI](ui-baseline-2026-10-02.md). Hợp đồng tổng kết ngày: [spec cuối ngày](spec-end-of-day-reference.md).
