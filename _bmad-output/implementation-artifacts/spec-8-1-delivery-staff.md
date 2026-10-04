---
title: 'Epic 8.1 — nhân viên vai trò cố định và lương cuối ngày'
type: feature
created: '2026-10-05'
status: done
baseline_commit: f65e737
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user supplied and confirmed staffing rules">

## Intent

Triển khai8.1: ngày8 mở thuê, phí2000xu/người, mỗi loại tối đa1. Bốn loại theo thẻ hiện có: phụ bếp, thợ nướng, đóng hộp, giao hàng. Vai trò cố định, không phân công lại. Lương200xu/người/ngày, thu cuối ngày; thiếu thì cảnh báo rõ số tiền thiếu và giữ lương chưa trả. Công đoạn làm nhanh, thời gian đặt trong config. Mỗi nhân viên giao1đơn/chuyến, trở về mới nhận tiếp.

## Boundaries & Constraints

Giữ tiền/kho/đơn/công thức/save cũ, UI header/năm tab/sáu mục/bốn thẻ nhân viên, bếp6ô khách và sức chứa4→6. Không thêm lưu giữa ca/thư viện. Đơn app giao là hoàn tất ngay, không thời gian chuyến; trở về20s/mưa30s theoEpic6. Người chơi vẫn thao tác được, không race/toggle topping/trừ kho/giao hai lần. Không tự mua nguyên liệu/bookshipper, xác nhận giúp/mặc cả/bánh sai hoặc xóa bánh của người chơi. Mua thuê chỉ trong chuẩn bị và atomic tiền+roster, save cũ không tự có người. Không cho đổi nghề hoặc thêm nghỉ/sa thải/đào tạo/mệt/bonus chưa chốt. Truyện/nhiệm vụ ẩn/khách nổi tiếng chưa thuộc đợt8.1; không tuyên bố toànEpic8done.

</frozen-after-approval>

## Design Notes

- Config: prep mỗi nguyên liệu0.30s; vận hành lò/lấy bánh0.25s; đóng hộp0.30s; handoff0.30s. Giữ cửa sổ chín của cấp lò hiện có; nhân viên thao tác nhanh, không ghi đè nâng cấp lò. Timers simulation50ms, pause dừng, background tiếp theo luật hiện hành.
- Automation dùng ticket/order identity+stage guard, công đoạn helper cùng manual path, không đổi selection để dispatch rồi đổi lại. Phụ bếp chỉ thêm nguyên liệu còn thiếu đúng món, không xóa topping sai; không tốn kho trước bake. Thợ nướng bắt đầu khi đúng món/kho/lò trống và app đã book hoặc có nhân viên; lấy bánh của ovenowner ở perfectStart. Boxer đóng/tích hộp đơn app, không tự là courier. Giao tự hoàn tất đúng đơn đủ hộp khi rảnh; counter không có chuyến ngoài quán, app chuyển return20/30s; khi đangreturn không tự nhận đơn khác. Không employee thì giữ manual/bookshipper hiện có.
- Payroll accrual: dailyWages=200×số nhân viên thuê trước ca. OpeningArrears+dailyWages=due. Cuối ngày sau rent/rewards, đủcash thì trả toàn due một lần; thiếu thì paid0, giữ due, báo thiếu=max(0,due−cash), không tự vay/mất người/lãi. Lương là chi phí ngày phát sinh trong profit; cash chỉ trừ wagesPaid thực trả (có thể gồm nợ cũ). EndingArrears=openingArrears+dailyWages−wagesPaid. Không tính lại khi retry/reload/close lần2. Ngày sau tự thử trả cả khoản còn thiếu và lương ngày mới ở cuối ngày.
- Staff metadata: acquired role/hiredDay/actualPrice, spent/pendingSpent, arrears. Report optional payroll(roles/openingArrears/wagesPaid/endingArrears), legacy wages0/defaultempty. Đối soát salary theo ngày thuê, capitalphíthuê, cash/profit/report sequence và currentarrears; không nới validation bằng việc chỉ chấp nhận số bất kỳ.

## Code Map

- `src/config/staffCatalog.ts`, `src/domain/StaffCheckpoint.ts`: roles/prices/salary/durations và metadata validation.
- `src/runtime/CozyRuntime.ts`: hiring, frozen roster, guarded jobs, payroll-close, warning; maintain oven owner/manual interop.
- `src/runtime/CozyCampaignSession.ts`: staging hire+commit/retry, same runtime confirmation.
- `src/domain/DayAccounts.ts`, `src/domain/CozyCheckpoint.ts`: salaryexpense/cashpaid/arrears and legacy reconciliation.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: staff cards live salary/owned/jobs, shared confirm/warning; unchanged geometry.
- `src/runtime/CozyEpic8.test.ts`, `tests/epic8-staff.spec.ts`: focused acceptance/regression.

## Tasks & Acceptance

- [x] Catalog/metadata/hire/fixed roles, oldsave and atomic retry.
- [x] Staff guarded actions, FEFO exactlyonce, ovenowner, app multi-box/one trip/return/manual overlap/pause.
- [x] Payroll accruing200each, paidcashvsprofit, arrears/warning/repayment, complete checkpoint validation.
- [x] Staff UI hire/cancel/owned/salary and wage warning in sharedmodal; sixframes unchanged.
- [x] Unit meaningful money/save/jobs/payroll/forgedmetadata; Chromium360×640E2E; build and3reviews.

Given day7, when hire, then blocked. Given day8/cash2000, when confirmedcommit, then one worker and2000 deducted once. Given rawsave without staff, when restore, then noemployee and unchangedmoney. Given fourworkers, when close, then wageexpense800; if insufficient no cashpayment, debt grows800 and warning exact; nextday enoughcash pays old+new due but profit expenses only newday. Given orderexpires/remade/manuallyboxed, when jobfinishes, then no stale action. Given another ticket selected, when ovenownerready, then only owner extracted. Given app3pizza, when packed/given, then cost/payment/outcome once and courier busyreturn20/30. Given anypause, when advance, then no job/oven/deadline/return progress.

## Verification

Focused Vitest Epic8/checkpoint/accounts/campaign/Epic6/Epic7/kitchen; build-nolog; Chromium360×640 epic8-staff plus relevant regression. No fullbrowsermatrix.
### Kết quả 2026-10-05

- `npm run build-nolog`: đạt; chỉ còn cảnh báo kích thước bundle Phaser đã có.
- 121 unit hiện hành đạt (114 trong bộ 15 file + 7 kiểm tra kế toán/tổng kết). Một assertion cũ trong CozyAccounts vẫn yêu cầu dừng demo ở ngày 3; thất bại giống hệt ở baseline f65e737 trên 26 dependency riêng. Ghi trong deferred-work.md, không đổi luật để khớp assertion cũ.
- Chromium 360×640: 3 Epic8, 4 Epic6 và 4 Epic7 đạt. Một luồng Epic7 chạm timeout30s lúc reload; chạy riêng timeout60s đạt23.8s. Sau chỉnh nhãn nghề cố định, build và E2E trang nhân viên chạy lại đạt.
- Đã xem ảnh renderer thật: bốn thẻ giữ nguyên tọa độ, giá/lương không tràn, khung xác nhận/hủy và cảnh báo thiếu lương đọc được, sáu ô khách không đổi. Ảnh ở ui-baseline/epic8-*.png.
- Ba review độc lập: blind diff, edge cases và acceptance. Không còn phát hiện cần sửa. Giả thuyết bỏ sót đơn mặc cả bị loại sau đối chiếu: quyết định mặc cả chỉ xuất hiện khi giao thủ công; resolveBargain quyết định và giao trong cùng command. Không tự xác nhận mặc cả. Giao tại quán không có chuyến ra ngoài; app mới có thời gian trở về.
- Save cũ mặc định không nhân viên/nợ lương; thuê và retry atomic, lương cuối ngày ghi một lần, không lưu giữa ca. Toàn Epic8 còn in-progress.

## Suggested Review Order

**Tuyển và công việc tự động**

- Tuyển theo nghề, bảo vệ tiền và giới hạn mỗi loại một người.
  [CozyRuntime.ts:87](../../src/runtime/CozyRuntime.ts#L87)
- Commit cùng tiền và roster, giữ runtime khi lưu thành công.
  [CozyCampaignSession.ts:83](../../src/runtime/CozyCampaignSession.ts#L83)
- Job giữ identity/stage; dùng chung hành động thủ công để tránh trừ kho lặp.
  [CozyRuntime.ts:718](../../src/runtime/CozyRuntime.ts#L718)

**Lương và checkpoint**

- Tách chi phí lương phát sinh khỏi tiền thực trả, giữ khoản chưa trả.
  [CozyRuntime.ts:341](../../src/runtime/CozyRuntime.ts#L341)
- Đối soát roster, lương, tiền và khoản chưa trả qua từng ngày.
  [CozyCheckpoint.ts:105](../../src/domain/CozyCheckpoint.ts#L105)
- Profit dùng lương phát sinh, cash dùng tiền thực trả.
  [DayAccounts.ts:11](../../src/domain/DayAccounts.ts#L11)

**Giao diện và bằng chứng**

- Dùng bốn thẻ hiện có và khung xác nhận chung.
  [CozyScene.ts:737](../../src/scenes/CozyScene.ts#L737)
- Kiểm tra race, lò đúng chủ, giao một chuyến, lương và retry.
  [CozyEpic8.test.ts:15](../../src/runtime/CozyEpic8.test.ts#L15)
- Kiểm tra native save và vùng bấm ở 360×640.
  [epic8-staff.spec.ts:16](../../tests/epic8-staff.spec.ts#L16)
- Giá, lương và tốc độ thao tác nằm trong cấu hình chung.
  [staffCatalog.ts:1](../../src/config/staffCatalog.ts#L1)