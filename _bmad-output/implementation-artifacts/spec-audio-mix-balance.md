---
title: 'Giảm nhạc nền và làm rõ hiệu ứng'
type: bugfix
created: '2026-10-06'
status: done
baseline_commit: 'aefd748'
context:
  - '_bmad-output/specs/spec-game-audio/SPEC.md'
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="Người dùng yêu cầu giảm nhạc và sửa hiệu ứng khó nghe">

## Intent

**Problem:** Người dùng chơi máy tính, Hiệu ứng Bật nhưng không nghe rõ sốt/lò/khách. Nhạc hiện phát100%; kiểm tra file thật thấy nhạcRMS0.1745, sốt0.0737, khách0.1596; tiếng lò trong6s đầu chỉRMS0.0057, peak0.0193. Native Chromium xác nhận file sốt/lò đã phát không mute; mất độ rõ do mức trộn.

**Approach:** Hạ hai bài nhạc xuống15%, khuếch đại tiếng lò6× trong mixer WebAudio; hiệu ứng khác giữ mức gốc và tất cả theo effectsVolume/mute. Kiểm chứng tín hiệu đầu ra thực thay vì chỉ currentTime.

## Boundaries & Constraints

**Always:** Giữ7file gốc, UI/controls, lựa chọn Music, một loop,6/4/2s,playhead/lease,không chồng và gameplay/save. Music độc lập Hiệu ứng. AudioContext mở từ gesture; dùng cùng context và nối mỗi media một lần. Browser thiếu graph dùng HTML fallback; lỗi không ngắt game.

**Ask First:** Thêm controls âm lượng hoặc thay asset/nội dung file.

**Never:** Ép bật Hiệu ứng khi người chơi đã tắt; làm nhạc tắt theo effects mute; thay timer/lò/UI.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Music | Chọn1/2 hoặc primer hoàn tất | Gain15%, giữ độc lập mute | Fallback HTML15% |
| Oven | Baking chưa chín | Gain6×effectsVolume, một source/loop | Fallback mức HTML giới hạn1 |
| Hiệu ứng | Bật/tắt hoặc volume đổi | Sốt/box/khách1×volume; lò6×volume; mute0 | Không ảnh hưởng Music |
| Safari primer | Nguồn im lặng→asset | Khôi phục gain/mix thật | Không phát primer nghe được |
| Destroy | Scene/game đóng | Dọn source/gain/media | Pending không hồi sinh |

</frozen-after-approval>

## Code Map

- `src/presentation/PlayAudio.ts`: shared media player và AudioContext hiện hành.
- `src/presentation/PlayAudio.test.ts`: mock media/context có cả fallback/graph.
- `tests/game-audio.spec.ts`: browser thật, settings/lease/timing.

## Tasks & Acceptance

- [x] `src/presentation/PlayAudio.ts`: mixer music15%/oven6×, chuẩn volume/prime/cleanup và diagnostics.
- [x] `src/presentation/PlayAudio.test.ts`: graph/fallback/mute/đổi bài/cleanup/primer.
- [x] `tests/game-audio.spec.ts`: đo tín hiệu source qua analyser, tiếng sốt/lò/khách từ gameplay thật và độc lập mute/Music.
- [x] Build, focused unit/E2E, review và đồng bộ tài liệu.

**Acceptance Criteria:**
- Given Music Bật, when mở game/đổi bài, then output gain0.15, không1.
- Given Hiệu ứng Bật, when sốt/nướng/khách thật, then media khôngmute và analyser có tín hiệu; lò gain6×volume.
- Given Hiệu ứng Tắt, when nhạc đang phát, then effects0 và nhạc vẫn0.15.

## Verification

- Unit PlayAudio, TypeScript/Vite build.
- Focused real-media Chromium360/WebKit390; không full matrix.

## Design Notes

User đã xác nhận Hiệu ứng Bật trên máy tính; không đổ nguyên nhân cho mute hoặc browser trước khi đo. Các artifact untracked ngoài scope được giữ. Âm lượng nhạc15% và lò6× là cấu hình cân bằng tạm theo đo file, có thể chỉnh theo phản hồi nghe thật.

## Implementation & Results

- Music cả hai bài cố định0.15. Stream mixer gain6 cho lò,1 cho sốt/box/arrival/settings, nhân effectsVolume và mute; media.volume1 khi đã có graph để tránh giảm hai lần. Prime khôi phục cùng mức âm, đổi bài không trở lại100%.
- AudioContext resume từ gesture, chỉ route khi state running; resume thất bại giữ native playback, lần gesture sau nối cùng7media. Source/gain được dọn khi destroy, không đổi source mỗi frame.
- Build TypeScript/Vite và20unit PlayAudio đạt.4E2E tập trung Chromium360/WebKit390 đạt qua lượt cuối/rerun: Chromium analyser đo tín hiệu đầu ra sốt/lò/arrival từ gameplay, Music0.15, effects mute không tắt Music; browser thật còn kiểm tra Pause/Menu/Continue/đổi bài/runtime replacement.
- Windows PlaywrightWebKit không có AudioContext hoặcwebkitAudioContext; kiểm tra native fallback bằng playhead/volume0.15/mute thật, không giả vờ đo PCM hay boost6 trên host không hỗ trợ. Không chứng nhận thiết bị/iPhone thật.
- Một assertion WebKit đọc playhead trước seek0 hoàn tất sau runtime replacement; đổi sang expect.poll để đợi trạng thái0 thật, rerun đạt. Không đổi logic reset/Pause để làm xanh test.
- Dev server8080 giữ chạy; nguồn live đã cập nhật. Không đổi fileasset/UI/gameplay/save.

## Review Results

Ba reviewer blind/edge/acceptance. Đã đóng phát hiện route vào context còn suspended làm mất output khi resume thất bại; unit phủ fallback và gesture sau. Đã sửa E2E capability gating vì WindowsWebKit thiếu WebAudio. Reviewers xác nhận đóng các phát hiện; không còn vấn đề được xác nhận.

## Suggested Review Order

- Mức trộn và source chỉ nối khi context chạy.
  [PlayAudio.ts:85](../../src/presentation/PlayAudio.ts#L85)
- Gain Music/hiệu ứng tách riêng, primer khôi phục đúng.
  [PlayAudio.ts:98](../../src/presentation/PlayAudio.ts#L98)
- Đo tín hiệu gameplay thật và fallback theo browser.
  [game-audio.spec.ts:61](../../tests/game-audio.spec.ts#L61)
