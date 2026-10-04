---
title: 'Tab Quán — thiết kế đề xuất và các luồng quản lý'
date: '2026-10-04'
status: implemented-ui-existing-actions
scope: shop-ui-and-existing-management-actions
source: user
---

# Tab Quán — thiết kế đề xuất

## Cập nhật Epic 5 — 2026-10-04

Menu & giá có đủ tám pizza, ba thẻ mỗi trang; các món đã sở hữu cho chọn bán/chỉnh giá, món chưa có hiển thị giá mua và số tiền thiếu. Mua công thức chỉ trong chuẩn bị, có xác nhận/hủy; tiền và sở hữu lưu atomic. Lỗi lưu chặn mở ca, có thử lại, không mua/trừ lần hai. Phô mai/Nấm mở sẵn; quyền mở ở save cũ được giữ. Giá vốn dự kiến dùng giá mua thực tế của ngày chuẩn bị, gồm ưu đãi nhà cung cấp nếu đủ điều kiện. Giá mua/giá bán/định lượng là cấu hình tạm trong [spec Epic 5](spec-5-1-expanded-ingredient-and-recipe-catalog.md). Trang trí/Tiện nghi/Nhân viên chưa được triển khai thêm trong Epic 5; các sáu mục và bố cục Quán giữ nguyên.

**Đã triển khai giao diện theo yêu cầu người dùng ngày 2026-10-04:** trang Quán có hình minh họa và sáu mục, từng mục mở/quay lại được. Menu nối trình chỉnh giá hiện có; Thiết bị/Mở rộng nối nâng cấp lò/ô chờ hiện có, có xác nhận và giữ giao dịch/lưu atomic. Giá vốn dự kiến dùng giá nguyên liệu của ngày chuẩn bị và công thức hiện có, ghi rõ chưa trừ chi phí chung. Xem [spec triển khai](spec-stock-shop-missions-ui.md). Các món trang trí, tiện nghi, thiết bị mới và nhân viên chưa có cấu hình mua/lưu đầy đủ được ghi rõ chưa mở, không suy giá/chỉ số từ ảnh hoặc tạo giao dịch giả. Hình xem trước được ghi rõ là minh họa, không giả nhận sở hữu/bố trí thật.

## Trang chính

**Bổ sung 2026-10-04:** [Chức năng Trang trí/Tiện nghi](requirement-decoration-and-amenity-effects.md) chốt bonus từng đồ, cộng dồn, đặt/cất, kích hoạt ngày và mua có lưu atomic. Các ghi chú chưa chốt tác dụng trong tài liệu này chỉ còn áp dụng phần chưa được yêu cầu bổ sung xác định. Giá lấy cấu hình dự án, không ảnh; chưa xác định bảng giá đầy đủ trong lượt đối chiếu này, không tự đặt giá.

Có ảnh xem trước quán và sáu mục theo thứ tự:

1. **Menu & giá bán:** chọn món bán, chỉnh giá.
2. **Trang trí:** cây, tranh, đèn, bảng hiệu.
3. **Thiết bị:** lò, tủ lạnh, bàn làm pizza.
4. **Tiện nghi:** ghế chờ, Wi-Fi, máy lạnh, loa.
5. **Mở rộng quán:** tu sửa, tăng diện tích/chỗ ngồi.
6. **Nhân viên:** thuê, phân công, xem tiền lương.

Trang chính là phần đề xuất riêng cho tab Quán, không cho phép đổi các tab khác, bếp hoặc menu chính. Ảnh xem trước phản ánh sở hữu/bố trí thật khi phần đó đã triển khai; trạng thái chưa hỗ trợ phải thể hiện rõ.

## Chỉnh giá

**Chọn món → xem giá vốn và giá hiện tại → chỉnh giá → cảnh báo nếu quá cao → lưu.**

- Áp dụng **từ ngày bán tiếp theo**; cần phân biệt giá đang áp dụng với giá đã lưu chờ ngày sau. Không đổi giá đang bán giữa ngày khi lưu.
- **Đơn đã nhận giữ nguyên giá lúc đặt**, không tính lại theo giá vừa chỉnh.
- Giá vốn hiển thị lấy từ dữ liệu/định lượng thực theo quy tắc hiện hành; chưa có dữ liệu thì không bịa con số.
- **Lãi dự kiến mỗi bánh chưa trừ chi phí chung của quán**; ghi rõ để không nhầm với lợi nhuận ngày.
- Mức “quá cao” và cách cảnh báo phải dùng quy tắc phản ứng khách đã chốt hoặc chốt riêng nếu còn thiếu; không tự đặt ngưỡng mới từ ảnh.
- Không tự suy ra chính sách giá cho lần mở Ngày 1 chưa có ngày bán trước; cần làm rõ trường hợp này khi viết story triển khai.

## Mua đồ

**Chọn mục → chọn đồ → xem giá, công dụng, điều kiện → xác nhận mua.**

- Kiểm tra đủ tiền trước khi mua; không cho tiền âm.
- **Trừ tiền và ghi nhận sở hữu đúng một lần**, kể cả chạm lặp/xác nhận lặp. Thao tác xem đồ hoặc hủy xác nhận không tạo giao dịch.
- Thiếu tiền: thông báo **số tiền còn thiếu** từ giá/tiền thật.
- Đồ đã sở hữu hiển thị rõ, **không bắt mua lại** cùng quyền sở hữu. Không tự suy ra nâng cấp là mua lại cùng món đồ.
- Trang trí có **“Đặt vào quán / Cất đi”**. Cất đi không tự bán/hoàn tiền hoặc xóa quyền sở hữu.
- Thiết bị và nâng cấp áp dụng theo **quy tắc gameplay đã chốt**; chưa chốt thì chưa cho hiệu ứng hoạt động.
- **Lưu quyền sở hữu, bố trí và cấp nâng cấp cùng tiến độ game**. Thiết kế tích hợp phải tuân thủ checkpoint/atomic commit hiện hành; không tự thêm lưu sau mỗi cú chạm. Cách ghi nhận giao dịch mua tại ranh giới lưu cần xác định trong story trước khi triển khai.
- Trang trí/Tiện nghi có yêu cầu mới: giao dịch mua trong chuẩn bị ghi tiền/sở hữu cùng lúc, **lưu thành công rồi cập nhật UI**, lỗi không mất tiền thiếu đồ. Đây là bổ sung ranh giới lưu ngoài tạo campaign/chốt ngày, không phải chỉ cập nhật RAM. Đặt/cất khôi phục nhất quán theo hợp đồng cần chi tiết hóa; xem tài liệu bổ sung. Không mua/thay đồ trong ca; mua chưa tự có hiệu ứng.

## Phân biệt công dụng

| Nhóm | Vai trò |
| --- | --- |
| Trang trí | Thay hình và tăng kỳ vọng khách ghé theo bonus đồ đang đặt đã chốt |
| Thiết bị | Hỗ trợ công đoạn làm pizza |
| Tiện nghi | Tăng kiên nhẫn, bàn ghế +10% kiên nhẫn, không tăng sức chứa |
| Mở rộng | Tu sửa, tăng diện tích/chỗ ngồi theo thông số được chốt |
| Nhân viên | Thuê, phân công và tiền lương theo hệ thống nhân sự |

**Chỉ số, giá, điều kiện và tác dụng cụ thể cần chốt riêng.** Không tự cấp bonus kiên nhẫn, tốc độ nướng, sức chứa, doanh thu hoặc thưởng từ việc một vật xuất hiện trong ảnh.

## Phân epic theo chỉ định mới của người dùng

- **Giá và phản ứng khách: E02–E03.** E02 đã hoàn tất được dùng làm nguồn quy tắc; công việc UI/chỉnh giá ngày kế tiếp bổ sung vào E03, không mở lại E02 chỉ vì thêm tab.
- **Trang trí, thiết bị, tiện nghi, mở rộng: E07.**
- **Nhân viên: E08.** Chỉ định này chuyển phạm vi nhân sự trước đây nằm E07 sang E08; vẫn giữ phạm vi câu chuyện/khách đặc biệt vốn có của E08.
- UI trang chính/sáu luồng điều hướng được ghi ở **3.8**; chỉnh giá ở **3.9**; E07/E08 chứa nghiệp vụ cần chốt, không được coi đã hoàn thành từ bản UI.

## Kiểm tra khi triển khai

- Đủ sáu mục, xem trước và điều hướng/quay lại đúng; tính năng chưa hỗ trợ hiển thị rõ, không có thao tác mua/thuê giả.
- Lưu giá ngày sau không đổi đơn hiện có/giá ngày hiện tại; cảnh báo giá và lãi dự kiến dùng dữ liệu thật.
- Mua thành công/thiếu tiền/hủy/chạm lặp/đã sở hữu; đặt/cất trang trí giữ sở hữu; quyền sở hữu/bố trí/nâng cấp khớp tiến độ sau lưu và tải lại theo hợp đồng được chốt.
- Giữ style hiện hành và trạng thái dữ liệu thật; chỉ kiểm tra phần liên quan, chưa chạy build/test ở lượt ghi tài liệu này.

### Epic 7 — triển khai phần đã chốt, 2026-10-04

Đã triển khai 12 món Trang trí/Tiện nghi giá 500–10.000 xu: mua một lần, đặt/cất ở vị trí cố định trong preview Quán, chỉ đồ đang đặt có bonus. Giữ sáu mục Quán, header/footer và bếp đã duyệt. Ca đóng băng hiệu ứng khi mở; bonus sinh khách chỉ nhân cơ hội thương mại tại quầy, bonus kiên nhẫn áp dụng khách trả tiền tại quầy (kể cả referral), không tăng hạn đơn app. Lò cấp 2/3 giá 2.000/5.000; mở rộng 4→6 giá 6.000.

Mua/đặt/cất/nâng cấp chuẩn bị staging trên candidate; commit thành công mới cập nhật chính runtime hiện tại, lỗi/retry không trừ trùng. Metadata lưu sở hữu/vị trí/giá thực trả; save cũ giữ tiền/kho/tiến độ và giá nâng cấp lịch sử. Không lưu giữa ca. Build, 110 unit và 7 E2E Chromium 360×640 đạt; ba review độc lập hoàn tất.

Bàn ghế 4.000 tăng10% kiên nhẫn, mua/đặt/cất được; không tăng sức chứa. Chỉ mở rộng quán tăng4→6 khách, tối đa6; giữ6 ô khách cố định, không avatar cuộn. Mở rộng lần2 giá10.000 chưa có tác dụng được chốt và chưa bật mua. Thiết bị mới/quảng bá/hư hỏng chưa có luật. Toàn Epic7 vẫn in-progress. Ghi chú này thay các nhận định trước đây rằng đồ mới chưa có giá hoặc toàn bộ luồng mua chưa triển khai. Chi tiết: `_bmad-output/implementation-artifacts/spec-7-shop-development.md`.