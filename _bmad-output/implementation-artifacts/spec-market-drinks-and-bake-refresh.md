---
title: 'Nước uống ở Chợ, phục vụ trong bếp và thời gian lò mới'
type: feature
created: '2026-10-13'
status: done
baseline_commit: '45daef1245c800230c1e5c5ee11ecfad320882aa'
context: []
---

<frozen-after-approval reason="Yêu cầu trực tiếp của người dùng 2026-10-13">

## Intent

Giảm tiếng thanh toán thêm30% so với mức hiện tại60%effectsVolume, tức42%. Chuyển mua nước từ Quán/Thiết bị sang Chợ, tách Nước suối/Nước cam/Coca có tên/nhãn thật. Ba ô phục vụ nước trong bếp đẹp đồng bộ bảng màu Quản lý, giữ bounds hiện có. Nối mua thật với đơn khách gọi một chai nước kèm pizza qua luồng đang có, kiểm tra cả ba loại. Đổi chín theo cấp lò0/1/2 thành4/3/2giây, cháy sau chín thêm3giây.

## Boundaries

Giữ giá nhập8/10/12 và bán20/25/30 theo catalogwater/cola/orange, tiền/kho/checkpoint/FEFOnguyên liệu thật. Nước giữ metadata riêng, không ép vào enum19nguyên liệu. Không đặt số lượng/đơn/tiền giả. Giữ các panel/footer/layout ngoài bộlọc nước và baô phục vụ được yêu cầu. Nhạc, các hiệu ứng khác, pause/ownership/lò lấy bánh/thưởng không đổi. App không gọi nước theo luật hiện hành. Giảm30% là nhân0.7, không giảm30điểm phần trăm.

## Acceptance

- Given Chợ trong chuẩn bị, when mua từng loại/số lượng, then trừ catalogprice×quantity một lần và kho chai/save đúng; thiếu tiền/mute/pause/save guard hiện hành.
- Given ba loại nước, when khách gọi loại đó, then tên nước có trên đơn và chỉ chai đúng được gắn một lần; nhận tiền pizza+nước/giá vốn/báo cáo đúng, không thu lặp.
- Given lò cấp0/1/2, when reaches4/3/2, then chín; tại7/6/5 còn chưacháy, sau mốc đó cháy. Pause dừng clock và tiếng lò; báo tinh tại mốc chín mới.
- Given thanh toán và effectsVolume, then WebAudio/nativefallback đều42%×volume; mute0.

</frozen-after-approval>

## Code Map / Tasks

- [x] `src/presentation/PlayAudio.ts`: giảmgain payment; focusedunit.
- [x] `src/config/bakeTiming.ts`, `src/presentation/ShopScreens.ts`: timing chung+text thật; focusedboundarytests.
- [x] `src/presentation/ReferenceMarket.ts`, `src/scenes/CozyScene.ts`: Chợ mua3nước, bộlọc, adapter giao dịch; bỏ mua nước Thiết bị.
- [x] `src/presentation/DrinkArt.ts`, `DrinkKitchenCells.ts`: minh họa/nhãn chung, baô đẹp trongbounds cũ.
- [x] `src/runtime/CozyDrinks.test.ts`, `tests/drinks-service.spec.ts`: cả3loại, sai/thiếu/gắnlặp, mua→mởca→giao→report; inventoryreload.
- [x] Build và focusedChromium360, tài liệu và ảnh/ghi kết quả hoàn thành.

## Verification

Focused audio/domain/runtime/drink units; drinks-service+game-audio+market regression Chromium360, chỉ đúngcases bị ảnh hưởng. Không full browser matrix.

## Kết quả hoàn thành — 2026-10-13

- Đã giảm payment60%→42%; timing chín4/3/2, vẫn chín tại7/6/5 và cháy khi vượt mốc. Shared timing áp dụng UI/runtime/audio/tutorial/staff.
- Nước mua tại Chợ, ba dòng đầy đủ tên/nhãn/số chai/giá, bộlọc riêng và xuất hiện trong Tất cả. Thiết bị chỉ còn lò/tủ lạnh. 19nguyên liệu và giỏ/gợi ý vẫn riêng; gợi ý giữ lượng nước người chơi đang chỉnh.
- Baô nước bếp giữ geometry, đổi hình chai/nhãn/màu đồng bộ quản lý. Người dùng đã xác nhận đúng phạm vi màn bếp. Đơn nước kèm pizza hiện có được nối/kiểm chứng đủ3loại; sai/thiếu/lặp không thu tiền sai, report/cost/save đúng.
- Build/typecheck và92unit/9file đạt.9E2E tập trung Chromium360×640 đạt qua lượt cuối:3loại nước, Chợ mua/drag/clip/reload,3cấp lò+pause/settings, tín hiệu audio thật và foodfilter/bulk/cancel/scroll. Không full matrix/thiết bị thật.
- Review blind/edge/acceptance phát hiện DrinkId thiếu trong listHit: đã sửa để dùng viewport clipping, cleanup và drag suppression chung. E2E chứng minh hàng nước khuất disabled, controls không trùng và kéo trên Mua không mất tiền. Không còn lỗi được xác nhận.
- Fixture hồi quy Chợ cập nhật vốn500/giá quote thật và tọa độhub0.88; không đổi production để phù hợp giả định lịch sử300xu/coords cũ.
- Ảnh đã kiểm tra: [Chợ](ui-baseline/market-drinks-bake-2026-10-13/market-drinks.png), [Bếp](ui-baseline/market-drinks-bake-2026-10-13/kitchen-drinks.png).

## Suggested Review Order

- Mốc chín và khoảng chờ cháy.
  [bakeTiming.ts:2](../../src/config/bakeTiming.ts#L2)
- Âm lượng thanh toán trong mixer/fallback.
  [PlayAudio.ts:121](../../src/presentation/PlayAudio.ts#L121)
- Dòng nước trong Chợ dùng kho riêng.
  [ReferenceMarket.ts:16](../../src/presentation/ReferenceMarket.ts#L16)
- Vùng chạm hàng nước và giao dịch mua.
  [CozyScene.ts:340](../../src/scenes/CozyScene.ts#L340)
- Ba ô phục vụ có nhãn trong bếp.
  [DrinkKitchenCells.ts:10](../../src/presentation/DrinkKitchenCells.ts#L10)
