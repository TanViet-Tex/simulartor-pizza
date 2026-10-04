---
title: Thông báo hết Ngày 1 trước Tổng kết
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

Người dùng yêu cầu hết Ngày1 hiện thông báo, bấm Đã hiểu mới vào tab Tổng kết. Chỉ sửa bước chuyển Ngày1; giữ theme, luật tiền/kho/đơn/lưu, thời lượng ca và grace hiện có. Yêu cầu mới cho phép Ngày1 tự chốt khi runtime đã awaiting-close; ngày khác vẫn giữ cách chốt hiện hành. Kết thúc sớm vẫn hỏi xác nhận trước rồi hiện thông báo.

Implementation: CozyScene.finishDay gọi giao dịch closeDay hiện có đúng một lần. Sau chốt Ngày1 giữ một pause lease riêng, hiện khung compact một nút “Đã hiểu”, nền đen/chặn controls phía sau. Không vẽ hub trước khi xác nhận; nút chuyển summaryTab=summary và chỉ trả lease của mình. Save/recovery dialog giữ ưu tiên và guard hiện có; không đổi schema, không thêm lưu giữa ca hoặc lưu acknowledgement.

Acceptance:
- Given Ngày1 đang bán, when ca/grace đã hết và không còn pause/đơn hỏa tốc chờ, then chốt bằng runtime/session hiện có và hiện thông báo một nút.
- Given chủ động kết thúc Ngày1, when xác nhận chốt thành công, then hiện cùng thông báo.
- Given thông báo, when bấm Đã hiểu, then mở Tổng kết đúng báo cáo đã chốt; không chốt/trừ tiền lần nữa, không trả pause owner khác.
- Given saving/error/recovery, then guard/dialog lưu giữ nguyên; reload giữ checkpoint hiện có.
- Given ngày khác hoặc ca đang pause/chưa hết grace, then không tự chốt bởi thay đổi này.

Verification: build và hai E2E Chromium360×640 tập trung (full purchase/use/end-day/next-day và automatic grace/notice/ack/independent pause). Không chạy browser matrix.

Kết quả: production build đạt; hai E2E tập trung đạt. Review blind/edge/acceptance không có lỗi xác nhận; ưu tiên save/recovery kiểm tra bằng code vì fixture browser dùng runtime trực tiếp. Thử nghiệm tự hết clock phải Tiếp tục sau gap do môi trường test, không bỏ guard pause của game. Ảnh renderer thật lưu tại ui-baseline/day-one-ended-notice-2026-10-04.png. Không thêm dependency hoặc sửa domain/save schema.
