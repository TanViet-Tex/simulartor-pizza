---
title: 'Tiếng Cài đặt phản hồi ngay khi bấm'
type: bugfix
created: '2026-10-06'
status: done
baseline_commit: 'a74742c'
context: []
---

<frozen-after-approval reason="Người dùng yêu cầu triển khai trực tiếp">

## Intent

**Problem:** Tiếng Cài đặt chậm và các nút bật/tắt vẫn dùng tiếng oscillator cũ. Người dùng muốn cùng file cài đặt.mp3 cho các thao tác Cài đặt, phản hồi ngay lúc bấm.

**Approach:** Bỏ đoạn gần im lặng đầu file khi phát, tải sẵn file nhỏ, gọi feedback trong thao tác nút trước redraw. Bỏ oscillator trong Cài đặt ở Menu/Pause, cả chuột/chạm và bàn phím.

## Boundaries & Constraints

**Always:** Giữ giao diện/vị trí/nút và hành vi cài đặt đã duyệt; một voice settings không chồng. Giữ âm lượng hiệu ứng/mute, nhạc15%, lò6× và lifecycle hiện có. Khi tắt Hiệu ứng phải dừng tiếng; bật lại dùng tiếng Cài đặt ngay theo trạng thái mới. Các thao tác khác khi mute không phát.

**Never:** Sửa file âm thanh gốc, thêm UI, đổi gameplay/save, phát âm trước gesture hoặc tự bật lại hiệu ứng.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Click | Hiệu ứng Bật; đổi nhạc/chuyển động/quay lại | Một settings voice từ đầu phần có tiếng; không oscillator | Thiếu thiết bị không ngắt game |
| Repeated clicks | Voice đang phát | Restart cùng voice; không chồng | Pending play giữ intent cuối |
| Mute | Tắt Hiệu ứng | Dừng hiệu ứng, không beep mới | Music độc lập |
| Unmute | Bật Hiệu ứng | Settings file phản hồi ngay | Browser khóa giữ fallback hiện có |

</frozen-after-approval>

## Code Map

- `src/presentation/PlayAudio.ts` -- media pool, mixer, gesture unlock và prime.
- `src/presentation/SettingsPanel.ts` -- callback dùng chung cho Menu/Pause.
- `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts` -- pointer/keyboard generic cue.
- `tests/game-audio.spec.ts` -- fixture kiểm tra gameplay và settings thật.

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/PlayAudio.ts` và test -- preload settings nhỏ, seek qua khoảng390ms im lặng và phát trực tiếp trong gesture.
- [x] `src/presentation/SettingsPanel.ts` -- feedback trước redraw, mute theo trạng thái mới.
- [x] `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts` -- không generic oscillator khi mở/dùng/thoát settings; giữ cue nơi khác.
- [x] `tests/game-audio.spec.ts` -- số lần settings và pointer/keyboard/mute/no-beep.
- [x] Tài liệu audio -- ghi quyết định hiện hành và kết quả kiểm chứng.

**Acceptance Criteria:**
- Given Menu hoặc Pause Cài đặt và hiệu ứng Bật, when bấm điều khiển hoặc Enter/Space, then chỉ file cài đặt.mp3 phát từ phần có tiếng và không chờ callback redraw.
- Given cài đặt mute, when bật hiệu ứng, then cùng settings voice phát; when tắt, then mọi hiệu ứng dừng và Music không đổi.
- Given browser hỗ trợ HTML media, when khởi động sau gesture, then settings preload auto và phần near-silence390ms được bỏ qua; file khác không bị đổi offset.

## Design Notes

Chromium AudioContext giải mã file1.28s: cửa sổ10ms đầu vượtRMS.001 tại0.39s; transient chính tại0.40s. Seek0.39s giữ onset, không cần chỉnhasset. Native HTML fallback vẫn hoạt động nếu thiếu WebAudio.

Settings được gọi từ UI gesture nên không cần primer dùng cho các hiệu ứng gameplay tự phát; tránh chờ promise nguồn im lặng và re-prime trên WebKit.

## Spec Change Log

- Review acceptance/edge: mở Menu settings bằng bàn phím lần đầu bỏ interact; sửa opening action tự unlock trước effect. Thêm E2E Menu mới cho cả pointer/keyboard. Giữ suppression oscillator và trim/preload.
- Kiểm tra media thật WebKit: primer một sample lỗi code4, gây re-prime settings mỗi click. Settings luôn được gọi từ gesture UI, nên bỏ prime riêng voice này; preload và phát trực tiếp, giữ primer hiện có cho các hiệu ứng tự phát. Giữ trim0.39s và không oscillator.

## Verification

- Vitest PlayAudio tập trung.
- Build TypeScript/Vite.
- Playwright game-audio và shared-settings kiểm tra tập trung Chromium/WebKit; không full viewport matrix.

Kết quả cuối: build đạt,24unit và8E2E đạt (5Chromium: pointer/keyboardhai scene, onset media thật/lặpclick, Menu mới pointer/keyboard, gameplay mix; 3WebKit: hooks hai scene và Menu mới pointer/keyboard có media thật). Shared-settings geometry đã đạt Chromium/WebKit ở lượt trước. Fixture gameplay media thật trên WebKit crash browser trước assertion, nên chưa xác nhận onset lặpclick trong fixture đó; không coi lượt crash là pass.

Ba review hoàn tất; acceptance/edge tìm lỗi mở settings keyboard lần đầu đã sửa và kiểm chứng. Blind báo oscillator tại opener pointer nhưng handler được nêu chỉ đăng ký controls trong panel; opener dùng handler riêng không cue, xác nhận bằng E2E.

## Suggested Review Order

- Feedback dùng chung bắt đầu trước callback dựng lại panel.
  [SettingsPanel.ts:30](../../src/presentation/SettingsPanel.ts#L30)
- Preload tiếng nhỏ và seek qua đoạn gần im lặng.
  [PlayAudio.ts:55](../../src/presentation/PlayAudio.ts#L55)
- Mở Menu tự unlock và bỏ cue cho bàn phím.
  [MainMenuScene.ts:154](../../src/scenes/MainMenuScene.ts#L154)
- Pause không phát oscillator chồng lên tiếng Cài đặt.
  [CozyScene.ts:321](../../src/scenes/CozyScene.ts#L321)
- Kiểm tra thao tác hai scene và onset bằng media thật.
  [game-audio.spec.ts:62](../../tests/game-audio.spec.ts#L62)
