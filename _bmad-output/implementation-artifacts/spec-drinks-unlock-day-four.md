---
title: 'Mở khóa nước uống từ ngày 4'
type: change
created: '2026-10-13'
status: done
baseline_commit: '7b31358'
---

## Yêu cầu

Ngày 1–3 chỉ bán pizza; ngày 4 mở khóa nước suối, Coca và nước cam. Không đổi giá, tỷ lệ gọi nước, bố cục hay luồng nhân viên đã sửa.

## Triển khai

- `src/config/drinkCatalog.ts`: mốc chung `DRINK_UNLOCK_DAY=4`.
- `src/runtime/CozyRuntime.ts`: khóa mua theo ngày chuẩn bị; khóa gọi và gắn chai theo ngày đang bán. Chuẩn bị sau khi kết thúc ngày 3 đã mua nước được cho ngày 4.
- `src/presentation/ReferenceMarket.ts`: giữ ba dòng nước, hiển thị khóa và “Mở từ ngày 4”, khóa số lượng/Mua.
- `src/presentation/DrinkKitchenCells.ts`, `src/scenes/CozyScene.ts`: giữ ba ô bếp, ghi “Ngày 4” trước khi mở; runtime vẫn là nguồn chặn giao dịch.
- Save cũ giữ nguyên số chai và tiền; không tạo đơn nước trước ngày 4 dù đã có chai từ phiên bản trước.

## Tiêu chí kiểm tra

- Ngày 1–3: không mua hoặc gắn chai được, khách không gọi nước; tiền/kho không đổi khi thử mua.
- Chuẩn bị ngày 4: mở ba loại nước, mua trừ đúng tiền và lưu/khôi phục đúng kho.
- Ngày 4: khách có thể gọi nước, nhân viên vẫn giao đúng chai và mở lựa chọn mặc cả.
- Chợ khóa nút đúng ngày; ba ô bếp giữ vị trí và số lượng.

## Kết quả

Build/typecheck đạt; 5 file unit tập trung, 30 test đạt. Unit kiểm tra trực tiếp ngày 1–3 và chuẩn bị ngày 4, khôi phục kho save cũ và luồng nhân viên giao chai. Chromium 360×640: 8 E2E đạt, gồm khóa Chợ ngày 1/3 và mua ngày 4, ba loại nước, lưu/reload kho và nhân viên giao liên tục/mặc cả. Không chạy toàn bộ browser matrix.

## Review

Ba lượt độc lập (blind, edge cases và acceptance) không phát hiện lỗi cần sửa. Đối chiếu preparationDay với currentDay, giao dịch session, save cũ và geometry ba ô. Các fixture ngày 4 tắt sự kiện mất tiền ngẫu nhiên để kiểm tra nước độc lập với popup sự kiện.

## Suggested Review Order

- Mốc dùng chung cho mọi loại nước.
  [drinkCatalog.ts:1](../../src/config/drinkCatalog.ts#L1)
- Chặn giao dịch trước ngày mở khóa tại runtime.
  [CozyRuntime.ts:154](../../src/runtime/CozyRuntime.ts#L154)
- Khách chỉ gọi nước theo ngày đang bán.
  [CozyRuntime.ts:405](../../src/runtime/CozyRuntime.ts#L405)
- Giữ ba dòng Chợ, ghi ngày mở và khóa nút.
  [ReferenceMarket.ts:42](../../src/presentation/ReferenceMarket.ts#L42)
- Kiểm tra ranh giới ngày và kho cũ.
  [CozyDrinkUnlock.test.ts:15](../../src/runtime/CozyDrinkUnlock.test.ts#L15)
