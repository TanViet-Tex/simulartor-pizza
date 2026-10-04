---
title: 'Tiếp tục ngày chuẩn bị vào Tổng kết'
type: bugfix
created: '2026-10-04'
status: done
route: one-shot
baseline_commit: NO_VCS
---

## Intent

**Problem:** Người dùng bấm Tiếp tục Ngày1 thấy màn chuẩn bị cũ và yêu cầu xóa, vào tab Tổng kết.

**Approach:** Mọi Cozyproduction preparation chưa mở ca dùng hub5tab đã duyệt, mặc định Tổng kết. Không phụ thuộc cờ guidedPreparation nên restore save mới cũng vào đúng hub. Xóa renderer market() cũ. Ngày chưa bán hiện chưa bắt đầu/không đánh giá, không bịa daySummary; giữ openShop và kho/tiền/save. Nhãn ngày dùng runtime.day cho cả bản lưu ngày sau.

## Suggested Review Order

- [CozyScene.ts](../../src/scenes/CozyScene.ts): preparationHub, draw routing, dayHub initial/footer.
- [preparation-summary.spec.ts](../../tests/preparation-summary.spec.ts): Menu→Continue thật,5tabs/Tổng kết, cash/stock giữ nguyên, daySummary null, mở cùng ca.
- [Ảnh](ui-baseline/continue-day-one-summary-2026-10-04.png).

## Verification

Build/typecheck đạt,1focusedChromium390×844 đạt. Đã xem screenshot. Assertion test đầu dùng nhầm phaseorders, sửa đúng phasemaking của openShop rồi đạt. Chỉ presentation routing; runtime/schema/mua hàng không đổi. Test kitchen-v2 đổi market-open→summary-open-first-day để theo nút mới. Tutorial tests cũ còn yêu cầu UI mua thường chưa khôi phục nên không chạy fullmatrix.
