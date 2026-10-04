---
title: 'Căn pizza vừa ô chọn món'
type: bugfix
created: '2026-10-04'
status: done
route: one-shot
baseline_commit: NO_VCS
---

# Căn pizza vừa ô chọn món

## Intent

**Problem:** Người dùng chỉ rõ qua ảnh: pizza trong các ô chọn món chồi lên mép trên khung.

**Approach:** Thu đồng đều toàn bộ hình pizza (đế, topping và bóng) xuống 70%, căn tại tâm ngang và y+14 trong ô hiện có. Giữ tám ô, nhãn/vị trí tên, khóa, vùng chạm và gameplay; không triển khai yêu cầu Chợ đang chỉ ở tài liệu.

## Suggested Review Order

- [CozyScene.ts](../../src/scenes/CozyScene.ts): `recipes()` chỉ thay lệnh vẽ preview, save/restore transform để không ảnh hưởng đối tượng khác.
- [Ảnh kiểm chứng](ui-baseline/recipe-pizza-fit-2026-10-04.png): cả tám pizza nằm trong ô và phía trên nhãn.

## Verification

Typecheck/build đạt. Một Playwright Chromium390×844 (`reference-kitchen.spec.ts`) đạt: touch/input, resize, modal và đủ tám nhãn; đã xem screenshot cuối. Review độc lập xác nhận command transform được Canvas renderer và StaticGraphics cache/crop áp dụng đúng; không có lỗi mới. Không chạy full matrix.
