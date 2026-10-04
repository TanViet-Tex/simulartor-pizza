---
title: "Game quản lý tiệm pizza - GDD nháp"
status: approved
version: "0.2"
game_type: simulation
platforms: [web]
created: 2026-09-29
updated: 2026-10-01
requirements_updated: 2026-10-04
---

# GDD - Game quản lý tiệm pizza

> Người dùng đã duyệt GDD v0.2 và epics.md để làm đầu vào kiến trúc. Các nhãn “đề xuất/chờ duyệt” bên dưới được giữ nguyên như nội dung bản v0.2 tại thời điểm duyệt; luật demo trong bản này là baseline đã duyệt, vẫn cần playtest. Các quyết định được ghi rõ là để sau demo/kiến trúc vẫn còn mở. Chưa được sửa code game cho đến khi người dùng duyệt kiến trúc.

## Trạng thái và nguồn yêu cầu

Tài liệu ghi nhận yêu cầu trực tiếp của người dùng ngày 2026-09-29, cập nhật định hướng mỹ thuật ngày 2026-09-30. Chuyển sản phẩm bán từ bánh mì sang pizza, chuyển định hướng mỹ thuật sang game web 2D cartoon. Tên chính thức mới chưa chốt; không tự đổi thành tên phát hành.

Người dùng đã duyệt demo 3 ngày làm trước, giữ chiến dịch 30 ngày và đủ 16 hệ thống, chia rõ phần demo và phần sau demo. Workflow gds-gdd được kích hoạt lại bằng Python 3.12.14 có sẵn trong runtime; cả bộ phân giải customization và cấu hình đều chạy thành công. Lịch sử và bằng chứng nằm trong decision-log.md.

Bản v0.2 chờ duyệt nội dung trước khi triển khai. Các con số, nội dung mẫu và lịch mở khóa dưới đây mang nhãn **ĐỀ XUẤT**; chúng không được xem là đã được người dùng xác nhận. Đã xác nhận: demo 3 ngày, giữ đủ P01–P16, ưu tiên điện thoại, cảm ứng và nhịp thư giãn. Tên chính thức và lịch phát triển chưa chốt.

## Đối tượng, mục tiêu và bản sắc

ĐỀ XUẤT: người chơi casual thích quản lý tiệm ăn, một phiên chơi 15–20 phút cho ba ngày gồm mua hàng và tổng kết. Mục tiêu demo là kiểm chứng phục vụ pizza có dễ hiểu, lựa chọn mua hàng/giá bán có ý nghĩa và người chơi muốn tiếp tục ngày sau.

Bản sắc dự kiến là cùng một khách có sở thích và quan hệ thay đổi qua nhiều ngày, đặt cạnh quyết định giá, tồn kho và tiền lời. Không tuyên bố đây là cơ chế mới trên thị trường. Bối cảnh văn hóa và tên mới vẫn chờ chọn.

## Tầm nhìn và vòng lặp đề xuất

Người chơi phát triển một tiệm pizza qua chiến dịch 30 ngày, cân bằng phục vụ, nguyên liệu, tiền mặt, uy tín và quan hệ khách hàng.

Các trụ cột đề xuất, chờ duyệt:

- Làm đúng pizza và phục vụ đúng lúc cho các nhóm khách có nhu cầu khác nhau.
- Quyết định mua hàng, giá bán và nhân sự tạo hậu quả kinh tế dễ hiểu.
- Khách quen, lựa chọn giúp đỡ và nhiệm vụ tạo sự gắn bó qua nhiều ngày.
- XP và các mốc chiến dịch mở dần nội dung, tránh dồn toàn bộ hệ thống vào ngày đầu.

Vòng lặp đề xuất: xem dự báo và mục tiêu ngày → mua nguyên liệu, chọn thực đơn, giá và nhân sự → nhận đơn, làm/nướng pizza, đóng gói và phục vụ/giao → xem sổ thu chi, đánh giá và tiến độ nhiệm vụ → mở khóa, chuẩn bị ngày tiếp theo.

Điện thoại, cảm ứng và nhịp thư giãn đã được người dùng chọn. Thao tác làm pizza, thời gian nướng và góc nhìn chi tiết dưới đây vẫn là đề xuất để duyệt tài liệu.

## Các hệ thống đã được yêu cầu

| ID | Hệ thống | Yêu cầu thiết kế |
| --- | --- | --- |
| P01 | Tính cách khách | Có khách quen thích món cũ, khách khó tính chấm thấp khi sai món, khách mặc cả và khách mua nhanh trước giờ đi làm. Mỗi nhóm có mức kiên nhẫn và độ nhạy giá riêng. |
| P02 | Nguyên liệu và chợ | Giá nguyên liệu đổi theo ngày. Thiếu nguyên liệu thì không làm được món tương ứng; mua dư có thể hư hoặc hết hạn. Mở khóa nhà cung cấp quen để được giá tốt hơn. |
| P03 | Uy tín quán | Phục vụ đúng, ngon, nhanh thúc đẩy giới thiệu bạn bè. Chậm, giá quá cao hoặc chất lượng kém làm giảm khả năng khách quay lại. |
| P04 | Thời tiết và sự kiện | Mưa giảm khách tại quán nhưng tăng nhu cầu giao tận nơi. Lễ hội và giờ cao điểm tăng lượng khách, tạo cơ hội doanh thu. |
| P05 | Đơn hàng và giao hàng | Mở khóa app giao đồ ăn; hỗ trợ đơn mang đi và đơn số lượng lớn. Giao trễ hoặc đóng sai pizza ảnh hưởng đánh giá. |
| P06 | Nhân viên | Nhân viên có thế mạnh làm bánh nhanh, chuẩn bị nguyên liệu hoặc thu ngân ít nhầm. Có đào tạo, tăng lương để giữ người và mệt mỏi làm giảm tốc độ. |
| P07 | Mục tiêu ngày | Doanh thu, số khách, đánh giá hoặc đơn đặc biệt là mục tiêu có thưởng theo ngày. |
| P08 | Sổ thu chi | Cuối ngày hiển thị tiền bán hàng, mua nguyên liệu, lương, thuê và sửa chữa để người chơi biết kết quả kinh doanh. |
| P09 | Quảng bá | Phát tờ rơi, giảm giá món mới và trang trí theo chủ đề thu hút những nhóm khách nhất định. |
| P10 | Câu chuyện khách quen | Khách xuất hiện nhiều ngày, mở dần câu chuyện và công thức gia truyền. Phục vụ tốt có thể mở công thức hoặc phần thưởng riêng. |
| P11 | Nhiệm vụ thường | Phục vụ đủ khách, đạt doanh thu, bán món cụ thể hoặc giữ đánh giá. Thưởng XP, tiền và uy tín. |
| P12 | Nhiệm vụ ẩn | Không hiện trước trên bảng nhiệm vụ. Được khám phá khi đủ nổi tiếng, mở đúng món hoặc phục vụ tốt nhiều ngày. |
| P13 | Khách nổi tiếng | Ghé bất ngờ, đặt món theo yêu cầu riêng. Thành công có thể thưởng công thức gia truyền, trang trí hiếm hoặc nhiều uy tín. |
| P14 | Khách cần giúp | Nhờ giao đồ cho người thân, làm món gấp hoặc tìm món phù hợp. Người chơi được giúp hoặc từ chối; lựa chọn tác động tiền, đánh giá hoặc quan hệ. |
| P15 | Lên cấp | Đơn hàng, nhiệm vụ và đánh giá tốt cho XP. Cấp mới mở công thức, nguyên liệu cao cấp, trang trí hoặc thiết bị. Pizza cao cấp bị giới hạn theo cấp yêu cầu. |
| P16 | Chiến dịch 30 ngày | Những ngày cuối mở khách VIP, đơn lớn và nhiệm vụ khó hơn. Kết thúc tổng kết cấp, tiền, uy tín và nhiệm vụ hoàn thành. |

## Các quyết định liên kết cần duyệt

Các mục này được cụ thể hóa cho demo ở phần luật v0.2 phía dưới. Người dùng sẽ duyệt chúng cùng tài liệu; các thông số sau demo vẫn cần chi tiết hóa trước epic tương ứng.

- Phân biệt đánh giá từng đơn, uy tín toàn quán và quan hệ từng khách; xác định tác động qua lại và giới hạn cộng/trừ.
- Phân biệt mục tiêu ngày P07 với nhiệm vụ thường P11 để tránh đếm hoặc trả thưởng hai lần ngoài ý muốn.
- Chốt mức giá tham chiếu, cơ chế mặc cả, độ kiên nhẫn, chất lượng pizza và ảnh hưởng của thời gian nướng.
- Chốt thời điểm trừ nguyên liệu, cách đặt trước nguyên liệu cho đơn đã nhận, hạn sử dụng và xử lý đơn khi hết hàng.
- Quy định tương tác mưa với app giao hàng chưa mở khóa; không phát sinh đơn mà người chơi chưa thể xử lý.
- Chốt cách giao hàng: đếm thời gian/điều phối, thuê người giao hay điều khiển trực tiếp. Chưa chọn một phương án.
- Chốt tiền công, thuê, sửa chữa và ngày thanh toán. Phân biệt dòng tiền với lợi nhuận có tính tồn kho để báo cáo không gây hiểu nhầm.
- Chốt điều kiện xuất hiện khách VIP/nhiệm vụ ẩn và bảo đảm món họ yêu cầu có thể được mở khóa theo tiến độ.
- Chốt lưu tiến độ, điều kiện hết tiền/thất bại và cách tiếp tục sau ngày 30. Ngày đã hoàn tất không được chơi lại.
- Chốt đường cong XP, phần thưởng một lần, mốc mở khóa và độ khó; hiện chưa có bảng số liệu cân bằng được duyệt.

## Phạm vi demo 3 ngày và phần sau demo

Toàn bộ P01–P16 thuộc yêu cầu thiết kế chiến dịch. Demo 3 ngày đã được chọn; bảng sau cụ thể hóa phạm vi để duyệt tài liệu. Phần sau demo thuộc chiến dịch 30 ngày, không mặc định là sau phát hành.

| Phần | Đề xuất bản chơi thử |
| --- | --- |
| Độ dài | Ba ngày trong game, mỗi ca bán khoảng 3–5 phút; một tiệm, ba công thức pizza. |
| Phục vụ | Nhận đơn → làm/nướng → giao tại quầy hoặc mang đi; thử đủ bốn tính cách khách ở mức cơ bản. |
| Kinh tế | Chợ đầu ngày, giá đổi, tồn kho và hết hạn; điều chỉnh giá bán; báo cáo cuối ngày gồm các khoản đã phát sinh. |
| Tiến độ | Uy tín, XP, một mốc mở công thức, mục tiêu ngày và một nhiệm vụ thường. |
| Câu chuyện | Một khách quen có tình huống giúp/từ chối để kiểm chứng quan hệ. |
| Sau demo | Giao hàng/app, nhà cung cấp quen, nhân sự, quảng bá, thời tiết/sự kiện, nhiệm vụ ẩn, khách nổi tiếng và hoàn thiện chiến dịch 30 ngày. |

### Ma trận truy vết 16 hệ thống

| ID | Trong demo 3 ngày | Sau demo, vẫn thuộc chiến dịch | Trụ cột / Epic |
| --- | --- | --- | --- |
| P01 | Bốn kiểu khách: quen, khó tính, mặc cả, vội; kiên nhẫn và ngưỡng giá khác nhau | Đa dạng khách, yêu cầu đặc biệt và cân bằng dài hạn | Phục vụ / E02 |
| P02 | Mua theo ngày, giá đổi có lịch cố định để thử, thiếu hàng, hạn dùng | Nhà cung cấp quen và giá ưu đãi | Kinh tế / E03, E05 |
| P03 | Đánh giá đơn, uy tín; khách quen quay lại và một lượt giới thiệu có giới hạn | Lượng khách, lời giới thiệu và tỷ lệ quay lại thích ứng toàn chiến dịch | Phục vụ, quan hệ / E02, E05 |
| P04 | Chưa mô phỏng mưa/lễ hội; nhịp khách demo có lịch rõ ràng | Mưa, tăng giao hàng, lễ hội, giờ cao điểm | Kinh tế / E06 |
| P05 | Đơn tại quầy và mang đi một pizza, kiểm tra đóng gói | App giao đồ ăn, hạn giao, đơn nhiều pizza | Phục vụ / E01, E06 |
| P06 | Chủ quán tự làm; lương nhân viên bằng 0 trong báo cáo | Ba thế mạnh nghề, đào tạo, lương, giữ người và mệt | Kinh tế / E08 |
| P07 | Một mục tiêu mỗi ngày, báo thưởng rõ | Mục tiêu biến đổi và đơn đặc biệt | Tiến độ / E04, E09 |
| P08 | Sổ bán hàng, mua hàng, thuê; lương/sửa chữa 0 có lý do; tồn kho và lợi nhuận | Lương, sửa chữa và toàn bộ dòng tiền chiến dịch | Kinh tế / E03, E07, E08 |
| P09 | Chưa có chiến dịch quảng bá | Tờ rơi, giảm món mới, trang trí thu hút nhóm khách | Kinh tế / E07 |
| P10 | Một khách quen, tối đa ba lần gặp có điều kiện; phần thưởng quan hệ nhỏ | Chuỗi truyện và công thức gia truyền | Quan hệ / E04, E08 |
| P11 | Một nhiệm vụ thường kéo dài ba ngày, thưởng XP/tiền/uy tín | Danh mục nhiệm vụ thường đầy đủ | Tiến độ / E04, E09 |
| P12 | Chưa có nhiệm vụ ẩn | Ba kiểu kích hoạt: nổi tiếng, đúng món, phục vụ tốt nhiều ngày | Quan hệ, tiến độ / E08 |
| P13 | Chưa có khách nổi tiếng | Yêu cầu riêng và thưởng công thức/trang trí/uy tín | Quan hệ / E08 |
| P14 | Một lựa chọn giúp/từ chối bằng món tại quầy | Giao cho người thân, món gấp, tư vấn món phù hợp | Quan hệ / E04, E08 |
| P15 | XP, ba cấp thử nghiệm; cấp 2 mở pizza thứ ba | Nguyên liệu cao cấp, trang trí, thiết bị và món yêu cầu cấp | Tiến độ / E04, E09 |
| P16 | Chơi ngày 1–3 rồi tổng kết demo | Ngày 4–30, VIP, đơn lớn, nhiệm vụ khó và tổng kết chiến dịch | Tiến độ / E04, E09 |

Mục tiêu kiểm chứng đề xuất: người chơi hiểu cách hoàn thành pizza đầu tiên, nhận ra khác biệt giữa các nhóm khách, giải thích được biến động tiền cuối ngày và muốn chơi sang ngày tiếp theo. Ngưỡng định lượng và đối tượng playtest cho hướng mobile thư giãn được nêu trong mục yêu cầu kiểm chứng.

## Hình ảnh, âm thanh và nền tảng

- Đã xác nhận: web, 2D cartoon, sản phẩm chính là pizza.
- Chưa chốt: bối cảnh văn hóa/địa điểm, tên mới, phong cách nhân vật, âm nhạc và lời thoại.
- Đã chốt: ưu tiên điện thoại, điều khiển cảm ứng, nhịp thư giãn. Kích thước khung hình và thiết bị đo hiệu năng dưới đây là đề xuất.
- Phaser + TypeScript + Vite là đề xuất công nghệ từ lượt trước, chưa được duyệt. Kiến trúc và phiên bản cụ thể thuộc bước gds-game-architecture.

## Thiết kế mô phỏng và luật demo

Toàn bộ luật định lượng trong mục này là ĐỀ XUẤT v0.2 để duyệt và playtest, chưa phải số liệu cân bằng đã kiểm chứng.

### Mô hình hệ thống và giới hạn

Mô phỏng một doanh nghiệp nhỏ theo hướng dễ đọc, không mô phỏng vật lý thực phẩm. Tiền và tồn kho giới hạn món có thể bán; giá, độ đúng món, thời gian và chất lượng tạo đánh giá; đánh giá tạo uy tín và quan hệ; uy tín tác động khách quay lại; đơn/nhiệm vụ tạo XP và mở khóa; mở khóa thêm quyết định mua nguyên liệu.

Trong demo, lịch khách cố định để so sánh các lần thử. Uy tín không sinh khách vô hạn: chỉ thêm tối đa một khách giới thiệu ở ngày 3. Thời gian chờ và nướng tính bằng giây; phản hồi thời gian hiển thị ít nhất mỗi 0,1 giây. Đóng tab hoặc mở tạm dừng thì đồng hồ dừng; không có thu nhập hay hỏng hàng theo giờ ngoài đời.

### Thao tác, pizza và đơn hàng

**Quyết định onboarding 2026-10-03 — đã chốt yêu cầu, chưa sửa code:** Chọn Bắt đầu chiến dịch mới vào thẳng tutorial làm pizza, không yêu cầu mua hàng trước hoặc đi qua Chợ để mở tutorial. Nguyên liệu tutorial thuộc fixture luyện tập tách khỏi tiền/kho và đơn thương mại; không thu tiền/XP và không tự mua thay người chơi. Quyết định đổi thứ tự giới thiệu game, không bỏ quy tắc mua nguyên liệu cho ca thật. Giữ giao diện đã duyệt. Xem [nhật ký quyết định](decision-log.md).

Thiết bị ưu tiên đã duyệt: điện thoại web, cảm ứng, nhịp thư giãn. ĐỀ XUẤT bố cục dọc, một quầy cố định: dải phiếu ở trên, vùng thao tác bếp ở giữa, nguyên liệu/hành động ở dưới; chợ và tổng kết là màn riêng ngoài ca. Chạm phiếu → chạm đế/sốt/phô mai/topping → nướng → lấy bánh → chạm phiếu giao. Không có thao tác hover, kéo thả chính xác hoặc yêu cầu đa chạm; vùng bấm tối thiểu 48×48 CSS px, nội dung tôn trọng vùng an toàn màn hình. Luôn thấy hạn đơn và trạng thái lò, kể cả khi đang chọn topping; có tạm dừng và bật/tắt âm thanh. Topping có biểu tượng và tên, không chỉ dùng màu để phân biệt.

| Pizza | Công thức mỗi chiếc | Giá tham chiếu | Mở khóa |
| --- | --- | --- | --- |
| Phô mai | 1 đế + 1 sốt + 1 phô mai | 50 xu | Ban đầu |
| Nấm | Công thức phô mai + 1 nấm | 65 xu | Ban đầu |
| Xúc xích | Công thức phô mai + 1 xúc xích | 75 xu | Cấp 2; bán từ ngày kế tiếp |

Một lò, một bánh mỗi lần, tối đa ba phiếu đang chờ. Theo mốc người dùng chốt ngày 2026-10-01: lấy trước 3 giây là sống; lấy trong giây 3–5 là đạt; sau giây 5 là cháy, thang nhiệt kết thúc ở giây 7. Cảnh báo hình ảnh từ giây 4 tới 5. Pizza sống/cháy vẫn có thể giao nhưng bị phạt chất lượng; có nút bỏ bánh và làm lại. Bỏ bánh không hoàn nguyên liệu. Đơn mang đi cần thêm thao tác đóng hộp trước khi giao; hộp miễn phí trong demo. Giao nhầm công thức hoặc giao mang đi chưa đóng hộp là sai đơn. Lựa chọn giá mặc cả, Help / Decline và xác nhận bỏ bánh có thể đọc khi pause riêng; khách thường/vội/khó tính tự tạo đơn trong ca đang chạy.

Khi tạo ticket tự động hoặc sau lựa chọn đặc biệt được đồng ý, giữ đủ nguyên liệu còn hạn; khi bắt đầu làm mới trừ tồn kho. Không đủ thì không tạo ticket, hiện lý do. Nguyên liệu chưa dùng được trả về khả dụng khi đơn hết giờ. Bánh làm lại cần nguyên liệu mới. Giá được chốt khi khách đồng ý mua; đổi giá chỉ thực hiện trước khi mở cửa. Hết kiên nhẫn thì khách bỏ đi, không thu tiền, phiếu đóng; bánh dở chỉ có thể bỏ trong demo.

Khách thường, khách vội và khách khó tính tự vào theo lịch và tự tạo đơn khi còn chỗ, giá hợp lệ và đủ nguyên liệu có thể giữ. Tạo phiếu, giữ kho, chốt giá và bắt đầu kiên nhẫn là một thao tác nguyên tử; không có màn Accept/Decline và không tạm dừng ca để nhận các đơn này. Nếu đầy chỗ hoặc thiếu kho, không tạo phiếu, không thay món và hiện lý do cụ thể; không tạo lựa chọn từ chối thủ công. Phạt giá quá cao vẫn dùng quy tắc riêng phía dưới. Khách quen mua hàng thông thường cũng theo luồng tự tạo đơn.

Chỉ khách mặc cả mở lựa chọn riêng về giá: “Đồng ý giá giảm” hoặc “Từ chối giá”; khách quen xin giúp mở Help / Decline vì đây là lựa chọn cốt truyện. Hai lựa chọn đặc biệt này có pause riêng; trước khi giải quyết chưa có phiếu, giữ kho hay kiên nhẫn. Không tích lũy lượt khách trong lúc lựa chọn đặc biệt đang mở. Khi chọn topping khác công thức, nguyên liệu thêm chỉ được lấy từ phần chưa giữ cho phiếu khác; lúc nướng tiêu hao đúng nguyên liệu người chơi đã chọn và trả phần giữ không dùng về khả dụng.

#### Phân loại luồng khách — quyết định 2026-10-01

| Khách | Vào tiệm / tạo đơn | Lựa chọn của người chơi |
| --- | --- | --- |
| Thường | Tự vào, tự tạo đơn | Không Accept/Decline |
| Vội / khó tính | Tự vào, tự tạo đơn; khác ở kiên nhẫn và mức phạt theo cấu hình | Không Accept/Decline |
| Mặc cả | Tự vào, mở thương lượng giá | Đồng ý giá giảm / Từ chối giá |
| Quen xin giúp | Tự vào, mở lời nhờ giúp | Help / Decline; lựa chọn cốt truyện |

### Khách, giá, đánh giá và uy tín

| Nhóm | Kiên nhẫn | Giá tối đa so với giá tham chiếu | Hành vi |
| --- | --- | --- | --- |
| Quen | 120 giây | 120% | Gọi lại pizza phô mai; theo dõi quan hệ riêng |
| Khó tính | 100 giây | 110% | Sai món bị trừ thêm sao |
| Mặc cả | 110 giây | 105% | Đề nghị giảm 10%; lựa chọn riêng Đồng ý giá giảm / Từ chối giá |
| Vội | 75 giây | 125% | Nhanh tương đối so với nhóm khác, không yêu cầu phản xạ gấp |

Giá đặt trong khoảng 80–140% giá tham chiếu, làm tròn tới xu gần nhất. Khách xét giá cuối sau mặc cả. Nếu vượt ngưỡng, khách từ chối trước khi tạo phiếu, không tính là đơn thất bại và không bị trừ sao; uy tín giảm 1 do giá quá cao, tối đa 3 điểm mỗi ngày. Từ chối đề nghị mặc cả không thêm phạt. Đồng hồ chờ bắt đầu khi nhận phiếu. Khách tới lúc cả ba chỗ đầy rời đi không bị phạt.

Điểm đơn khởi đầu 5 sao: sai món/đóng gói −2; bánh sống/cháy −2; giao sau nửa thời gian kiên nhẫn −1; khách khó tính gặp sai món trừ thêm 1. Điểm chặn trong 1–5; đơn hết giờ là 1 sao. Chỉ đơn đã giao thu đủ giá đã thỏa thuận, không có tiền tip/hoàn tiền trong demo. Các phạt khác loại cộng được, mỗi loại chỉ tính một lần.

Uy tín khởi đầu 50/100: đơn 4–5 sao +1; 3 sao không đổi; 1–2 sao −2. Đánh giá ngày là trung bình đơn đã kết thúc, gồm đơn hết giờ, không gồm khách từ chối trước khi đặt. Không có đơn thì hiển thị “chưa có đánh giá”, không tự cho 5 sao. Quan hệ khách quen từ 0–3: phục vụ 4–5 sao +1 (tối đa một lần/ngày). Uy tín ít nhất 55 khi đóng ngày 2 thêm một khách giới thiệu ngày 3. Khách quen quay lại theo các quy tắc cốt truyện dưới đây; lịch người khác giữ cố định ở demo.

### Chợ, hạn dùng và kế toán

Tiền đầu game 300 xu; tồn kho đầu game bằng 0. Mỗi đế, sốt, phô mai, nấm, xúc xích có giá ngày 1 lần lượt 5, 3, 7, 5, 10 xu. Hệ số giá ngày 1/2/3 là 1,00/1,10/0,90; từng giá làm tròn tới xu. Bảng giá ngày kế tiếp không biết trước trong UI. Đế/sốt/phô mai dùng đến hết ngày mua + 1; nấm/xúc xích đến hết ngày mua. Cuối ngày loại lô đến hạn, ghi chi phí hủy. Dùng lô hết hạn sớm nhất trước, nguyên liệu đã giữ cũng phải còn hạn.

Mua thường ở tab **Chợ** trước giờ mở cửa và trong giai đoạn chuẩn bị giữa các ngày: người chơi chủ động mua, trừ tiền một lần và nhập lô vào **Kho**; ca dùng tồn đã mua. Không vay, không bán lại và không vượt tiền mặt. Chợ có nguồn cung không giới hạn trong demo nhưng người chơi tự chịu rủi ro mua dư. Thuê quán 20 xu/ngày; không có nhân viên hoặc hỏng thiết bị nên lương/sửa chữa bằng 0. Dự báo ngân sách cho thấy tiền thuê trước khi mở cửa.

**Đính chính yêu cầu 2026-10-04, chưa sửa code:** hỏa tốc là lựa chọn bổ sung khi thiếu nguyên liệu trong ca, không thay Chợ hoặc là cách mua duy nhất. Quy tắc đã ghi: `ceil(giá Chợ ngày × 1.6)`, nhận sau5s simulation; pause dừng giao. Không tự gán phí/thời gian nếu thiếu quy tắc. Giữ dữ liệu lưu/checkpoint và kiểm tra đầy đủ luồng mua→Kho→ca→cuối ngày→mua chuẩn bị ngày sau khi triển khai. Xem [yêu cầu](../../implementation-artifacts/requirement-market-stock-and-express-flow.md). Phần cập nhật này chỉ là tài liệu, không chứng nhận runtime đã khôi phục mua thường.

Tiền cuối ngày = tiền đầu ngày + bán hàng + thưởng tiền − mua nguyên liệu − thuê − lương − sửa chữa − chi phí khác. Lợi nhuận kinh doanh = doanh thu − giá vốn nguyên liệu đã dùng − nguyên liệu hết hạn − thuê − lương − sửa chữa − chi phí khác. Tiền thưởng hiển thị riêng, không gọi là doanh thu bán pizza. Tồn kho cuối ngày định giá bằng giá mua thực tế, không bằng giá thị trường mới. Dòng mua nguyên liệu thuộc dòng tiền, không bị trừ lần thứ hai vào lợi nhuận.

### Mục tiêu, nhiệm vụ và XP

Đơn giao nhận 10 XP; nếu 4–5 sao thêm 5 XP. Đơn hết giờ không có XP. Cấp 1 từ 0 XP, cấp 2 từ 60, cấp 3 từ 150; demo giới hạn cấp 3 nhưng giữ tổng XP thực. Cấp 2 mở pizza xúc xích từ ngày tiếp theo để có thời gian mua nguyên liệu; cấp 3 là mốc tổng kết, chưa mở thiết bị trong demo. Không sinh yêu cầu món đang khóa hoặc không có trên thực đơn ngày đó.

Mỗi mục tiêu ngày hoàn thành thưởng 20 xu + 10 XP, chốt một lần khi tổng kết: ngày 1 giao được 3 đơn; ngày 2 doanh thu ít nhất 200 xu; ngày 3 đánh giá trung bình ít nhất 4 sao và có ít nhất 3 đơn kết thúc. Một nhiệm vụ thường: giao tổng cộng 8 pizza phô mai trong ba ngày, thưởng 30 xu + 20 XP + 2 uy tín, nhận tự động một lần khi đủ điều kiện. Một đơn có thể tiến triển cả hai mục tiêu độc lập; không được nhận lại cùng phần thưởng khi mở lại bảng hoặc tải save.

Nhiệm vụ có trạng thái chưa mở → đang làm → hoàn thành hoặc thất bại/hết hạn. Nhiệm vụ thường hiển thị ngay ngày 1; mục tiêu ngày hết hạn khi ngày đó kết thúc. Tiến độ nhiệm vụ ẩn sau demo không hiện trước khi đạt điều kiện; khi mở phải thông báo rõ mục tiêu và thời hạn mới.

### Một khách quen và lựa chọn giúp đỡ

Ngày 1 khách quen giới thiệu sở thích pizza phô mai. Ngày 2 chỉ quay lại nếu lần đầu đạt ít nhất 3 sao; họ nhờ làm một pizza phô mai miễn phí, có 120 giây, chiếm một phiếu bình thường. Đồng ý và hoàn thành tăng quan hệ 1; món tặng không tạo doanh thu/XP đơn nhưng tiêu hao nguyên liệu. Không đủ hàng thì lựa chọn giúp bị vô hiệu kèm lý do; từ chối không mất tiền hoặc uy tín, quan hệ không tăng. Nhận rồi giao sai/trễ giảm quan hệ 1 và không áp dụng phạt uy tín của đơn thương mại. Quan hệ luôn chặn trong 0–3.

Đơn giúp đỡ thành công khi đúng công thức, bánh đạt và giao trước hạn; bánh sống/cháy tính thất bại như sai món. Đơn này không góp vào đánh giá ngày, số đơn kết thúc thương mại, mục tiêu ngày, nhiệm vụ bán 8 pizza hoặc phần thưởng XP của đánh giá tốt. Chỉ áp dụng thay đổi quan hệ riêng một lần, không cộng thêm điểm quan hệ của đơn thương mại. Giá vốn món tặng ghi riêng trong nguyên liệu đã dùng; không bị trừ hai lần.

Ngày 3 khách quay lại nếu ngày 2 được giúp thành công hoặc đơn thương mại gần nhất của họ ít nhất 4 sao. Quan hệ đạt 2 thì nhận lời cảm ơn và thưởng 20 xu một lần; món/công thức gia truyền được giữ cho sau demo. Ngày 2 không có đơn thương mại bổ sung của cùng khách. Nhánh bỏ lỡ khách quen không chặn việc chơi đủ ba ngày.

### Ba ngày, kết thúc và lưu tiến độ

| Ngày | Ca bán / lịch khách | Mục đích |
| --- | --- | --- |
| 1 | 180 giây; 6 lượt tại giây 10, 35, 60, 85, 110, 135 | Học làm bánh; 1 quen, 2 khó tính, 3 mặc cả |
| 2 | 210 giây; 8 lượt tại giây 10 rồi mỗi 22 giây | Khách vội; vị trí đầu là khách quen nếu đủ điều kiện, nếu không thay bằng khách mặc cả; các vị trí còn lại luân phiên vội/khó tính/mặc cả |
| 3 | 240 giây; 10 lượt tại giây 10 rồi mỗi 20 giây; khách giới thiệu có điều kiện ở giây 210 | Ghép các kỹ năng; vị trí đầu ưu tiên khách quen nếu đủ điều kiện, còn lại luân phiên ba nhóm khác |

Lượt khách ngày 2 bao gồm tình huống giúp đỡ nếu xuất hiện, không cộng thêm lượt. Hết thời gian ca thì ngừng sinh khách, cho tối đa 120 giây xử lý phiếu còn lại theo hạn riêng; sau đó tất cả phiếu đóng. Ca mới chỉ bắt đầu bằng thao tác người chơi. Hướng dẫn tương tác ngày 1 dừng đồng hồ cho đến khi người chơi thử được thao tác; không dùng để kiếm tiền/XP. Chuyển ứng dụng/khóa màn hình tự tạm dừng và yêu cầu chạm tiếp tục khi quay lại.

ĐỀ XUẤT danh sách món gọi: mỗi ngày lặp phô mai → phô mai → nấm → phô mai → xúc xích; món đang khóa hoặc bị tắt khỏi thực đơn được thay bằng món đang mở đầu tiên theo thứ tự bảng công thức. Khách quen luôn gọi phô mai, khách giới thiệu gọi món mở đầu tiên. Không cho mở cửa với thực đơn rỗng; tồn kho thiếu không tự sửa yêu cầu đã xuất hiện mà hiển thị lý do không nhận được đơn. Tối đa một lần sinh mỗi lượt lịch, không dồn các lượt đã bỏ lỡ. Mỗi lượt thứ ba là mang đi, còn lại tại quầy; tình huống giúp đỡ luôn tại quầy. Lịch này tạo đủ cơ hội bán 8 pizza phô mai nếu người chơi giữ món trong thực đơn.

Thứ tự tổng kết: kết thúc phiếu → chốt đánh giá/mục tiêu ngày → nhận thưởng còn đủ điều kiện → hủy nguyên liệu đến hạn → trừ thuê và lập sổ → xét thiếu vốn → lưu kết quả. Chỉ số mục tiêu ngày lấy doanh thu trước thưởng; không dùng tiền thưởng để tự hoàn thành mục tiêu doanh thu.

Chơi hết ngày 3 là hoàn thành demo; tổng kết tiền mặt, lợi nhuận tích lũy, cấp/XP, uy tín, quan hệ và nhiệm vụ. Không đạt mục tiêu ngày vẫn được đi tiếp. Nếu sau khi chốt một ngày, trạng thái đầu ngày kế tiếp không đủ tiền thuê hoặc không đủ tiền cộng tồn kho để làm ít nhất một món đang mở, chiến dịch kết thúc vì thiếu vốn và giải thích nguyên nhân. Luôn cảnh báo trước lúc mở cửa nếu số tiền còn lại dưới tiền thuê hoặc không thể làm ít nhất một món. Ngày đã hoàn tất là bất biến, không có nút chơi lại hoặc quay về ngày trước. Sau kết thúc thiếu vốn, người chơi chỉ có thể xem tổng kết hoặc bắt đầu chiến dịch mới. Không có vay cứu trợ trong demo.

Checkpoint tiến độ được ghi khi tạo chiến dịch và khi chốt cuối ngày. Thoát giữa một ngày chưa hoàn tất sẽ tải lại checkpoint đầu ngày hiện tại, có thông báo trước khi thoát; đây là tiếp tục ngày chưa chốt, không phải chơi lại ngày đã hoàn tất. Tải lại giữ nguyên lịch khách và bảng giá của ngày hiện tại, đồng thời không giữ tiền/XP/phần thưởng phát sinh sau checkpoint. Lựa chọn giúp/từ chối trong ngày chưa chốt có thể được thực hiện lại sau khi tải lại; ngày đã chốt thì không thể mở lại. Demo kết thúc tại ngày 3, không hiển thị ngày 4 là đã chơi được.

Chỉ checkpoint mới nhất của chiến dịch được dùng để tiếp tục: trước ngày 1 hoặc đầu ngày kế tiếp sau lần chốt thành công gần nhất. Không cung cấp lịch sử checkpoint để chọn ngày cũ. Hệ thống có thể giữ bản sao dự phòng của cùng checkpoint mới nhất để phục hồi lỗi kỹ thuật; bản sao này không mở khả năng quay lại một ngày đã chơi.

## Thiết kế chiến dịch sau demo

Các mốc sau là ĐỀ XUẤT phân kỳ để duyệt, không phải cam kết số ngày phát triển. Tất cả 16 hệ thống phải có mặt trong chiến dịch hoàn chỉnh.

| Ngày trong game | Nội dung đưa vào và điều kiện |
| --- | --- |
| 4–7 | Nhà cung cấp quen sau 3 ngày mua hàng; app giao hàng từ ngày 5; mưa và một giờ cao điểm từ ngày 6 |
| 8–14 | Tuyển nhân viên, đào tạo và mệt; tờ rơi, khuyến mãi, trang trí theo nhóm khách; một lễ hội |
| 15–21 | Câu chuyện khách quen nhiều nhánh, nhiệm vụ ẩn, khách nổi tiếng; công thức gia truyền có yêu cầu cấp |
| 22–29 | Khách VIP, đơn nhiều pizza, nhiệm vụ khó hơn kết hợp hạn giao và chất lượng |
| 30 | Một đơn cao trào phù hợp công thức/thiết bị đã mở; tổng kết cấp, tiền, uy tín và nhiệm vụ |

### Quản lý, nhân viên và trang trí

Sau demo, chủ quán chọn phân công, mua hàng, giá và quảng bá; nhân viên tự thực hiện vai trò được giao. Ba thế mạnh: làm bánh nhanh, chuẩn bị nguyên liệu tốt, thu ngân ít nhầm. Đào tạo cải thiện đúng nghề; lương và mức mệt ảnh hưởng hiệu quả/giữ người. Chi phí và chỉ số cụ thể sẽ được cân bằng trước khi triển khai E08 (nhân sự chuyển từ E07 theo yêu cầu tab Quán ngày 2026-10-04), không tự áp dụng vào demo.

Không xây dựng mặt bằng tự do trong demo. Sau demo, trang trí và thiết bị gắn vào vị trí định sẵn là đề xuất để hạn chế độ phức tạp; số vị trí, điều kiện mua, nâng cấp và bán lại sẽ chốt ở thiết kế E07. Không coi tùy chọn này là quyền loại bỏ trang trí người dùng yêu cầu.

**Bổ sung Trang trí/Tiện nghi2026-10-04, chỉ tài liệu:** [yêu cầu chức năng](../../implementation-artifacts/requirement-decoration-and-amenity-effects.md) xác định bonus từng đồ, cộng trên gốc, quạt/máy lạnh lấy max, cap khách30%/kiên nhẫn40%, bàn ghế+10% kiên nhẫn, không tăng sức chứa; chỉ đồ đặt có hiệu ứng, chốt khi mở ngày và nối spawn/patience thật. Mua đồ chuẩn bị ghi tiền/sở hữu atomic, lưu thành công rồi UI; đặt/xem trước/xác nhận/cất giữ sở hữu và save bố trí/cấp, tương thích save cũ. Không tăng giá/sao/tốc độ nướng, đổi đồ trong ca hoặc dùng số ảnh làm giá. Giá/vị trí/cap bố trí/chính sách tăng kỳ vọng spawn cần nguồn cấu hình hoặc chi tiết hóa trước triển khai. BacklogE07 7.1/7.2/7.4/7.5; chưa sửa luật demo/code hiện tại.

### Ranh giới tương tác dài hạn

- Mưa chỉ tăng đơn giao khi app đã mở; trước đó chỉ giảm khách tại quán, không tạo đơn không thể nhận.
- Đơn lớn giữ nguyên liệu cho từng pizza; tổng hạn giao, sức chứa lò và số người làm phải cho phép hoàn thành. Không sinh đơn bắt buộc cần món còn khóa.
- Sai đóng gói hoặc trễ giao ảnh hưởng đánh giá cùng hệ thống uy tín; quy tắc chống trừ lặp phải giữ như demo.
- Nhà cung cấp giảm giá vốn; quảng bá tăng tiếp cận nhóm khách; không tự sinh tiền hoặc miễn chi phí. Cần giới hạn lượng khách để tránh vòng lặp uy tín → khách → uy tín tăng vô hạn.
- Giá quá cao, món kém và chậm phải ảnh hưởng quay lại trong chiến dịch. Lời giới thiệu không được vượt năng lực phục vụ vô hạn; cân bằng theo công suất quán.
- Tiền cấp cao có các khoản chi thiết bị, lương, đào tạo, thuê, sửa chữa và quảng bá. Rà soát lợi nhuận/ngày ở ngày 7, 14, 21, 30 để tránh mất khả năng phục hồi hoặc tiền tăng không còn ý nghĩa.
- Nhiệm vụ ẩn và khách nổi tiếng không bắt buộc để đạt kết thúc ngày 30; điều kiện và phần thưởng không được nhận lặp sau tải lại.
- Khách cần giúp được từ chối; hậu quả phải được gợi ý trước lựa chọn. Các tình huống giao đồ người thân và món đặc biệt mở khi có hệ thống hỗ trợ.
- Hoàn thành ngày 30 là kết thúc chiến dịch chính; tổng kết không tự mở endless mode. Hành vi sau tổng kết đề xuất là xem thành tích hoặc bắt đầu lượt mới.

## Nghệ thuật, âm thanh và yêu cầu kiểm chứng

ĐỀ XUẤT asset demo: một cảnh quầy, bốn kiểu khách (một nhận diện khách quen riêng), ba pizza với trạng thái sống/đạt/cháy, năm biểu tượng nguyên liệu, một lò và hộp. Animation cần đủ trạng thái chờ, nhận món và rời quán; không yêu cầu số frame trước khi chốt ngân sách mỹ thuật. Font phải hiển thị đủ dấu tiếng Việt, đồ họa 2D cartoon có nét bo mềm, đường viền rõ, màu ấm và đổ bóng nhẹ; giữ đúng tỷ lệ và rõ nét khi co giãn.

Âm thanh đề xuất: tiếng nhận đơn, thêm nguyên liệu, lò xong, thu tiền, khách rời đi và một nhạc nền; có mute, không bắt người chơi nghe âm thanh để nhận biết trạng thái. Nguồn asset/giấy phép phải được xác minh trước khi đưa vào build.

ĐỀ XUẤT mục tiêu kỹ thuật cho nền tảng mobile đã duyệt: Chrome Android và Safari iOS, màn dọc từ 360×640 CSS px, kiểm tra thêm 390×844 và 412×915; nút và chữ không tràn, không cần cuộn trang để thao tác bếp. Mục tiêu 60 FPS, không dưới 30 FPS kéo dài quá 1 giây trong ca đầy phiếu. Thiết bị tham chiếu Android/iPhone và phiên bản OS/trình duyệt sẽ chốt ở kiến trúc; đo đủ ba ca và mở báo cáo, kiểm tra đổi ứng dụng/khóa màn hình. Asset tải đầu tối đa 10 MB, vào màn bắt đầu trong 5 giây ở mạng 20 Mbps với cache trống. Đây là mục tiêu, chưa có build để đo. Desktop chỉ là nền tảng kiểm tra phụ, không thay mobile. Khi xoay ngang, tạm dừng và hiển thị yêu cầu trở lại dọc; không mất trạng thái.

Playtest đề xuất 5 người chưa đọc GDD: ít nhất 4 người hoàn thành đơn đầu trong 60 giây chơi thực (không tính pause), ít nhất 4 người chơi hết ba ngày hoặc giải thích đúng lý do hết vốn, ít nhất 4 người giải thích được tiền cuối ngày, ít nhất 3 người muốn chơi ngày 4. Ghi số đơn sai, bánh cháy, khách bỏ đi và thời điểm thiếu nguyên liệu để cân bằng; không tự coi đạt các chỉ số là người dùng đã duyệt.

## Development Epics

| ID | Tên | Phạm vi / phụ thuộc |
| --- | --- | --- |
| E01 | Vòng lặp làm và giao pizza | Demo; nền tảng phục vụ |
| E02 | Khách và uy tín | Demo; sau E01 |
| E03 | Chợ và sổ thu chi | Demo; sau E01, kết hợp E02 |
| E04 | Demo ba ngày và quan hệ đầu tiên | Demo; sau E01–E03 |
| E05 | Kinh tế và khách dài hạn | Sau demo; sau E04 |
| E06 | Giao hàng và sự kiện | Sau demo; sau E05 |
| E07 | Quán, thiết bị, tiện nghi, mở rộng và quảng bá | Sau demo; sau E05 |
| E08 | Nhân viên, câu chuyện và khách đặc biệt | Sau demo; sau E06–E07 |
| E09 | Chiến dịch 30 ngày | Sau demo; sau E05–E08 |

Chi tiết high-level stories nằm trong epics.md cùng thư mục. Đây là đầu ra thiết kế của GDD, chưa phải story sẵn sàng lập trình và không thay bước kiến trúc/readiness.

## Ngoài phạm vi demo và ngoài yêu cầu hiện tại

Các phần sau demo đã liệt kê đủ trong ma trận P01–P16, vẫn thuộc chiến dịch 30 ngày; không bị chuyển mặc định sang sau phát hành. Chưa đề xuất nội dung sau phát hành riêng.

Multiplayer, tài khoản, thanh toán thật, xây mặt bằng tự do, điều khiển xe giao hàng và endless mode chưa nằm trong yêu cầu được duyệt; không đưa vào demo. Cơ chế giao hàng thực tế sẽ quyết định ở E06, không mặc định cần bản đồ lái xe.

## Giả định và phụ thuộc

Không dùng giả định ẩn để thay lựa chọn người dùng: toàn bộ đề xuất mới được đánh dấu ĐỀ XUẤT theo mục và cần duyệt tài liệu. Không có mục [ASSUMPTION] đã chốt. Phụ thuộc bên ngoài gồm thiết bị đo hiệu năng, nguồn asset hợp lệ, thời gian/nhân lực và kết quả playtest. Chưa ước lượng thời hạn khi chưa biết nguồn lực.

## Quyết định còn mở

1. Duyệt bố cục dọc và thao tác chạm cụ thể. Điện thoại/cảm ứng/nhịp thư giãn đã chốt, không cần chọn lại.
2. Duyệt luật demo và bảng số liệu v0.2 hoặc yêu cầu điều chỉnh; demo 3 ngày không còn là câu hỏi mở.
3. Chốt tên phát hành, nguồn lực và lịch phát triển trước khi lên kế hoạch sản xuất; có thể tiếp tục thiết kế với tên tạm.
4. Chi tiết định lượng của hệ thống sau demo phải được bổ sung trước khi triển khai epic tương ứng. Bản này không tuyên bố chiến dịch 30 ngày đã sẵn sàng lập trình.

Chỉ chuyển sang lập trình sau khi người dùng duyệt kế hoạch.


## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.


## Manual-close amendment for the current Cozy session — 2026-10-02

The user explicitly chose ending a day by pressing “Kết thúc ngày”, with confirmation, instead of an automatic timer transition. This applies to the current Cozy RAM session and its new reference-inspired summary/preparation hub; the legacy campaign schedule/checkpoint flow is unchanged. Preserve inventory accounting, terminal three-day/insolvency handling and no replay of a closed day. See [implementation scope](../../implementation-artifacts/spec-end-of-day-reference.md). This scoped request does not itself implement later mission/decor/XP systems or certify E03/E04 completion.

### Luật Epic 7 thay thế — 2026-10-04

Chỉ mở rộng quán tăng sức chứa: mặc định4 khách, mở rộng lần1 lên6, tối đa6. Bàn ghế4000xu chỉ tăng10% kiên nhẫn khi đang đặt; không tăng khách hoặc chỗ chờ phụ. Tổng tiện nghi sau lấy max quạt/máy lạnh là38%, cap40%. Giữ6 ô khách cố định, loại bỏ đề xuất cap8/10 và hàng avatar cuộn. Mở rộng lần2 giá10000 chưa có tác dụng được chốt, chưa cho mua và không tự gán bonus. Các luật bàn ghế/chỗ chờ trước đây được thay bằng quyết định này. Xem spec-7-capacity-and-table-patience.md trong implementation-artifacts.