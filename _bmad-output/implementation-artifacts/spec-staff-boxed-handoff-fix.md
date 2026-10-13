---
title: 'Sửa nhân viên kẹt bánh đóng hộp khi đơn có nước/mặc cả'
type: bugfix
created: '2026-10-13'
status: done
baseline_commit: '1f8694a90f7f56dcb419cb3b1d1aa7e1d3a951d8'
context: []
---

<frozen-after-approval reason="Người dùng yêu cầu fix gấp bốn nhân viên đóng hộp rồi không giao">

## Intent

**Problem:** Bốn nhân viên có thể hoàn thành pizza nhưng không giao đơn có nước; khách mặc cả không được mở lựa chọn. Tái hiện bằng publicAPI trướcfix, không suy từFPS.
**Approach:** Nhân viên giao thêm đúng chai của chính đơn đang phục vụ qua shared drink mutation owner, rồi handoff qua deliver hiện có. Cho scheduler khởi chạy mặc cả bằng delivery chuẩn, chờ lựa chọn người chơi rồi tiếp tục. Không tự quyết định giá.

## Boundaries

Giữ recipe/FEFO/cash/cost/report/doublecommand/pause/selection/oneworkbench/expiry. Chai tiêuhao tối đa một lần; không tự mua, đổi loại hoặc tạo chai khi thiếu. Manualattach đã có giữ nguyên, staff không tiêuhao lại. Không đổi UI/art/layout, contract2000/10ngày, lò4/3/2 và3giây chờcháy, courierapp20/30s vềquán hay appbooking.

## Acceptance

- Given all4staff và đủfood/drinks, when chuỗi đơn nước khác nhau được đóng hộp, then mỗiđơn đượcgiao, chaixuất đúngloại mộtlần và board đượcgiảiphóng; không kẹt sauđơnđầu.
- Given đangxem đơnB, when staffhandoffđơnA, then chai/giáA đúng và selectionB đượcgiữ.
- Given manualattached, then staff khôngdùng chai thứhai.
- Given boxedbargain, when staffready, then bảng mặc cả mở và pauseđúng; accept/refuse chốt đúngmộtlần và ca tiếp tục.
- Given thiếuchai/pause/saveguard hoặc ticketexpired, then khônginvent/thu sai tiền; khi đủchai vàguardhợp lệ, staff có thể tiếp tục.

</frozen-after-approval>

## Code Map / Tasks

- [x] `src/runtime/CozyRuntime.ts`:shared target-specificattachdrink và staffhandoff; mởbargainkhôngautochoose.
- [x] `src/runtime/CozyStaffHandoff.test.ts`:deterministic beforefail→afterpass và chuỗi đơn/saiđơn/stock/manual/pause/bargain/accounting.
- [x] `tests/staff-handoff.spec.ts`:canvas4staff phục vụchuỗiđơn và bargainUI, khôngbấm giao/thêmchai thủcông.
- [x] Focusedstaff/drink/runtimeunits +build +Chromium360; note kếtquả trongfile.

## Verification

Không fullmatrix. Kiểm tra chính luồng bịkẹt, longsequence và report/savevalidity; giữ các phần đãđượcduyệt.

## Kết quả — 2026-10-13

- Nhân viên giao hàng tự lấy đúng nước của đơn đang giao, chỉ tiêu hao một chai; không phụ thuộc đơn người chơi đang chọn. Bánh giao xong giải phóng bàn cho đơn tiếp theo.
- Đơn mặc cả mở lựa chọn cho người chơi. Đồng ý hoặc từ chối đều chốt đơn đúng một lần và tiếp tục ca.
- Build/typecheck đạt. 7 file unit tập trung, 63 test đạt; gồm chuỗi 12 đơn nước, kiểm tra tiền, kho, báo cáo, checkpoint, pause và save guard tại bước giao hộp.
- Chromium 360×640: 3 E2E đạt, gồm 8 đơn liên tục với 4 nhân viên và cả hai lựa chọn mặc cả trên canvas thật.
- Không chạy full suite. Sáu assertion lịch sử của `CozyCustomers.test.ts` lệch timing/lịch hiện hành cũng thất bại trên runtime trước sửa; không thuộc thay đổi này.

## Review

Ba lượt rà soát độc lập: blind, acceptance và edge cases. Một P2 được phát hiện và sửa: giữ khách thứ ba đang chọn sau khi giải quyết mặc cả của khách đầu. `deliverStaff` dùng chung cho handoff và quyết định mặc cả; reviewer tái hiện lại cả đồng ý/từ chối và xác nhận đóng finding. Unit bổ sung khóa tạm dừng và save guard. Expiry/replenishment chưa có regression riêng tại bước handoff; không tuyên bố đã kiểm chứng bổ sung nước giữa ca.

## Suggested Review Order

- Giao đúng đơn và giữ khách đang chọn qua cả hai giai đoạn mặc cả.
  [CozyRuntime.ts:1065](../../src/runtime/CozyRuntime.ts#L1065)
- Dùng chung kiểm tra và tiêu hao chai theo đơn đích.
  [CozyRuntime.ts:162](../../src/runtime/CozyRuntime.ts#L162)
- Kiểm tra chuỗi đơn, kho, tiền, pause và khách thứ ba.
  [CozyStaffHandoff.test.ts:23](../../src/runtime/CozyStaffHandoff.test.ts#L23)
- Kiểm tra phục vụ và lựa chọn mặc cả trên canvas thật.
  [staff-handoff.spec.ts:32](../../tests/staff-handoff.spec.ts#L32)
