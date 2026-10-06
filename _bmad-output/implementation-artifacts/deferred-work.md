# Công việc để xử lý riêng

## 2026-10-06 — Assertion report legacy trong CozyMarketFlow

Test “preserves legacy checkpoint stock and cash while buying at its current preparation day” so sánh completedReports với checkpoint.reports còn progressionArchive; selector hiện không xuất trường archive. Cùng lỗi tái hiện với CozyRuntime từ baseline c8408f7 (3test khác trong suite đạt). Không do quyền nguyên liệu/dự báo/bulk. Cần cập nhật assertion theo contract report trong lượt riêng; không sửa báo cáo/gameplay để làm xanh test. Bản Chợ mới có27unit tập trung đạt.

## 2026-10-04 — Tests lịch sử không khớp luật game hiện hành

Trong khi kiểm tra background play, `CozyRuntime.test.ts` còn assertion lấy bánh ở 3s thay vì cửa sổ lò hiện hành 6–8s; `CozySchedule.test.ts` còn kỳ vọng lịch/menu cũ (7 assertion thất bại tổng cộng). Luật và các assertions này có sẵn trước bản sửa background play. Cần cập nhật bộ test lịch sử theo luật hiện hành ở lượt riêng, giữ bằng chứng regression có ý nghĩa; không đổi luật tiền/kho/lịch chỉ để làm xanh test cũ. Bộ lifecycle/gameplay hiện hành 54 kiểm tra tập trung đạt trước patch review cuối; kết quả cuối ghi ở spec background play.

## 2026-10-04 — Epic 6 xác minh test giao tại quầy cũ

Giữ nguyên sáu test `src/runtime/CozyDelivery.test.ts`, không thay bằng test Epic6. Cả sáu thất bại ở bản hiện tại và ở baseline `1516b49`, đã chạy lại trong cây nguồn baseline tạm chỉ chứa test và 20 dependency local. Chúng dùng nướng3s, thời điểm hết kiên nhẫn và kỳ vọng giao chéo cũ; xử lý ở lượt cập nhật regression riêng. Bộ luật hiện hành có kiểm tra trong `CozyKitchenV2.test.ts`; giao app mới ở `CozyEpic6.test.ts`. Không sửa luật game để khớp fixture cũ.

## 2026-10-05 — Assertion giới hạn ba ngày trong CozyAccounts

`src/runtime/CozyAccounts.test.ts` còn test “keeps terminal selectors on day three and refuses further economic commands”, kỳ vọng preparationDay=3 và chặn mua/mở ngày4. Người dùng đã bỏ demo ba ngày trước Epic8. Test này thất bại preparationDay=4 ở cả bản nhân viên và baseline f65e737; đã đối chiếu bằng 26 dependency baseline riêng. Hai test kế toán khác và năm test tổng kết hiện hành đạt. Giữ test cũ để xử lý cùng nhóm regression lịch sử, không thay luật chiến dịch nhằm làm xanh assertion cũ.
