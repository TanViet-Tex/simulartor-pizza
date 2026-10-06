---
title: 'Phản hồi giao dịch tiền trên HUD và tiếng thanh toán'
type: feature
created: '2026-10-06'
status: done
baseline_commit: 23352ee
---

## Intent

Sau mỗi giao dịch thực sự thay đổi tiền, hiện số xu nhận xanh hoặc chi đỏ, viền tối, dưới ô tiền. Dùng delta số dư thực tế của giao dịch, gom phí/thưởng cùng thanh toán. Không đổi luật tiền, bố cục HUD hoặc save. Thanh toán/mua thành công dùng thanh toán.mp3 theo Hiệu ứng.

## Tasks & Acceptance

- [x] Runtime phát receipt tiền transient theo giao dịch, guard duplicate/failure và nested call.
- [x] Presentation giữ text ngoài layer redraw, xếp lệch nhiều receipt, tween1000ms alpha và bay8px; reducedMotion chỉ fade. Cleanup shutdown/destroy/completion.
- [x] Audio thêm một voice payment dùng asset hiện có; không phát khi fail, mute hoặc redraw.
- [x] Unit runtime/audio và E2E cash HUD nhận/chi, redraw, liên tiếp, reducedMotion, cleanup.
- Given giao dịch thành công, when money changes, then tổng tiền cập nhật và hiện một receipt đúng delta.
- Given redraw/doublecommand/save load, when UI refreshes, then không có receipt/sound mới.
- Given nhiều receipt, when chúng cùng tồn tại, then vị trí không đè nhau.
- Given giảm chuyển động, when receipt hiện, then không thay y và vẫn fade1s.

## Code Map

- `src/runtime/CozyRuntime.ts`: ranh giới tiền và subscribe transient.
- `src/presentation/CashFeedback.ts`: text/tween lifetime độc lập redraw.
- `src/presentation/PlayAudio.ts`: payment voice.
- `src/scenes/CozyScene.ts`: đăng ký, anchor HUD và cleanup.

## Implementation & Verification

Receipt `{id,amount,cash}` chỉ là notification trong phiên, không save/history/replay. Ranh giới nested transaction gom delivery/VIP/reward/app fee một lần; app2bánh100−5phí hiện+95, VIP50+500 hiện+550. Tiền chi mua lẻ/bulk/hỏa tốc/công thức/đồ/nâng cấp/nhân viên, settlement và tiền nhận mã/thưởng có feedback khi số dư thật đổi. Restore/reset không phát; candidate shop commit không có listener, live confirm chỉ phát khi commit thành công, retry/save failure đã kiểm tra.

CashFeedback nằm ngoài container redraw, chữ14px viền3px tối, xanh/đỏ, origin phải: bếp340/36 và hub350/44. Slots cách32px, lệch x10px xen kẽ; thử delayed bursts/reuse slot xác minh bounds không đè sau8px bay. Fade1000ms linear. Receipt ID dùng watermark transient; dispose tween/text khi xong/shutdown/destroy, unsubscribe runtime. Không mở popup thay thế.

Theo steering sau cùng, riêng payment=75%effectsVolume; vẫn chịu mute và effectsVolume. File `public/assets/audio/thanh toán.mp3`, preload auto, voice payment dùng lại không phát chồng. Burst trong cùng pending play dùng cơ chế restart/coalesce hiện có; không replay vì redraw. Tổng8voice bao gồm hai music, cùngwave lò.

77unit đạt, gồm net app/VIP, duplicate/failure/restore, reward khi arrival bị fullqueue từ chối, repo failure/retry, graph volume/mute/cleanup. Build đạt. Cash-feedback E2E Chromium360×640 đạt: redraw/doublecommand/stack/delayed slot reuse/fade/reducedMotion/shutdown; E2E giao hai đơn không popup cũng đạt. Đã xem ảnh thực tế. Một assertion lịch Epic6 cũ được đồng bộ số lượt14/22/28 theo lịch người dùng vừa duyệt.

Review độc lập phát hiện slot20px có thể chồng khi stagger và boolean false của arrival có thể che reward20xu đã commit; đã sửa slot32px và dựa cash delta của action hoàn tất, thêm regression tương ứng. Kiểm tra acceptance trực tiếp giữ luật tiền/schema/geometry.

## Suggested Review Order

- Ranh giới transaction và receipt: [CozyRuntime.ts](../../src/runtime/CozyRuntime.ts#L708).
- Độc lập redraw, motion và lifetime: [CashFeedback.ts](../../src/presentation/CashFeedback.ts).
- Voice payment và mức âm75%: [PlayAudio.ts](../../src/presentation/PlayAudio.ts#L119).
- Kiểm chứng hình/chuyển động/cleanup: [cash-feedback.spec.ts](../../tests/cash-feedback.spec.ts).
