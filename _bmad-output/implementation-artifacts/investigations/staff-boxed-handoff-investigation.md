# Investigation: Bốn nhân viên kẹt bánh đã đóng hộp

## Hand-off Brief

Người dùng báo thuê4nhânviên, đầu ca chạy rồi nhiều lần bánh đóng hộp đứng yên. Tái hiện bằng publicAPI xác nhận đơn gọi nước thiếu bước thêm chai trong staffhandoff và khách mặc cả bị bỏ qua bởi scheduler. Sửa target-specific drink attachment theo owner hiện có và kích hoạt lựa chọn mặc cả thật, rồi kiểm thử chuỗi đơn dài.

## Case Info

- Opened:2026-10-13; baseline:`1f8694a90f7f56dcb419cb3b1d1aa7e1d3a951d8`.
- Status:Concluded.
- Scope:CozyRuntime.tickStaff→deliverNow, stockdrink/selection/pause/bargain. Không sửaUI/layout hoặc giá/ca/contract.
- Evidence:source code, public API regression tests, 3 focused Chromium E2E passed.

## Problem Statement

User: “khi thuê4nhânviên xong mở quán bán lúc đầu thì mượt, lúc sau thì khi nó làm xong pizza đóng hộp rồi bị đứng im không giao cho khách … rất nhiều lần”.

## Evidence / Hypotheses

1. Confirmed:deliverNow chặn target.drink&&!drinkAttached; tickStaff cũ chỉ handoff không thêm nước. Test all4staff+seededwater/cola/orange+đủchai cho thấy bánh boxed không được giao. Selectedticket khác càng cần target-specific owner, không dùng chai của đơn đang xem.
2. Confirmed:deliveryscheduler cũ yêu cầu kind!=='bargain'. Regression cả accept/refuse thấy bargainPending=null sau15s và bánh boxed. Việc hỏi giá có pause riêng, cần khởi chạy qua deliver chuẩn chứ không tự chấp nhận giá.
3. Refuted as general cause:đợi nhânviên app trở về20/30s là luồng hữu hạn đã có test riêng, không giải thích boxedwater/bargain trong ca quầy.

## Reproduction

Freshproductionruntime, seeded slots quầy, claim testfunds qua publicAPI, hire4nghề, buyfood+drink, openShop, advance50ms steps. Trướcfix4/5case mới failed:3nước/repeatedstock và2bargainbranches (manualattached case passed). Không sửa tiền/save trực tiếp để dựng repro.

## Conclusion

Confidence:High. Điều kiện trong source và regression trước sửa khớp triệu chứng. Đã sửa theo [spec](../spec-staff-boxed-handoff-fix.md): build đạt, 63 unit tập trung và 3 E2E Chromium đạt. Chuỗi 12 đơn unit và 8 đơn canvas không còn kẹt; cả hai lựa chọn mặc cả tiếp tục ca đúng. Khi hết đúng loại nước, đơn vẫn chờ bổ sung kho theo luật hiện có.
