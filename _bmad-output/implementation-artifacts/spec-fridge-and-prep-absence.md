---
title: 'Tủ lạnh bảo quản ×4 và ngày phụ bếp bận'
created: '2026-10-07'
type: feature
status: done
baseline_commit: 9de8fd3
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user explicitly approves price, existing lots and unpaid absence">

## Intent

Tủ lạnh giá3000xu, mua một lần trong chuẩn bị, bảo quản thực phẩm lâu gấp4 và áp dụng cả lô còn dùng được trong kho. Không hồi sinh lô đã hủy/hết hạn. Hạn tính theo ngày dùng được bao gồm ngày mua: 1ngày thành4ngày,2ngày thành8ngày. Sốt không hết hạn giữ nguyên. Mua atomic tiền/sở hữu/lô qua candidate→commit→confirm, lỗi/retry không trừ trùng hoặc nhân hạn lần nữa. Chỉ mở mục thiết bị hiện có, không reflow toàn Quán.

Phụ bếp/nguyên liệu làm5–7ngày rồi bận đúng1ngày, khoảng chọn seeded theo chiến dịch/ngày thuê/chu kỳ. Ngày bận không thao tác tự động và miễn200xu lương ngày đó; các nghề khác vẫn làm/trả lương bình thường. Nợ lương cũ vẫn phải trả theo luật hiện có. Không đào tạo/mệt/nghề mới. Cho người chơi biết ngày bận trong chuẩn bị và ca. Tự làm nguyên liệu vẫn được, pause giữ timer công việc hiện hành. Save cũ giữ nhân viên/tiền/nợ lương, không reroll chu kỳ.

</frozen-after-approval>

## Code Map

- `src/domain/CozyStock.ts`: metadata refrigeration, expiry×4, mua/restore/validate.
- `src/domain/StaffAbsence.ts`: chu kỳ seed ổn định5–7ngày làm/1ngày bận.
- `src/domain/CozyCheckpoint.ts`: chấp nhận và đối soát fridge/lot/payroll, báo cáo lịch sử không sửa.
- `src/runtime/CozyRuntime.ts`: giao dịch tủ lạnh, xác định roster làm việc và lương ngày bận.
- `src/runtime/CozyCampaignSession.ts`: mua fridge qua candidate commit confirm.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: mua tủ lạnh và nhãn phụ bếp bận trong phần hiện có.

## Tasks & Acceptance

- [x] Tủ lạnh metadata/expiry/save, mua atomic và UI.
- [x] Chu kỳ bận seeded, công việc/roster/lương/report đối soát và UI.
- [x] Unit expiry/retry/save/absence/payroll, build/typecheck, E2E tập trung nếu khả dụng.

Given còn lô dùng được và đủ3000xu, when mua fridge, then trừ đúng3000, hạn×4 một lần, qty/cost giữ. Given lô đã hết hạn, when mua, then không hồi sinh. Given fridge/save reload, when mua lô mới, then nhận hạn×4, sốt vẫn không hết hạn. Given ngày phụ bếp bận, when mở/chốt ca, then không job prep,không lương prep nhưng nợ cũ giữ; nghề khác giữ nguyên. Given cùng seed/save, when reload, then ngày bận giống nhau. Given mua save lỗi, when retry, then không mất tiền hay nhân hạn trùng.

## Verification

Unit stock/fridge/absence/checkpoint/payroll/session tập trung, build-nolog; không toàn E2E.

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
