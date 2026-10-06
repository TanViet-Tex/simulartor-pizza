---
title: 'Bỏ thông báo đã giao pizza trong ca'
type: bugfix
created: '2026-10-06'
status: done
baseline_commit: 1beec04
---

## Intent

Người dùng yêu cầu bỏ popup “Đã giao pizza” sau giao bánh. Scene gọi continueShift hiện có khi ca ở delivered, rồi vẽ bếp; không còn dựng popup hay nút Tiếp tục ca trong ca thật. Runtime guard vẫn kiểm tra save/pause, nên không mở ca vượt qua lease khác. Giao lúc còn đơn tự chọn đơn tiếp như cũ. Không thay nhận tiền/XP/thưởng, xác nhận giao sai món, kết thúc ngày, save hoặc thông báo hoàn tất tutorial/freeplay.

## Verification

Build và E2E Chromium360×640 tập trung giao hai món phô mai/nấm: không popup/nút tiếp tục, nhận đủ115xu, hết hàng chờ trở về assembly/making không pause. Các E2E trước đây bấm continue-shift được đổi sang chờ making; không chạy full matrix. Kiểm tra trực tiếp draw không còn nhánh popup production, continueShift chỉ chuyển phase và được runtime guard trước khi chạy.

## Suggested Review Order

- Bỏ acknowledgement và tiếp tục ca qua guard hiện có: [CozyScene.ts](../../src/scenes/CozyScene.ts#L196).
- Đơn cuối trở lại bếp, tiền vẫn đủ: [reference-kitchen.spec.ts](../../tests/reference-kitchen.spec.ts#L48).
