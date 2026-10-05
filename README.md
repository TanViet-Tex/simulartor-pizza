# Pizza Demo

## Tiệm Pizza Ấm Áp — giao diện hiện tại

Trang `/` mở menu minh họa có animation. Bắt đầu dẫn qua hướng dẫn rồi vào quán; `/?mode=shop` mở thẳng phần chuẩn bị và `/?mode=freeplay` là màn tập làm bánh độc lập. Giao diện đã duyệt được ghi trong [mốc UI](_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md).

Trong ca bán, chạm đồng hồ ca → **Kết thúc ngày → Xác nhận** để vào tổng kết. Dùng Chợ mua trước ca và giữa các ngày, nhập Kho rồi **Mở quán — Ngày N+1**; ca sử dụng tồn kho đó. Tiền và lô còn hạn được giữ qua ngày. Pause có Tiếp tục/Cài đặt/Menu; về Menu giữ phiên đang chơi.

Chiến dịch chính có khung **ngày 1–30**. Sau ngày 30 xem tổng tiền, cấp/XP, uy tín, đơn/pizza đã bán và nhiệm vụ hoàn thành; có thể xem lại hoặc bắt đầu lượt mới sau xác nhận. VIP từ ngày10 có10% cơ hội mỗi lượt khách quầy đủ điều kiện, có thể nhiều lần/ngày:1bánh,100giây; giao đúng/chín/trước hạn thêm500 và+2uytín (cap100). Sự kiện A có10% mỗi ngày mở ca, mất200 kể cả tiền âm, cooldown3ngày; sự kiện xấu tối đa1/ngày, không liền2ngày. Lịch XP/nhiệm vụ mới, đơn cao trào và cân bằng đầy đủ30ngày còn chưa triển khai. Save cũ giữ dữ liệu; nếu đã vượt ngày30 thì hoàn tất ngày đang chuẩn bị rồi tổng kết.

Tiến độ dùng **IndexedDB** khi tạo chiến dịch, mua nâng cấp/công thức/nhân viên và chốt ngày; không lưu giữa ca. Tải lại giữa ca trở về checkpoint đầu ngày đang chơi. Lỗi lưu có thử lại và giữ bản cũ; lượt mới chỉ thay phiên sau khi lưu thành công. Xem [spec chiến dịch](_bmad-output/implementation-artifacts/spec-9-1-thirty-day-campaign.md).

## Chiến dịch riêng

`/?mode=campaign` vẫn là prototype ba ngày với giao diện và dữ liệu riêng. Khung chiến dịch 30 ngày áp dụng cho luồng chính Cozy, không thay prototype này.

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
