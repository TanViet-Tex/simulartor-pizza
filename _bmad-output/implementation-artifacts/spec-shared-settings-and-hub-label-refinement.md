---
title: 'Chỉnh nhãn hub, nền thông báo và Cài đặt dùng chung'
type: bugfix
created: '2026-10-05'
status: done
baseline_commit: 498de97
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="explicit user request authorizes these scoped UI changes">

## Intent

Chữ năm tab hub sát mép dưới, thông báo che đen hết nền và hai nơi Cài đặt không đồng bộ. Nâng riêng nhãn tab, cho nền sau modal hơi tối còn nhìn thấy, dùng cùng panel/điều khiển Cài đặt ở Menu/Pause, bỏ hậu tố xu trong ô tiền có icon đồng xu.

## Boundaries & Constraints

Giữ toàn bộ artwork, hitbox tab, header/body/footer, sáu ô khách, dữ liệu và gameplay. Chỉ sửa các phần người dùng nêu; không cài thư viện hoặc tạo hệ nhạc chưa có. Nhạc chưa có phải ghi rõ; điều khiển hiệu ứng và giảm chuyển động dùng hệ đang có. Giữ input blocker và lease/modal pause; lớp nền bán trong suốt không cho click xuyên. Yêu cầu mới thay luật nền đen kín ở các thông báo cũ. Không xóa chữ xu ở nội dung giá/lương khác chưa có icon tiền.

## I/O & Edge-Case Matrix

| Trạng thái | Hành động | Kết quả |
|---|---|---|
| Hub bất kỳ | Đổi tab | Nhãn nhích lên, không đổi vùng bấm/art/body |
| Thông báo click hoặc tự hiện | Mở panel | Nền nhìn thấy, chỉ tối nhẹ một lần, thao tác nền bị chặn |
| Menu Cài đặt | Đổi hiệu ứng/mute/motion | Vào Pause Cài đặt giữ cùng giá trị/kiểu panel |
| Pause Cài đặt | Quay lại | Về Pause, game vẫn dừng; Tiếp tục mới trả lease |
| Nhạc chưa có | Mở Cài đặt | Nêu chưa có, không giả có âm lượng nhạc hoạt động |
| Header tiền | Vẽ cash | Icon hiện có và số, không hậu tố xu |

</frozen-after-approval>

## Code Map

- `src/presentation/HubHeader.ts`: canvas header tiền và năm nhãn navigation.
- `src/presentation/NotificationFrame.ts`: art khung/nút dùng chung, giữ nine-slice.
- `src/presentation/SettingsPanel.ts`, `src/presentation/ModalBackdrop.ts`: presenter/settings và lớp tối chung.
- `src/scenes/CozyScene.ts`: veil, Pause Settings, thông báo tự hiện và targets/leases.
- `src/scenes/MainMenuScene.ts`, `src/main.ts`: Menu Settings và injection cùng PlayAudio/preferences.
- `src/presentation/PlayAudio.ts`, `src/presentation/MenuPreferences.ts`: trạng thái thật hiệu ứng/mute/motion.
- `tests/shared-settings-ui.spec.ts`: focused360×640 và regression tương tác.

## Tasks & Acceptance

- [x] `HubHeader.ts`, `CozyScene.ts`: nâng chữ tab khoảng5px; chỉ số tiền trong pill/icon hub và bếp.
- [x] `ModalBackdrop.ts`, `CozyScene.ts`, `MainMenuScene.ts`: lớp đen alpha0.28–0.30, không stack trong cùng redraw, input vẫn chặn.
- [x] `SettingsPanel.ts`, hai scenes, `main.ts`: cùng panel, font, nút, nhãn và trạng thái thật; nút ít nhất48CSSpx; giữ keyboard/focus và Quay lại.
- [x] `tests/shared-settings-ui.spec.ts`: kiểm tra khớp panel/giá trị, hitbox, thông báo manual/automatic, chặn nền và pause.
- [x] Tài liệu/mốc UI: ghi override phạm vi và ảnh360×640; build, focused tests, ba review.

Given năm tab và ô tiền, when render360×640, then chữ không chạm viền dưới và số/icon không tràn. Given Menu/Pause dùng cùng audio/preferences, when chỉnh một nơi và chuyển sang nơi kia, then giá trị và panel khớp. Given modal đã mở, when click nền hoặc đổi settings, then không mua/đổi tab phía sau và ca vẫn dừng theo lease hiện có. Given đóng thông báo, when không còn lease khác, then runtime tiếp tục đúng hành vi hiện có.

## Design Notes

Cozy summaryModalVeil và notificationFrame có thể cùng gọi veil trong một redraw: opacity phải chỉ vẽ một lần, vẫn reset targets đúng. Shared presenter giữ semantic actions, adapters đăng ký geometry/focus của scene, không remap tọa độ hai lần. PlayAudio cùng instance được truyền từ composition root cho cả Menu/Pause; thay runtime không reset setting. Nhạc hiện chưa có; trạng thái rõ ràng và disabled. MainMenu modal phải có blocker thực sự vì xóa targets không tự xóa zone đã dựng.

## Verification

Build-nolog; unit PlayAudio/MenuPreferences liên quan; focused Chromium360×640 shared-settings-ui và reference-pause flows. Xem ảnh tab/tiền và hai Settings, thông báo1/2nút để xác nhận nền nhìn thấy và màu không đen kín. Không full browser matrix.

## Results & Review

Build đạt;6unit PlayAudio/MenuPreferences đạt.12E2E notification-frames/reference-pause đạt;3E2E mới shared-settings-ui đạt ởChromium360×640. Lần đầu nhóm15 có một timeout chờ khởi động5s; đã dùng readiness15s và chạy lại đủ3test mới đạt, không sửa logic để né lỗi. Kiểm tra pixel lớp nền chỉ tối một lần, chặn tab/mua phía sau, thông báo tự hết ngày, sharedgeometry/values, bàn phím chỉnh âm lượng và Quay lại giữ pause. Xem ảnh thật cả5tab, Menu/Pause Settings và thông báo1/2nút. Ba review độc lập không còn phát hiện; acceptance recheck nhãn tiền bếp đạt. Không fullmatrix, không thư viện/save/gameplay changes.

## Suggested Review Order

- Hai scene dùng cùng panel và cùng trạng thái âm thanh/chuyển động.
  [SettingsPanel.ts:11](../../src/presentation/SettingsPanel.ts#L11)
- Lớp tối nhẹ dùng chung vẫn chặn thao tác nền.
  [ModalBackdrop.ts:6](../../src/presentation/ModalBackdrop.ts#L6)
- Nâng riêng nhãn tab và bỏ xu ở ô tiền có icon.
  [HubHeader.ts:27](../../src/presentation/HubHeader.ts#L27)
- Chỉ vẽ veil một lần, giữ điều khiển và lease thông báo.
  [CozyScene.ts:605](../../src/scenes/CozyScene.ts#L605)
- Menu bỏ input cũ, đăng ký controls và giữ bàn phím.
  [MainMenuScene.ts:219](../../src/scenes/MainMenuScene.ts#L219)
- Composition root truyền cùng PlayAudio cho hai scene.
  [main.ts:30](../../src/main.ts#L30)
- Kiểm tra pixel, dữ liệu thật, hình học và chặn nền360×640.
  [shared-settings-ui.spec.ts:23](../../tests/shared-settings-ui.spec.ts#L23)