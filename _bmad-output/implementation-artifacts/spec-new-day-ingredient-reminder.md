---
title: 'Nhắc mua nguyên liệu khi mở ngày mới'
created: '2026-10-14'
status: done
baseline_commit: 'd80593f'
---

## Yêu cầu và hành vi

Khi bấm Mở quán mà chưa mua nguyên liệu cho ngày chuẩn bị, chuyển tab Chợ và nhắc mua. Giữ ngày, tiền, ca và hàng khách chưa chạy trong lúc nhắc. Mua nước/đồ nâng cấp không tính là nhập nguyên liệu.

Nhắc một lần cho mỗi ngày trong phiên màn chơi. Sau khi đóng “Đã hiểu”, người chơi mua hoặc có thể bấm mở tiếp để dùng kho còn lại; không bắt mua mỗi ngày hoặc tạo vòng lặp khi thiếu tiền. Reload mà chưa mua có thể nhắc lại; mua đã lưu cho đúng ngày thì bỏ qua.

## Code

- `CozyRuntime.boughtIngredientsForPreparation`: kiểm tra lô food của preparationDay, dùng dữ liệu kho thật và tương thích save hiện có.
- `CozyScene.openPreparedDay`: dùng chung nút mở ngày đầu/ca sau; khóa thao tác khi pause hoặc save guard, chuyển Chợ/bộ lọc Tất cả/reset cuộn, dùng popup hubDetail và pause lease hiện có.
- Không đổi bố cục, giá, menu, nguồn tiền, luật tồn kho hay runtime.openShop/openNextDay cho bên gọi ngoài UI.

## Kiểm chứng

Kiểm tra getter qua ngày/restore/nước; canvas chuyển Chợ/nhắc trước khi mở, không trừ tiền hay chạy ca; mua xong mở được; kho cũ có thể dùng sau nhắc và ngày kế tiếp nhắc lại. Regression Tiếp tục/lợi nhuận theo luồng mới.

## Kết quả

Build/typecheck đạt; 2 file unit tập trung, 7 test đạt. Chromium360×640: 5 case đã đạt qua các lượt chạy tập trung (4 case lời nhắc và 1 regression Tiếp tục/lợi nhuận). Kiểm chứng chuyển Chợ, đúng ngày, pause/tiền/clock không đổi, mua rồi mở, nhắc ngày sau và dùng kho cũ sau nhắc.

Fixture vốn thấp ban đầu không đủ tiền thuê theo luật cạn vốn cũ; đã chỉnh fixture còn20–23 xu sau chốt ngày và chạy lại đạt. Không đổi luật tiền thuê/cạn vốn. Không chạy full browser matrix.

## Review

Ba lượt rà soát độc lập không phát hiện lỗi cần sửa. Các guard pause/lưu/terminal được giữ trước khi ghi nhận ngày đã nhắc; popup dùng lease riêng và cleanup cũ. Chưa thêm E2E riêng cho hai lease pause đồng thời hoặc save guard đóng; không thay các owner đó.

## Suggested Review Order

- Chặn lần mở đầu để chuyển Chợ và nhắc, không chạy ca.
  [CozyScene.ts:952](../../src/scenes/CozyScene.ts#L952)
- Nhận biết food mua đúng ngày chuẩn bị từ lô thật.
  [CozyRuntime.ts:521](../../src/runtime/CozyRuntime.ts#L521)
- Kiểm tra ngày, mua/restore và nước không thay food.
  [CozyIngredientReminder.test.ts:1](../../src/runtime/CozyIngredientReminder.test.ts#L1)
- Kiểm tra popup, kho cũ, mua rồi mở và vốn thấp.
  [ingredient-reminder.spec.ts:40](../../tests/ingredient-reminder.spec.ts#L40)
