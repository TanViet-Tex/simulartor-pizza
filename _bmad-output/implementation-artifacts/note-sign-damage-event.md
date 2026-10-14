# Bảng hiệu bị phá — 2026-10-14

Theo yêu cầu người dùng, thay tên hiển thị “Sự kiện A” bằng “Bảng hiệu bị phá”. Thông báo giải thích trẻ con ngoài phố nghịch phá bảng hiệu và chi200xu thay bảng mới; vẫn hiển thị số dư và hướng dẫn khi tiền âm. Thu chi ghi “Thay bảng hiệu bị phá:200xu”.

Chỉ đổi nội dung hiển thị; mã sự kiện A, xác suất10%, khoảng cách tối thiểu3ngày, khoản trừ200xu, checkpoint và xử lý pause giữ nguyên. Không thêm hỏng thiết bị hay cơ chế sửa chữa mới.

Kiểm tra: build production đạt; E2E tập trung kiểm thông báo, xác nhận, số dư âm, báo cáo và khoản chi sau lưu.

Fixture E2E cũ mua50phần đế bánh dựa trên giá cũ; điều chỉnh75phần để giữ cùng mốc50xu trước sự kiện theo giá6xu hiện tại. Thu chi hiện vẽ nhãn và số riêng, nên kiểm tra nhãn khoản chi mới và đối chiếu200xu trong report thay vì tìm nguyên chuỗi cũ.

Kết quả cuối: build và1E2E Chromium360×640 đạt. Ảnh thông báo đã kiểm tra: nội dung và nút vừa khung, không cắt chữ. Ảnh lưu tại ui-baseline/sign-damage-event-2026-10-14/{notice,finance}.png.
