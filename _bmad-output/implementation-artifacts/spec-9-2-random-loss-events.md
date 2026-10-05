---
title: 'Epic 9.2 — Sự kiện A và giới hạn sự kiện xấu'
type: feature
created: '2026-10-05'
status: done
baseline_commit: 7865e47
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user provided event rules and explicitly selected full loss with negative cash">

## Intent

Triển khai Sự kiện A:10% xuất hiện, mất200, cooldown3ngày. Sự kiện xấu tối đa1lần/ngày và không lặp2ngày liên tiếp. Người dùng chọn trừ đủ200 kể cả tiền âm. Giữ khung30ngày, tiền/kho/ca/đơn/nhân viên và checkpoint đang có; VIP mở10 thưởng500/+2 đã chốt nhưng tần suất/số bánh/hạn đang chờ trả lời, không tự triển khai thông số VIP.

## Boundaries & Constraints

Không giảm mức mất200, đặt sàn0, tự vay/tính lãi, đổi lương/giá/XP hoặc tự tạo thêm loại sự kiện. Cooldown là khoảng cách ngày>=3: xảy ra10, sớm nhất13. Mưa/cao điểm/lễ hội giữ lịch hiện tại, không gán tổn thất mới. Giữ tiền/kho/lịch sử save cũ, không ghi giữa ca. Chỉ thêm nội dung trong khung thông báo1nút và chi tiết tài chính hiện có; không đổi bố cục/art/năm tab/sáu ô/nút. Nền alpha0.28/blocker/lease như mốc mới.

## I/O & Edge-Case Matrix

| Trạng thái | Hành động | Kết quả |
|---|---|---|
| Đủ điều kiện, roll<0.1 | Mở ca | Mất đúng200 một lần, thông báo rõ |
| Roll=0.1 hoặc đang cooldown | Mở ca | Không mất tiền |
| Tiền50 | A xảy ra | Tiền-150; không chặn sinh/giao hoặc giả hết ca |
| A ngày10 | Xét11/12/13 | 11/12 bị chặn;13 mới có thể xảy ra |
| Đã có sự kiện xấu cùng/ngày trước | Xét A | Bị chặn theo giới hạn chung |
| Reload đầu ca chưa chốt | Mở lại cùng ngày | Cùng roll/kết quả; quay về checkpoint theo luật đang có |
| Chốt/retry/reload | Lưu báo cáo | Chi phí200, cash/profit chính xác; không trừ trùng |
| Save cũ chưa có metadata | Khôi phục | Giữ lịch sử, tiền/kho; chuẩn hóa trên bản sao sau checksum |

</frozen-after-approval>

## Code Map

- `src/config/campaignEvents.ts`, `src/domain/CampaignEvents.ts`: xác suất/cooldown và chọn sự kiện thuần, seed+day ổn định.
- `src/runtime/CozyRuntime.ts`: xét một lần lúc mở ca, trừ cưỡng bức có chủ đích, trạng thái/thông báo và closeAccounts.
- `src/domain/CozyStock.ts`, `src/domain/DayAccounts.ts`: tiền âm và chi phí sự kiện riêng, không biến thành mua kho/giá vốn/shipper.
- `src/domain/CozyCheckpoint.ts`: metadata/report optional, kiểm tra loss/cooldown, tổng tiền và lợi nhuận; bảo toàn legacy.
- `src/scenes/CozyScene.ts`, `src/presentation/ReferenceSummary.ts`: thông báo compact/lease riêng, dòng chi tiết tài chính hiện có.
- `src/runtime/CozyCampaignEvents.test.ts`, `tests/campaign-events.spec.ts`: boundary randomness, save/idempotence và E2E.

## Tasks & Acceptance

- [x] Policy/config: random theo seed+day,10% đúng biên, lịch sử giới hạn1/ngày/no-adjacent/cooldown3; không random mỗi frame.
- [x] Runtime/stock/accounts: ca mới áp dụng A đúng một lần; vẫn bán được khi âm; chi phí thật và wage warnings giữ đúng.
- [x] Checkpoint: seed/lịch sử/report loss cùng boundary hiện có; checksum trước normalize; không sửa báo cáo cũ hoặc tiền khác không hợp lệ.
- [x] UI: compact Đã hiểu, thông báo số mất và số dư thật; giữ lease/không click xuyên; chi tiết finance thêm chi phí trong vùng cuộn hiện có.
- [x] Tests/docs: focused unit/E2E360×640, build,3review và cập nhật luật/tracking.

Given campaign mới, when tạo và mở ca, then seed đã gắn vào checkpoint tạo chiến dịch trước khi bốc sự kiện. Given cùng save/ngày, when tải lại, then không thể reroll bằng đóng thông báo/mua ở chuẩn bị/return Menu. Given loss200 khi tiền50, when giao pizza hoặc cuối ngày, then số âm/bù tiền/thuê/lương/phá sản theo luật hiện có, không tạo nợ riêng. Given cuối30, when có A, then vẫn complete như9.1; rewards/report save đúng một lần.

## Design Notes

Optional metadata giúp save cũ không mất dữ liệu. Seed mới boundedinteger; legacy thiếu seed dùng giá trị deterministic ổn định, không derive từ tiền/kho đang thay đổi hoặc bốc mới mỗi load. Cooldown có thể derive từ reports có event loss; không cần mảng lịch sử trùng reports. Tiền âm được cho phép vì yêu cầu mới nhưng không nới validator tuỳ tiện: audit mọi bound cash/start/end, đối soát eventloss với reports và inventoryledger. Phí shipper riêng, eventcost vào other/profit/cash đúng một lần. Fixtures cần seed/roll có kiểm soát, tránh ngẫu nhiên làm test flaky hoặc đổi legacy expectedprices.

Thông báo scene không phải nơi trừ tiền; acknowledgement chỉ đóng/trả lease riêng. Save/error/recovery ưu tiên. Return Menu giữ ca RAM/sự kiện đã xét, reload về đầu ca và cùng quyết định.

## Verification

Vitest eventpolicy+runtime+stock+checkpoint+accounts+Epic9/Epic8 regressions; Chromium360×640 eventnotice, clickblocking/leases, số âm/cashfinancedetail, restore/retry/legacy. Build-nolog. Không full browser matrix hoặc tự tuyên bố cân bằng chiến dịch đã playtest.

Kết quả: build đạt,45unit/6files đạt,2E2E360×640 đạt (test đầu sửa chọn control tổng kết và metadata của finance body rồi chạy lại). Ba reviewer độc lập không có lỗi cần sửa; giải thích chi phí other đã cập nhật gồm sự kiện. Một test demo3ngày cũ thuộc deferred-work, không đổi luật30ngày để làm pass. Validator kiểm tra loss/cooldown/ledger, không áp RNG hồi tố lên lịch sử cũ. VIP được người dùng chốt tiếp10% mỗi lượt, nhiều lần/ngày; Story9.3 xử lý riêng.

## Suggested Review Order

- Áp dụng một lần lúc mở ca, giữ điều kiện mua và lịch hiện tại.
  [CozyRuntime.ts:447](../../src/runtime/CozyRuntime.ts#L447)
- Đối soát tiền âm, tổn thất và lịch sử qua checkpoint.
  [CozyCheckpoint.ts:108](../../src/domain/CozyCheckpoint.ts#L108)
- Seed từ danh tính chiến dịch đã xác minh, không đổi sau mua.
  [CozyCampaignSession.ts:1](../../src/runtime/CozyCampaignSession.ts#L1)
- Thông báo sở hữu lease riêng trước đồng hồ simulation.
  [CozyScene.ts:172](../../src/scenes/CozyScene.ts#L172)
- Kiểm tra biên xác suất, reload và chi phí chính xác.
  [CozyCampaignEvents.test.ts:17](../../src/runtime/CozyCampaignEvents.test.ts#L17)
- Kiểm tra native IndexedDB, input, số âm và retry.
  [campaign-events.spec.ts:26](../../tests/campaign-events.spec.ts#L26)
