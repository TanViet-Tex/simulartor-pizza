---
title: 'Mã test VIETVUIVE trong Cài đặt'
type: feature
created: '2026-10-06'
status: done
baseline_commit: '9900910e002debcf815f26ce3e747f0473a7055b'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người dùng cần nhập mã trong Cài đặt để nhận tiền thử chức năng Quán và mua hàng.

**Approach:** Thêm hành động Nhập mã ở Cài đặt dùng chung Menu/Pause; mở ô văn bản và nút nhận. Mã `VIETVUIVE` cộng đúng100.000xu vào chiến dịch hiện tại, một lần mỗi lượt chơi. Lưu tiền và dấu đã nhận cùng giao dịch trước khi báo thành công.

## Boundaries & Constraints

**Always:** Chuẩn hóa trim + uppercase; giữ tiền/kho/ngày/XP/uy tín, chỉ cộng khoản tiền test. Mã chỉ nhận khi có chiến dịch đang ở chuẩn bị, không có giao dịch pending/lỗi cần xử lý. Menu không tự tạo/reset campaign. Pause giữa ca cho mở nhập mã nhưng báo cần chốt ngày rồi nhận khi chuẩn bị. Chiến dịch mới có thể nhận lại. Dữ liệu cũ không có metadata mặc định chưa nhận. Hiển thị rõ mã sai/đã nhận/chưa có lượt/đang lưu/lỗi lưu; retry cùng payload không cộng lặp.

**Ask First:** Nếu cần cho nhận/lưu giữa ca, thay luật một lần mỗi lượt hoặc đổi màn ngoài Cài đặt và hộp nhập mã.

**Never:** Không gửi mạng/backend, không giả doanh thu/XP/uy tín, không thêm lưu gameplay giữa ca, không cộng tiền trước commit thành công rồi báo đã lưu giả. Không thiết kế lại Menu/bếp/hub. Không tăng100k khi mở Cài đặt hoặc chỉ nhập chữ.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Mã đúng | `VIETVUIVE`, đang chuẩn bị | Tiền hiện tại +100000; dấu nhận lưu cùng tiền | Thành công sau commit |
| Chuẩn hóa | ` vietvuive ` | Cùng mã hợp lệ | Không nhạy case/khoảng trống ngoài |
| Sai/rỗng | Chữ khác hoặc rỗng | Không đổi tiền/metadata | Nêu mã không hợp lệ |
| Nhận lặp | Mã đã nhận, double tap hoặc reload | Không thưởng lần hai | Nêu đã nhận |
| Chưa có lượt | Settings từ Menu trước Start | Không tự tạo campaign | Hướng dẫn Bắt đầu rồi nhập |
| Đang bán | Pause Settings hoặc Menu giữ ca RAM | Không cộng/lưu giữa ca | Hướng dẫn nhận trong chuẩn bị |
| Save lỗi | Commit thất bại/conflict | RAM chưa thưởng, không mất save cũ | Retry hiện hành hoặc tải mới theo conflict |
| Lượt mới | Người dùng tạo chiến dịch mới thật | Có thể nhận một lần ở lượt mới | Không ảnh hưởng lượt cũ trước commit tạo mới |
| Đóng/thoát | Hủy input, chuyển scene | Không thưởng, gỡ input và lease riêng | Không resume pause nguồn khác |

</frozen-after-approval>

## Code Map

- `src/presentation/SettingsPanel.ts`: panel dùng chung, thêm nút mã trong khoảng nội dung còn trống; giữ controls cũ.
- `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts`: modal nhập và adapter gọi campaign; pause/input cleanup.
- `src/main.ts`: MenuActions nối session thật.
- `src/runtime/CozyCampaignSession.ts`: candidate checkpoint → commit → confirm, retry/guard.
- `src/runtime/CozyRuntime.ts`, `src/domain/CozyCheckpoint.ts`: tiền test và receipt optional, kiểm tra/restore/export.
- `src/domain/CozyStock.ts`: API cộng tiền hiện hành.

## Tasks & Acceptance

- [x] `src/domain/TestCode.ts` và unit — mã, số thưởng, chuẩn hóa/receipt, không đặt mã hoặc tiền từ artwork.
- [x] `CozyRuntime.ts`, `CozyCheckpoint.ts` — metadata optional được validate; export/restore và nhận test tách thưởng thương mại. Đối soát tiền báo cáo qua khoản hỗ trợ riêng, không làm tăng profit bán hàng hoặc mục tiêu.
- [x] `CozyCampaignSession.ts` — staged grant cho chuẩn bị; áp dụng vào runtime hiện tại sau commit, một lần; dùng guard/revision/idempotency hiện hành; save cũ giữ nguyên.
- [x] `SettingsPanel.ts` và hai scene/main adapter — nút Nhập mã chung, modal/input thật, feedback/loading/error và cleanup; đúng pause ownership và input nền.
- [x] Unit session/runtime/checkpoint —100k chính xác, nhận lặp/reload, checksum save cũ, double tap/retry/lỗi commit không thưởng sớm.
- [x] E2E360×640 tập trung — nhận từ Menu/Pause chuẩn bị, sai/đã nhận, giữa ca chặn, đóng modal, reload giữ tiền, không ảnh hưởng audio/motion.
- [x] Cập nhật UI baseline đúng phần Cài đặt được yêu cầu, spec kết quả và ảnh kiểm chứng riêng.

**Acceptance Criteria:**
- Given tiền trước là300, when mã đúng commit thành công, then tiền là100300 và reload không nhận lần hai.
- Given Settings đang mở, when nhập/hủy/đóng modal, then audio/motion controls và pause owner khác vẫn đúng.
- Given commit lỗi, when thử lại cùng yêu cầu, then100k được nhận tối đa một lần và chỉ sau success.

## Spec Change Log

## Design Notes

Khoản test là tiền hỗ trợ, không doanh thu bán bánh. Chỉ thêm trong vùng Cài đặt được yêu cầu; dùng khung thông báo chung, input text native tương tự quantity editor nhưng không dùng numeric validation. Luật chuẩn bị giữ ranh giới checkpoint hiện hành; không hồi sinh chiến dịch phá sản/complete bằng mã.

## Verification

- `npm run build-nolog`.
- Vitest chọn đúng các unit mới và checkpoint/session liên quan.
- Playwright Chromium360×640 chỉ chọn luồng Settings/mã và save liên quan; không full matrix.

## Results

- Build `npm run build-nolog` đạt.
- 23 unit liên quan mã, checkpoint và campaign session đạt.
- 7 E2E Settings/mã trên Chromium 360×640 đạt; sau sửa Escape, chạy lại 2 luồng Menu/Pause đạt.
- Ba lượt rà soát độc lập hoàn tất; lỗi Escape sau nhận tiền đã sửa và kiểm chứng lại.
- Ảnh Settings và hộp nhận mã đã kiểm tra; UI baseline cập nhật đúng phần được yêu cầu.

## Suggested Review Order

**Giao dịch tiền và dữ liệu lưu**

- Lưu tiền và dấu nhận cùng checkpoint trước khi cập nhật phiên chơi.
  [CozyCampaignSession.ts:85](../../src/runtime/CozyCampaignSession.ts#L85)
- Chặn nhận trùng và chỉ cho nhận trong chuẩn bị.
  [CozyRuntime.ts:90](../../src/runtime/CozyRuntime.ts#L90)
- Đối soát tiền hỗ trợ riêng với báo cáo và save cũ.
  [CozyCheckpoint.ts:92](../../src/domain/CozyCheckpoint.ts#L92)

**Nhập mã và kiểm chứng**

- Giữ input native, đóng bằng Escape và trả focus về game.
  [TestCodePanel.ts:13](../../src/presentation/TestCodePanel.ts#L13)
- Kiểm tra nhận đúng tiền, reload và chặn nhận giữa ca.
  [test-code.spec.ts:15](../../tests/test-code.spec.ts#L15)