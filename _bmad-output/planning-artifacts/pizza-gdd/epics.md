# Epics thiết kế - Pizza GDD v0.2

### Thay đổi người dùng — 2026-10-04: bỏ demo3ngày, mua công thức

Người dùng yêu cầu bỏ kết thúc bắt buộc ngày 3, mua công thức bằng tiền và hoàn tất Epic 5. Đã triển khai catalog 19 nguyên liệu/8 pizza, sở hữu công thức lưu atomic, gợi ý mua toàn menu, tiếp ngày 4+, nhà cung cấp quen và khách quay lại/referral. Save cũ giữ tiền/kho/công thức đã mở, không reset campaign. Giá/định lượng và quy tắc nối tiếp là cấu hình tạm cần playtest trong [spec Epic 5](../../implementation-artifacts/spec-5-1-expanded-ingredient-and-recipe-catalog.md), không có nghĩa đã có đủ cốt truyện 30 ngày. Các đoạn baseline demo phía dưới là lịch sử trước thay đổi này.

Quyết định ngày2026-10-04: bỏ lời nhắc xoay điện thoại về chiều dọc và pause/chặn Tiếp tục theo orientation. Giữ các pause khác và bố cục360×640 FIT hiện tại; bố cục ngang sẽ được cập nhật theo yêu cầu riêng. Quyết định này thay các yêu cầu orientation gate cũ, không mở lại epic đã hoàn tất. Xem [spec](../../implementation-artifacts/spec-remove-portrait-gate.md).

Trạng thái: người dùng đã duyệt cùng GDD v0.2 làm đầu vào kiến trúc. Đây là chia nhóm thiết kế, chưa phải workflow tạo implementation stories. Demo ba ngày và luật/số liệu v0.2 là baseline đã duyệt, vẫn cần playtest. Không sửa code game cho đến khi người dùng duyệt kiến trúc.

## E01 - Vòng lặp làm và giao pizza

Demo; P05, nền cho P01–P03. Trụ cột phục vụ. Không có phụ thuộc epic.

- Người chơi đọc phiếu, chọn nguyên liệu, nướng và giao một pizza; phản hồi giải thích đúng/sai/sống/cháy.
- Khách thường/vội/khó tính tự vào và tự tạo phiếu hợp lệ; không có Accept/Decline hoặc pause nhận đơn.
- Người chơi xử lý đơn mang đi có bước đóng hộp; tiền chỉ được thu một lần cho phiếu đã giao.
- Người chơi tạm dừng, tắt âm thanh và chơi hướng dẫn; đồng hồ không chạy khi pause.

Chấp nhận thiết kế: đủ chu trình nhận → làm → giao → kết quả; phiếu hết giờ không thu tiền; một bánh/một lò, tối đa ba phiếu theo GDD. Ưu tiên điện thoại/cảm ứng/nhịp thư giãn đã được duyệt: thao tác chạm không cần hover/đa chạm, vùng bấm ít nhất 48×48 CSS px, tự pause khi đổi ứng dụng/khóa màn hình; thời gian chờ/lấy bánh theo GDD.

## E02 - Khách và uy tín

Demo; P01, P03. Trụ cột phục vụ và quan hệ. Phụ thuộc E01.

- Người chơi nhận biết bốn nhóm khách bằng yêu cầu, ngưỡng giá và thời gian chờ.
- Khách vội/khó tính khác ở kiên nhẫn và mức phạt; luồng tự tạo đơn giống khách thường.
- Người chơi xử lý lựa chọn riêng Đồng ý giá giảm / Từ chối giá cho khách mặc cả trước khi tạo phiếu, thấy giá cuối.
- Người chơi xem sao, uy tín, lý do thay đổi và khách giới thiệu có giới hạn.

Chấp nhận thiết kế: điểm chặn trong 1–5, uy tín 0–100; không phạt khách rời vì đầy hàng chờ; sai món của khách khó tính được phân biệt.

## E03 - Chợ và sổ thu chi

### Đính chính luồng mua — 2026-10-04, chỉ sửa tài liệu

Giữ tab **Chợ** mua chủ động trước ca và giữa các ngày: chọn mua → trừ tiền một lần → nhập **Kho** → mở quán → ca dùng tồn đã mua. Hỏa tốc chỉ bổ sung khi thiếu nguyên liệu trong ca, không thay Chợ hoặc là cách mua duy nhất. Quy tắc hỏa tốc hiện có: `ceil(giá Chợ ngày × 1.6)`, nhận sau5s simulation, pause dừng giao; thiếu quy tắc cụ thể phải báo rõ, không tự đặt số. Giữ dữ liệu campaign/checkpoint, không reset tiền/kho/tiến độ hay tự thêm lưu mỗi tap. [Yêu cầu chi tiết](../../implementation-artifacts/requirement-market-stock-and-express-flow.md).

Bổ sung vào phạm vi **3.4 (Chợ/hub/luồng)** và phối hợp **3.7 (Kho)**: khôi phục nội dung mua thường cùng dữ liệu thật, giữ bố cục hub/bếp đã duyệt. Bắt buộc kiểm tra **mua trước ca → nhập Kho → mở quán → dùng nguyên liệu → cuối ngày → mua chuẩn bị ngày sau → nhập Kho → mở ngày sau**, cùng tiền/lô/giá vốn và tương thích save cũ. Đây là yêu cầu chưa triển khai; không mở lại epic đã hoàn tất hoặc nâng trạng thái sprint chỉ vì sửa tài liệu.

Demo; P02, P08. Trụ cột kinh tế. Phụ thuộc E01; kết hợp E02 cho giá bán.

- Người chơi mua nguyên liệu với giá theo ngày, thấy số lượng/hạn dùng và tiền thuê dự kiến.
- Người chơi không thể bán món thiếu nguyên liệu; đơn giữ nguyên liệu, làm bánh tiêu hao, hủy/đơn hết giờ giải phóng phần chưa dùng.
- Người chơi xem dòng tiền, giá vốn, tồn kho, hủy hàng và lợi nhuận riêng biệt cuối ngày.

Chấp nhận thiết kế: tiền không âm do mua hàng; không trừ mua hàng hai lần; lương/sửa chữa 0 trong demo được giải thích; lô hết hạn bị loại đúng ngày.

### Công việc bổ sung chưa làm — yêu cầu 2026-10-04

Ưu tiên **giao diện trước, kèm các luồng theo giao diện**. Các mục dưới là backlog được bổ sung vào E03 đang triển khai, không mở lại E02 đã hoàn tất và không đánh dấu chúng ready/done. Chưa code hoặc xem ảnh `references`; khi người dùng yêu cầu làm mới xem đúng mẫu. Đây là ghi phạm vi/thứ tự, chưa thay thế story chi tiết đủ điều kiện triển khai.

| Story dự kiến | Phạm vi và luồng | Phụ thuộc / tiêu chí chính |
| --- | --- | --- |
| **3.4 — Giao diện hub và các luồng theo mẫu** | Khi được yêu cầu làm, đọc ảnh trong `references`, xác định giao diện từng phần và trạng thái; nối Tổng kết ↔ Chợ ↔ Kho, mở/đóng modal, Kho → Chợ. Giữ tutorial → hub Chợ → mở Ngày 1 và chốt ngày thật → chuẩn bị → mở ngày kế tiếp. | Làm trước các mục mới còn lại. Chỉ sửa vùng người dùng yêu cầu; ảnh không tự duyệt thiết kế lại toàn màn. Chốt hành vi trước ca/chưa có dữ liệu, thiếu hàng, ngày kết thúc; giữ save/pause/input. Không tạo số liệu giả hoặc tự tăng ngày. |
| **3.5 — Khách nói gì và modal đánh giá ngày** | Thẻ giữ 2 đánh giá gần nhất → “Xem tất cả ›” → “Đánh giá ngày {day}” → danh sách cuộn → × đóng. | Dùng kết quả E02 hiện có, không sửa cách chấm sao. Trung bình/tổng lượt từ toàn bộ đánh giá đúng ngày; avatar/tên/sao/nhận xét thật; nền tối chặn input; 0/1/2/nhiều đánh giá đều hợp lệ. [Yêu cầu](../../implementation-artifacts/requirement-day-reviews-modal.md). |
| **3.6 — Chi tiết lợi nhuận và modal thu chi ngày** | “Chi tiết ›” trên “Lợi nhuận hôm nay” → “Thu chi ngày {day}” → nội dung cuộn → × đóng. | Dùng sổ E03 hiện có: lợi nhuận, doanh thu theo món/số lượng, giá vốn, chi phí khác, dòng tiền, số dư đầu/cuối. Nhập kho tách giá vốn; hao hụt/bánh cháy tính một lần; không đổi cách tính tiền. Nếu thiếu dữ liệu phân rã, ghi khoảng trống và bổ sung dữ liệu trong đúng phạm vi, không suy đoán số. Build và kiểm tra số liệu/modal. [Yêu cầu](../../implementation-artifacts/requirement-day-finance-modal.md). |
| **3.7 — Kho nguyên liệu, bộ lọc và xem lô** | Kho → Tất cả/Sắp hết/Sắp hết hạn → chọn nguyên liệu → xem lô/hạn dùng → trở về; “Đi chợ mua thêm” → Chợ. | Thiết kế quản lý đủ 19 mục đã chốt, icon/tên/lượng dùng được/hạn dùng. Trình bày UI/luồng trước; hoàn tất dữ liệu đủ 19 phụ thuộc **5.1**, gợi ý mua phụ thuộc **5.2**. Giữ dùng lô gần hết hạn, không dùng hàng hết hạn; phân biệt hàng giữ cho đơn. Ngưỡng lọc còn phải chốt. Không đánh dấu hoàn tất chỉ vì có UI. [Yêu cầu](../../implementation-artifacts/requirement-stock-and-purchase-suggestions.md). |

Thứ tự ưu tiên: **3.4 → 3.5/3.6 → phần UI và luồng 3.7 → 5.1 → 5.2 → hoàn tất tích hợp/kiểm tra 3.7**. Các modal và hub giữ kem–gỗ–viền đồng, vừa 360×640, thao tác nền bị chặn khi modal mở. UI làm trước không đồng nghĩa được giả dữ liệu thương mại: dữ liệu có sẵn dùng thật; phần chưa hỗ trợ thể hiện chưa mở/chưa có dữ liệu và chưa cho thao tác nghiệp vụ tương ứng.

### Tab Quán — bổ sung backlog 2026-10-04

- **3.8 — Trang chính Quán và sáu luồng điều hướng:** ảnh xem trước, Menu & giá bán / Trang trí / Thiết bị / Tiện nghi / Mở rộng quán / Nhân viên. UI và luồng được chuẩn bị trong nhóm giao diện E03 trước dữ liệu nghiệp vụ E07/E08; chức năng chưa triển khai có trạng thái rõ và chưa cho giao dịch. Không suy ra chỉ số/giá từ ảnh. [Yêu cầu](../../implementation-artifacts/requirement-shop-tab.md).
- **3.9 — Chỉnh menu/giá cho ngày bán tiếp theo:** chọn món → giá vốn/giá hiện tại → chỉnh → cảnh báo quá cao → lưu. Giá mới áp dụng ngày sau, đơn đã nhận giữ giá lúc đặt; lãi dự kiến mỗi bánh chưa trừ chi phí chung. Dùng quy tắc phản ứng khách E02; cần chốt cách xử lý giá mở Ngày 1 và dữ liệu giá chờ ngày sau, không đổi công thức tiền hoặc mở lại E02.
- Thứ tự ưu tiên UI bổ sung: **3.4 → 3.5/3.6 → UI/luồng 3.7/3.8 → 3.9 khi hợp đồng giá đã chốt**. Nghiệp vụ E05/E07/E08 hoàn tất theo phụ thuộc và quyết định còn thiếu; không tuyên bố UI đồng nghĩa nghiệp vụ đã chạy.

## E04 - Demo ba ngày và quan hệ đầu tiên

Demo; P07, P10, P11, P14, P15, P16. Trụ cột tiến độ và quan hệ. Phụ thuộc E01–E03.

- Người chơi hoàn thành ba ca có lịch khách và mục tiêu khác nhau, rồi xem tổng kết demo.
- Người chơi nhận XP, mở công thức ở ngày kế tiếp, hoàn thành một nhiệm vụ thường.
- Người chơi gặp một khách quen, giúp/từ chối và thấy kết quả quan hệ.
- Help / Decline chỉ xuất hiện khi khách quen xin giúp theo cốt truyện; khách quen mua hàng vẫn tự tạo đơn.
- Người chơi tiếp tục từ ngày chưa hoàn tất; nếu thiếu vốn sau khi chốt ngày thì chiến dịch kết thúc. Ngày đã hoàn tất không thể chơi lại.

Chấp nhận thiết kế: thất bại mục tiêu không chặn ngày sau; không có đơn món khóa; kết thúc ở ngày 3; tải lại trong ngày chưa chốt trở về checkpoint đầu ngày và bỏ mọi thay đổi RAM sau checkpoint. Không có chọn ngày hoặc quay lại ngày đã chốt; đơn giúp đỡ chỉ thay đổi quan hệ, không cộng doanh thu/XP/đánh giá hoặc tiến độ nhiệm vụ thương mại.

## E05 - Kinh tế và khách dài hạn

Sau demo; P01–P03, P08. Trụ cột kinh tế và phục vụ. Phụ thuộc E04.

- Người chơi mở nhà cung cấp quen với giá tốt hơn.
- Người chơi quan sát quay lại/giới thiệu chịu ảnh hưởng giá, tốc độ và chất lượng.
- Người chơi theo dõi tồn kho, lợi nhuận và nhu cầu qua nhiều ngày với giới hạn công suất.

Điều kiện trước triển khai: chốt bảng giá dài hạn, giảm giá nhà cung cấp, tỷ lệ quay lại và giới thiệu; kiểm tra khả năng phục hồi sau một ngày lỗ.

### Công việc bổ sung chưa làm — danh mục và chuẩn bị theo menu, 2026-10-04

| Story dự kiến | Phạm vi | Điều kiện / tiêu chí chính |
| --- | --- | --- |
| **5.1 — Danh mục 19 nguyên liệu và dữ liệu công thức mở rộng** | Hoàn thiện dữ liệu 19 nguyên liệu đã chốt: ID/tên/icon/giá mua/đơn vị/tồn theo lô/hạn dùng; tích hợp Chợ/Kho. Xác định dữ liệu tám công thức đề xuất và ánh xạ với món hiện có. | Chốt giá, đơn vị, định lượng sốt/phô mai/topping, hạn dùng và phạm vi/lịch mở khóa trước khi kích hoạt. Tất cả pizza dùng 1 đế. Kem trắng/pesto/sốt cay dành cho biến thể hoặc tùy chỉnh, không tự bắt buộc vào tám món. Không coi “Xóa tất cả” là nguyên liệu. Không tự mở cả tám món trong demo hoặc sửa bố cục bếp. [Danh mục](proposal-market-ingredients-and-recipes.md). |
| **5.2 — Gợi ý mua theo menu và số phần chuẩn bị** | Menu dự định bán + số phần + tồn khả dụng → nhu cầu từng nguyên liệu → gợi ý lượng thiếu; từ Kho đi Chợ để người chơi tự mua. | Phụ thuộc 5.1 và định lượng đã chốt. `max(0, lượng cần chuẩn bị − khả dụng)`; cộng nhu cầu chung giữa các món trước khi trừ tồn; loại hàng hết hạn/giữ cho đơn, theo ngày chuẩn bị. Chỉ gợi ý nguyên liệu của menu; không tự mua/trừ tiền. Cách chọn số phần cần chốt. Ví dụ nấm ít/tôm, giăm bông hết/phô mai, nấm gần hết hạn không hardcode. [Yêu cầu](../../implementation-artifacts/requirement-stock-and-purchase-suggestions.md). |

E05 giữ phạm vi sau demo. **UI/luồng liên quan được ưu tiên ghi và làm ở E03 trước**, việc mở rộng dữ liệu/gameplay chờ điều kiện E05; không dùng yêu cầu UI để tự triển khai sớm toàn bộ E05 hoặc thay baseline demo ba công thức. Người dùng có thể chốt phạm vi mới sau.

## E06 - Giao hàng và sự kiện

### Triển khai theo yêu cầu 2026-10-04

Người dùng yêu cầu làm E06 và chốt: chưa có nhân viên → nhận đơn app → book shipper → làm/đóng hộp → shipper tới lấy/giao; có nhân viên → làm/đóng hộp → nhân viên đi giao → quay về nhận đơn tiếp. Nhánh nhân viên nối availability từ hệ thống thuê thật ở E08, không tạo người đã thuê giả. Giao đếm thời gian simulation; thông số phí/thời gian/sự kiện là cấu hình tạm cần playtest. Save cũ giữ dữ liệu, app mặc định tắt, không lưu giữa ca. Xem [spec Epic6](../../implementation-artifacts/spec-6-delivery-and-events.md).

- **6.1:** App từ ngày5, bật/tắt trước ca, đơn1–3pizza và đóng hộp từng phần.
- **6.2:** Book shipper trước nướng, chờ tới lấy/giao, thanh toán một lần; availability nhân viên và chuyến đi/về.
- **6.3:** Mưa/cao điểm/lễ hội, dự báo trước ca, lịch cầu thay đổi có giới hạn và không sinh đơn app khi chưa bật.

Yêu cầu tiếp theo: Giao bánh hoàn tất/nhận tiền ngay, bỏ thời gian chuyến giao/phạt đến trễ. Vẫn đợi shipper tới trước giao; nhân viên trở về trước nhận đơn tiếp. Không đổi tiền/kho/lưu.

Sau demo; P04, P05, hỗ trợ P14. Trụ cột phục vụ và kinh tế. Phụ thuộc E05.

- Người chơi mở app, nhận đơn giao và đơn nhiều pizza với hạn giao/đóng gói.
- Người chơi chuẩn bị cho mưa, giờ cao điểm và lễ hội.
- Người chơi xem đánh giá khi giao trễ/sai và biết nguyên nhân.

Luồng giao đã chốt và được triển khai theo spec2026-10-04. Phí/hạn/thời gian và bảng sự kiện là config tạm cần playtest, không coi là balance đã duyệt; không phát đơn giao trước khi app bật. Tuyển/lương/roster nhân viên thật vẫn thuộc E08.

## E07 - Quán, thiết bị, tiện nghi, mở rộng và quảng bá

Sau demo; P08, P09, phần thiết bị của P15. Trụ cột kinh tế. Phụ thuộc E05. Theo chỉ định người dùng 2026-10-04, nhân sự/P06 chuyển sang E08; quảng bá và các yêu cầu cũ ngoài nhân sự vẫn giữ ở E07.

- Người chơi quản lý trang trí, thiết bị, tiện nghi và mở rộng quán; từng chức năng chỉ kích hoạt khi thông số/điều kiện đã chốt.
- Người chơi phát tờ rơi, giảm giá món mới và trang trí để thu hút nhóm khách.
- Người chơi thấy lương, thuê, sửa chữa, quảng bá và nâng cấp trong kết quả kinh doanh.

Điều kiện trước triển khai: chốt giá/điều kiện/tác dụng trang trí, thiết bị, tiện nghi, mở rộng; quy tắc đặt/cất/nâng cấp, nguồn hư hỏng và sửa chữa. Chi phí lương hiển thị từ dữ liệu nhân sự E08 khi hệ thống đó có thật; không bịa lương trong UI E07.

Backlog theo [tab Quán](../../implementation-artifacts/requirement-shop-tab.md):

**Bổ sung chức năng 2026-10-04:** [Trang trí/Tiện nghi](../../implementation-artifacts/requirement-decoration-and-amenity-effects.md) chốt bonus từng đồ, chỉ sở hữu một bản/loại, đặt/cất, cộng trên gốc (cap khách30%, kiên nhẫn40%, quạt/máy lạnh lấy max, bàn ghế+10% kiên nhẫn, không tăng sức chứa), chốt hiệu ứng đầu ngày và nối sinh khách thật. Các ghi chú chưa chốt bên dưới chỉ áp dụng phần còn thiếu như nguồn giá/điều kiện/vị trí, thiết bị/mở rộng. Giá theo cấu hình dự án, không ảnh. Chưa code hoặc xem references.

- **7.1 — Sở hữu và bố trí trang trí:** xem đồ/giá/công dụng/điều kiện → xác nhận mua; đủ tiền, số tiền thiếu, một giao dịch/một quyền sở hữu; đồ có rồi không bắt mua lại; Đặt vào quán/Cất đi. Sở hữu/bố trí lưu cùng tiến độ theo hợp đồng checkpoint cần chi tiết hóa.
- **7.2 — Thiết bị và tiện nghi:** lò/tủ lạnh/bàn pizza, ghế chờ/Wi-Fi/máy lạnh/loa; phân biệt hỗ trợ sản xuất và trải nghiệm khách. Giá/chỉ số/tác dụng/nâng cấp chưa chốt thì hiển thị chưa triển khai, không tự tạo bonus từ ảnh. Mua/lưu một lần, giữ quy tắc gameplay đã chốt.
- **7.3 — Tu sửa và mở rộng:** xem giá/điều kiện/diện tích/chỗ ngồi → xác nhận → ghi nhận cấp nâng cấp. Thông số và tác động phải chốt; không tự tăng cap đơn hoặc thay bố cục bếp. Lưu cấp nâng cấp cùng tiến độ.

- **7.4 — Hiệu ứng ngày từ đồ đang đặt:** tính từ dữ liệu catalog/bố trí, không từ chỉ số đã nhân; chốt mỗi ngày, kiên nhẫn từng khách nhân trên gốc, tăng kỳ vọng khách nối scheduler thật, giữ sức chứa. Không đổi đồ trong ca hoặc tự tăng giá/sao/tốc độ nướng. Kiểm tra không nhân đôi khi reload; vị trí/sức chứa và cách tăng kỳ vọng khách cần chi tiết hóa. Phụ thuộc7.1/7.2 cho dữ liệu đồ đặt.
- **7.5 — Giao dịch mua trong chuẩn bị, lưu và tương thích save:** tiền/sở hữu cùng giao dịch, lưu thành công rồi UI xác nhận; double-tap/retry một lần, lỗi không mất tiền thiếu đồ; lưu sở hữu/bố trí/cấp, save cũ mặc định chưa có đồ mới nhưng giữ tiền/tiến độ. Yêu cầu này bổ sung ranh giới save chuẩn bị cho đồ ngoài nhịp campaign/chốt ngày cũ; chi tiết hóa schema/commit/revision/lỗi và tích hợp trước khi bật Mua hoặc nghiệm thu7.1/7.2. Không ghi mỗi lần xem trước, không lưu giữa ca hoặc mở ngày khi pending.

Nghiệm thu7.1/7.2 gồm UI đầy đủ hình/tên/giá/tác dụng/sở hữu/hiệu quả hiện tại-dự kiến; mua → chọn vị trí → xem trước → xác nhận, hủy giữ sở hữu chưa bonus; cất giữ sở hữu; không đặt chồng lò/nút/vùng thao tác, tiện nghi cố định có vị trí định sẵn. Build và test nghiệp vụ/modal/gameplay/save liên quan phải đạt; không coi nút đổi hình/thông báo giả là chức năng đã làm.

**Triển khai 2026-10-04:** 12 món giá 500–10000 xu đã có mua/đặt/cất, vị trí cố định, preview, hiệu ứng đầu ca và lưu atomic; lò cấp 2/3 giá 2000/5000, mở rộng 4→6 giá 6000, giữ save cũ và giá lịch sử. Build, 110 unit, 7 E2E tập trung đạt. 7.1/7.4/7.5 ở review; 7.2/7.3 và toàn Epic7 còn in-progress: bàn ghế4000 đã có tác dụng10% kiên nhẫn; mở rộng2 giá10000 chưa chốt tác dụng; thiết bị mới/quảng bá/hư hỏng còn thiếu luật. Xem [spec](../../implementation-artifacts/spec-7-shop-development.md).

## E08 - Nhân viên, câu chuyện và khách đặc biệt

Sau demo; P06, P10, P12, P13, P14. Trụ cột kinh tế, quan hệ và tiến độ. Phụ thuộc E06–E07 cho nhóm câu chuyện hiện có; phần nhân viên dùng UI Quán 3.8 và dữ liệu kinh tế, không tự tạo phụ thuộc vòng ngược về E07.

- Người chơi mở câu chuyện khách quen và công thức gia truyền qua nhiều ngày.
- Người chơi thuê bốn nghề cố định và xem tiền lương; đào tạo, tăng lương, quản lý mệt và giữ người còn cần chốt luật.
- Người chơi khám phá nhiệm vụ ẩn và phục vụ khách nổi tiếng với yêu cầu riêng.
- Người chơi giúp giao cho người thân, làm món gấp hoặc tìm món phù hợp, hoặc từ chối với hậu quả có thể hiểu trước.

Điều kiện trước triển khai: viết nhánh/điều kiện/thưởng, phân biệt khách VIP và khách nổi tiếng, kiểm tra toàn bộ yêu cầu món đều có đường mở khóa.

- **8.1 — Nhân viên trong tab Quán:** thuê theo nghề cố định → tự làm công đoạn → xem lương cuối ngày. Đã triển khai ngày 8, phí 2.000 xu/người, mỗi nghề một người, lương 200 xu/người/ngày và khoản chưa trả. Giao app một đơn/chuyến, giao xong hoàn tất ngay rồi trở về trước chuyến tiếp. Các yêu cầu đào tạo/mệt/giữ người, câu chuyện và khách đặc biệt vẫn chưa chốt; toàn Epic 8 còn in-progress.

## E09 - Chiến dịch 30 ngày

Sau demo; P07, P11, P15, P16, tích hợp P01–P14. Trụ cột tiến độ. Phụ thuộc E05–E08.

- Người chơi tiến từ ngày 4 đến 30 qua lịch mở hệ thống, XP và công thức/thiết bị cao cấp.
- Người chơi phục vụ VIP, đơn lớn và nhiệm vụ khó ở những ngày cuối.
- Người chơi xem kết thúc với cấp, tiền, uy tín và nhiệm vụ hoàn thành, rồi bắt đầu lượt mới nếu muốn.

Điều kiện trước triển khai: bảng XP/mở khóa 30 ngày, lịch nhiệm vụ và nền kinh tế được duyệt; playtest các mốc 7/14/21/30; không khóa kết thúc vì bỏ lỡ một nhiệm vụ ẩn.

**Phạm vi đã duyệt 2026-10-05:**

- **9.1 — Khung chiến dịch 30 ngày:** giữ luồng Chợ/Kho/ca bán/tổng kết, hiển thị ngày trên tổng 30, chốt chiến dịch sau ngày 30, xem thành tích thật và bắt đầu lượt mới có xác nhận. Giữ luật XP/tiền/kho/lương/save; không thêm thưởng kết thúc. Save cũ đã quá ngày 30 giữ toàn bộ dữ liệu, hoàn tất ngày đang chuẩn bị rồi kết thúc; không cắt lịch sử hoặc đặt lại tiền. Xem [spec 9.1](../../implementation-artifacts/spec-9-1-thirty-day-campaign.md).
- **9.2 — Sự kiện A:**10% mỗi ngày mở ca, mất200 cho phép âm; cooldown3ngày, tối đa1sự kiện xấu/ngày, không liền2ngày. Seed ổn định, chi phí/report/checkpoint chính xác, thông báo lease riêng. Đã triển khai/kiểm tra; xem [spec9.2](../../implementation-artifacts/spec-9-2-random-loss-events.md).
- VIP được chốt từ ngày10,10% mỗi lượt khách đủ điều kiện và có thể nhiều lần/ngày, thưởng500/+2; đang triển khai riêng9.3. Lịch nhiệm vụ/XP/mở khóa mới, balance dài hạn và playtest còn ngoài đợt này; toàn Epic9 còn in-progress.

## Chỉnh sửa luồng cuối ngày Cozy — người dùng 2026-10-02

Màn cuối ngày đã được người dùng xác nhận bằng ảnh và yêu cầu giữ làm mốc. Story triển khai tiếp theo phải đọc [mốc UI, phần cuối ngày](../../implementation-artifacts/ui-baseline-2026-10-02.md), giữ bố cục/phong cách/nút và các tab hiện có; không diễn giải spec “reference” thành quyền tự thiết kế lại. Chỉ số/nhận xét thay theo dữ liệu thật, không đóng băng giá trị trong ảnh.

Theo [spec cuối ngày](../../implementation-artifacts/spec-end-of-day-reference.md), người dùng chọn bấm “Kết thúc ngày” trong bảng pause, xác nhận rồi qua hub Tổng kết / Chợ / Kho / Quán / Nhiệm vụ, chuẩn bị và mở ngày sau. Đây là nối luồng cho phiên Cozy hiện tại theo ảnh người dùng, không phải chấp nhận toàn bộ E03/E04 hoặc lưu campaign. Giữ nguyên bếp, menu và UI hàng chờ. Chỉ số/nhận xét lấy từ ca thật; hệ thống nhiệm vụ/trang trí chưa có ghi “Chưa mở”.

### Luật Epic 7 thay thế — 2026-10-04

Chỉ mở rộng quán tăng sức chứa: mặc định4 khách, mở rộng lần1 lên6, tối đa6. Bàn ghế4000xu chỉ tăng10% kiên nhẫn khi đang đặt; không tăng khách hoặc chỗ chờ phụ. Tổng tiện nghi sau lấy max quạt/máy lạnh là38%, cap40%. Giữ6 ô khách cố định, loại bỏ đề xuất cap8/10 và hàng avatar cuộn. Mở rộng lần2 giá10000 chưa có tác dụng được chốt, chưa cho mua và không tự gán bonus. Các luật bàn ghế/chỗ chờ trước đây được thay bằng quyết định này. Xem spec-7-capacity-and-table-patience.md trong implementation-artifacts.
## Luật nhân viên đã chốt — 2026-10-05

Epic 8.1 đã triển khai bốn loại phụ bếp/thợ nướng/đóng hộp/giao hàng theo bốn thẻ hiện có. Mở thuê ngày8, phí2000xu/người, mỗi loại tối đa1. Vai trò cố định theo loại thuê, không phân công lại. Lương200xu/người/ngày, thu cuối ngày. Thiếu tiền báo rõ số thiếu và giữ lương chưa trả; không tự sa thải, cho vay hoặc tính lãi. Công đoạn xử lý nhanh, thời gian đặt trong cấu hình; giữ cửa sổ chín của nâng cấp lò hiện có. Giao hàng1đơn/chuyến, chốt ngay lúc giao và trở về20s/mưa30s trước nhận đơn tiếp. Không tăng sức chứa hay đổi6ô khách.

Mua thuê trong chuẩn bị dùng giao dịch tiền+roster atomic và checkpoint hiện có, không lưu giữa ca; save cũ chưa có nhân viên. Lương phát sinh là chi phí của ngày, tiền mặt chỉ trừ phần thực trả; khoản chưa trả đối soát qua báo cáo/metadata, thử trả cùng lương ngày mới vào cuối ngày sau. Khi thiếu tổng tiền lương thì chưa trả khoản đó, giữ toàn bộ nghĩa vụ và báo số tiền cần thêm. Những đề xuất cũ lương50xu/ca, phân công/nghỉ hoặc chỉ có một nhân viên giao được thay bởi luật này. Đào tạo/mệt/giữ người và truyện/nhiệm vụẩn/khách nổi tiếng vẫn chưa có luật, không coi8.1 là toànEpic8.

Chi tiết trong `_bmad-output/implementation-artifacts/spec-8-1-delivery-staff.md`; build đạt, 121 unit hiện hành và 11 E2E tập trung 360×640 đạt; ba review độc lập không còn phát hiện cần sửa. Một test cũ giới hạn demo ba ngày thất bại cả ở baseline f65e737, ghi riêng trong deferred-work.md. Story 8.1 ở review; toàn Epic 8 còn in-progress.
