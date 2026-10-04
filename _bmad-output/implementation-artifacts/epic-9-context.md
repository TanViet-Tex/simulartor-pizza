# Epic 9 Context: Chiến dịch 30 ngày

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Cho người chơi đi qua chiến dịch ngày 1–30, thấy tiến độ thật, xem tổng kết toàn chiến dịch và chủ động bắt đầu lượt mới. Phạm vi người dùng vừa duyệt chỉ gồm khung 30 ngày, nhãn tiến độ, tổng kết cuối và restart có xác nhận; bảo toàn luật kinh tế, tiến độ và save hiện có. Lịch mở khóa, XP mới, VIP, nhiệm vụ khó và cân bằng dài hạn vẫn thuộc phần chưa duyệt của Epic 9; không dùng mục tiêu toàn epic để tự triển khai chúng.

## Stories

- Story 9.1: Khung chiến dịch 30 ngày, tiến độ và tổng kết chiến dịch.
- Story chưa đánh số: Lịch mở hệ thống và balance dài hạn.
- Story chưa đánh số: VIP, đơn lớn và nhiệm vụ cuối chiến dịch.

## Requirements & Constraints

- Khung chiến dịch có 30 ngày. Hoàn tất ngày 30 dẫn tới kết thúc chiến dịch, không tạo ngày 31 chơi được. Thiếu vốn trước đó vẫn có thể kết thúc theo luật hiện có; không thêm vay, cứu trợ hoặc thay điều kiện vốn để bảo đảm đủ 30 ngày.
- Nhãn tiến độ phản ánh ngày và trạng thái thật; mở bảng/reload không tăng tiến độ.
- Ngày đã chốt bất biến: không chọn ngày cũ, replay để kiếm thêm tiền/thưởng hoặc bỏ qua ngày. Mục tiêu không đạt hoặc nhiệm vụ ẩn bỏ lỡ không tự khóa đường tới kết thúc.
- Tổng kết dùng tiền mặt, lợi nhuận tích lũy, cấp/XP, uy tín, quan hệ và nhiệm vụ thật. Phân biệt số dư với doanh thu/lợi nhuận; mở/reload không cộng thưởng lại.
- Giữ giá, FEFO, công thức, cap4/6, bonus đồ, lương/nợ và app/shipper hiện có. Không thêm VIP, XP, nhiệm vụ, thiết bị, thưởng kết thúc hoặc cân bằng mới.
- Save cũ phải giữ tiền, kho, ngày, lịch sử và các quyền sở hữu đã lưu. Không tự reset hoặc sửa dữ liệu cho vừa giới hạn mới. Những save vượt ngày 30 từ cơ chế chơi nối tiếp trước đây cần chính sách tương thích rõ trong story; không tự cắt lịch sử hay lùi ngày.
- Restart cần xác nhận; hủy giữ chiến dịch, retry không reset hai lần. Dùng khởi tạo/onboarding hiện có, không mang tiền/thưởng cũ hoặc xóa settings.
- Test tập trung ngày29/30, thiếu vốn, reload, save cũ, restart cancel/retry/conflict và tổng kinh tế. Không full browser matrix; playtest cân bằng dài hạn thuộc phạm vi sau.

## Technical Decisions

- Domain xử lý chiến dịch/kinh tế; scene gửi ý định và hiển thị, không trực tiếp reset, cộng tiền hoặc ghi IndexedDB.
- Checkpoint có phiên bản; chỉ tiếp tục mốc mới nhất. Không lưu giữa ca hoặc serialize scene; reload về checkpoint trước ca.
- Chốt kết quả một lần, ghi báo cáo/checkpoint atomic. Ngày cuối lưu terminal/tổng kết; chỉ công nhận lưu sau transaction hoàn tất.
- Lỗi giữ checkpoint cũ/kết quả pending, chặn hành động phụ thuộc; retry cùng commit không tính lại kinh tế. Conflict không tự merge; restart bảo vệ giao dịch đang lưu.
- Save hỏng/không tương thích báo rõ và giữ bản gốc. Migration kiểm tra trên bản sao trước thay bản chính; không clamp ngày/reset.
- Modal/save chặn input bằng pause lease riêng, chỉ giải phóng lease của mình.

## UX & Interaction Patterns

- Tuân thủ `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md` và AGENTS hiện hành. Giữ bố cục, màu, art, số ô, nút, menu/bếp; nhãn tiến độ không cho phép thiết kế lại.
- Giữ hub, cụm thông tin, năm tab, thẻ/vùng chuẩn bị đã duyệt; chỉ cập nhật dữ liệu. Không thêm tab/thẻ/reflow; xung đột bố cục cần người dùng chọn phương án.
- Sau ngày cuối cho xem kết quả/restart xác nhận bằng khung chung, không mở ngày31. Hủy về kết quả; saving/error/retry rõ và khóa hành động phụ thuộc.
- Không tạo đánh giá/thành tích giả. Reload terminal vẫn kết thúc, không mở ca cuối.

## Cross-Story Dependencies

- Kế thừa E05 công thức/save, E06 app/sự kiện, E07 đồ/nâng cấp, E08.1 roster/lương; không phụ thuộc hoàn tất quảng bá, thiết bị hoặc truyện chưa có luật.
- Tổng kết phụ thuộc báo cáo/checkpoint; restart phụ thuộc terminal, xác nhận và transaction tạo chiến dịch mới.
- XP/mở khóa, VIP/nhiệm vụ cần thiết kế riêng, không chặn khung vừa duyệt. Khung hoạt động không đồng nghĩa toàn Epic9 hoàn thành.
