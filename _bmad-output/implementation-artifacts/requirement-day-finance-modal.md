---
title: 'Lợi nhuận hôm nay — modal chi tiết thu chi theo ngày'
date: '2026-10-04'
status: implemented
requested_by: user
scope: summary-finance-modal
---

# Lợi nhuận hôm nay — Chi tiết thu chi

**Đã triển khai ngày 2026-10-04**, sau khi người dùng yêu cầu làm Tổng kết theo ảnh và ghi chú. Dùng `public/assets/references/bảng doanh thu chi tiết.png` làm mẫu; số liệu lấy từ báo cáo ngày thật. Build, kiểm tra dữ liệu và kiểm tra trình duyệt tập trung đã đạt; xem [spec và bằng chứng](spec-reference-summary-and-details.md). Không triển khai các tab khác trong lượt này.

## Nút và nội dung modal

- Thêm nút **“Chi tiết ›”** vào thẻ **“Lợi nhuận hôm nay”**.
- Bấm mở modal **“Thu chi ngày {day}”**, với `{day}` là ngày của báo cáo đang xem.
- Trình bày theo ảnh mẫu: **lợi nhuận**, **doanh thu theo món và số lượng**, **giá vốn nguyên liệu**, **chi phí khác**, **dòng tiền**, **số dư đầu ngày và cuối ngày**.
- Dùng dữ liệu thật của đúng ngày đang xem. Không hardcode số, tên món hoặc số lượng từ ảnh; không trộn ngày khác hay số liệu mua hàng phát sinh sau ngày đã chốt vào báo cáo cũ.
- Số lượng và doanh thu theo món phải đối chiếu được với giao dịch thực tế của ngày. Không suy ra số lượng bằng cách chia doanh thu cho một giá bán mặc định vì giá thực nhận có thể khác nhau.

## Nguyên tắc kế toán phải giữ

- **Không thay đổi cách tính tiền**, quy tắc kinh tế, ghi nhận lô hoặc chốt ngày hiện có. Modal chỉ trình bày/đối chiếu dữ liệu; mở, cuộn và đóng không tạo giao dịch hoặc tính lại thưởng.
- **Tách tiền nhập kho khỏi giá vốn nguyên liệu đã dùng**. Tiền mua hàng thuộc dòng tiền nhập kho; chỉ giá vốn đã ghi nhận theo quy tắc hiện có thuộc chi phí sử dụng. Không trừ tiền mua nguyên liệu thêm lần nữa vào lợi nhuận khi đã tính giá vốn.
- **Hao hụt/bánh cháy chỉ tính một lần** theo quy tắc hiện có. Không thêm một khoản phạt/chi phí từ trạng thái cháy nếu cùng nguyên liệu đã được ghi nhận vào chi phí; mọi phân tách hiển thị phải tránh cộng/trừ lặp.
- Chi phí khác, thưởng và các dòng tiền được trình bày theo đúng phân loại hiện có; không đổi thưởng thành doanh thu bán món hoặc lấy tiền nhập kho làm chi phí sử dụng.
- Số dư đầu/cuối và các dòng thu/chi phải đối chiếu được với báo cáo thật. Nếu dữ liệu hiện có thiếu chi tiết để trình bày theo món/nguyên liệu, ghi rõ khoảng trống khi triển khai; không tạo số giả hoặc âm thầm đổi công thức để khớp ảnh.

## Hành vi và hình thức

- Nội dung modal **cuộn**, có nút đóng **×**, nền phía sau **làm tối và chặn thao tác**. Chạm/kéo không kích hoạt tab, mua hàng hay mở ngày mới ở phía sau.
- Vừa màn **360×640**, không tràn hoặc buộc cuộn toàn màn; giữ nút đóng dễ truy cập và vùng chạm tối thiểu 48×48 CSS px.
- Giữ style **kem–gỗ–viền đồng**, theo mẫu tương ứng trong `references` khi được yêu cầu triển khai. Không refactor phần ngoài phạm vi, không nhân tiện đổi bếp/menu/các tab khác.
- Đóng modal giữ đúng ngày/tab và số liệu; không giải phóng pause do nguồn khác sở hữu.

## Kiểm tra bắt buộc khi được yêu cầu triển khai

- Chạy **`npm run build-nolog`**.
- Kiểm tra tập trung số liệu: doanh thu theo món/số lượng, giá vốn, chi phí khác, nhập kho/dòng tiền, số dư đầu/cuối và phân biệt nhiều ngày. Có trường hợp mua hàng còn tồn, nguyên liệu đã dùng, hao hụt/bánh cháy để chứng minh không tính chi phí hai lần.
- Kiểm tra modal: mở bằng “Chi tiết ›”, tiêu đề đúng ngày, nội dung dài cuộn, × đóng, nền tối không nhận input và vừa 360×640. Đối chiếu hình với ảnh mẫu.
- Chỉ chạy kiểm tra liên quan theo nhịp kiểm thử dự án; không tự chạy toàn bộ browser matrix vì thay đổi cục bộ này.

Liên quan: [mốc UI](ui-baseline-2026-10-02.md), [hợp đồng cuối ngày](spec-end-of-day-reference.md), [modal đánh giá](requirement-day-reviews-modal.md).
