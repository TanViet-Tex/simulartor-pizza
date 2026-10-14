# Công việc để xử lý riêng

## 2026-10-12 — Đồng bộ regression với luật hiện hành

Các ghi nhận bên dưới giữ lại lịch sử lỗi và số kiểm tra của từng đợt, không phải kết quả kiểm tra mới. Đợt sửa hiện hành theo [spec regression](spec-current-rule-regression-refresh.md) dùng vốn mới 500 xu, giữ save cũ 300 xu, nướng 6–8/4–6/2–4 giây, chuẩn bị 5 giây ở lịch sản phẩm, chiến dịch 30 ngày, sốt không hết hạn và một bàn làm đơn. Không sửa gameplay để khớp fixture cũ.

Nhóm 9 file Accounts/Day/Epic5/Epic6/Epic9/History/FinishingSauces/MixedOrders/VipCustomers đã đạt **76/76**, không skip hoặc bỏ test; xem [báo cáo tập trung](campaign-regression-current.json). Ngưỡng kết thúc chuyển sang ngày 30; bộ lịch sử vẫn thực hiện 30 ngày bán thật và kiểm tra archive/XP/receipt/restore. Fixture nhiều ngày trả lời từ chối vé số qua API thật để không bị pause ở ngày sự kiện; bánh cháy phải lấy khỏi lò trước giao.

**Đã xử lý toàn bộ các regression lịch sử ghi ở dưới:** baseline 518 test có 401 đạt/117 lỗi; kết quả cuối **75 file, 518/518 đạt, 0 lỗi, 0 skip** trong [JSON kiểm chứng cuối](unit-regression-current-2026-10-12.json). Build/typecheck đạt; 2/2 E2E Chromium 360×640 kiểm tra mua/đặt/cất/nâng cấp/thuê/tải lại và lỗi lưu–retry đạt. Chi tiết phạm vi, lý do cập nhật assertion và giới hạn tại [báo cáo tổng hợp](regression-refresh-summary-2026-10-12.md). Những số đợt cũ trong các đoạn dưới chỉ là bằng chứng lịch sử.

**Còn cần nghiệm thu bên ngoài:** [5 người chơi thật](epic-4-playtest.md) vẫn 0 phiên; [thiết bị điện thoại thật](mobile-performance-report.md) chưa xác nhận FPS/độ trễ, và số đo tải local không chứng nhận mạng chậm. Ma trận Chromium/WebKit nhiều viewport trước release vẫn chưa được chứng nhận bởi 2 E2E tập trung này. Không coi unit/Playwright là người tham gia hoặc chứng nhận thiết bị. Món thay Bàn làm pizza chưa được chốt; nội dung/XP/nhiệm vụ mới, cân bằng dài hạn và playtest các mốc chiến dịch còn ngoài phạm vi regression này.

## 2026-10-07 — Đồng bộ nút, mở sốt và làm đậm giao diện

Ban đầu chỉ ghi chú; người dùng đã yêu cầu triển khai toàn bộ các mục dưới đây. Theo dõi kết quả tại `spec-bold-ui-and-menu-cleanup.md`:

**Đã triển khai và kiểm chứng:** 52 unit test, 5 luồng Chromium 360×640 và build đạt; ba review độc lập hoàn tất, một lỗi cuộn chữ mới đã sửa và có kiểm tra pixel. Các mục dưới đây đã xử lý, không còn chờ code.

- Đồng bộ nút “Quay lại” ở Tổng kết, Kho, Chợ, Quán và Nhiệm vụ theo ảnh mới: dạng viên thuốc, nền nâu đen đậm, viền vàng/kem nhiều lớp, chữ kem sáng đậm, bóng đổ phía dưới. Giữ vị trí và chức năng nút hiện có.
- Các loại sốt luôn mở khóa, không yêu cầu mở công thức và không khóa lại khi thay menu. Khi triển khai cần rà cả giao diện và logic mua, giữ giá/tồn kho/giá vốn hiện hành.
- Chỉnh phần “Menu & Giá bán” sát ảnh tham chiếu nhất có thể. Ảnh đính kèm lượt này chỉ thể hiện nút “Quay lại”, chưa đủ mô tả bố cục toàn panel; cần đối chiếu ảnh tham chiếu panel sẵn có hoặc lấy thêm ảnh trước khi quyết định bố cục mới.
- Theo bổ sung của người dùng: **toàn bộ giao diện, trên tất cả các màn và panel**, đều chỉnh màu đậm theo ảnh tham chiếu; không giới hạn ở nút hoặc Menu & Giá bán. Chữ trên mọi màn phải sắc nét, rõ và dễ đọc, tăng tương phản chữ/nền, kiểm tra font, viền chữ và độ nét khi render để tránh mờ hoặc nhòe. Áp dụng đồng bộ cho nền, khung, nút, HUD, tab và thông báo; giữ bố cục, vị trí nút, số ô và luật gameplay ngoài thay đổi đã yêu cầu.

Ảnh triển khai là bằng chứng để người dùng xem, không tự coi kết quả mới đã được duyệt. Mốc UI ghi phạm vi thay đổi rõ ràng mà người dùng yêu cầu, giữ các phần bố cục ngoài phạm vi.

## 2026-10-07 — Ba ô món đầu hiển thị sai tên/hình

Người dùng báo qua ảnh màn chơi: ba ô đầu trong bảng món hiện tên khách thay hình và tên pizza mong đợi; các ô phía sau vẫn hiện pizza như Pepperoni, Rau củ, Gà BBQ, Hải sản, Giăm bông dứa. Điều tra mã nguồn xác định đó là overlay “Bánh bỏ” kèm tên khách của `abandonedPizzas`, không phải tên công thức bị hỏng. Dòng “Chọn đơn để xem chi tiết” khi chưa chọn đơn không phải lỗi được báo.

Người dùng đã giao sửa cùng nhóm giao diện trên: giữ tám ô món đúng catalog, chuyển khả năng bỏ bánh hết hạn về thao tác bàn/thùng rác hiện có, không bỏ đường phục hồi gameplay. Theo dõi kiểm chứng tại `spec-bold-ui-and-menu-cleanup.md`.

## 2026-10-06 — Assertion report legacy trong CozyMarketFlow — đã xử lý 2026-10-12

Test “preserves legacy checkpoint stock and cash while buying at its current preparation day” so sánh completedReports với checkpoint.reports còn progressionArchive; selector hiện không xuất trường archive. Cùng lỗi tái hiện với CozyRuntime từ baseline c8408f7 (3test khác trong suite đạt). Không do quyền nguyên liệu/dự báo/bulk. Cần cập nhật assertion theo contract report trong lượt riêng; không sửa báo cáo/gameplay để làm xanh test. Bản Chợ mới có27unit tập trung đạt.

Đã cập nhật regression theo ranh giới report lưu gọn và selector lịch sử mở rộng, giữ tiền/kho/save cũ. Kiểm chứng cuối 518/518 tại [JSON](unit-regression-current-2026-10-12.json); không còn là việc chờ sửa test.

## 2026-10-04 — Tests lịch sử không khớp luật game hiện hành — đã xử lý 2026-10-12

Trong khi kiểm tra background play, `CozyRuntime.test.ts` còn assertion lấy bánh ở 3s thay vì cửa sổ lò hiện hành 6–8s; `CozySchedule.test.ts` còn kỳ vọng lịch/menu cũ (7 assertion thất bại tổng cộng). Luật và các assertions này có sẵn trước bản sửa background play. Cần cập nhật bộ test lịch sử theo luật hiện hành ở lượt riêng, giữ bằng chứng regression có ý nghĩa; không đổi luật tiền/kho/lịch chỉ để làm xanh test cũ. Bộ lifecycle/gameplay hiện hành 54 kiểm tra tập trung đạt trước patch review cuối; kết quả cuối ghi ở spec background play.

Đã cập nhật nướng, lịch seeded/ngân sách lượt, chuẩn bị 5 giây, vốn mới 500 và timing chạy nền theo luật hiện hành. Coverage pause, transition và bảo toàn tiền/kho giữ lại; kiểm chứng cuối [518/518](unit-regression-current-2026-10-12.json).

## 2026-10-04 — Epic 6 xác minh test giao tại quầy cũ — đã xử lý 2026-10-12

Giữ nguyên sáu test `src/runtime/CozyDelivery.test.ts`, không thay bằng test Epic6. Cả sáu thất bại ở bản hiện tại và ở baseline `1516b49`, đã chạy lại trong cây nguồn baseline tạm chỉ chứa test và 20 dependency local. Chúng dùng nướng3s, thời điểm hết kiên nhẫn và kỳ vọng giao chéo cũ; xử lý ở lượt cập nhật regression riêng. Bộ luật hiện hành có kiểm tra trong `CozyKitchenV2.test.ts`; giao app mới ở `CozyEpic6.test.ts`. Không sửa luật game để khớp fixture cũ.

Cả sáu test giao tại quầy được giữ và sửa fixture theo luật nướng/quyền bánh/thời hạn hiện hành; không thay bằng test app. Nhóm order đã được xác minh cùng bộ cuối [518/518](unit-regression-current-2026-10-12.json).

## 2026-10-05 — Assertion giới hạn ba ngày trong CozyAccounts — đã xử lý 2026-10-12

Trước đợt sửa này, `src/runtime/CozyAccounts.test.ts` còn test “keeps terminal selectors on day three and refuses further economic commands”, kỳ vọng preparationDay=3 và chặn mua/mở ngày4. Người dùng đã bỏ demo ba ngày trước Epic8. Test này thất bại preparationDay=4 ở cả bản nhân viên và baseline f65e737; đã đối chiếu bằng 26 dependency baseline riêng. Hai test kế toán khác và năm test tổng kết hiện hành đạt ở đợt ghi nhận đó.

Đã đổi coverage kết thúc sang ngày 30, giữ kiểm tra tiền/kho/selector và từ chối giao dịch sau kết thúc. Cả 3 test Accounts và 9 test Day đạt trong nhóm 76/76 tại [báo cáo tập trung](campaign-regression-current.json); không thay luật chiến dịch hoặc bỏ coverage.


## 2026-10-07 — Assertion làm hai đơn trong CozyKitchenV2 — đã xử lý 2026-10-12

Test keeps the oven owner when switching customers and consumes only that pizza vẫn yêu cầu thêm đế cho đơn thứ hai khi đơn đầu đang nướng. Thất bại src/runtime/CozyKitchenV2.test.ts:74 ở cả bản khách đặc biệt và runtime HEAD4580445 đối chiếu riêng. Luật một đơn đang làm đã được yêu cầu trước đó; cần cập nhật regression đúng contract, không sửa gameplay để khớp assertion cũ. Các test tập trung còn lại69 đạt;3Chromium khách đặc biệt đạt.

Đã kiểm tra một bàn làm đơn: đổi khách để xem không được tạo bánh thứ hai khi đơn đầu đang giữ bàn; quyền lò và tiêu hao vẫn thuộc bánh/đơn đang làm. Kiểm chứng cuối [518/518](unit-regression-current-2026-10-12.json); không còn assertion hai đơn trái luật đang chờ xử lý.

- source_spec: `_bmad-output/implementation-artifacts/spec-tiem-pizza-pwa.md`
  summary: Verify installed Tiệm Pizza launch on physical Android and iPhone, including icon/name, hidden address bar and campaign availability.
  evidence: Manifest parsing, icon serving and native storage reload are automated; mobile home-screen chrome/storage cannot be reproduced by ordinary Playwright tabs. No device is available; configuration is complete but this device check is unverified.
