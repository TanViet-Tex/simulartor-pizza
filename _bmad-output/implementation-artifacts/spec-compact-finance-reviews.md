---
title: 'Thu gọn bảng Thu chi và Đánh giá, thêm icon'
type: feature
created: '2026-10-08'
status: done
baseline_commit: 7c3b3c0
---

## Intent

Người dùng yêu cầu hai bảng Thu chi và Đánh giá nhỏ lại một chút, thêm icon cho giao diện đẹp mắt. Giới hạn trong hai bảng này, giữ nội dung thật, font dễ đọc, bộ lọc, cuộn và đóng/pause như hiện tại. Hub, bếp và các popup khác giữ nguyên.

## Implementation

- [x] `src/presentation/ReferenceSummary.ts` — giảm khung Thu chi từ324×552 xuống300×476, Đánh giá từ324×480 xuống300×440, đặt giữa canvas; căn lại các vùng nội dung mà không thu nhỏ toàn bộ chữ. Thêm icon có sẵn theo ý nghĩa từng mục, không emoji hoặc package mới.
- [x] `src/presentation/SummaryModalLayout.ts`, `src/scenes/CozyScene.ts` — dùng chung bounds/viewport/close, vùng chạm đóng tối thiểu48px và không đè nội dung.
- [x] `tests/reference-summary.spec.ts` — kiểm tra kích thước/icon, report thật, cuộn chỉ đổi body, bộ lọc/đóng, chữ200% và nội dung dài.
- [x] `_bmad-output/project-context.md`, `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md` — ghi thay đổi và ảnh kiểm chứng360×640.

## Acceptance

- Given report đã chốt, when mở Thu chi/Đánh giá, then khung nhỏ hơn và nằm giữa360×640, có icon phù hợp, nội dung và số liệu thật giữ nguyên.
- Given danh sách dài hoặc chữ200%, when cuộn, then body clip đúng vùng mới, header/footer/bộ lọc đứng yên và có thể đọc hết nội dung.
- Given modal, when bấm lọc hoặc đóng, then đúng hành động/pause lease, không thao tác nền hoặc đổi báo cáo.
- Given hub hoặc bếp, when chưa mở hai modal, then layout không đổi.

## Verification

- Build TypeScript/Vite.
- E2E tập trung Chromium360×640; xem ảnh cả hai bảng và ảnh sau cuộn.

Build đạt; 5 E2E tập trung đạt. Chữ200%/nhận xét dài clip và cuộn đúng, bộ lọc/close giữ pause lease khác, report không thay. Test visibility cũ đã thay bằng lease test-owner chủ động theo luật không tự pause khi đổi tab. Ba review độc lập không có lỗi code. Ảnh kiểm chứng tại ui-baseline/compact-finance-reviews-2026-10-08.

## Suggested Review Order

- Geometry khung/viewport/đóng dùng chung.
  [SummaryModalLayout.ts:1](../../src/presentation/SummaryModalLayout.ts#L1)
- Nội dung, icon và cuộn hai bảng.
  [ReferenceSummary.ts:140](../../src/presentation/ReferenceSummary.ts#L140)
- Vùng chạm đóng và lease hiện hành.
  [CozyScene.ts:866](../../src/scenes/CozyScene.ts#L866)
- Kiểm tra focused dữ liệu, lọc, cuộn và chữ lớn.
  [reference-summary.spec.ts:49](../../tests/reference-summary.spec.ts#L49)
