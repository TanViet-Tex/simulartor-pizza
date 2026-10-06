---
title: 'Tích hợp bảy asset âm thanh'
type: feature
created: '2026-10-06'
status: done
baseline_commit: '80eeaafaf4146c4ff0e1f6ac75e43ff140375b96'
context:
  - '_bmad-output/specs/spec-game-audio/SPEC.md'
  - '_bmad-output/specs/spec-game-audio/audio-assets.md'
  - '_bmad-output/project-context.md'
  - '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="Người dùng đã yêu cầu triển khai spec-game-audio">

## Intent

**Problem:** Bảy file đã có nhưng runtime chỉ có tiếng bấm tổng hợp, Music disabled.

**Approach:** Phát asset theo sự kiện thành công; một tiếng lò bám thời gian thật và pause leases; nhạc nền bài 2 mặc định, đổi bài và bật/tắt qua Cài đặt chung.

## Boundaries & Constraints

**Always:** Giữ art/geometry UI, chỉ kích hoạt hai control Music hiện có. Âm thanh là presentation; không sửa luật, thời gian lò hay lưu campaign. Hiệu ứng theo mute/effectsVolume, Music riêng. Tiếng lò dừng ở perfectStart (bắt đầu chín: 6/4/2s), không kéo tới hết cửa sổ chín vừa 8/6/4s. Pause giữ vị trí; mọi owner phải trả lease trước resume. Mở Cài đặt phát cài đặt.mp3 một lần. Nhạc lặp, mặc định bài 2, giữ lựa chọn trong phiên, tiếp tục khi Pause.

**Ask First:** Đổi thời gian nướng, thêm UI âm lượng hoặc thay bố cục.

**Never:** Phát lò chồng bản; phát hiệu ứng theo redraw; replay hàng loạt khi catchup; ghi giữa ca; thay bảng màu/art.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Nướng | Bake thành công | Một loop lò, dừng khi chín/hủy | Không timer riêng |
| Pause | Có lease | Lò pause giữ playhead | Resume chỉ khi hết lease |
| Nhạc | Hai bài | Bài 2 mặc định, chọn bài khác dừng bài cũ | Không chồng |
| Hiệu ứng | Sốt/box/khách thật, gồm staff | Đúng asset mỗi sự kiện thành công | Không phát thao tác thất bại |
| Browser chặn audio | Chưa gesture/lỗi tải | Game tiếp tục | Catch play rejection, không exception |

</frozen-after-approval>

## Code Map

- `src/presentation/PlayAudio.ts`: shared session player, media lifecycle, volume/mute/music.
- `src/runtime/CozyRuntime.ts`: success notifications dùng chung thao tác manual/staff.
- `src/scenes/CozyScene.ts`: subscriptions và đồng bộ lò theo timing/lease.
- `src/scenes/MainMenuScene.ts`, `src/presentation/SettingsPanel.ts`: mở Cài đặt, Music state/actions chung.

## Tasks & Acceptance

- [x] `src/presentation/PlayAudio.ts` và unit: lazy assets, loop/resume/reset/volume/music/rejections.
- [x] `src/runtime/CozyRuntime.ts` và unit: notifications success, unsubscribe, không replay catchup.
- [x] `src/scenes/CozyScene.ts`: subscribe/dọn listener; đồng bộ lò sau lifecycle reconciliation và pause boundaries.
- [x] `src/presentation/SettingsPanel.ts`, `src/scenes/MainMenuScene.ts`: enable hai control Music, hiệu ứng mở settings.
- [x] `tests/shared-settings-ui.spec.ts` và audio E2E: cập nhật trạng thái thật và kiểm chứng focused.
- [x] Đồng bộ tài liệu, build và review.

**Acceptance Criteria:**
- Given cấp lò 1/2/3, when bánh đạt perfectStart, then tiếng dừng tại 6/4/2s theo clock thật.
- Given lò đang chạy, when Pause/Cài đặt/tiếp tục, then vị trí tiếng giữ và chỉ resume khi không còn lease.
- Given Menu/Pause, when đổi Music hoặc bài, then cả hai dùng chung trạng thái, không chồng nhạc.
- Given mute/volume, when hiệu ứng chạy, then độ lớn tuân settings; Music độc lập.

## Verification

- Unit PlayAudio/runtime notifications; TypeScript/Vite build.
- E2E tập trung audio/settings, Chromium360×640; không full matrix.

## Design Notes

Yêu cầu tiếp theo giảm nhạc và sửa hiệu ứng khó nghe được triển khai trong [spec cân bằng âm](spec-audio-mix-balance.md): Music15%, lò6× qua WebAudio, giữ mute/volume/UI/timing. Các kết quả ban đầu phía dưới là lịch sử trước sửa mức trộn này.

Spec đã được người dùng yêu cầu triển khai; không hỏi lại approval cho spec hoặc file asset/untracked do phiên trước tạo. Dirty artifacts ngoài phạm vi được giữ nguyên. Các giả định âm thanh trong spec đầu vào được giữ.

## Implementation & Results

- Shared player tái sử dụng một media mỗi tiếng/bài, URL encode đúng dấu. Nhạc bài2 mặc định, bật/tắt riêng và đổi1↔2 trong cùng bounds đã duyệt; lựa chọn giữ trong phiên.
- Tiếng lò theo `ovenState` (không phụ thuộc đơn đang chọn), so clock với perfectStart; pause lease giữ playhead, Menu→Continue cùng player, runtime mới reset. Shutdown gỡ subscriptions, destroy giải phóng media.
- Runtime notifications dùng chung đường thành công manual/practice/staff. Mỗi catchup gom một sốt/box và một arrival nếu còn khách mới trong hàng; không phát hàng loạt sự kiện đã trôi qua.
- Safari: mở quyền mỗi voice bằng WAV im lặng trong gesture, đổi về asset trên cùng element; hồi phục khi browser pause media. Primer không phát hiệu ứng nghe được hoặc sửa state gameplay.
- Build TypeScript/Vite đạt; 16unit PlayAudio và6unit notifications đạt (22).
- 12E2E tập trung đã đạt qua lượt cuối/rerun: Chromium360×640 vàWebKit390×844, mỗi browser kiểm tra3cấp lò trước/đúng ngưỡng,2pause owner,settings nhạc,metadata7asset,phát media thật/arrival ngoài gesture/Menu→Continue/runtime replacement,settings parity/mute/keyboard/reload. Không chạy full matrix hoặc chứng nhận iPhone thật.
- Lượt cuối11/12 đạt; Settings WebKit đóng trang trong một lượt, rerun phát hiện test parse snapshot rỗng khi redraw. Sửa fallback `|| '{}'`, rerun Settings WebKit đạt. Không sửa gameplay để xử lý test.
- Kiểm tra thêm test lịch sử CozyRuntime.test.ts phát hiện lấy bánh3s sai; baseline HEAD80eeaaf cũng thất bại đúng assertion. Đã có mục này trong deferred-work.md, giữ nguyên luật6–8s; không tính test lịch sử này là regression audio.
- Đã xem ảnh Menu/Pause và xác nhận geometry/art giữ nguyên: [Menu](ui-baseline/audio-settings-menu-2026-10-06.png), [Pause](ui-baseline/audio-settings-pause-2026-10-06.png). Không ghi đè ảnh Cài đặt cũ.

## Review Results

Ba review độc lập (blind/edge/acceptance). Đã sửa arrival catchup còn khách nhưng tiếng bị bỏ khi khách cuối hết hạn; đã sửa Safari per-element unlock và native interruption. Bổ sung E2E media thật, exact threshold, lease độc lập và Menu/replacement. Reviewers xác nhận các phát hiện đã đóng; lượt E2E cuối/rerun hoàn tất.

## Suggested Review Order

- Player dùng chung giữ một loop và mở quyền từng media.
  [PlayAudio.ts:29](../../src/presentation/PlayAudio.ts#L29)
- Đồng bộ tiếng lò theo state, timing và pause ownership.
  [CozyScene.ts:188](../../src/scenes/CozyScene.ts#L188)
- Sự kiện thành công có unsubscribe và catchup coalescing.
  [CozyRuntime.ts:655](../../src/runtime/CozyRuntime.ts#L655)
- Cài đặt kích hoạt Music mà giữ geometry/art.
  [SettingsPanel.ts:31](../../src/presentation/SettingsPanel.ts#L31)
- Unit và browser kiểm tra media thật/lease/timing/Menu.
  [game-audio.spec.ts:31](../../tests/game-audio.spec.ts#L31)
