# Epic 7 Context: Quán, thiết bị, tiện nghi, mở rộng và quảng bá

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Cho người chơi đầu tư vào quán bằng trang trí, thiết bị, tiện nghi, tu sửa/mở rộng và quảng bá, với tác dụng gameplay thật, chi phí rõ và tiến độ lưu nhất quán. Đây là phần kinh tế sau demo, phụ thuộc E05; nhân sự thuộc E08. Bonus Trang trí/Tiện nghi đã chốt, nhưng giá, vị trí, sức chứa, thiết bị mới, mở rộng và quảng bá còn thiếu quyết định nên chưa thể bật toàn bộ nghiệp vụ.

## Stories

- Story 7.1: Sở hữu và bố trí trang trí
- Story 7.2: Thiết bị và tiện nghi
- Story 7.3: Tu sửa và mở rộng
- Story 7.4: Hiệu ứng ngày từ đồ đang đặt
- Story 7.5: Giao dịch mua trong chuẩn bị, lưu và tương thích save

## Requirements & Constraints

- Mỗi loại đồ sở hữu một bản; mua không tự đặt. Chỉ mua/đặt/cất trong chuẩn bị. Xem/hủy không trừ tiền; thiếu tiền báo số còn thiếu; cất giữ sở hữu, không bán/hoàn tiền. Kiểm tra lại điều kiện trên trạng thái thật khi xác nhận.
- Trang trí tăng kỳ vọng khách: cây để bàn 3%, tranh pizza 5%, đèn trang trí 5%, bảng hiệu 8%, chậu cây lớn 5%, rèm cửa 3%. Tiện nghi tăng kiên nhẫn: ghế chờ 5%, Wi-Fi 8%, quạt đứng 5%, máy lạnh 10%, loa 5%; bàn ghế khách thêm 2 chỗ chờ riêng.
- Chỉ đồ đang đặt/kích hoạt có tác dụng. Cộng phần trăm trên gốc; quạt/máy lạnh lấy mức cao hơn. Cap khách 30%, kiên nhẫn 40%; toàn danh mục hiện đạt 29%/28%, không sửa item để chạm cap. Ví dụ gốc 60 giây với ghế và Wi-Fi thành 67.8 giây.
- Chốt bộ hiệu ứng khi mở ngày; mỗi khách dùng kiên nhẫn gốc của mình. Bonus khách phải nối scheduler thật, tăng kỳ vọng chứ không bảo đảm lượng khách cố định; giữ chính sách đầy hàng chờ/sức chứa. Không đổi đồ trong ca hoặc tự tăng giá, sao, tốc độ nướng.
- Chỗ chờ không tự đồng nhất với cap đơn/phiếu hoặc số avatar. Mở rộng không tự cho phép thay bố cục bếp. Chi phí mua thiết bị/nâng cấp là dòng tiền, không trừ lại trong lợi nhuận; lương chỉ xuất hiện khi có dữ liệu nhân sự E08 thật.
- Các quyết định còn thiếu phải được chốt trước khi bật chức năng: catalog ID/giá/điều kiện mua đồ mới; vị trí hợp lệ, vị trí lắp cố định và giới hạn bố trí; model chỗ chờ và quan hệ với cap đơn; cách áp bonus vào kỳ vọng scheduler; chỉ số/giá/nâng cấp tủ lạnh, bàn pizza và thiết bị mới; cấp/giá/điều kiện/diện tích/chỗ ngồi mở rộng; nguồn hư hỏng và sửa chữa. Giá nâng cấp lò/hàng chờ hiện có là tạm, không suy rộng thành bảng giá mới.
- Quảng bá vẫn thuộc E07: tờ rơi, giảm giá món mới và trang trí thu hút nhóm khách. Chưa có story hoặc bảng chi phí, thời hạn, nhóm đích, mức giảm giá, giới hạn/cách cộng với bonus khác; không tự tạo chương trình quảng bá hoặc lợi ích miễn phí.
- Kiểm tra tập trung nghiệp vụ, modal, gameplay và save: thiếu tiền/hủy/điều kiện sai, double-tap/retry, lưu lỗi, vị trí sai, mua chưa đặt, đặt/cất, công thức bonus/cap/sức chứa, reload và save cũ. Full browser matrix chỉ khi hoàn tất Epic 1 hoặc trước release.

## Technical Decisions

- Domain TypeScript thuần sở hữu tiền/đồ/bố trí/nâng cấp; mutation qua typed intent và `GameRuntime.dispatch`. Scene đọc selector/view model, không tự ghi database hoặc tính bonus bằng công thức riêng. Catalog có ID ổn định, nhóm, giá, asset, loại/giá trị hiệu ứng, nhóm không cộng dồn, vị trí và điều kiện; validate config một lần.
- Lưu sở hữu, đồ đang đặt/vị trí và cấp nâng cấp. Tính lại bonus từ catalog/bố trí; không lưu chỉ số gốc đã nhân rồi cộng tiếp khi reload.
- Mua đồ chuẩn bị bổ sung ranh giới lưu bền: tiền và sở hữu cùng kết quả atomic, transaction hoàn tất rồi UI báo thành công. Pending/lỗi chặn mở ngày; retry giữ định danh/payload, không trừ lần hai. Xác nhận đặt/cất/cấp phải khôi phục nhất quán. Schema/version, commit/revision và lịch ghi bố trí cần thiết kế trong 7.5; không xem snapshot hiện tại là đã hỗ trợ đồ mới.
- Giữ snapshot tiền/kho/tiến độ chung, không ghi mỗi tap/xem trước hoặc giữa ca. Ngày đã chốt bất biến; reload giữa ca vẫn về checkpoint ngày chưa chốt. Revision conflict yêu cầu tải lại, không merge/lùi ngày. Migration trên bản sao hợp lệ; save cũ mặc định chưa sở hữu/chưa đặt đồ mới, giữ tiền và tiến độ.
- Simulation clock/pause theo ownership hiện hành; modal trả lease của mình. Quyết định mới cho game tiếp tục khi rời tab và bỏ orientation gate thay hướng dẫn auto-pause cũ.

## UX & Interaction Patterns

- Giữ mốc UI đã duyệt và cập nhật mới: header/nền gỗ chung, preview Quán, sáu mục Menu & giá / Trang trí / Thiết bị / Tiện nghi / Mở rộng / Nhân viên, footer và bếp. Không tự đổi tab khác, số ô hoặc vị trí nút. Quán hiện có UI/điều hướng và nâng cấp lò/hàng chờ; UI sẵn không chứng minh nghiệp vụ mới hoàn tất.
- Chi tiết đồ có hình/tên/giá/tác dụng/sở hữu và hiệu quả hiện tại-dự kiến đúng cap. Mua → chọn vị trí hợp lệ → xem trước → xác nhận; hủy đặt giữ sở hữu chưa bonus. Đồ đặt phải hiện trong quán; không chồng lò/nút/vùng thao tác. Vị trí xung đột bố cục phải trình phương án để người dùng quyết định.
- Dùng kem–gỗ–viền đồng, nút/khung xác nhận chung, nền tối chặn input và vùng chạm tối thiểu 48 CSS px. Giá/sở hữu từ dữ liệu thật, không từ ảnh; preview chưa hỗ trợ ghi minh họa. Mục thiếu cấu hình rõ chưa mở; nút bật phải nối hành động thật.

## Cross-Story Dependencies

- E05 cung cấp kinh tế/campaign; E03/3.8 cung cấp tab Quán và sáu luồng UI. Không mở lại E02 hay coi chỉnh giá là nghiệp vụ E07.
- 7.5 phải tích hợp trước bật Mua/nghiệm thu 7.1–7.2; 7.4 phụ thuộc dữ liệu đồ đặt của 7.1–7.2 và quyết định scheduler/sức chứa. 7.3 cần thông số mở rộng và lưu cấp thống nhất.
- E06 có sự kiện ngày ảnh hưởng sinh khách; chính sách phối hợp với bonus cần rõ. E08 sở hữu tuyển/phân công/lương, không tạo phụ thuộc vòng ngược hoặc nhân viên giả trong E07. E09 dùng kết quả đầu tư/quảng bá cho cân bằng chiến dịch dài hạn.

### Epic 7 — triển khai phần đã chốt, 2026-10-04

Đã triển khai 11 món Trang trí/Tiện nghi giá 500–10.000 xu: mua một lần, đặt/cất ở vị trí cố định trong preview Quán, chỉ đồ đang đặt có bonus. Giữ sáu mục Quán, header/footer và bếp đã duyệt. Ca đóng băng hiệu ứng khi mở; bonus sinh khách chỉ nhân cơ hội thương mại tại quầy, bonus kiên nhẫn áp dụng khách trả tiền tại quầy (kể cả referral), không tăng hạn đơn app. Lò cấp 2/3 giá 2.000/5.000; mở rộng 4→6 giá 6.000.

Mua/đặt/cất/nâng cấp chuẩn bị staging trên candidate; commit thành công mới cập nhật chính runtime hiện tại, lỗi/retry không trừ trùng. Metadata lưu sở hữu/vị trí/giá thực trả; save cũ giữ tiền/kho/tiến độ và giá nâng cấp lịch sử. Không lưu giữa ca. Build, 110 unit và 7 E2E Chromium 360×640 đạt; ba review độc lập hoàn tất.

Bàn ghế 4.000 vẫn chờ chốt mô hình +2 chỗ đợi; mở rộng lần 2 giá 10.000 chờ sức chứa/bố cục. Thiết bị mới/quảng bá/hư hỏng chưa có luật. Toàn Epic7 vẫn in-progress. Ghi chú này thay các nhận định trước đây rằng đồ mới chưa có giá hoặc toàn bộ luồng mua chưa triển khai. Chi tiết: `_bmad-output/implementation-artifacts/spec-7-shop-development.md`.