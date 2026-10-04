---
title: 'Pause theo ảnh ba nút và giữ phiên qua Menu'
type: feature
created: '2026-10-04'
status: done
baseline_commit: NO_VCS
context: []
---

<frozen-after-approval reason="Người dùng yêu cầu triển khai trực tiếp">

## Intent

**Problem:** Pause đang dùng khung chung không khớp ảnh3nút; cần nối settings và menu giữ nguyên phiên.

**Approach:** Dùng PNG `public/assets/references/Bảng tạm dừng tiệm pizza.png` nguyên tỷ lệ, vùng bấm khớp Tiếp tục/Cài đặt/Menu; phủ tối toàn canvas chặn nền. Settings giữ pause, Back về pause. Menu giữ runtime RAM, main-menu Continue dùng cùng phiên; New bắt buộc confirm.

## Boundaries & Constraints

**Always:** Đọc context/baseline, chỉ thay pause/settings/navigation và audio presentation cần thiết. Dừng tất cả simulation qua pause lease hiện có (ngày/lò/patience/spawn/express). Resume giải phóng user pause do scene sở hữu, không release owner khác; lifecycle hidden không cho chạy khi tab còn ẩn, visibility/gap vẫn yêu cầu xử lý theo lifecycle. Orientationgate đã bỏ theo yêu cầu trước, không thêm lại, lease orientation ngoài còn giữ. Preserve tutorials/order/modal pauses. Giữ phiên khi Menu, không chốt ngày/chợ/summary/save; mainmenucontinue giữ tiền/kho/pizza/ovenowner/đơn/thời gian. PNG3nút chứa chữ, không đè thêm chữ mới. Chức năng chốt ngày đang có phải vẫn truy cập bằng đường riêng hợp lý ngoài3nút pause (không thêm nút trong ảnh); tránh xóa gameplay hiện có.

**Ask First:** Đổi luật tiền/kho/đơn hoặc thiết kế ngoài pause.

**Never:** Không cài thư viện, không thêm lưu giữa ca, không phục hồi portraitgate. Không tự tạo hệ nhạc mới: PlayAudio hiện chỉ cue hiệu ứng, có volume hiệu ứng thật; nhạc nếu chưa có báo rõ chưa có, disabled control. Không thay luồng/controls Chợ trong task pause hoặc đưa Menu thành chốt ngày; yêu cầu khôi phục mua Chợ trước đây còn tài liệu không tự coi đã triển khai.

## I/O & Edge-Case Matrix

| State | Action | Expected |
| --- | --- | --- |
| Ca đang bán/nướng | Pause/settings | Ngày/lò/patience/spawn không advance, nền không nhận input |
| Settings | Volume effects/reduced motion/Back | Áp dụng presentation thật, pausegiữ; Backpause |
| User+visibility/order | Resume | Không clear lease người khác hoặc chạy hidden |
| Ca paused | Menu/Continue | RAMphiên giữ nguyên, không summary/chợ/checkpoint |
| Phiên có sẵn | Mainmenu Start/cancel | Confirmation; cancel giữ runtime |
| Direct freeplay/tutorial/shop | Pause | Menu có cơ chế giữ RAM như đường vào bình thường, không nút chết |

</frozen-after-approval>

## Code Map

- `src/presentation/ReferencePause.ts` mới: PNGmanifest, fit/bounds3nút.
- `src/scenes/CozyScene.ts`: overlay pause/settings, lease ownership, input.
- `src/presentation/PlayAudio.ts`: volume hiệu ứng thật, không bịa nhạc.
- `src/presentation/MenuPreferences.ts`: share reduced-motion cả directgame.
- `src/main.ts`, `CozyCampaignSession.ts` nếu cần: menu giữ runtime; không lưu mới.
- `tests/reference-pause.spec.ts` mới + focusedunit audio/lifecycle.

## Tasks & Acceptance

- [x] PNGpause3buttons khớp artwork, blackout/blocking.
- [x] Settings effects volume/reduced motion/Back giữ pause.
- [x] Menu giữ RAM và Continue/Start-confirm các đường vào Cozy.
- [x] Build/unit/E2E tập trung, review độc lập và root acceptance audit, ảnh/docs baseline.

**Acceptance Criteria:**
- Given shift active, when Pause/settings và chờ simulation, then đồng hồ/lò/patience/spawn và kho/tiền giữ nguyên.
- Given có pause khác, when Continue, then không chạy cho đến các owner còn lại được giải phóng hợp lệ.
- Given đang bán, when Menu rồi Continue, then cùng phiên/thời gian/đơn không chuyển chốt ngày hoặc Chợ, không ghi IndexedDB giữa ca.
- Given phiên cũ, when Start, then confirm và cancel giữ phiên.

## Verification

Build, focusedunit audio/lifecycle, Playwright Chromium390×844 pause/navigation/settings với clock simulation, xem screenshot3nút. Không fullmatrix.

Kết quả: build cuối đạt;13unit audio/lifecycle/preferences đạt. Lượt tích hợp8E2E menu/bếp/pause đạt; lượt sau9E2E notification/pause đạt, gồm runtimegap. Hai review độc lập không thấy lỗi navigation khác; edge review tìm gap legacy không thểresume, đã sửa bằng resume('gap') chỉ giải phóng token runtime legacy, không lease ngoài. Root acceptance audit bằng source/tests (reviewer thứ3 không spawn được do giới hạn threads). New-session qua Menu thay đường reset cũ trong pause3nút. Không sửa BootScene legacy; scope UI là Cozy đã duyệt. Không đổi schema/save hoặc Chợ. Không cài thư viện.

Kiểm chứng: runtime đang nướng/tickets/scheduler thật trong fixture;100bước50ms ở pause và settings không đổi shiftclock/oven/patience/spawn/cash/stock/owner. Resume hidden/order không xóa lease khác; runtime-only gap phục hồi. Directfreeplay Menu→Newcancel→Continue giữ nguyên ingredients/cash, zero IDBput. Existingdefaultmenu tests bảo toànvisibility/session/confirmation/keyboard. Đã xem PNGpause và settings; lưu ảnh vào UIbaseline.

## Spec Change Log

- Người dùng bổ sung mẫu nút **Quay lại** trong lúc hoàn tất pause: đồng bộ các nút phụ modal/Cài đặt ở Cozy và MainMenu bằng artwork blankbutton từ khung1; chia3phần để bo góc/viền giữ hình khi đổi chiều rộng. Không đổi vị trí/IDs/action. Build cuối và2E2E pause/menu sau stylechange đạt; ảnh settings mới đã xem và cập nhật.

## Suggested Review Order

- [ReferencePause.ts](../../src/presentation/ReferencePause.ts): PNGfit và3vùng bấm.
- [CozyScene.ts](../../src/scenes/CozyScene.ts): pause/settings/owner và HUDchốt ngày riêng.
- [main.ts](../../src/main.ts): directruntime RAMmenu, không writes.
- [PlayAudio.ts](../../src/presentation/PlayAudio.ts): effectsgain thật.
- [NotificationFrame.ts](../../src/presentation/NotificationFrame.ts): nút chung cùng artwork Quay lại.
- [reference-pause.spec.ts](../../tests/reference-pause.spec.ts): timer/settings/menu/hidden/gap.
