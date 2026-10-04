---
title: '5.2 — Gợi ý mua theo menu sở hữu và số phần chuẩn bị'
type: feature
created: '2026-10-04'
status: done
story_key: 5-2-menu-based-purchase-suggestions
baseline_commit: NO_VCS
---

Triển khai cùng [spec Epic 5](spec-5-1-expanded-ingredient-and-recipe-catalog.md). Kho dùng menu đã sở hữu đang bán của cả tám công thức; nhập 0–100 phần bằng cách chạm con số, hoặc tăng/giảm. Cộng các thành phần chung rồi trừ lượng khả dụng một lần; hàng hết hạn/đã giữ không được tính. Không có dự báo khách giả, tự mua, trừ tiền hoặc giữ kho.

Phân trang ba món/năm nguyên liệu ở 360×640, giữ header/footer/theme đã duyệt. “Đi chợ” tiếp tục luồng mua chủ động, không thay bằng hỏa tốc. Tồn/lô/giá vốn giữ nguyên. Định lượng catalog tạm một phần mỗi thành phần/bánh, cần playtest cân bằng; kem trắng/pesto/cay không tự tạo nhu cầu nếu không nằm trong món chọn.

File chính: `src/presentation/StockPlanning.ts`, `src/presentation/StockPlannerPanel.ts`, `src/scenes/CozyScene.ts`. Kiểm tra: `src/presentation/StockPlanning.test.ts`, `src/runtime/CozyEpic5.test.ts`, `tests/epic5-ui.spec.ts` (full menu 8 món, nhập 2 phần/món, nhu cầu đế 16/cà chua 14/BBQ 2, phân trang và không đổi tiền/kho).

Build, 75 unit và 18 E2E tập trung đạt; bốn E2E riêng Epic 5 chạy lại trên build cuối đều đạt. Review và bằng chứng chi tiết ghi ở spec Epic 5. Không thay kết quả human playtest cân bằng.

## Suggested Review Order

- Cộng nhu cầu và trừ available một lần, không mutation.
  [StockPlanning.ts:1](../../src/presentation/StockPlanning.ts#L1)
- Phân trang và vùng nhập lượng, giữ bố cục panel.
  [StockPlannerPanel.ts:1](../../src/presentation/StockPlannerPanel.ts#L1)
- Kiểm tra nhập đủ tám món, forecast và tiền/kho giữ nguyên.
  [epic5-ui.spec.ts:24](../../tests/epic5-ui.spec.ts#L24)
