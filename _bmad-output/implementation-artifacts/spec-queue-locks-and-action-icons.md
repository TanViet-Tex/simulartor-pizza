---
title: 'Căn ô hàng chờ khóa, thông báo nâng cấp và khôi phục icon nút bếp'
type: bugfix
created: '2026-10-04'
status: done
baseline_commit: NO_VCS
context: []
---

<frozen-after-approval reason="Yêu cầu triển khai trực tiếp của người dùng">

## Intent

**Problem:** Ô hàng chờ khóa chưa vừa vòng tròn và không giải thích cách mở; hai nút Đóng hộp/Giao bánh mất icon trước nhãn.

**Approach:** Căn hình khóa trong vòng hiện có, cho chạm ô khóa mở thông báo “Hãy nâng cấp cửa hàng để được mở ô hàng chờ.”, khôi phục icon hộp và giao bánh trước chữ.

## Boundaries & Constraints

**Always:** Giữ sáu vị trí hiện có, gameplay4/nâng6, vị trí/vùng chạm/nội dung hai nút và trạng thái enable. Dialog chặn input phía sau, đóng chỉ trả lease do dialog sở hữu. Giữ UI/avatar/phô mai và gameplay khác.

**Ask First:** Thay bố cục hoặc luật nâng cấp.

**Never:** Không tự mua nâng cấp, trừ tiền/mở thêm ô khi chạm khóa; không thay ảnh nền hay đổi phô mai.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Hai ô khóa | Queue cap4 | Khóa cân giữa/vừa vòng, mỗi ô bấm được | Dialog nâng cấp |
| Đã nâng | Queue cap6 | Không khóa/control ô khóa | Đơn thật theo gameplay |
| Pause khác | User/visibility | Dialog không giải phóng owner khác | Close trả lease riêng |
| Box/deliver | Enabled hoặc disabled | Icon nằm trước nhãn trong nút | Hành vi không đổi |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts`: khóa hàng chờ, hit/dialog lifecycle và kitchenAction.
- `src/presentation/PizzaIcons.ts`: icon SVG dùng lại hoặc thêm riêng cho2 nút.
- `tests/queue-locks-actions.spec.ts`: kiểm tra production cap4/cap6, input và icon geometry.

## Tasks & Acceptance

**Execution:**
- [x] Căn khóa trong vòng hiện có, thêm2 hit target.
- [x] Thông báo nâng cấp với owner lease/đóng/lifecycle.
- [x] Icon hộp và giao bánh trước chữ, giữ trạng thái/vùng chạm.
- [x] Build/test Chromium tập trung, ảnh kiểm chứng và cập nhật context/baseline.

**Acceptance Criteria:**
- Given queue cap4, when bấm ô khóa4 hoặc5, then hiện đúng thông báo và tiền/cap không đổi.
- Given thông báo mở, when chạm ingredient phía sau, then không thay gameplay.
- Given cap6, when render, then không hiện hai khóa.
- Given nút bếp, when enabled/disabled, then icon và chữ nằm gọn, action giữ luật cũ.

## Spec Change Log

## Verification

Build-nolog; Chromium390×844 fixture production thật và kiểm tra geometry/lease/input tập trung.

Kết quả: typecheck/build đạt;3 Playwright Chromium390×844 đạt. Đã xem ảnh khóa/icon, thông báo và nút giao bật. Test kiểm tra vị trí/kích thước khóa, cap4 click cả hai ô, nguyên liệu phía sau không nhận input, tiền/cap không đổi, visibility còn sau khi đóng, cap6 không có lock art/control và luồng box→deliver thật. Headless frame gap phục hồi bằng nút Tiếp tục trước thao tác tiếp theo. Ba reviewer không phát hiện lỗi code mới; đã bổ sung kiểm chứng geometry/enable theo audit. Cleanup reset cả flag và lease của thông báo. Không chạy full matrix.

## Suggested Review Order

- Icon và nhãn nằm gọn trong bounds hai nút.
  [CozyScene.ts:126](../../src/scenes/CozyScene.ts#L126)
- Ô khóa giữ vòng nền gốc và mở thông báo.
  [CozyScene.ts:342](../../src/scenes/CozyScene.ts#L342)
- Thông báo sở hữu pause riêng và chặn input.
  [CozyScene.ts:424](../../src/scenes/CozyScene.ts#L424)
- Các tình huống input, upgrade và box/deliver được kiểm chứng.
  [queue-locks-actions.spec.ts:30](../../tests/queue-locks-actions.spec.ts#L30)
