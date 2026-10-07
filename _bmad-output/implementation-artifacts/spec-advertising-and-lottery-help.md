---
title: 'Quảng bá dự báo và vé số giúp người vô gia cư'
type: feature
created: '2026-10-07'
status: done
baseline_commit: 9de8fd3
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user approves100 advertising and guaranteed300 per ticket once per campaign">

## Intent

Quảng bá trả100xu/ngày trong chuẩn bị, xem số tốp/lượt khách tại quán và số đơn app của lịch seeded thật, không tăng lượt. Mua một lần/ngày, retry không trừ lặp; có thể mở lại thông tin đã mua. Lịch dự báo dùng cùng menu/app/trang trí/mở rộng/runtime, cập nhật khi cấu hình chuẩn bị đổi. Tốp là nhóm khách quầy cùng thời điểm, không tính số bánh như số khách; giải thích dự kiến/có thể bỏ lỡ khi đầy.

Vé số là lời mời giúp người vô gia cư, một lần trong chiến dịch30ngày. Người chơi chọn5/10/20tờ, giá30xu/tờ, có thể từ chối. Tất cả tờ mua đều trúng300xu/tờ theo quyết định người dùng, nhận thưởng cuối ngày, không RNGtrúng hoặc tăng uy tín. Lời mời chọn ngày3–27 ổn định từ seed, ghi quyết định/thưởng trong save/report; reload/retry/chốt lặp không mua/nhận lặp. Không tạo đơn pizza hoặc tăng lượt đơn từ lời mời; xem là sự kiện khách ghé bán vé số, không phải lượt gọi món. Giữ các nhiệm vụ/luật khác. Không thêm voice/dependency/hư hỏng.

## Boundaries & Constraints

Giữ bố cục hub5tab, dùng dialog chung có pause lease riêng. Chi phí quảng bá/vé số là chi phí khác, không phải nhập nguyên liệu hoặc vốn nâng cấp; tiền thưởng vé số tách doanh thu pizza. Chốt ngày đối soát đủ receipts/nghĩa vụ/report, thông báo thưởng có claim duy nhất. Save cũ mặc định chưa mua quảng bá/chưa gặp nhiệm vụ, báo cáo cũ không sửa; save đã qua ngày sự kiện không ép mở lịch sử. Tiền/vốn/kho/nhân viên chưa được cấp miễn phí. Không công thức gia truyền, không thay payoutVIP.

</frozen-after-approval>

## Code Map

- `src/config/advertising.ts`, `src/domain/Advertising.ts`: phí100 và đếm lịch dự kiến.
- `src/config/lotteryMission.ts`, `src/domain/LotteryMission.ts`: counts/cost/prize/ngày seeded/receiptvalidation.
- `src/domain/DayAccounts.ts`, `src/domain/CozyCheckpoint.ts`: chi phí khác và receipts/thưởng/history/reload validation.
- `src/runtime/CozyRuntime.ts`, `src/runtime/CozyCampaignSession.ts`: transaction/claim/forecast/lời mời/tổng kết.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: quảng bá trong Quán, dialogmua/xem; lotteryhelpdialog và thưởngcuốingày.

## Tasks & Acceptance

- [x] Quảng bá mua/xem seeded/atomic/save/chi phí khác.
- [x] Lottery invitationmộtlần/quyết định/cost/prize/report/claim/save.
- [x] Dialogpause/input/giữgeometry và điều kiệnthiếutiền.
- [x] Unitseed/count/payout/retry/history, build/typecheck/Chromiumtập trung.

Given đủ100xu và chưa mua hôm đó, when quảng bá, then trừ100 và mở dự báo đúng lịch; mua lại không trừthêm. Given lottery5/10/20, when mua đủtiền, then chi150/300/600,thưởngcuốingày1500/3000/6000. Given từchối/thiếutiền, then không nhậnthưởngmiễnphí. Given chốt/retry/restore, then không trùngthưởng/chi. Given các tínhnăngcũ, then forecast/app/ngânsách không tự tăng.

## Verification

Unit economic/receipt/scheduler/save/session tập trung; build-nolog/typecheck; Chromiumdialogluồng nếu khả dụng, không toànE2E.

Runtime/checkpoint/session dịch vụ: 33 tests trong 4 file đạt, gồm mua quảng bá chỉ publish sau commit, retry dùng cùng candidate, ngân sách không tăng, vé5/10/20 nhận1500/3000/6000 cuối ngày, pause reason riêng, từ chối/thiếu tiền, reload/claim một lần và reject thưởng giả. Hồi quy nước/tủ lạnh/lịch: 29 tests trong 4 file đạt. Fixture ranh giới/campaign tự trả lời từ chối lời mời phụ; không thay luật sản phẩm để bỏ qua sự kiện.

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
