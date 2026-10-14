---
title: 'Giữ đánh giá tổng hợp và lợi nhuận ngày gần nhất sau Tiếp tục'
created: '2026-10-13'
status: done
baseline_commit: '7d2c50d'
---

## Nguyên nhân và yêu cầu

Save đã có báo cáo/reviews của từng ngày. Mở lại checkpoint chuyển sang chuẩn bị ngày kế tiếp, daySummary=null; bảng đánh giá và lợi nhuận chỉ đọc daySummary nên hiện trống. Người dùng yêu cầu đánh giá cộng tất cả ngày và giữ lợi nhuận ngày trước khi Tiếp tục.

## Phạm vi

- `CozyRuntime.reviewHistory`: tổng các review đã lưu, thêm review ca hiện tại nếu ngày đó chưa chốt; không nhân đôi review ngày vừa chốt. Điểm sao là tổng sao chia tổng lượt, không trung bình các điểm ngày.
- `CozyRuntime.latestDayReport`: báo cáo gần nhất từ archive với progression được khôi phục đúng.
- `CozyScene`: Khách nói gì và popup đọc history; khi chuẩn bị sau reload, lợi nhuận/thu chi/thống kê dùng báo cáo gần nhất. Header, ngày chuẩn bị, số tiền hiện tại, gameplay và nút mở ngày kế tiếp vẫn đọc runtime thật.
- `ReferenceSummary`: giữ các khung/vị trí/số dòng; tên popup “Đánh giá tổng hợp”, nhãn lợi nhuận ghi ngày nguồn khi là báo cáo trước.
- Không đổi schema save, tiền, luật chốt ca hoặc kết quả từng ngày. Dữ liệu phục hồi từ báo cáo các ngày đã chốt; không tự tạo lại review đã không có trong save.

## Tiêu chí kiểm chứng

- Hai ngày có số review khác nhau: tổng lượt và điểm sao đúng trọng số, chốt ngày không nhân đôi.
- Restore/reload nhiều lần: lịch sử, sao và báo cáo lợi nhuận gần nhất giữ nguyên; save cũ vẫn đọc được.
- Mua chuẩn bị mới thay tiền/kho hiện tại nhưng không sửa lợi nhuận/thu chi ngày trước.
- Popup tổng hợp lọc sao đúng, hai review gần nhất và lợi nhuận còn hiện sau Tiếp tục.
- Ngày/header/footer vẫn là ngày chuẩn bị kế tiếp; không lùi ngày bán hoặc cộng lại tiền.

## Kết quả

Build/typecheck đạt. Ba file unit tập trung, 30 test đạt; trong đó bốn case mới kiểm tra tổng/weighted stars, chốt ca không trùng, restore nhiều lần và báo cáo ngày trước không đổi khi mua chuẩn bị.

Chromium 360×640: 1 E2E đạt, bấm Tiếp tục thật và reload hai lần. Xác nhận tổng 3 lượt/11÷3 sao, hai dòng gần nhất, bộ lọc, lợi nhuận/thu chi ngày 2, tiền hiện tại và mở tiếp đúng ngày 3. Một lượt chạy bị gián đoạn/quá thời gian sau khoảng trống nhiều giờ; chạy lại đầy đủ đạt trong 27.2 giây. Không chạy full browser matrix.

## Review

Ba lượt rà soát độc lập không phát hiện lỗi production. Góp ý kiểm chứng đã bổ sung: bấm nút Tiếp tục thật trên menu thay đường tắt mode=shop; kiểm tra hai review gần nhất, tiền hiện tại, footer khả dụng và mở đúng ngày 3. Nhãn popup đọc từ frame, nội dung review đọc từ vùng cuộn; không nhầm dataset vùng cuộn với toàn bộ popup.

## Suggested Review Order

- Tổng review không trùng và báo cáo cuối từ archive đã lưu.
  [CozyRuntime.ts:256](../../src/runtime/CozyRuntime.ts#L256)
- Popup và lợi nhuận dùng nguồn lịch sử khi chuẩn bị lại.
  [CozyScene.ts:876](../../src/scenes/CozyScene.ts#L876)
- Giữ hình thức, cập nhật điểm tổng và nhãn ngày nguồn.
  [ReferenceSummary.ts:104](../../src/presentation/ReferenceSummary.ts#L104)
- Kiểm tra trọng số, reload, mutation và giao dịch chuẩn bị.
  [CozyReviewHistory.test.ts:22](../../src/runtime/CozyReviewHistory.test.ts#L22)
- Tiếp tục thật, hai lần reload và mở đúng ngày kế tiếp.
  [review-history.spec.ts:27](../../tests/review-history.spec.ts#L27)
