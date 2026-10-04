---
title: 'Epic 7 — chỉ mở rộng tăng sức chứa, bàn ghế tăng kiên nhẫn'
type: bugfix
created: '2026-10-04'
status: done
baseline_commit: 9b2f24b
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user explicitly requested implementation">

## Intent

Người dùng thay luật Epic7: chỉ mở rộng quán tăng sức chứa từ 4 lên tối đa 6 khách. Bàn ghế chỉ tăng thời gian kiên nhẫn, không thêm chỗ chờ/khách. Bỏ đề xuất sức chứa 8/10 và hàng avatar cuộn; giữ đúng 6 ô khách hiện tại. Đồng bộ code, tài liệu và test. Không tự thêm tác dụng cho mở rộng lần 2.

## Boundaries & Constraints

Always: giữ UI/giá/tiền/kho/đơn/lưu cũ; mở rộng hiện có một lần 6000 xu, cap6. Loại bỏ waitingSeats khỏi hiệu ứng đồ. Người dùng đã trả lời bàn ghế 4000 xu tăng10% kiên nhẫn: bật mua/đặt/cất theo giao dịch hiện có, chỉ đồ đặt có bonus, cộng trên gốc/cap40%/đóng băng đầu ca. Tổng tiện nghi sau cooling max là38%, không28%. Mở rộng lần2 giá10000 vẫn chưa mua được/chưa có tác dụng.

Never: cap8/10, hàng chờ phụ/overflow, avatar cuộn, reflow 6 ô hoặc tác dụng mới của mở rộng lần2. Không thêm lưu giữa ca/thư viện hoặc đổi phần ngoài yêu cầu.

## I/O & Edge-Case Matrix

| Trạng thái | Kết quả |
|---|---|
| Mọi tổ hợp đồ đang đặt | Không tăng cap4/6 hoặc sinh thêm chỗ chờ |
| Mở rộng lần1 | Cap4→6; không nâng tiếp khi cap6 |
| Save queueLevel2/3 | Bị validation từ chối, không clamp/reset save |
| Bàn ghế | Giá4000, +10% kiên nhẫn khi đặt; mua chưa đặt không bonus; cap không đổi |
| Mở rộng lần2 | Không action mua và không tác dụng bổ sung |

</frozen-after-approval>

## Code Map

- `src/domain/ShopEffects.ts`, `src/config/shopCatalog.ts`: hiệu ứng đồ và trạng thái chưa chốt.
- `src/presentation/ReferenceShop.ts`, `src/scenes/CozyScene.ts`: nhãn thẻ/detail, không thay bounds.
- `src/runtime/CozyRuntime.ts`, `src/domain/CozyCheckpoint.ts`: cap4/6 hiện có, queueLevel0/1; giữ đúng implementation.
- `src/domain/ShopEffects.test.ts`, `src/runtime/CozyEpic7.test.ts`, `tests/epic7-shop.spec.ts`: chống hồi quy sức chứa và nhãn.
- Tài liệu Epic7/GDD/decision-log/project-context/UI-baseline/sprint: thay các luật bàn ghế/chỗ chờ cũ, ghi nhận quyết định mới.

## Tasks & Acceptance

- [x] Bỏ trường/công thức/nhãn waitingSeats; bàn ghế +10% kiên nhẫn, bật mua/đặt/cất, validation nhận tối đa12 món.
- [x] Test pure effects/runtime/save: đồ không tăng cap; nâng cấp đúng 4→6 một lần; từ chối cấp sức chứa cao hơn.
- [x] E2E kiểm tra sáu ô/thẻ, bàn ghế mua/đặt/reload +10% và cap không đổi, mở rộng lần2 không action.
- [x] Đồng bộ tài liệu liên quan; không để luật chỗ chờ cũ còn hiệu lực.
- [x] Build và kiểm tra tập trung; review độc lập.

Given đồ đang đặt, when mở ca/reload, then chỉ bonus khách/kiên nhẫn hợp lệ và cap phụ thuộc mở rộng. Given cap6, when nâng tiếp, then tiền/cấp không đổi. Given bàn ghế đang đặt, when nhận khách gốc60s, then66s và cap4 không đổi. Given màn bếp, when mở rộng, then vẫn đúng 6 ô khách cố định.

## Spec Change Log

- Người dùng trả lời mức bàn ghế10% trong khi đang chuẩn bị: thay trạng thái chờ mức bằng món khả dụng, cập nhật tổng38% và các test tương ứng. Giữ nguyên cap4/6 và sáu ô cố định.

## Verification

Vitest ShopEffects/CozyEpic7/CozyCheckpoint/CozyCampaignSession; build-nolog; Chromium360×640 epic7-shop. Không full browser matrix.

Build đạt. 41 unit trong5 file liên quan đạt; cả4 E2E Epic7 Chromium360×640 đạt (3 đạt lượt đầu, test bàn ghế đạt sau sửa harness). Đã kiểm tra ảnh bàn ghế +10% và mở rộng lần2 chưa có tác dụng. Không thay bounds/số ô/vị trí của UI hiện hành.

Ba review độc lập hoàn tất, không có lỗi production cần sửa. Nghi vấn notification-close được bác bỏ bằng alias nút cancel trong CozyScene và E2E đã đạt. Test mới đọc nhãn Canvas qua dataset chỉ chứa Phaser Text nên thất bại; sửa kiểm tra thành không có action mở rộng2 và ảnh thực tế, không đổi code sản phẩm. Shared fixture cache theo mức tiền là quan sát không chặn, hiện assertions dùng tiền tương đối/schedule riêng.

## Suggested Review Order

- Bàn ghế thêm kiên nhẫn, hiệu ứng đồ không còn trường sức chứa.
  [ShopEffects.ts:14](../../src/domain/ShopEffects.ts#L14)
- Cho mua món theo luồng hiện có, nhận đủ12 món trong save.
  [shopCatalog.ts:3](../../src/config/shopCatalog.ts#L3), [ShopCheckpoint.ts:8](../../src/domain/ShopCheckpoint.ts#L8)
- Giữ mở rộng lần2 chưa mua, không gán tác dụng mới.
  [ReferenceShop.ts:91](../../src/presentation/ReferenceShop.ts#L91)
- Kiểm tra mua/đặt/cất/reload và giới hạn4→6.
  [CozyEpic7.test.ts:23](../../src/runtime/CozyEpic7.test.ts#L23), [epic7-shop.spec.ts:17](../../tests/epic7-shop.spec.ts#L17)
