---
title: 'Chợ mua chủ động, Kho dùng trong ca và hỏa tốc bổ sung'
date: '2026-10-04'
status: implemented
requested_by: user
---

# Yêu cầu sửa luồng mua nguyên liệu

Người dùng xác nhận cách hiểu “bỏ mua thường, chỉ còn hỏa tốc” là sai. Yêu cầu này thay riêng phần đó trong spec bếp tự phối ngày 2026-10-04. Ban đầu chỉ ghi tài liệu; sau yêu cầu “tiếp theo đến chợ… đọc rồi làm”, **đã triển khai Chợ theo `references/chợ.png`**, nối nghiệp vụ mua thường hiện có và giữ dữ liệu lưu. Xem [spec triển khai và kiểm chứng](spec-reference-market-purchases.md).

## Luồng chính đã chốt

1. Người chơi vào tab **Chợ** trong giai đoạn chuẩn bị trước khi mở quán hoặc giữa các ngày.
2. Chợ hiển thị nguyên liệu, giá ngày tương ứng, số lượng chọn mua, tổng tiền, tiền còn lại và thao tác mua rõ ràng. Người chơi chủ động chọn mua; không tự mua thay người chơi.
3. Mua thành công trừ đúng tổng tiền một lần và thêm đúng số lượng vào **Kho** theo lô, giá mua và hạn dùng. Thiếu tiền hoặc giao dịch không hợp lệ không làm mất tiền hay thêm hàng một phần; thông báo lý do. UI Chợ và Kho đọc cùng nguồn dữ liệu thật.
4. Người chơi mở quán. Ca dùng tồn kho đã mua; không reset tiền/kho khi chuyển từ hub sang bếp. Việc chọn topping không tự mua; tiêu hao theo nguyên liệu thật của bánh tại điểm tiêu hao hiện có, một lần, theo lô còn hạn/ưu tiên hết hạn sớm.
5. Kết thúc ngày ghi kết quả thật và giữ phần tồn còn hạn, xử lý lô hết hạn theo luật hiện có. Không coi tiền nhập kho là giá vốn đã dùng hoặc trừ mua hàng lần thứ hai vào lợi nhuận.
6. Trong hub chuẩn bị ngày kế tiếp, tab Chợ tiếp tục cho mua thêm → nhập Kho → mở ngày kế tiếp, dùng cùng tiền/tồn/tiến độ.

Onboarding vẫn **Bắt đầu → tutorial luyện tập → hub chuẩn bị Ngày 1, tab Chợ → người chơi mua hàng thật → mở quán**. Không bắt mua để vào tutorial và không tạo báo cáo/ngày bán giả cho phần luyện tập. Chợ luôn có lựa chọn mua thường; không biến tab này thành màn chỉ dẫn dùng hỏa tốc.

Yêu cầu khôi phục quyền mua chủ động không tự chốt lại điều kiện mở ca hoặc nhận đơn khi kho trống. Không suy diễn thành bắt buộc phải mua, tự cấp nguyên liệu hoặc bỏ các luật gameplay hiện có ngoài luồng mua được yêu cầu.

## Hỏa tốc là lựa chọn bổ sung trong ca

- Khi thiếu nguyên liệu trong ca, người chơi có thể đặt hỏa tốc; phải chọn/xác nhận, không tự đặt hoặc trừ tiền khi chỉ chạm ô.
- Hỏa tốc không thay tab Chợ, không phải cách mua duy nhất và không áp phụ phí/thời gian hỏa tốc lên mua thường trước ca/giữa các ngày.
- Quy tắc đã ghi trong [spec bếp](spec-kitchen-free-assembly-and-express.md) và cấu hình hiện có `src/config/kitchenEconomy.ts`: đơn giá **`ceil(giá Chợ của ngày × 1.6)`**; nhận sau **5 giây simulation gameplay**, có tiến độ. Pause/ẩn ứng dụng dừng giao hàng; nhận hàng một lần; hàng chưa giao chưa dùng được; giữ quy tắc chốt ngày khi còn giao hàng hiện có.
- Giá mua cơ sở lấy từ config của dự án; một số giá nguyên liệu mới đang tạm, không suy từ ảnh. Nếu khi triển khai không xác định được giá/phí/thời gian cho trường hợp cụ thể, báo rõ phần chưa chốt và chưa bật giao dịch đó; không tự đặt số mới.

## Phạm vi giao diện và dữ liệu lưu

- Khôi phục nội dung mua thật trong tab Chợ và các đường chuyển Chợ ↔ Kho ở giai đoạn chuẩn bị. Giữ hub năm tab, bảng treo, cụm tiền/cấp/đánh giá, footer và phong cách đã duyệt; chỉ sửa phần Chợ/luồng mua cần thiết.
- Hỏa tốc dùng modal bổ sung trong ca. Giữ bếp, hàng chờ, avatar, hai nút Đóng hộp/Giao bánh, phô mai và các phần UI khác.
- Giữ dữ liệu campaign đã lưu: tiền, ngày/tiến độ, lô kho/giá/hạn dùng, báo cáo, nâng cấp và customer memory. Không xóa database, reset campaign, cấp lại tiền/kho hoặc thay schema chỉ để khôi phục UI mua thường.
- Giữ ranh giới checkpoint, transaction, revision và retry hiện hành. Scene gửi intent, không tự sở hữu tiền/kho hoặc ghi IndexedDB; mua thường dùng nghiệp vụ mua/kho có sẵn. Yêu cầu này không cho phép tự thêm autosave mỗi tap hay lưu giữa ca.
- Bằng chứng hoàn thành luồng mua nằm trong spec triển khai và các kiểm tra tập trung, không đồng nghĩa bộ lọc Kho/gợi ý mua hoặc toàn bộ E03/E05 đã hoàn thành.

## Tiêu chí kiểm tra khi triển khai

| Given | When | Then |
| --- | --- | --- |
| Chuẩn bị Ngày 1, tiền/kho thật | Chọn nguyên liệu, số lượng và mua ở Chợ | Trừ đúng tiền, tạo/cập nhật lô Kho đúng lượng/giá/hạn dùng; không cần dùng hỏa tốc |
| Tiền không đủ hoặc chạm mua lặp | Xác nhận mua | Báo lý do hoặc xử lý một giao dịch theo quy tắc hiện có; không mất tiền/thêm kho lặp |
| Đã mua hàng và xem Kho | Mở quán, phối/nướng bánh | Giữ tiền/tồn khi vào bếp; bánh dùng đúng lô/loại/lượng thật, tiêu hao một lần |
| Thiếu nguyên liệu trong ca | Mở/hủy/xác nhận đặt hỏa tốc | Hủy không trừ tiền; xác nhận áp đúng giá ×1.6 làm tròn lên; trước5s chưa có hàng, đủ5s nhận một lần |
| Hỏa tốc đang giao | Pause rồi tiếp tục | Thời gian giao chỉ tăng khi simulation chạy |
| Ca kết thúc với tồn kho | Chốt ngày → Chợ chuẩn bị → mua thêm → Kho → mở ngày sau | Số liệu thật, tồn còn hạn được giữ; tiền/giá vốn không trừ hai lần, không reset trạng thái |
| Campaign cũ hợp lệ | Nạp/tiếp tục rồi thực hiện luồng mua mới | Giữ toàn bộ dữ liệu đã lưu và chính sách reload/checkpoint; lỗi lưu/retry không nhân đôi giao dịch |

Kiểm tra bắt buộc trọn luồng: **mua trước ca → nhập Kho → mở quán → dùng nguyên liệu → cuối ngày → mua chuẩn bị ngày sau → nhập Kho → mở ngày sau**. Đã kiểm tra bằng unit tiền/kho/lô/giá vốn và E2E tập trung cùng modal hỏa tốc; không chạy full browser matrix. Lệnh/kết quả và ảnh renderer thật được ghi trong [spec](spec-reference-market-purchases.md).
