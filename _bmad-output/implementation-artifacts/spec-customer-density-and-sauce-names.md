---
title: 'Tăng lịch khách, giảm thông báo xin giúp và căn tên sốt'
type: feature
created: '2026-10-06'
status: done
baseline_commit: a08e598
---

## Intent

Ngày1 có10 lượt nền, ngày2 có15, ngày3–7 có20, từ ngày8 có25. Giữ thời gian ca180/210/240 giây và biến động mưa/cao điểm/lễ hội/app/giới thiệu/nâng cấp Quán. Lịch nền là lượt dự kiến; nhận khách vẫn theo sức chứa/kho/menu.

Người dùng xác nhận giảm cả xin giảm giá và xin pizza miễn phí: khoảng một khách mặc cả mỗi10lượt, Linh có25% cơ hội khi đủ điều kiện ngày2, ổn định theo seed save. Giữ luật nhận/từ chối, thưởng/phạt và pause. Tên đầy đủ của sốt nằm gọn trong khung, giữ hình chai/hitbox và highlight.

## Code Map

- `src/config/cozySchedule.ts`: số lượng, thời điểm, loại khách và hook giúp.
- `src/runtime/CozyRuntime.ts`: quyền hook giúp ổn định cho lịch thật/dự báo.
- `src/scenes/CozyScene.ts`: căn tên sốt.

## Tasks & Acceptance

- [x] Cập nhật lịch và kiểm tra toàn30ngày, IDs/tick/biến động sự kiện.
- [x] Giảm cả hai loại thông báo, giữ save và dự báo đồng nhất.
- [x] Căn tên sốt trong khung và kiểm tra bounds trên canvas.
- Given ngày chuẩn bị, when lập lịch, then số nền theo10/15/20/25.
- Given seed save không đổi, when xem dự báo hoặc tải lại, then cơ hội giúp không đổi.
- Given nhãn sốt, when render, then bounds nằm trong ô, không thay hitbox/bố cục.

## Verification

38 unit lịch/sự kiện/dự báo/runtime đạt; 2E2E bếp Chromium360×640 đạt. Đã xem ảnh thật và kiểm tra bounds nhãn trong ô. Helper test cũ được đồng bộ mốc nướng6s, hàng chờ4, quyền nhận đơn trước khi mua kho theo luật hiện hành; không đổi luật runtime.

Rà soát edge cases độc lập kiểm tra giới thiệu210s sau khi tăng số lượt, các mốc cuối154/178/219/226s, tick và stable IDs. Đã sắp xếp referral giữa lịch nền, giữ commercialOrdinal. Kiểm tra acceptance/code trực tiếp: false help eligibility chuyển sang lượt thương mại; forecast và lịch thật dùng cùng hash; save không thêm schema; tên sốt chỉ chuyển lên4px và giới hạn scale trong ô. Runtime thread limit ngăn thêm phiên review nên các lens còn lại được kiểm tra trực tiếp.

Suite CozyDelivery cũ vẫn có6assertion lỗi về ready sau3s trong khi baseline lò đã dùng6s; không sửa luật giao bánh trong thay đổi này.

## Suggested Review Order

- [Lịch nền và loại khách](../../src/config/cozySchedule.ts).
- [Cơ hội giúp ổn định theo save](../../src/domain/HelpOffers.ts), [runtime](../../src/runtime/CozyRuntime.ts#L439).
- [Nhãn sốt trong ô](../../src/scenes/CozyScene.ts#L515), [kiểm tra canvas](../../tests/reference-kitchen.spec.ts#L48).
