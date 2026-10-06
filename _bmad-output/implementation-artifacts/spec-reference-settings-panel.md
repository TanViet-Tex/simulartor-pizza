---
title: 'Cài đặt theo ảnh tiệm pizza ấm cúng'
type: feature
created: '2026-10-06'
status: done
baseline_commit: 'fa602b3'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Cài đặt vẫn dùng bảng cũ, chưa theo ảnh `public/assets/references/Cài đặt tiệm pizza ấm cúng.png` mà người dùng yêu cầu làm tiếp.

**Approach:** Thay riêng panel Cài đặt dùng chung Menu/Pause: giấy kem, khung gỗ nâu/vàng, huy hiệu pizza trên đầu, icon âm nhạc/đĩa/vé mã/chuyển động, controls nền đen và trạng thái vàng, nút Quay lại. Nối ô Code vào popup nhập mã và thưởng hiện có.

## Boundaries & Constraints

**Always:** Giao diện portrait 360×640, đọc rõ và vùng chạm tối thiểu 48 CSS px; Menu/Pause cùng geometry/state. Chuyển động Bật tương ứng giảm chuyển động false, Tắt tương ứng true. Music/chọn nhạc chưa có nội dung âm nhạc thật nên disabled, ghi “Chưa có nhạc”, không vẽ trạng thái đang phát giả. Giữ bật/tắt hiệu ứng âm thanh thật qua mục Hiệu ứng. Theo chỉ dẫn tiếp theo của người dùng, bỏ nút −/+, phần trăm và điều chỉnh âm lượng trong Cài đặt; dùng âm lượng điện thoại. Code dùng nhãn “Nhập mã code” và icon quà, chạm mở editor hiện hành. Giữ pause ownership khi mở Cài đặt, nhập mã, nhận thưởng, Quay lại và Escape. Gỡ dữ liệu render/listener riêng khi scene đóng theo vòng đời sẵn có.

**Ask First:** Thêm nhạc thật/chọn bài, thay số xu hoặc luật nhận mã, thay phần Menu/Pause/bếp/hub ngoài bảng Cài đặt.

**Never:** Dùng ảnh có chữ Bật/số mẫu để giả trạng thái; đổi domain/save/claim; bỏ chức năng bật/tắt âm thanh đang có; làm mất pause khác; thiết kế lại màn nền hay popup mã/thưởng vừa hoàn thành.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Mở Settings | Menu hoặc Pause | Cùng bảng theo ảnh, state thật | Nền tối nhẹ hiện hành |
| Music/chọn bài | Chưa có asset nhạc | Disabled, ghi rõ chưa có | Không bật UI giả |
| Hiệu ứng | Bật/tắt | Cập nhật mute PlayAudio ngay | Độ lớn do điện thoại điều khiển |
| Chuyển động | Toggle | Đổi preference thật, hiện đúng Bật/Tắt | Không đổi luật simulation |
| Code | Chạm ô hoặc icon quà | Mở popup mã dùng chung | VIETVUIVE vẫn 100.000 xu |
| Quay lại | Nhập/hủy mã hoặc đóng thưởng | Trở về bảng Cài đặt mới | Không nhận thêm tiền |
| Đóng Settings | Quay lại hoặc Escape | Về đúng Menu/Pause nguồn | Không tự resume gameplay |
| Không có preferences | Direct fixture | Motion disabled, giữ UI | Không crash |

</frozen-after-approval>

## Code Map

- `src/presentation/SettingsPanel.ts`: renderer/action hiện hành dùng chung.
- `src/presentation/ReferenceSettingsArt.ts`: preload ảnh nguồn, cache khung giấy/viền/header/icon, clip silhouette bằng Canvas2D.
- `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts`: adapter ID/hit/focus/keyboard; chỉ sửa nếu renderer cần action mới.
- `src/presentation/PlayAudio.ts`, `src/presentation/MenuPreferences.ts`: state thật; lưu lựa chọn chuyển động riêng ở localStorage, không đổi simulation/campaign.
- `tests/shared-settings-ui.spec.ts`, `tests/test-code.spec.ts`: Settings parity/audio/pause và nhập mã/nhận thưởng.

## Tasks & Acceptance

- [x] `src/presentation/SettingsPanel.ts` và module art riêng nếu cần: ghép header/viền/giấy/footer/icon từ ảnh, tách các chữ/trạng thái mẫu khỏi dữ liệu thật.
- [x] `src/presentation/SettingsPanel.ts`: bố trí Music/chọn nhạc disabled, hiệu ứng bật/tắt, Code, Chuyển động, Quay lại; kiểu nút đen/vàng theo ảnh.
- [x] `src/scenes/MainMenuScene.ts`, `src/scenes/CozyScene.ts`: preload và nối action/hit/focus chung; giữ ownership và input blocking.
- [x] `tests/shared-settings-ui.spec.ts`: parity, state thật, audio/motion/keyboard và bounds; ảnh Cài đặt Menu/Pause.
- [x] `tests/test-code.spec.ts`: kiểm tra bảng mới mở mã, hủy/nhận thưởng/đóng rồi trở về đúng Settings; không đổi tiền/lưu.
- [x] `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`: cập nhật riêng mốc Cài đặt với ảnh kiểm chứng.
- [x] `src/presentation/MenuPreferences.ts` và unit: khôi phục lựa chọn chuyển động khi reload, bỏ override khi theo hệ thống, giữ lựa chọn trong phiên nếu storage bị chặn.

**Acceptance Criteria:**
- Given Menu/Pause có cùng preferences, when mở Settings, then bố cục và trạng thái controls giống nhau.
- Given hiệu ứng âm thanh đang bật, when tắt âm, then PlayAudio đổi thật mà ca vẫn pause.
- Given giảm chuyển động false, when chọn Tắt, then preference thành true; reload/menu/bếp đọc cùng trạng thái.
- Given Settings mới, when bấm Code và nhận VIETVUIVE, then popup hiện +100.000 và đóng quay về bảng mới.

## Spec Change Log

- 2026-10-06: Người dùng yêu cầu triển khai nhạc thật từ hai asset và đổi bài trong Cài đặt. Spec-game-audio.md thay riêng ràng buộc Music/chọn bài disabled/unavailable: bài2 mặc định, toggle Music riêng và đổi1↔2 trong các vùng hiện có; giữ geometry/art và hiệu ứng toggle, không thêm UI âm lượng. Các kết quả kiểm tra phía dưới là lịch sử trước lần tích hợp âm thanh.

- 2026-10-06: Người dùng yêu cầu bỏ nút hiệu ứng −/+ vì dùng âm lượng điện thoại. Đồng bộ intent và acceptance: giữ bật/tắt hiệu ứng, bỏ phần trăm và điều khiển âm lượng UI; không đổi API/logic audio khác.
- 2026-10-06: Acceptance audit phát hiện lựa chọn chuyển động chưa sống qua reload như AC. Bổ sung lưu/đọc preference giao diện riêng; giữ art, controls, pause, domain và checkpoint hiện hành.

## Design Notes

Ảnh là nguồn phong cách và art. Chỉ dùng các lát khung/icon/giấy/nút phù hợp; chữ và trạng thái hoạt động vẽ từ dữ liệu. Không đặt toàn PNG như ảnh nền tương tác vì chứa nhạc đang Bật và nội dung chưa có. Hiệu ứng giữ một toggle bật/tắt gọn, không còn nút âm lượng; các control còn lại theo thứ tự ảnh. Ưu tiên cache art tĩnh, không cắt/read pixel mỗi redraw.

## Verification

- Build TypeScript/Vite; unit âm thanh/preferences hiện có.
- E2E tập trung Settings/mã: Chromium360×640 và WebKit390×844, không full matrix.
- Kiểm tra ảnh Menu/Pause: đủ khung portrait, không chữ mẫu lộ dưới chữ động, đúng font/tỷ lệ icon, nút có khoảng cách và không đè vùng chạm.

## Implementation & Results

- Shared renderer dùng art cache `ReferenceSettingsArt.ts`, cắt header/viền/giấy/icon và clip Canvas2D để không lộ ảnh quán bên ngoài. Chữ/trạng thái động, không có nhạc Bật hoặc nội dung Code mẫu.
- Music/chọn bài unavailable rõ ràng; Hiệu ứng chỉ toggle mute thật, không phần trăm hoặc nút−/+. Chuyển động Bật/Tắt là nghịch đảo reducedMotion. Code/gift mở editor hiện có, nhận100.000xu và đóng trở lại Settings.
- Điều hướng bàn phím Menu/Pause dùng DOMkeydown đồng bộ, chỉ khi canvas focus và modal mã không mở; scene shutdown gỡ listener. Sửa lỗi WebKit Tab/Enter bị xử lý trễ ở Phaser queue; test keyboard Menu và Pause đã qua cả hai browser.
- Build TypeScript/Vite cuối đạt; 8 unit PlayAudio/MenuPreferences đạt, gồm lưu/khôi phục, giá trị sai và storage bị chặn.
- 6 E2E tập trung đạt qua các lượt kiểm tra cuối: parity/state/audio/motion/keyboard/48CSS/bounds trên Chromium360×640 và WebKit390×844 (2); claim Pause→đóng/reload/repeat và claim Menu→OK/Continue trên hai browser (4). Guard giữa ca giữ tiền/lưu đã qua Chromium trước steering UI; domain/save/claim không sửa.
- Một lượt WebKit parity thất bại ở Tab/Enter; sau chuyển listener DOM đồng bộ, rerun parity2browser đều đạt. Không chạy full matrix. Chưa kiểm chứng iPhone thật.
- Sau sửa lưu lựa chọn chuyển động, rerun Settings parity/reload trên hai browser đều đạt (2 tests, 32s). Acceptance audit kiểm tra lại và xác nhận lỗi reload đã đóng, không có lỗi mới được xác nhận.
- Ảnh Cài đặt Menu/Pause đã xem và root xác nhận riêng phần visual: [Menu](ui-baseline/reference-settings-menu-2026-10-06.png), [Pause](ui-baseline/reference-settings-pause-2026-10-06.png). Không ghi đè ảnh popup mã/thưởng trước đó; ảnh codeflow E2E dùng test output riêng.
- Các config Playwright tạm đã gỡ. Dev server 8081 giữ nguyên.

## Review Results

Blind và edge case không còn phát hiện được xác nhận. Acceptance phát hiện mất lựa chọn chuyển động khi reload; đã sửa, bổ sung unit/E2E và reviewer xác nhận đóng lỗi. Ba lượt rà soát hoàn tất.

## Suggested Review Order

**Giao diện và trạng thái**

- Một renderer dùng chung, state thật và chỉ bật/tắt hiệu ứng.
  [SettingsPanel.ts:12](../../src/presentation/SettingsPanel.ts#L12)
- Ghép khung và icon từ ảnh, cache art tĩnh một lần.
  [ReferenceSettingsArt.ts:9](../../src/presentation/ReferenceSettingsArt.ts#L9)

**Tương tác và kiểm chứng**

- Điều hướng đồng bộ, tránh Tab chuyển focus trước khi game xử lý.
  [CozyScene.ts:1096](../../src/scenes/CozyScene.ts#L1096)
- Kiểm chứng Menu/Pause, âm thanh, chuyển động và vùng chạm.
  [shared-settings-ui.spec.ts:42](../../tests/shared-settings-ui.spec.ts#L42)
