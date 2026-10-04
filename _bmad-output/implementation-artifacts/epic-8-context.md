# Epic 8 Context: Nhân viên, câu chuyện và khách đặc biệt

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Mở rộng kinh tế, quan hệ và tiến độ qua nhân viên thật, chuỗi khách quen, nhiệm vụ ẩn và khách đặc biệt. Nghiệp vụ nhân sự thuộc Epic8; giao diện Quán không tự chứng nhận đã thuê được người. Người dùng đã chốt8.1 bốn loại nhân viên vai trò cố định, lương200/ngày, phíthuê2000, ngày8, mỗi loại1; đào tạo/mệt/giữ người và nội dung truyện vẫn chưa có luật.

## Stories

- Story 8.1: Nhân viên trong tab Quán

Chưa có story đánh số riêng cho các nhánh truyện, nhiệm vụ ẩn, khách nổi tiếng hoặc tình huống giúp đỡ mở rộng; cần tách sau khi chốt phạm vi.

## Requirements & Constraints

- Nhân sự đã chốt: thuê và xem lương; bốn vai trò cố định phụ bếp, thợ nướng, đóng hộp, giao hàng. Không phân công lại. Đào tạo, tăng lương, mệt mỏi và giữ người là phạm vi dự kiến, chưa có chỉ số hay quy tắc được duyệt.
- Luồng giao đã chốt: chưa thuê nhân viên thì book shipper; có nhân viên được giao việc thì làm món, đóng hộp và giao. Bấm Giao bánh hoàn tất đơn/nhận tiền ngay; không thêm thời gian chuyến giao. Nhân viên trở về sau20s, mưa30s, rồi nhận đơn tiếp; khi đang về chưa chốt ngày. Availability giao hàng đóng băng đầu ca, save cũ không tự có người.
- Câu chuyện khách quen nhiều ngày có lựa chọn và đường mở công thức gia truyền. Giúp đỡ có thể từ chối; hậu quả phải hiểu trước. Đơn giúp miễn phí không được giả thành doanh thu, XP hay thành tích thương mại.
- Nhiệm vụ ẩn kích hoạt qua nổi tiếng, món đã mở hoặc phục vụ tốt nhiều ngày; trước khi mở không lộ mục tiêu. Khi mở phải nêu điều kiện và thời hạn. Khách nổi tiếng có yêu cầu riêng; phân biệt với VIP. Không sinh món không có đường mở khóa; phần thưởng không nhận lặp sau tải lại. Nội dung này không bắt buộc để hoàn tất ngày30.
- Giữ tiền, kho FEFO, công thức đã sở hữu, đơn hàng, XP và dữ liệu chiến dịch cũ. Lương/thuê người phải dùng giá thật đã duyệt, không suy từ hình minh họa. Không thay Chợ mua chủ động hoặc luật hỏa tốc.
- Sức chứa chỉ do mở rộng quán: mặc định4, tối đa6. Giữ6 ô khách cố định; bàn ghế chỉ tăng10% kiên nhẫn. Không đề xuất thêm hàng chờ phụ, avatar cuộn hoặc tác dụng cho mở rộng lần2.

### Các quyết định còn thiếu

Đã duyệt tuyển từ ngày8, phí2000/người, lương200/người/ngày cuối ngày, mỗi loại tối đa1 và bốn vai trò cố định; thiếu lương cảnh báo số thiếu và giữ khoản chưa trả. Chưa duyệt sa thải/đào tạo/mệt/giữ người. Chưa chốt nhánh/điều kiện/thưởng truyện, khách nổi tiếng/VIP và các nhiệm vụ ẩn. Mốc ngày8–14 nhân sự và15–21 truyện là đề xuất phân kỳ, không phải lịch mở khóa đã duyệt.

Người dùng thay đề xuất cũ: lương200/người/ngày, nghề cố định; ngày8/phí2000/mỗi loại1 đã được xác nhận. Công đoạn nhanh và đưa thời gian vào config; lò vẫn theo cấp hiện có. Nhân viên giao mỗi chuyến1đơn, trở về20s/mưa30s rồi mới nhận tiếp; giao app không phíshipper. Cuối ngày đủ tổnglương thì trả; thiếu thì chưa trả, giữ nghĩa vụ và báo sốthiếu. Lương phát sinh và tiền thực trả đối soát riêng để nợ cũ không trừ vào profit ngày mới lầnhai.

## Technical Decisions

- Phaser/TypeScript trình bày; luật kinh tế, nhân sự và kết quả đơn thuộc domain/runtime. Scene không trực tiếp trừ tiền hoặc phát thưởng. Command có ID ổn định; double-tap/retry không thực hiện nghiệp vụ hai lần.
- IndexedDB native, tương thích checkpoint cũ; kiểm tra schema, ID, giới hạn và liên kết trước khi khôi phục. Không clamp tiền/kho hay tự reset save. Không cài thêm thư viện.
- Không lưu giữa ca. Tuyển trong chuẩn bị commit tiền/roster atomic; nghề cố định theo loại thuê. Commit cuối ngày ghi kết quả, lương phát sinh/thực trả/khoản chưa trả và cờ thưởng nhất quán; retry cùng kết quả không tính lại.
- Chỉ Pause/modal/save có lease mới dừng simulation; rời tab vẫn chạy và đồng bộ thời gian thực. Đóng một modal chỉ trả lease của chính nó. Đừng khôi phục yêu cầu auto-pause visibility/orientation cũ.

## UX & Interaction Patterns

Giữ header chung, nền gỗ, năm tab, sáu mục Quán, theme và vị trí nút đã duyệt. Đi từ Quán → Nhân viên → thuê theo nghề/xem lương; dữ liệu chưa có quy tắc phải ghi rõ chưa mở, không tạo nhân viên giả. Dùng references nhân viên làm minh họa, không lấy số liệu ảnh làm luật. Xác nhận/hủy dùng khung hai nút, thông báo dùng một nút, lớp tối chặn input phía sau; giữ đóng/quay lại. Không đổi bếp, sáu ô khách, tám ô món hoặc hai nút Đóng hộp/Giao bánh. Kiểm tra tập trung360×640; không tự redesign hoặc chạy full browser matrix.

## Cross-Story Dependencies

Nhân sự nối luồng Quán đã có, sổ thu chi và checkpoint; nhân viên giao nối hợp đồng giao hàng Epic6. Truyện/khách đặc biệt phụ thuộc công thức và tiến độ Epic5, delivery/events Epic6 và đồ Quán Epic7 theo yêu cầu từng nhánh. Các quyết định còn thiếu của Epic7 không cấp quyền tự invent hoặc chặn mọi phần độc lập Epic8. Chiến dịch30ngày Epic9 dùng kết quả Epic8 nhưng chưa nằm trong phạm vi hiện tại.
