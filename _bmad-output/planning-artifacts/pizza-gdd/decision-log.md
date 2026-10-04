# Nhật ký quyết định

## Đính chính Chợ/Kho và hỏa tốc — 2026-10-04, chỉ sửa tài liệu

- Người dùng xác nhận agent đã hiểu sai luồng mua. **Giữ tab Chợ mua chủ động trước ca và giữa ngày**, mua trừ tiền một lần và thêm lô vào Kho; ca dùng tồn đó. **Hỏa tốc chỉ bổ sung khi thiếu trong ca**, không thay Chợ/cách mua duy nhất. Quyết định này thay cách hiểu “bỏ mua thường” trong spec bếp tự phối, không hủy gameplay bếp/khách/lò khác.
- Hỏa tốc hiện có giá `ceil(giá Chợ ngày × 1.6)`,5s simulation, pause dừng giao; dùng quy tắc đã chốt, thiếu thì báo rõ. Mua thường dùng giá Chợ/cấu hình của ngày, không mang phụ phí hỏa tốc. Giữ onboarding tutorial→hub Chợ chuẩn bị Ngày1 và mua chuẩn bị giữa ngày.
- Giữ dữ liệu campaign đã lưu và ranh giới checkpoint/retry; không reset hoặc xóa database. Khi triển khai kiểm tra đủ mua trước ca→Kho→mở quán→dùng→cuối ngày→mua ngày sau, cùng tiền/lô/giá vốn/save cũ.
- [Yêu cầu đầy đủ](../../implementation-artifacts/requirement-market-stock-and-express-flow.md), phạm vi E03/3.4 phối hợp3.7. **Lượt này chỉ sửa file tài liệu, chưa sửa code/chạy build/test hoặc đổi dữ liệu lưu.**

## Chỉ số và chức năng Trang trí/Tiện nghi — 2026-10-04

- Chốt bonus từng đồ, cộng trên gốc, quạt/máy lạnh lấy mức cao hơn, trần khách30%/kiên nhẫn40%, bàn ghế+10% kiên nhẫn, không tăng sức chứa; sở hữu một bản/loại, chỉ đồ đặt có bonus; chốt đầu ngày, nối sinh khách/kiên nhẫn thật và giữ sức chứa.
- Mua trong chuẩn bị, tiền/sở hữu cùng giao dịch và lưu thành công rồi cập nhật UI. Đây là bổ sung ranh giới lưu cho mua đồ ngoài tạo campaign/chốt ngày cũ; lỗi không mất tiền thiếu đồ, retry/double-tap một lần. Đặt/cất đúng vị trí, giữ sở hữu; lưu bố trí/cấp, migration save cũ giữ tiền/tiến độ, không nhân đôi bonus.
- Giá theo cấu hình dự án, không ảnh. Chưa xác định đủ nguồn giá/vị trí/sức chứa/cách tăng kỳ vọng spawn trong lượt đối chiếu, cần chi tiết hóa trước triển khai, không tự bịa.
- [Yêu cầu đầy đủ](../../implementation-artifacts/requirement-decoration-and-amenity-effects.md), backlogE07 mở rộng7.1/7.2, thêm7.4/7.5. Chỉ ghi tài liệu; chưa code, xem ảnh hoặc chạy build/test.

## Tab Quán và phân epic mới — 2026-10-04, chỉ ghi tài liệu

- Ghi đề xuất trang chính Quán với xem trước/sáu mục, luồng chỉnh giá ngày bán tiếp theo, luồng mua đồ/sở hữu/đặt-cất/nâng cấp và lưu cùng tiến độ. Giá/chỉ số/tác dụng phải chốt, không suy từ ảnh; phần chưa triển khai có trạng thái rõ.
- Theo chỉ định mới: giá và phản ứng khách E02–E03; trang trí/thiết bị/tiện nghi/mở rộng E07; nhân viên E08. Chuyển nhân sự từ E07 sang E08, giữ câu chuyện/khách đặc biệt và quảng bá ở epic tương ứng. Không mở lại E02 done.
- Bổ sung backlog3.8 UI Quán/luồng,3.9 giá ngày sau,7.1–7.3 nghiệp vụ đồ/nâng cấp và8.1 nhân viên; chưa ready-for-dev hoặc triển khai. Cần chi tiết hóa hợp đồng lưu và giá Ngày1; không tự đổi gameplay/demo.
- [Yêu cầu đầy đủ](../../implementation-artifacts/requirement-shop-tab.md). Chưa xem ảnh references, sửa code hoặc chạy build/test.

## Bổ sung backlog và ưu tiên giao diện/luồng — 2026-10-04

- Người dùng yêu cầu thêm các mục mới vào epic chưa làm cho hợp lý, ưu tiên giao diện và các luồng theo giao diện; chỉ note, chưa code.
- Đưa hub UI/luồng, modal đánh giá, modal thu chi và Kho/lọc/xem lô vào các story dự kiến 3.4–3.7 của E03 chưa hoàn tất; modal đánh giá dùng dữ liệu E02, không mở lại E02 đã done. Danh mục đầy đủ/công thức mở rộng và gợi ý mua theo menu là 5.1–5.2 thuộc E05 backlog.
- Ghi thứ tự UI/luồng trước rồi dữ liệu/gợi ý và tích hợp; phân biệt phần UI Kho với hoàn tất đủ 19 dữ liệu. Giá/định lượng/ngưỡng bộ lọc/số phần/mở khóa vẫn phải chốt. Không tự mở rộng gameplay demo hoặc giả số liệu theo ảnh.
- Đồng bộ [epics](epics.md) và sprint-status; chỉ tạo phạm vi backlog, chưa sinh đầy đủ implementation story hoặc chuyển ready-for-dev. Không xem ảnh references, sửa code hoặc chạy build/test trong lượt này.

## Kho 19 nguyên liệu và gợi ý mua — 2026-10-04, chỉ ghi tài liệu

- Người dùng xác nhận danh mục **19 nguyên liệu đã chốt**. Kho hiển thị icon/tên/lượng còn dùng được/hạn dùng, lọc Tất cả/Sắp hết/Sắp hết hạn, bấm xem lô, ưu tiên lô gần hết hạn, không dùng hàng hết hạn; “Đi chợ mua thêm” chuyển tab Chợ.
- Gợi ý mua theo menu, số phần và tồn: `max(0, lượng cần chuẩn bị − khả dụng)`. Loại hàng hết hạn/đã giữ cho đơn; chỉ gợi ý nguyên liệu của menu, không tự mua hay trừ tiền. Ví dụ ảnh chỉ minh họa, không hardcode tồn/hạn dùng.
- **Chỉ ghi tài liệu, chưa code/xem ảnh.** Ngưỡng bộ lọc, cách chọn số phần, giá và định lượng chưa chốt; tám công thức vẫn là đề xuất. Xem [yêu cầu](../../implementation-artifacts/requirement-stock-and-purchase-suggestions.md).

## Đề xuất nguyên liệu chợ và tám pizza — 2026-10-04

- Người dùng gửi danh sách 19 nguyên liệu: 1 đế, 5 sốt, 1 mozzarella, 4 thịt, 2 hải sản, 6 rau củ/trái cây; tám công thức gồm phô mai, nấm, xúc xích, pepperoni, rau củ, gà BBQ, hải sản, giăm bông dứa. Tất cả dùng 1 đế bánh.
- Kem trắng/pesto/sốt cay dành cho biến thể hoặc tùy chỉnh, chưa bắt buộc trong tám công thức. Giá và lượng dùng mỗi bánh cần chốt riêng. Mỗi nguyên liệu cần ID/tên/icon/giá mua/tồn/hạn sử dụng/đơn vị; “Xóa tất cả” không phải nguyên liệu.
- Trạng thái **đề xuất, chỉ ghi tài liệu, chưa triển khai**. Không tự thay phạm vi demo, lịch mở khóa hoặc UI hiện tại. Chi tiết: [danh mục và công thức](proposal-market-ingredients-and-recipes.md).

## Ảnh references và modal thu chi — 2026-10-04, chỉ ghi tài liệu

- Người dùng đã thêm ảnh vào `references`: chỉ khi được yêu cầu làm mới xem ảnh trong đó và triển khai theo mẫu; hiện chỉ cập nhật tài liệu.
- “Lợi nhuận hôm nay” thêm “Chi tiết ›”, mở “Thu chi ngày {day}”: lợi nhuận, doanh thu theo món và số lượng, giá vốn nguyên liệu, chi phí khác, dòng tiền, số dư đầu/cuối ngày. Dữ liệu thật đúng ngày, không hardcode ảnh; nhập kho tách khỏi giá vốn đã dùng, không trừ hai lần; hao hụt/bánh cháy ghi nhận một lần, không đổi cách tính tiền.
- Modal cuộn, × đóng, nền tối chặn thao tác; kem–gỗ–viền đồng, vừa 360×640, không refactor ngoài phạm vi. Khi triển khai chạy build và kiểm tra số liệu/modal liên quan.
- **Chưa triển khai, chưa xem ảnh hoặc chạy build/test cho thay đổi này.** Xem [yêu cầu](../../implementation-artifacts/requirement-day-finance-modal.md).

## Modal đánh giá của ngày — 2026-10-04, chỉ ghi tài liệu

- Người dùng yêu cầu trong “Khách nói gì?” giữ hai đánh giá gần nhất, thêm “Xem tất cả ›” mở “Đánh giá ngày {day}”. Modal có điểm trung bình, tổng lượt, danh sách cuộn toàn bộ đánh giá của ngày (avatar, tên, sao, nhận xét), nút ×, nền tối và chặn thao tác phía sau.
- Dùng dữ liệu thật của đúng ngày, không trộn lịch sử ngày khác; giữ style kem–gỗ–viền đồng hiện tại. Phạm vi chỉ là thẻ đánh giá/modal, không duyệt lại toàn bộ bố cục theo ảnh mẫu.
- **Chỉ ghi yêu cầu, chưa sửa code hoặc tuyên bố hoàn thành.** Chi tiết: [yêu cầu modal](../../implementation-artifacts/requirement-day-reviews-modal.md).

## Sau tutorial vào Chợ trong hub — triển khai 2026-10-03

- Người dùng chọn rõ: “Sau tutorial: vào giao diện tổng kết, tab Chợ để mua hàng”. Yêu cầu này cho phép sửa code sau ghi chú chỉ tài liệu trước đó.
- Hoàn tất tutorial và xác nhận “Đến Chợ mua hàng” mở giao diện hub hiện có ở trạng thái chuẩn bị Ngày 1. Mua bằng tiền/kho thương mại thật; “Mở quán — Ngày 1” mở ca khi đủ nguyên liệu. Không tạo tổng kết giả, không thu thuê/tăng ngày hoặc thưởng tutorial.
- Bố cục tổng kết/menu/bếp đã duyệt giữ nguyên; thông tin trước ca thể hiện chưa bắt đầu. Pause/menu và âm thanh vẫn truy cập được. Checkpoint/reload và chốt ngày thật không đổi.

## Bắt đầu vào thẳng tutorial — 2026-10-03

- Người dùng yêu cầu: “không sửa code, note lại trong tài liệu, khi bắt đầu game thì không cần mua hàng. vào thẳng toturial luôn”.
- Yêu cầu đã chốt: chọn **Bắt đầu** cho chiến dịch mới phải vào thẳng tutorial làm pizza; không mở Chợ hoặc bắt mua nguyên liệu như điều kiện để vào tutorial.
- Tutorial dùng nguyên liệu luyện tập của fixture riêng, không mua tự động thay người chơi, không trừ tiền/kho thật và không trao doanh thu/XP. Đây là đổi thứ tự onboarding, không tự bỏ hệ thống mua hàng của ca thương mại.
- Giữ bố cục bếp/menu đã duyệt. Các quy tắc tiền/kho của ca thật và lưu checkpoint vẫn theo GDD/architecture; không tự cấp kho thương mại miễn phí từ quyết định này.
- Trạng thái: **chỉ cập nhật tài liệu; chưa triển khai theo yêu cầu mới**. Không sửa code, không đánh dấu story/code đã hoàn tất nhờ ghi chú này. Bằng chứng kiểm thử trước đó vẫn mô tả luồng cũ.

## Loại bỏ chơi lại ngày đã hoàn tất

- Người dùng yêu cầu: “bỏ cái chơi lại khi xong 1 day đi, chỉ có qua ngày mới chứ không chơi lại ngày đã chơi.”
- Ngày đã chốt là bất biến và không thể chọn lại. Thoát/tải lại trong ngày chưa hoàn tất trở về checkpoint đầu ngày hiện tại; đây là tiếp tục phần chưa chốt.
- Thiếu vốn sau tổng kết kết thúc chiến dịch; không quay về ngày trước. Bản sao dự phòng chỉ bảo vệ cùng checkpoint mới nhất khỏi lỗi kỹ thuật, không tạo lịch sử ngày cho người chơi chọn.

## Chuyển sang kiến trúc

- Người dùng: “Tôi duyệt GDD v0.2 và epics.md. Hãy tiếp tục bước kiến trúc game theo BMAD Game Dev Studio, chưa sửa code cho đến khi tôi duyệt kiến trúc.”
- Ghi nhận GDD/epics approved; giữ nội dung thiết kế v0.2 và các mục dài hạn còn mở, không tự đổi luật. Kiến trúc mới vẫn cần duyệt riêng trước thay đổi code game.

## 2026-09-29 - Cập nhật v0.2 theo xác nhận của người dùng

- Người dùng tiếp tục xác nhận: điện thoại, cảm ứng, nhịp thư giãn. Thay đề xuất desktop/chuột bằng mobile dọc và thao tác chạm; tăng kiên nhẫn, mở rộng cửa sổ lấy bánh, tự pause khi chuyển ứng dụng. Các giá trị cụ thể vẫn chờ duyệt tài liệu.

- Đã duyệt: chủ đề pizza là thay đổi chủ động; demo 3 ngày làm trước; chiến dịch 30 ngày và đủ P01–P16 vẫn nằm trong GDD. Chia rõ phần demo và phần sau demo.
- Các ghi chú phía dưới thuộc lịch sử v0.1; trạng thái demo chờ chọn và Python chưa tìm thấy đã được thay thế bởi mục này.
- Tìm thấy Python 3.12.14 tại C:/Users/tranv/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe. Đã chạy thành công resolve_customization.py (workflow gds-gdd) và resolve_config.py bằng executable này, mã thoát 0. uv không cần thiết cho hai script chỉ dùng thư viện chuẩn này. Không cài mới hoặc sửa PATH toàn máy.
- Customization được resolve: không có bước prepend/append, persistent facts, doc standards, external handoffs hoặc on_complete bổ sung. Đọc cấu hình GDS; dùng tiếng Việt theo cuộc trao đổi hiện tại và giữ nguyên cấu hình cài đặt.
- Chạy chế độ Update trên thư mục tài liệu cũ pizza-gdd; không tạo thư mục GDD thứ hai. Thể loại simulation khớp với quản lý kinh tế/tiệm ăn, tiếp tục theo hướng đã được người dùng chấp nhận.
- Ghi tất cả P01–P16 trong ma trận demo/sau demo; không loại bỏ hệ thống. Thông số, điều khiển, nội dung và lịch mở khóa mới là đề xuất để duyệt tài liệu, không phải quyết định người dùng đã chốt.
- Tài liệu là bản chờ duyệt, không cấp quyền lập trình. Không thực hiện workflow downstream hoặc sửa code game.
- Đối chiếu đầu vào độc lập xác nhận đủ P01–P16; sửa “ba lần gặp” thành “tối đa ba lần gặp có điều kiện”, bổ sung mobile/cảm ứng/thư giãn vào E01 để giữ quyết định khi đọc riêng epics.
- Validator checklist GDD từng phát hiện hai lỗi mức medium: retry đầu ngày có thể vẫn thiếu vốn và quy tắc đơn tặng chưa tách khỏi đơn thương mại. Giải pháp quay về ngày trước sau đó đã bị quyết định mới của người dùng thay thế: thiếu vốn kết thúc chiến dịch. Quy tắc đơn tặng, lịch món, loại đơn và xử lý lời đề nghị vẫn giữ nguyên.
- Không có custom doc standards hoặc external handoffs phải chạy. Bản thảo được biên tập thuật ngữ/trạng thái, nhưng chưa có duyệt cuối của người dùng và chưa playtest số liệu.
- Validator kiểm tra lại xác nhận Q-4/S-1 đã sửa, Q-6 pass và không còn fail trong các mục kiểm tra lại. Lưu ý còn lại về khách chưa nhận phiếu đã được giải quyết bằng màn đề nghị tạm dừng, nhận/từ chối rõ trong GDD. Thiết bị tham chiếu/ngân sách bộ nhớ để bước kiến trúc xác định. Kiểm tra cấu trúc: 16 yêu cầu và 16 hàng phân kỳ, 9 epics khớp 9 mục chi tiết, không còn token template.
- Kết thúc lượt Update ở trạng thái draft-for-approval: đủ để người dùng duyệt thiết kế demo, không tuyên bố toàn bộ chiến dịch đã sẵn sàng build. Tất cả quyết định đã được phản ánh vào GDD/epics; thông tin môi trường ở docs/bmad-python.md. Cần người dùng duyệt tài liệu theo yêu cầu của họ trước mọi thay đổi code game.

## 2026-09-29

- Người dùng xác nhận chuyển món bán từ bánh mì sang pizza. Tên phát hành mới chưa được xác nhận.
- Giữ yêu cầu nền tảng web và đồ họa 2D pixel art từ trao đổi trước.
- Ghi nhận đầy đủ 16 yêu cầu thành P01–P16 trong gdd.md, gồm chiến dịch 30 ngày.
- Không xem đề xuất demo một ca ở lượt trước là phạm vi đã duyệt. Đề xuất demo ba ngày trong bản nháp mới vẫn chờ người dùng quyết định.
- Chưa có GDD trên đĩa nên tạo bản nháp yêu cầu mới, không tuyên bố cập nhật một tài liệu đã tồn tại.
- Chưa chạy được workflow gds-gdd: không có uv/Python trong môi trường; py.exe báo "No installed Python found!" khi chạy resolve_customization.py. Chưa thực hiện kiểm định/finalize theo workflow.
- Không thay đổi mã game, cấu hình BMAD, hoặc cài dependency. Chưa duyệt công nghệ, cân bằng, điều khiển hay phạm vi triển khai.


## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.

## Luồng khách — 2026-10-01

- Người dùng thay thế cơ chế nhận/từ chối chung: khách thường tự vào và tự tạo đơn, không Accept/Decline; khách vội/khó tính cũng tự vào/tạo đơn, khác ở kiên nhẫn và mức phạt theo cấu hình.
- Khách mặc cả chỉ mở lựa chọn riêng về giá. Khách quen xin giúp vẫn có Help / Decline vì là lựa chọn cốt truyện; khách quen mua hàng thông thường theo luồng tự tạo đơn.
- Ticket thường được tạo nguyên tử cùng giữ kho và bắt đầu kiên nhẫn khi lượt đến hợp lệ; không pause ca. Lựa chọn giá/Help dùng pause riêng và chưa tạo ticket trước khi đồng ý. Giữ kiểm tra sức chứa, giá, kho, không đổi món âm thầm.
- Đồng bộ GDD, epics, UX và cache Epic 1. Chỉ sửa tài liệu; code Story 1.5 vẫn theo hợp đồng cũ. Mở lại Story 1.5 ở ready-for-dev, giữ bằng chứng kiểm thử cũ làm lịch sử và thêm task chuyển luồng tự động.

### Luật Epic 7 thay thế — 2026-10-04

Chỉ mở rộng quán tăng sức chứa: mặc định4 khách, mở rộng lần1 lên6, tối đa6. Bàn ghế4000xu chỉ tăng10% kiên nhẫn khi đang đặt; không tăng khách hoặc chỗ chờ phụ. Tổng tiện nghi sau lấy max quạt/máy lạnh là38%, cap40%. Giữ6 ô khách cố định, loại bỏ đề xuất cap8/10 và hàng avatar cuộn. Mở rộng lần2 giá10000 chưa có tác dụng được chốt, chưa cho mua và không tự gán bonus. Các luật bàn ghế/chỗ chờ trước đây được thay bằng quyết định này. Xem spec-7-capacity-and-table-patience.md trong implementation-artifacts.
## Luật nhân viên đã chốt — 2026-10-05

Epic 8.1 đã triển khai bốn loại phụ bếp/thợ nướng/đóng hộp/giao hàng theo bốn thẻ hiện có. Mở thuê ngày8, phí2000xu/người, mỗi loại tối đa1. Vai trò cố định theo loại thuê, không phân công lại. Lương200xu/người/ngày, thu cuối ngày. Thiếu tiền báo rõ số thiếu và giữ lương chưa trả; không tự sa thải, cho vay hoặc tính lãi. Công đoạn xử lý nhanh, thời gian đặt trong cấu hình; giữ cửa sổ chín của nâng cấp lò hiện có. Giao hàng1đơn/chuyến, chốt ngay lúc giao và trở về20s/mưa30s trước nhận đơn tiếp. Không tăng sức chứa hay đổi6ô khách.

Mua thuê trong chuẩn bị dùng giao dịch tiền+roster atomic và checkpoint hiện có, không lưu giữa ca; save cũ chưa có nhân viên. Lương phát sinh là chi phí của ngày, tiền mặt chỉ trừ phần thực trả; khoản chưa trả đối soát qua báo cáo/metadata, thử trả cùng lương ngày mới vào cuối ngày sau. Khi thiếu tổng tiền lương thì chưa trả khoản đó, giữ toàn bộ nghĩa vụ và báo số tiền cần thêm. Những đề xuất cũ lương50xu/ca, phân công/nghỉ hoặc chỉ có một nhân viên giao được thay bởi luật này. Đào tạo/mệt/giữ người và truyện/nhiệm vụẩn/khách nổi tiếng vẫn chưa có luật, không coi8.1 là toànEpic8.

Chi tiết trong `_bmad-output/implementation-artifacts/spec-8-1-delivery-staff.md`; build đạt, 121 unit hiện hành và 11 E2E tập trung 360×640 đạt; ba review độc lập không còn phát hiện cần sửa. Một test cũ giới hạn demo ba ngày thất bại cả ở baseline f65e737, ghi riêng trong deferred-work.md. Story 8.1 ở review; toàn Epic 8 còn in-progress.
### Epic9.1 — khung30ngày, 2026-10-05

Cozy mới chạy tối đa30ngày, giữ Chợ→Kho→ca→chốt→chuẩn bị. Chốt30 thanh toán/thưởng theo luật hiện có đúng một lần rồi complete, không cần vốn31 và không mở31. Kết quả readonly từ reports/progression: tiền cuối, XP/cấp, uy tín, lợi nhuận/doanh thu, đơn/pizza, mục tiêu/nhiệm vụ. Xem tổng kết và xác nhận lượt mới dùng khung chung; chỉ thay save sau commit thành công, phiên RAM thay runtime/lifecycle thật. Không thêm thưởng/XP/VIP, không lưu giữa ca. Save thiếu campaignEndDay suy ra max(30,day), giữ toàn bộ tiền/kho/lịch sử; save vượt30 hoàn tất chính ngày đã chuẩn bị rồi kết thúc. Old insolvent giữ nguyên. Build,65unit tập trung,7E2E360×640 đạt; ba review hoàn tất, một lỗi RAMrestart đã sửa/test lại. Story9.1 review, toànEpic9 vẫn in-progress. Chi tiết implementation-artifacts/spec-9-1-thirty-day-campaign.md.