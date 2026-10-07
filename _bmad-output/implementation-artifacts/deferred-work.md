# Công việc để xử lý riêng

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

## 2026-10-06 — Assertion report legacy trong CozyMarketFlow

Test “preserves legacy checkpoint stock and cash while buying at its current preparation day” so sánh completedReports với checkpoint.reports còn progressionArchive; selector hiện không xuất trường archive. Cùng lỗi tái hiện với CozyRuntime từ baseline c8408f7 (3test khác trong suite đạt). Không do quyền nguyên liệu/dự báo/bulk. Cần cập nhật assertion theo contract report trong lượt riêng; không sửa báo cáo/gameplay để làm xanh test. Bản Chợ mới có27unit tập trung đạt.

## 2026-10-04 — Tests lịch sử không khớp luật game hiện hành

Trong khi kiểm tra background play, `CozyRuntime.test.ts` còn assertion lấy bánh ở 3s thay vì cửa sổ lò hiện hành 6–8s; `CozySchedule.test.ts` còn kỳ vọng lịch/menu cũ (7 assertion thất bại tổng cộng). Luật và các assertions này có sẵn trước bản sửa background play. Cần cập nhật bộ test lịch sử theo luật hiện hành ở lượt riêng, giữ bằng chứng regression có ý nghĩa; không đổi luật tiền/kho/lịch chỉ để làm xanh test cũ. Bộ lifecycle/gameplay hiện hành 54 kiểm tra tập trung đạt trước patch review cuối; kết quả cuối ghi ở spec background play.

## 2026-10-04 — Epic 6 xác minh test giao tại quầy cũ

Giữ nguyên sáu test `src/runtime/CozyDelivery.test.ts`, không thay bằng test Epic6. Cả sáu thất bại ở bản hiện tại và ở baseline `1516b49`, đã chạy lại trong cây nguồn baseline tạm chỉ chứa test và 20 dependency local. Chúng dùng nướng3s, thời điểm hết kiên nhẫn và kỳ vọng giao chéo cũ; xử lý ở lượt cập nhật regression riêng. Bộ luật hiện hành có kiểm tra trong `CozyKitchenV2.test.ts`; giao app mới ở `CozyEpic6.test.ts`. Không sửa luật game để khớp fixture cũ.

## 2026-10-05 — Assertion giới hạn ba ngày trong CozyAccounts

`src/runtime/CozyAccounts.test.ts` còn test “keeps terminal selectors on day three and refuses further economic commands”, kỳ vọng preparationDay=3 và chặn mua/mở ngày4. Người dùng đã bỏ demo ba ngày trước Epic8. Test này thất bại preparationDay=4 ở cả bản nhân viên và baseline f65e737; đã đối chiếu bằng 26 dependency baseline riêng. Hai test kế toán khác và năm test tổng kết hiện hành đạt. Giữ test cũ để xử lý cùng nhóm regression lịch sử, không thay luật chiến dịch nhằm làm xanh assertion cũ.


## 2026-10-07 — Assertion làm hai đơn trong CozyKitchenV2

Test keeps the oven owner when switching customers and consumes only that pizza vẫn yêu cầu thêm đế cho đơn thứ hai khi đơn đầu đang nướng. Thất bại src/runtime/CozyKitchenV2.test.ts:74 ở cả bản khách đặc biệt và runtime HEAD4580445 đối chiếu riêng. Luật một đơn đang làm đã được yêu cầu trước đó; cần cập nhật regression đúng contract, không sửa gameplay để khớp assertion cũ. Các test tập trung còn lại69 đạt;3Chromium khách đặc biệt đạt.
