---
title: 'Bỏ yêu cầu xoay điện thoại về chiều dọc'
type: feature
created: '2026-10-04'
status: done
baseline_commit: NO_VCS
context: []
---

<frozen-after-approval reason="Yêu cầu triển khai trực tiếp của người dùng">

## Intent

**Problem:** Game yêu cầu xoay điện thoại về chiều dọc và tự dừng khi màn hình ngang. Người dùng yêu cầu bỏ ràng buộc này để chuẩn bị cập nhật màn hình ngang.

**Approach:** Bỏ overlay, thông báo và pause tự động do orientation; cho phép tiếp tục sau khi quay lại ứng dụng ở cả hai chiều.

## Boundaries & Constraints

**Always:** Giữ pause do người chơi, tutorial, đọc đơn, ẩn tab và gián đoạn; resize vẫn cập nhật presentation. Giữ bố cục 360×640 FIT và giao diện đã duyệt.

**Ask First:** Thiết kế bố cục ngang mới nằm ngoài yêu cầu hiện tại.

**Never:** Không tự reflow bếp/menu/hub hoặc đổi gameplay, audio, lưu campaign.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Mở màn ngang | Menu hoặc ca | Không overlay/yêu cầu xoay dọc, không pause orientation | Gián đoạn frame thật vẫn giữ gap |
| Xoay khi pause | User/tutorial/order | Các pause cũ giữ nguyên | Không tự resume |
| Ẩn rồi trở lại ngang | Visibility | Tiếp tục giải phóng đúng lease visibility | Không giải phóng pause khác |

</frozen-after-approval>

## Code Map

- `src/runtime/PlayLifecycle.ts`, `src/infrastructure/BrowserPlayLifecycle.ts`: browser interruption leases và resize.
- `index.html`, `src/style.css`: overlay xoay dọc.
- `src/scenes/BootScene.ts`, `src/scenes/CozyScene.ts`: dialog pause.
- `src/runtime/PlayLifecycle.test.ts`, `src/runtime/MainMenuSession.test.ts`, `tests/orientation.spec.ts`: kiểm chứng lifecycle và browser.

## Tasks & Acceptance

**Execution:**
- [x] Bỏ orientation gate trong lifecycle và scene/HTML/CSS, giữ resize.
- [x] Đồng bộ test orientation cũ, thêm kiểm tra tập trung màn ngang và ownership.
- [x] Ghi quyết định mới trong project-context, UI baseline và epics.
- [x] Chạy unit liên quan, build và Chromium một cấu hình.

**Acceptance Criteria:**
- Given ca đang chạy, when xoay ngang, then không xuất hiện orientation pause hoặc yêu cầu xoay dọc.
- Given pause user/visibility, when màn ngang và bấm Tiếp tục, then chỉ owner được chọn được giải phóng.
- Given menu/tutorial, when khởi động ngang, then các nút vẫn dùng được trong bố cục FIT hiện có.

## Spec Change Log

- Review phát hiện assertion cũ trong `BrowserPlayLifecycle.test.ts` còn chặn Continue khi ngang; đã sửa để kiểm tra visibility được giải phóng và user vẫn giữ.

## Verification

- `npx vitest run src/runtime/PlayLifecycle.test.ts src/runtime/MainMenuSession.test.ts`
- `npm run build-nolog`
- `npx playwright test tests/orientation.spec.ts --project=chromium-390x844 --workers=1`

Kết quả: build/typecheck đạt;14 unit test lifecycle/session/browser adapter đạt. Ba browser test Chromium390×844 đạt (xoay ngang và ownership, tutorial mở ngang, menu bắt đầu campaign ngang). Hai test đầu chạy cùng lượt; test menu chạy qua cấu hình tạm reuseExistingServer vì tiến trình preview của lượt đầu chưa tự đóng trên Windows. Cấu hình tạm đã xóa. Ba reviewer không phát hiện lỗi runtime/acceptance khác. Không chạy full browser matrix.

## Suggested Review Order

- Lifecycle bỏ ràng buộc orientation, giữ Continue theo từng owner.
  [PlayLifecycle.ts:24](../../src/runtime/PlayLifecycle.ts#L24)
- Resize vẫn cập nhật scene và reset mốc frame.
  [BrowserPlayLifecycle.ts:17](../../src/infrastructure/BrowserPlayLifecycle.ts#L17)
- Browser test xoay ngang, tutorial và menu.
  [orientation.spec.ts:11](../../tests/orientation.spec.ts#L11)
