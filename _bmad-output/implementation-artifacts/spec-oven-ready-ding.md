---
title: 'Tiếng tinh báo bánh chín theo cấp lò'
type: bugfix
created: '2026-10-06'
status: done
baseline_commit: ce7e7b0
---

## Intent

Người dùng yêu cầu dùng tiếng tinh trong file lò gốc, phát một lần đúng mốc chín6/4/2s theo cấp lò. Trước đây dừng media lúc chín đã cắt tiếng tinh nằm sau6s trong file.

## Implementation

- Giữ `lò nướng.mp3` gốc. Dẫn xuất PCM16bit cùng sample rate/channel bằng browser decoder: `oven-baking.wav` đoạn0–6.16s, `oven-ready.wav` đoạn6.17–9.144s. Không tăng tốc/đổi cao độ. Đo đoạn chạy peak0.0193 không chứa tinh; đoạn ready peak0.3183, onset lớn22.94ms sau đầu đoạn.
- Một voice oven: phần chạy loop, chuyển sang ready không loop khi baking→chín thật. Scene đọc perfectStart6/4/2s và runtime clock. Dừng/cancel trước mốc không báo; nhiều frame readiness không phát lại. Mẻ tiếp theo chuyển về tiếng chạy.
- Pause giữ playhead cả phần chạy/ready. Mute dừng ready, bật lại không replay completion. Silence/shutdown dừng ready. Gain phần chạy6×effectsVolume; ready1×effectsVolume tránh peak khuếch đại. Music/UI/gameplay/save giữ nguyên.

## Verification

26unit PlayAudio đạt, gồm one-shot/pause/mute/cancel/gain/pending-play;3E2E Chromium360×640 ba cấp lò đạt exact trước/sau perfectStart và pause lease. Build đạt. Không chạy full matrix. Hai WAV giải mã bằng Chromium xác minh đoạn chạy không chứa transient và ready chứa đúng transient nguồn.

## Suggested Review Order

- Transition một voice khi clock đạt chín.
  [PlayAudio.ts:68](../../src/presentation/PlayAudio.ts#L68)
- Scene dùng readiness thật của runtime.
  [CozyScene.ts:189](../../src/scenes/CozyScene.ts#L189)
- Kiểm tra ba cấp và trường hợp không replay.
  [game-audio.spec.ts:31](../../tests/game-audio.spec.ts#L31), [PlayAudio.test.ts:57](../../src/presentation/PlayAudio.test.ts#L57)
