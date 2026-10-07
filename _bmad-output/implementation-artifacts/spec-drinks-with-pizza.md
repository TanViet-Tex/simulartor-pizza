---
title: Three drinks served with shop pizza orders
date: 2026-10-07
status: done
---

# Ba ô nước cùng đơn pizza

Người dùng duyệt nước suối/Coca/nước cam, giá nhập 8/10/12 xu và giá bán 20/25/30 xu. Ba ô thay đúng khu lò thứ hai; giữ lò thứ nhất và các phần UI khác. Khách quầy gọi kèm tối đa một chai, bấm ô nước để thêm vào đơn, giao cùng pizza; app không gọi nước. Nước độc lập quảng bá quán.

## Thực hiện

- Catalog giá/tên/màu trong dữ liệu; chọn nước seeded ổn định theo chiến dịch/ngày/lượt, mặc định 25% lượt quầy gọi nước sau lần mua nước đầu tiên; quyền bán được lưu, hết chai vẫn có thể được gọi. Không tăng ngân sách khách hoặc số pizza.
- Mua chai trong chuẩn bị bằng giao dịch candidate/commit/checkpoint hiện có. Kho riêng ba loại không hết hạn; không đổi 19 dòng nguyên liệu.
- Ô nước bếp chỉ phục vụ đơn đang chọn đúng chai, một lần; đơn thiếu nước chưa thể giao. App/đơn giúp không gọi nước. Thanh toán chai và tiêu hao giá vốn một lần theo đơn, bao gồm báo cáo/lưu game.
- Save cũ không có chai tương đương kho nước rỗng. Bảo quản tủ lạnh chỉ tác động thực phẩm có hạn.

## Kiểm tra tập trung

Giá nhập/bán đúng; reload giữ lượng chai và đối soát tiền; cùng seed cùng nước; app không gọi nước; sai loại/thiếu chai không tiêu hao; giao lặp không nhận tiền hoặc tiêu hao thêm; UI đúng ba ô và giữ lò một. Build/typecheck, unit tập trung và kiểm tra bếp/chuẩn bị ở 360×640.

## Suggested Review Order

- Runtime transactions and shared schedule.
  [CozyRuntime.ts](../../src/runtime/CozyRuntime.ts#L140)
- Receipt, historical payroll and cash validation.
  [CozyCheckpoint.ts](../../src/domain/CozyCheckpoint.ts#L50)
- Stock preservation and bottle accounting.
  [CozyStock.ts](../../src/domain/CozyStock.ts#L65)
- Atomic preparation purchases.
  [CozyCampaignSession.ts](../../src/runtime/CozyCampaignSession.ts#L107)
- Existing UI panels and focused browser tests.
  [CozyScene.ts](../../src/scenes/CozyScene.ts#L920)

## Final verification

Typecheck and build passed. More than 120 focused unit tests passed, plus 52 employee/special-customer/audio regression checks (overlap included). Drinks and services Chromium 360x640 tests: 4 passed. Expansion and audio browser checks recorded separately. Three independent review lenses completed; terminal-save payroll migration and lottery-decline overdraft fixed with regression tests. No full E2E run.

Final focused Chromium checks: 7 passed across drinks (2), advertising/lottery (2), expansion (2), audio (1).
