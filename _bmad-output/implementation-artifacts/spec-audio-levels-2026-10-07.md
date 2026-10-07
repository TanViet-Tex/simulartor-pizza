---
title: 'Điều chỉnh nhạc và hiệu ứng theo yêu cầu'
status: done
date: '2026-10-07'
---

Nhạc nền đặt20%. Tiếng tiền giảm20% so với mức75% trước đó, còn60% effectsVolume. Tiếng lò chạy và tiếng tinh giảm10%; tiếng khách đến giảm10%. Các hiệu ứng khác giữ nguyên. Cụm “tiếng khác đến” được hiểu là tiếng khách đến theo ngữ cảnh và đã thông báo trong lượt triển khai.

Giữ voice duy nhất, mức điều chỉnh effectsVolume, mute/pause và fallback native media. Không đổi UI hoặc asset.

28 unit mixer đạt. Kiểm tra gain WebAudio dùng sai số số thực, giữ kiểm tra phát âm thật và mute.

## Suggested Review Order

- Mức âm riêng từng stream trong mixer chung.
  [PlayAudio.ts](../../src/presentation/PlayAudio.ts#L120)
- Pause, mute, native fallback và gain.
  [PlayAudio.test.ts](../../src/presentation/PlayAudio.test.ts#L68)
- Kiểm tra phát âm trong trình duyệt.
  [game-audio.spec.ts](../../tests/game-audio.spec.ts#L122)
