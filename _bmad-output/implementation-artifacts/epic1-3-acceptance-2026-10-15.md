# Nghiệm thu kỹ thuật Epic 1 và Epic 3 — 2026-10-15

Trạng thái hồ sơ: đã hoàn tất đợt tự nghiệm thu, có tiêu chí chưa đạt/chưa đủ bằng chứng. Epic1 và Epic3 vẫn in-progress; không phải chứng nhận release.

Phạm vi: đối chiếu các story1.1–1.7 và3.1–3.9 với luật hiện hành, build/API typecheck, unit và thao tác trên Chromium/WebKit. Không sửa gameplay hoặc thiết kế lại UI. Các tiêu chí cũ bị thay thế (vốn300, lò6giây, demo3ngày, tự pause khi ẩn tab, thanh Nhiệm vụ) được đối chiếu theo quyết định mới trong project-context/ui-baseline, không ép game về luật cũ.

## Bằng chứng ban đầu

- Baseline:2dc7ee4. Build đầu phát hiện tests/pwa.spec.ts thiếu guard cho CDP manifest data có thể undefined; đã sửa guard để typecheck đúng.
- API TypeScript đạt. Build sau guard đạt, cảnh báo bundle-size cũ giữ nguyên.
- Unit rộng:605case,577đạt/28lỗi,0skip. File gốc epic1-3-unit-audit-2026-10-15.json giữ nguyên để truy vết.
- Phân loại xác nhận: nhóm Tickets/Delivery dùng4giây nướng nhưng còn chờ thêm14giây cho lượt tại20giây, nên truy cập khách thứ hai khi mới18giây; Tutorial còn kỳ vọng lò dừng6giây; Accounts đòi chữ nhân viên trong giải thích nay ghi Không phát sinh lương; MarketForecast bỏ bước giảm20% đã duyệt. Chỉ cập nhật fixture/assertion, không đổi runtime.
-36/36unit của5file sửa trực tiếp đã đạt. Các lỗi Customers/Progress/Help/MixedOrders/SpecialCustomers ngoài phạm vi này vẫn được ghi riêng, không tự coi là đã sửa.
- Matrix ban đầu dừng sau khi xác định test ReferenceSummary còn giá pizza50/giá vốn15, tiêu đề Đánh giá ngày và bỏ bước mua nguyên liệu ngày mới. Cập nhật theo giá60/vốn18 và luồng Chợ hiện hành, giữ đối chiếu tiền/report/scroll/lease. Không lấy lượt bị dừng làm kết quả matrix hoàn chỉnh.

## Ma trận tiêu chí

| Story | Nội dung nghiệm thu | Kết quả |
|---|---|---|
|1.1–1.2|Build, config/asset validation, boot, khung màn hình|1.1 giữ đạt;1.2 mở lại review vì tải đầu18,728,797byte >10MiB|
|1.3|Tutorial không đổi kinh tế thật, đi hết bước và vào chuẩn bị|Đạt trên cả6cấu hình; giữ done|
|1.4–1.5|Kho/thiếu hàng, đế trước, một bàn/lò, ownership khi đổi khách|Đạt;1.5 chuyển done theo unit và luồng thực trên6cấu hình|
|1.6|Đóng hộp, giao đúng chủ, chống double payment, hủy giao sai và timeout|Đạt; chuyển done theo unit và luồng hộp/giao trên6cấu hình|
|1.7|Pause/lifecycle, audio, reduced motion, text200%, safe area, viewport|Unit đạt; viewport/tutorial đạt trên6cấu hình, safe-area đạt hai browser360; giữ review vì kiểm tra điện thoại thật còn mở|
|3.1|Mua/đổi giá đúng chuẩn bị, mua atomic và giữ tiền khi lỗi|Đạt; done theo unit + mua/giá/save/retry trên hai browser|
|3.2|Lô/hạn dùng/giá vốn lịch sử và conservation|Đạt; done theo Lots/Stock/MarketFlow/Accounts và chi tiết lô|
|3.3|Cash bridge/lãi/tồn và report không bị sửa bởi ngày sau|Đạt; done theo unit + summary/history trên hai browser|
|3.4–3.6|Hub, đánh giá và Thu chi thật, modal/cuộn/filter|Đạt; done; filter test đã đồng bộ render và qua lại trên WebKit360|
|3.7|Kho/filter/ngưỡng/lô/cuộn|Giữ review; Chromium đạt, WebKit chưa có lượt đầy đủ đạt sau sửa bước chờ vì trang tự đóng|
|3.8–3.9|Quán/điều hướng, menu/giá/lãi sau reload|Đạt; done;6trang Quán qua6cấu hình, menu/giá/reload qua hai browser|

## Giới hạn

FPS/độ trễ chạm trên thiết bị vật lý và chứng nhận mạng chậm thực tế không thể thay bằng desktop mô phỏng. Không đánh dấu Epic1 hoàn tất nếu các tiêu chí này vẫn mở. Chỉ đổi trạng thái story/Epic khi kết quả mới đủ bằng chứng; không xóa các kết quả lỗi ban đầu.

## Đối chiếu hợp đồng hiện hành

- Bếp tự phối/đặt hỏa tốc và các cập nhật sau đã thay hợp đồng giữ kho lúc khách vào: tiêu hao đúng lớp tại bake, không trừ kho khi chỉ chọn nguyên liệu; một bàn/lò có chủ và không hoàn kho khi bỏ bánh. Không nghiệm thu bằng yêu cầu reservation-at-arrival cũ đã bị thay.
- Vốn đầu500, cửa sổ lò4/3/2 với3giây trước cháy, hàng chờ4→5→6,30ngày, tiếp tục chạy khi rời tab và Xếp hạng thay Nhiệm vụ là luật đang dùng. Bảng giá pizza phô mai60/vốn18 theo catalog thật.
- Kiểm tra kiểu API vẫn đạt. Guard PWA chỉ sửa test compile, không thêm cache/worker hoặc ghi dữ liệu mới.
- Đã sửa vùng chạm đầy đủ ở mép viewport bằng cách dịch phần mở rộng vào trong, không di chuyển nút nhìn thấy. Dòng bị cuộn khuất một phần vẫn giữ clipping cũ. Bằng chứng test thực sự phát hiện46px trước sửa; case mới chạm vùng đệm phía trên mua đúng một phần đế, đồng thời kiểm phần cuộn khuất không mua hàng.

## Unit sau cập nhật

- Nhóm tập trung Epic1/3:160/160 đạt trong20file; raw `epic1-3-unit-focused-2026-10-15.json`.
- Toàn bộ hiện tại:605case,591đạt/14lỗi,0skip; raw `epic1-3-unit-final-2026-10-15.json`. Không tuyên bố toàn dự án xanh.
- Lỗi còn lại: Customers6, Progress4, Help1, MixedOrders1, SpecialCustomers1 và AppCampaign1. Các nhóm đầu còn fixture thời gian/lượt khách cũ; AppCampaign trả `STACK_TRACE_ERROR`, chưa kết luận nguyên nhân. Không thay luật hoặc nới assertion để che lỗi ngoài phạm vi nghiệm thu này.
- Browser WebKit phát hiện ReferenceSummary đọc danh sách ngay sau tap bộ lọc, trước frame cập nhật dataset. Ảnh lỗi đã hiện đúng ba review5sao; bổ sung poll trạng thái filter rồi mới đối chiếu tên/danh sách. Giữ assertion loại trừ review sai sao và chạy lại ca này.

## Các lượt browser và điểm cần xác nhận

- Matrix30ca:27đạt/3lỗi,0skip (`epic1-3-browser-matrix-final-2026-10-15.json`). Ba lỗi là cùng race bộ lọc review trong test WebKit; các luồng boot/single-workbench/tutorial/sáu trang Quán đều đạt trên6cấu hình. Không sửa số liệu hoặc bỏ assertion để làm xanh.
- Batch bổ sung18ca:14đạt/4lỗi (`epic1-3-browser-acceptance-2026-10-15.json`). Hai lỗi ngân sách tải là lỗi tiêu chí thật; một race nhập ngưỡng Kho trong test đã thêm poll; một lần WebKit đóng trang ở ca reload-history, cần chạy lại có trace, chưa coi là lỗi domain hay tự bỏ qua.
- Tải đầu Chromium360:1292ms/18,728,797byte; WebKit360:1598ms/18,729,285byte. Cả hai vượt10MiB. Chỉ di chuyển attachment lên trước assertion để giữ bằng chứng khi fail; ngân sách giữ nguyên. File raw từng browser ở `epic1-3-evidence-2026-10-15/boot-budget-*.json`.
- Batch18 đã xác nhận giao dịch mua nền không chặn màn hình, chống lặp, lỗi ghi không mất tiền/ownership rồi retry đúng một lần, giá/menu/ownership giữ sau reload trên cả hai browser. Chromium history qua hai reload; WebKit history cần xác nhận lại sau một lần trang tự đóng. Đây là kiểm tra IndexedDB thực, không khẳng định checkpoint game được lưu toàn bộ lên Supabase.

## Kết luận tự nghiệm thu

- Epic1 chưa hoàn tất:1.5/1.6 chuyển done;1.2 mở lại review vì ngân sách tải,1.7 giữ review vì tiêu chí thiết bị vật lý. Không nới10MiB/5giây hoặc thay artwork để che kết quả.
- Epic3 nghiệm thu8/9story:3.1–3.6 và3.8–3.9 done;3.7 giữ review và Epic3 vẫn in-progress. Không suy ra mọi lỗi unit của Epic khác đã được sửa.
- Lượt gọn cuối WebKit (`epic1-3-webkit-focused-2026-10-15.json`): history đạt, gồm tiếp tục và hai reload; Kho lại bị đóng trang từ sớm, không có kết luận chức năng mới cho ngưỡng sau Enter. Lượt trace trước đó timeout khi khởi tạo và đã dừng; không dùng lượt dừng làm bằng chứng đạt.
- Môi trường tại lúc WebKit chạy chỉ còn320,596KiB RAM trống trên16,537,592KiB tổng; sau đóng browser còn2,548,780KiB. Nhóm process WebKit kiểm thử dùng khoảng2.1GiB working set tại mẫu quan sát. Đây là yếu tố gây nhiễu, chưa chứng minh nguyên nhân đóng trang là game hay môi trường. Cần một lượt3.7 WebKit đầy đủ đạt khi có đủ RAM, rồi mới đóng story/Epic3.
- Không có thay đổi gameplay, kinh tế, dữ liệu lưu hoặc bố cục được duyệt trong lượt này. Source chỉ sửa phần đệm vùng chạm của nút danh sách nhìn thấy đầy đủ; đã kiểm tra bằng tap thật ở vùng mới và clipping dòng khuất, qua Chromium/WebKit360 trong lượt edge trước.

## Kiểm tra cuối và bằng chứng lưu

- `npm run build-nolog`: đạt (TypeScript frontend/tests + Vite production); bundle `index-CzWsKBgp.js`. Cảnh báo chunk-size cũ còn, không đổi threshold. `npx tsc -p tsconfig.api.json`: đạt.
- `epic1-3-edge-history-2026-10-15.json`: hai ca actual-edge tap/clipping đạt ở Chromium/WebKit360; history WebKit đạt, history Chromium lúc đó lỗi bước chờ5giây và đã được xác nhận đạt ở batch18 sau cập nhật readiness.
- `epic1-3-browser-acceptance-2026-10-15.json`: summary hoàn chỉnh đã đạt lại cả hai browser360 sau thêm poll filter. Không tuyên bố ba ca summary WebKit trong matrix cũ đã được chạy lại đủ ba viewport; finance/scroll của chúng đã qua trước assertion race, ảnh lỗi cho thấy filter cuối đúng.
- Ảnh đã xem: Tổng kết106xu, Thu chi chữ200%, menu/lãi và cumulative-history. Bản sao ổn định cùng boot-resource measurements nằm ở `epic1-3-evidence-2026-10-15/`; raw reports giữ nguyên cả lần lỗi.
- Một blind review độc lập cho bản sửa hit/test refresh và một lần follow-up đã hoàn tất, không còn lỗi code xác nhận trong phạm vi sửa. Không coi review sạch là bằng chứng xóa các blocker nghiệm thu ở trên.

## Việc còn lại để đóng Epic

1. Epic1/1.2: giảm tài nguyên tải đầu xuống ngân sách10MiB rồi đo lại cold boot5giây; giữ artwork/bố cục đã duyệt. Chưa thực hiện tối ưu asset trong đợt kiểm tra này.
2. Epic1/1.7: đo FPS/độ trễ input và tải mạng20Mbps trên điện thoại Android/iPhone thật. Desktop mô phỏng không thay tiêu chí này.
3. Epic3/3.7: chạy lại trọn ca Kho/filter/ngưỡng/lô/cuộn trên WebKit khi có đủ RAM; nếu vẫn đóng trang, điều tra riêng memory/crash trước khi đánh dấu done.
4. Ngoài Epic1/3:14test rộng còn lỗi cần đợt refresh/điều tra riêng; AppCampaign `STACK_TRACE_ERROR` chưa được xác minh nguyên nhân. Không mở rộng sửa gameplay của các Epic khác trong nghiệm thu này.
