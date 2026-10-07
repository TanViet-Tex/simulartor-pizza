---
title: 'Mở rộng hai lần: 4→5→6 ô và bonus khách quán'
type: feature
created: '2026-10-07'
status: done
baseline_commit: 9de8fd3
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user requests implementation of confirmed expansion rules">

## Intent

Triển khai hai cấp mở rộng: lần1 giá6000xu mở4→5 ô và +10% lượt khách quầy; lần2 giá10000xu mở5→6 ô và tổng+30%. Bonus cộng trên gốc cùng trang trí, không cộng lặp theo ca/save/reload. Đây là phần đã đủ luật trong nhóm người dùng giao; nước/tủ lạnh/quảng bá/ngày bận/nhiệm vụ còn đang bổ sung quyết định riêng, không tự chọn tiền hoặc luật cho các phần đó.

## Boundaries & Constraints

Giữ sáu ô UI đã duyệt; ô ngoài sức chứa khóa đúng cấp. Burst tối đa2/3 theo ngày không phụ thuộc sức chứa, cả app không nhận bonus. Runtime và forecast dùng chung lịch seeded sau bonus. Referral/help không nhận bonus khách quầy thương mại. Tiền trừ một lần, nâng cấp trong chuẩn bị qua candidate→commit→confirm hiện có, retry không mất tiền trùng. Giá nâng lò và các đồ khác giữ nguyên.

Save cũ có cấp1 đã mua từng nhận6ô: giữ6ô đã sở hữu, lịch sử thanh toán6000 hoặc200 theo receipt cũ; không hạ sức chứa/xóa tiến độ/thu tiền lại. Cần metadata phân biệt save cũ và cấp1 mới5ô, vẫn cho mua cấp2 nhận tổng+30% khách; không sửa báo cáo tiền lịch sử. Save mới cấp1=5ô; cấp2=6ô. Không tự chuyển cấp1 cũ thành mua cấp2 hoặc thêm receipt giả.

</frozen-after-approval>

## Code Map

- `src/config/kitchenEconomy.ts`: giá, sức chứa và bonus từng cấp.
- `src/config/cozySchedule.ts`: eligibility nhận5ô nhưng không tác động burst.
- `src/domain/CozyCheckpoint.ts`: nhận cấp2 và migration metadata giữ6ô save cũ.
- `src/domain/ShopEffects.ts` và scheduler bonus hiện có: additive bonus lên lượt quầy.
- `src/runtime/CozyRuntime.ts`: cấp/bonus/sức chứa/restore/atomic nâng cấp và forecast chung.
- `src/runtime/CozyCampaignSession.ts`: giữ candidate commit upgrade.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: nhãn cấp hiện tại/cấp tiếp, khóa ô đúng sức chứa, không reflow.

## Tasks & Acceptance

- [x] Config/runtime/save: hai cấp, bonus và migration giữ quyền save cũ.
- [x] UI nhãn giá/cấp/bonus trong phần mở rộng hiện có; khóa đúng4/5/6ô.
- [x] Unit tập trung mua/thiếu tiền/retry/save/bonus/shop-only/forecast/burst.
- [x] Build/typecheck và Chromium tập trung phần mở rộng.

Given cấp0, when mua lần1, then trừ6000 một lần,5ô,+10%. Given cấp1, when mua lần2, then trừ10000 một lần,6ô,tổng+30%. Given save cũ cấp1, when restore, then6ô và tiền/receipt giữ nguyên. Given app/help/referral, when bonus, then không nhân các lượt này. Given cùng seed và cấp, when forecast/runtime tạo lịch, then khớp; sức chứa không đổi burst. Given lưu lỗi/retry, when nâng cấp, then không cấp đồ trước commit hoặc trừ trùng.

## Verification

Build-nolog/typecheck, unit scheduler/upgrade/checkpoint/campaign-session tập trung; Chromium360×640 phần mở rộng, không toàn E2E.

### Verification update

Two expansion levels use 6000/10000 coins, capacities 4/5/6 and shop visitor bonuses 0/10/30%. Legacy level 1 saves retain six seats and historical receipts. Decoration and expansion bonuses add once to the base shop schedule; app/help/referral are excluded. The pizza workbench upgrade card was removed; the production board remains.

Focused unit tests and previous expansion browser test passed. Final integration checks are pending.

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
