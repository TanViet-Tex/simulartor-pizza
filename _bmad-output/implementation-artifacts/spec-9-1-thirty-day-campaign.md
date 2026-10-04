---
title: 'Epic 9.1 — khung chiến dịch 30 ngày và tổng kết chiến dịch'
type: feature
created: '2026-10-05'
status: done
baseline_commit: 87af4a6
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user approved the preceding concrete implementation scope">

## Intent

Người dùng duyệt triển khai khung chiến dịch ngày 1–30: tiến độ ngày, kết thúc sau ngày 30, xem thành tích thật và bắt đầu lượt mới có xác nhận. Hiện game đã qua ngày 3 nhưng chưa có giới hạn chiến dịch hoặc tổng thành tích. Giữ luồng Chợ → nhập Kho → mở ca → sử dụng tồn → chốt ngày → chuẩn bị ngày sau.

## Boundaries & Constraints

Giữ luật tiền, kho FEFO, giá/công thức, XP/cấp, mục tiêu/phần thưởng, nhân viên/lương, delivery, pause/background và save cũ. Giữ bố cục header/năm tab/thẻ/footer, sáu ô khách và art. Chỉ đổi nhãn tiến độ cùng nội dung kết quả cuối; dùng khung thông báo và nút hiện có. Không lưu giữa ca, cài thư viện, thêm endless, VIP, lịch nhiệm vụ/XP mới, balance hoặc thưởng kết thúc chưa chốt. Toàn Epic9 chưa hoàn tất nội dung chiến dịch.

## I/O & Edge-Case Matrix

| Tình huống | Kết quả |
|---|---|
| Chốt ngày 29 | Lưu đầu ngày30, mua chuẩn bị và mở ngày30 được |
| Chốt ngày30 | Settlement/lương/thưởng hiện có một lần; complete, không mở31/mua nâng cấp |
| Tải lại kết thúc | Cùng ngày/kết quả/totals, không trả thưởng/lương lần nữa |
| Hủy lượt mới | Runtime/save/campaign identity không đổi |
| Tạo lượt mới lỗi lưu | Giữ save cũ; retry cùng payload; chỉ cài runtime mới sau commit |
| Save cũ đã quá30 | Không clamp/xóa lịch sử; hoàn tất ngày đang chuẩn bị rồi chốt chiến dịch |
| Save cũ phá sản | Giữ terminal/insolvent, không tự hồi sinh |

</frozen-after-approval>

## Code Map

- `src/config/campaignRules.ts`, `src/domain/CozyCampaignResults.ts`: mốc30, nhãn tiến độ và tổng thành tích thuần từ reports/progression.
- `src/runtime/CozyRuntime.ts`: endDay, chốt cuối cùng, guarded preparation và accessor kết quả.
- `src/domain/CozyCheckpoint.ts`: metadata optional/tương thích/validation kết thúc.
- `src/presentation/HubHeader.ts`, `src/scenes/CozyScene.ts`: nhãn ngày hiện có, footer/modal kết quả, confirm restart hiện có.
- `src/runtime/shopTestFixture.ts`: fixture tiền kiếm thật trong30ngày, không sửa giá gameplay.
- `src/runtime/CozyEpic9.test.ts`, `tests/epic9-campaign.spec.ts`: mốc29/30, save/retry/reload, totals, restart và regression.

## Tasks & Acceptance

- [x] Config/domain — endDay30 và totals chỉ đọc; không metadata tổng tiền thừa.
- [x] Runtime/checkpoint — giới hạn mới, khôi phục legacy, thanh toán/thưởng chính xác một lần.
- [x] UI — ngày /30 trong nhãn hiện có; kết quả cấp/XP/tiền/uy tín/pizza/nhiệm vụ; xem và xác nhận lượt mới.
- [x] Tests/docs — Vitest và Chromium360×640 tập trung, build, ba review; ghi phạm vi còn thiếu.

Given campaign mới, when chốt29→mua Kho→mở30→chốt, then chỉ30ngày, công đoạn/lương/tiền giữ luật. Given ngày30 dù không đủ vốn cho31, when chốt, then complete vì không cần ca31; phá sản trước đó vẫn kết thúc theo luật cũ. Given nhiệm vụ hết hạn, when đạt cuối30, then không chặn kết thúc. Given reports có đơn app3bánh, when xem totals, then pizza3/đơn1, không nhận thưởng thêm. Given final summary, when thao tác/reload/retry/Continue, then totals và save không bị tính lại.

## Design Notes

Checkpoint optional `campaignEndDay`: mới30; save thiếu field suy ra max(30,day) để bảo toàn ngày chuẩn bị cũ vượt30. Giá trị>30 chỉ hợp lệ với lịch sử đã vượt mốc, tại ngày kết thúc tương ứng; không mở ngày mới cao hơn. Chuẩn hóa trong memory sau kiểm checksum gốc, không ghi database chỉ vì load. Reports trước endDay giữ ending theo viability; ngày cuối complete hợp lệ, old insolvent không viable vẫn được giữ. Không thay báo cáo lịch sử để biến30 thành terminal. Không thêm migration phá schema.

Kết quả derive tiền/XP/uy tín cuối, cumulativeProfit, tổng doanh thu/đơn/pizza và số mục tiêu/nhiệm vụ đã hoàn thành; không tính lời cảm ơn thành nhiệm vụ. Report cũ thiếu pizzasSold dùng delivered review quantities (trước app mỗi đơn1bánh). Runtime trả bản copy. Giữ progressionLevel hiện có.

Header chỉ nối /30 vào nhãn ngày có sẵn, không thay coords/font/art; save grandfather có thể hiện /endDay thực tế để không ghi35/30 sai. Khung cuối dùng hai hành động Xem tổng kết/Chiến dịch mới, black veil và lease riêng; confirm hủy trả đúng lease. Kết thúc persisted vẫn vào hub và mở lại kết quả qua footer. Lượt mới dùng session.start có replacement token, không dispatch reset cho session persist.

## Verification

Build-nolog; Vitest Epic9 + checkpoint/campaign/history/legacy/Epic8/Epic6/kitchen; Chromium360×640 Epic9 + regressions liên quan. Không full browser matrix. Xem capture final/confirm/progress trong cùng baseline.

## Results & Review

Build đạt; 65 unit tập trung và 7 E2E Chromium360×640 đạt. Luồng29→Chợ→Kho→30→kết thúc, reload, hủy restart, lỗi lưu/retry, phiên RAM và lương cuối cùng được kiểm tra. Ba review độc lập phát hiện một lỗi restart phiên RAM; đã sửa bằng thay runtime/lifecycle và thêm E2E, acceptance recheck đạt. Những test demo3ngày cũ nằm riêng trong deferred-work.md, không đổi gameplay để khớp luật cũ. Toàn Epic9 còn thiếu nội dung VIP/lịch XP/nhiệm vụ/cân bằng đã ghi trong context.

## Suggested Review Order

- Xem quy tắc chốt ngày cuối và tổng thành tích từ dữ liệu thật.
  [CozyRuntime.ts:340](../../src/runtime/CozyRuntime.ts#L340)
- Khôi phục save cũ vượt30 mà không bỏ lịch sử hoặc kiểm checksum sai.
  [CozyCheckpoint.ts:79](../../src/domain/CozyCheckpoint.ts#L79)
- Xem kết quả, xác nhận lượt mới và lease thông báo riêng.
  [CozyScene.ts:674](../../src/scenes/CozyScene.ts#L674)
- Thay runtime phiên RAM thay vì mở lại ngày đã chốt.
  [main.ts:20](../../src/main.ts#L20)
- Kiểm tra settlement, migration, retry và thành tích.
  [CozyEpic9.test.ts:1](../../src/runtime/CozyEpic9.test.ts#L1)
- Kiểm tra luồng thật với IndexedDB tại360×640.
  [epic9-campaign.spec.ts:1](../../tests/epic9-campaign.spec.ts#L1)