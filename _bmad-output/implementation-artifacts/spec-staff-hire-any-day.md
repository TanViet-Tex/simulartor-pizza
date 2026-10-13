---
title: 'Thuê nhân viên 2000 xu trong 10 ngày, hỏi gia hạn khi hết hạn'
type: feature
created: '2026-10-13'
status: done
baseline_commit: '198ec0879dfcae801c1e871bbf45f3168664c2e5'
context: []
---

<frozen-after-approval reason="Yêu cầu người dùng 2026-10-13: bỏ khóa ngày 8, 2000 xu/10 ngày, không lương hằng ngày, hết hạn hỏi người chơi">

## Intent

**Problem:** Người chơi đủ tiền vẫn phải đợi ngày 8 mới được thuê nhân viên.
**Approach:** Cho phép thuê cả bốn nghề từ ngày 1 khi đủ tiền trong chuẩn bị. Phí 2000 xu trả trước cho 10 ngày trong game; không trừ lương mỗi ngày. Hết hạn ngừng làm và hỏi người chơi có gia hạn không, không tự trả tiền.

## Boundaries & Constraints

**Always:** Phí thuê/gia hạn 2000 xu/10 ngày, ngày thuê tính ngày thứ nhất; mỗi nghề một người còn hợp đồng. Chỉ thuê/gia hạn trong chuẩn bị, giữ guard pause/save và ngày bận phụ bếp. Gia hạn cần đồng ý thật. Giữ toàn bộ bố cục/art hiện có.
**Never:** Cấp thêm tiền, thu lương hằng ngày, gia hạn/trừ tiền tự động, cho thuê giữa ca, xóa tiến độ hoặc làm yếu kiểm tra kế toán/save.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Thuê sớm | Ngày 1, đủ 2000 xu, chuẩn bị | Một người đúng nghề, trừ 2000 xu một lần | Save lỗi giữ trạng thái cũ; retry cùng payload |
| Thiếu tiền | Ngày 1, dưới 2000 xu | Hồ sơ ghi tiền thiếu, nút thuê khóa | Không trừ tiền |
| Reload | Đã thuê ngày 1 | Khôi phục tiền và nhân viên đúng | Kiểm tra hiredDay trong khoảng 1..day |
| Guard | Đã sở hữu, đang ca hoặc pause | Không thuê thêm | Không đổi state |
| Hết hạn | Thuê ngày 1, chuẩn bị ngày 11 | Ngừng làm, hỏi gia hạn 2000 xu/10 ngày | Thiếu tiền khóa xác nhận; từ chối không trả phí |
| Gia hạn | Đồng ý khi đủ tiền | Trả phí một lần, hợp đồng mới 10 ngày | Save lỗi/retry giữ cùng candidate |
| Save cũ | Có người/lương/nợ lịch sử | Giữ tiền/báo cáo/nợ cũ, bắt đầu kỳ 10 ngày tại chuẩn bị hiện tại | Không hồi tố hoàn tiền, không thu nợ tự động trong ngày mới |

</frozen-after-approval>

## Code Map

- `src/config/staffCatalog.ts`: ngưỡng mở thuê chung cho runtime, UI và validator.
- `src/domain/StaffCheckpoint.ts`: xác thực ngày thuê.
- `src/domain/CozyCheckpoint.ts`: đối soát báo cáo cũ và kỳ thuê mới.
- `src/runtime/CozyRuntime.ts`: preview và giao dịch thuê.
- `src/runtime/CozyCampaignSession.ts`: giao dịch thuê/gia hạn/từ chối cùng checkpoint.
- `src/presentation/ShopScreens.ts`, `src/scenes/CozyScene.ts`: thông tin hồ sơ/thẻ thuê.
- `src/runtime/CozyEpic8.test.ts`: guard, kế toán và retry.
- `tests/epic8-staff.spec.ts`, `tests/reference-shop-screens.spec.ts`: UI và persistence.

## Tasks & Acceptance

- [x] Bỏ khóa ngày 8 trong cấu hình và thông tin UI; không đổi geometry.
- [x] Hợp đồng 10 ngày và không lương mỗi ngày; hỏi gia hạn tại chuẩn bị hết hạn.
- [x] Lưu lịch sử kỳ thuê/gia hạn, kiểm tra kế toán; giữ báo cáo/save cũ.
- [x] Test thuê ngày 1 đủ tiền, thiếu tiền, reload và invalid hiredDay=0.
- [x] Cập nhật assertion UI từ khóa ngày sang thiếu tiền; kiểm thử giao dịch thuê sớm.
- [x] Đồng bộ project-context theo luật mới.
- [x] Build/typecheck và unit/E2E tập trung Chromium 360×640.

**Acceptance Criteria:** Given ngày 1 và đủ tiền, when xác nhận thuê và lưu thành công, then nhân viên đã thuê hoạt động trong ca và vẫn tồn tại sau reload. Given save cũ, when restore, then giữ nguyên tiền, người đã thuê và nợ lương.

Given thuê ngày 1, when hết ngày 10, then ngày 11 nhân viên dừng, người chơi được hỏi và chỉ trả phí nếu đồng ý. Given đóng bất kỳ ngày mới, then không sinh lương/nợ hoặc trừ lương.

## Verification

- `npx vitest run src/runtime/CozyEpic8.test.ts src/runtime/CozyFridgeAndAbsence.test.ts`
- `npm run build-nolog`
- `npx playwright test tests/epic8-staff.spec.ts tests/reference-shop-screens.spec.ts --project=chromium-360x640` với grep đúng luồng thuê.

## Spec Change Log

- 2026-10-13: Người dùng đổi phí thuê thành trả trước 10 ngày và bỏ lương hằng ngày, yêu cầu hỏi khi hết hạn. Giữ thay đổi mở thuê ngày1 và geometry; thay phạm vi kiểm thử payroll bằng contracts, migration và gia hạn.

## Implementation & Results

- `staff.contracts` version2 giữ mốc chuyển đổi, kỳ thuê và lựa chọn từ chối; biên nhận thuê gốc bất biến, gia hạn cộng chi phí đầu tư đúng ngày. Ngày thuê..ngày thuê+9 có hiệu lực; sau đó chỉ hợp đồng mới khi xác nhận.
- Save cũ đối soát lương200xu/ngày trước khi chuẩn hóa hợp đồng. Giữ nguyên cash/reports/arrears và không tự thu nợ cũ ở ngày mới. Kỳ chuyển đổi10ngày bắt đầu tại chuẩn bị đang khôi phục, không mất người đã trả phí.
- Build/typecheck đạt. 29unit/4file đạt: Epic8, Contracts, FridgeAndAbsence, Epic9. Năm E2E tập trung Chromium360×640 đạt qua các lượt cuối: thuê ngày1/lỗi–retry–reload, bốn nghề/phí trả trước/no-wage, hết hạn/từ chối/gia hạn, gia hạn lỗi–retry–reload và thiếu tiền.
- UI expiry screenshot kiểm tra trực quan: khung/thẻ/nút cũ, chữ vừa nội dung, Để sau/Gia hạn rõ. Không chạy full browser matrix.
- Fixture E2E đợi scene chơi sau menu tải, cuộn tới thẻ dưới; test no-wage chốt ca thật ngay sau mở, automation đã có unit riêng. Không thay gameplay để làm xanh fixture.
- Review blind/edge/acceptance không còn phát hiện lỗi được xác nhận.

## Suggested Review Order

- Kiểm tra kỳ thuê và biên nhận gia hạn.
  [StaffCheckpoint.ts:1](../../src/domain/StaffCheckpoint.ts#L1)
- Kiểm tra thao tác thuê, hết hạn và lựa chọn từ chối.
  [CozyRuntime.ts:150](../../src/runtime/CozyRuntime.ts#L150)
- Đối soát lương lịch sử và kỳ thuê mới.
  [CozyCheckpoint.ts:160](../../src/domain/CozyCheckpoint.ts#L160)
- Hỏi gia hạn trong chuẩn bị và giữ frame hiện có.
  [CozyScene.ts:270](../../src/scenes/CozyScene.ts#L270)
- Kiểm tra migration, hạn10ngày và retry.
  [CozyStaffContracts.test.ts:1](../../src/runtime/CozyStaffContracts.test.ts#L1)
