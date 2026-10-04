# Pizza Demo

## Tiệm Pizza Ấm Áp — giao diện hiện tại

Trang `/` mở menu minh họa có animation. Bắt đầu dẫn qua hướng dẫn rồi vào quán; `/?mode=shop` mở thẳng phần chuẩn bị và `/?mode=freeplay` là màn tập làm bánh độc lập. Giao diện đã duyệt được ghi trong [mốc UI](_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md).

Trong ca bán: **Pause → Kết thúc ngày → Xác nhận** để vào màn tổng kết. Xem doanh thu, chi phí, lợi nhuận, đơn hoàn thành/khách bỏ đi và đánh giá thực tế. Dùng Chợ/Kho chuẩn bị nguyên liệu, chọn món rồi **Mở quán — Ngày N+1**. Tiền và lô còn hạn được giữ qua ngày. Quán/Nhiệm vụ/cấp chưa triển khai hiển thị “Chưa mở”. Demo kết thúc sau ngày 3 hoặc khi thiếu vốn; ngày đã chốt không thể mở lại trong phiên.

Luồng Cozy này giữ tiến độ trong **RAM của phiên đang mở**; tải lại trang không khôi phục các ngày đã chơi. Chi tiết theo [spec cuối ngày](_bmad-output/implementation-artifacts/spec-end-of-day-reference.md).

## Chiến dịch riêng

`/?mode=campaign` mở prototype chiến dịch ba ngày với giao diện riêng. Tiến độ được ghi vào IndexedDB khi tạo chiến dịch và chốt ngày. Tải lại giữa ngày trở về checkpoint đầu ngày đó; lỗi lưu giữ màn tổng kết để thử lại. Luồng cuối ngày Cozy không thay dữ liệu hoặc cơ chế lưu chiến dịch này.

## Chạy dự án

Node 24.21.0 và npm 11.19.0. Trong PowerShell tại thư mục dự án:

```powershell
$env:PATH = "$PWD\.scaffold\toolchain\node-v24.21.0-win-x64;$env:PATH"
npm.cmd run dev-nolog
```

Dùng URL Vite in ra; phiên hiện tại đang dùng http://127.0.0.1:8082/.

## Kiểm tra

```powershell
npm.cmd run typecheck
node node_modules/vitest/vitest.mjs run src/runtime/CozyDay.test.ts src/domain/CozyStock.test.ts
npm.cmd run build-nolog
node node_modules/playwright/cli.js test tests/day-end.spec.ts --project=chromium-390x844 --workers=1
```

Mỗi lần sửa chỉ chạy test tập trung. Full Playwright Chromium/WebKit với nhiều viewport dành cho hoàn thành Epic 1 hoặc trước release. Build nằm trong `dist/`; browser test dùng production preview và lưu ảnh ở `test-results/`. Ảnh UI được giữ lâu dài trong `_bmad-output/implementation-artifacts/ui-baseline/`.

# simulartor-pizza
