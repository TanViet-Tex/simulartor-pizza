---
title: 'Game tiếp tục khi chuyển tab; Pause dừng thời gian'
type: fix
created: '2026-10-04'
status: done
baseline_commit: 0a0c080
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

## Intent

<frozen-after-approval>
Người dùng xác nhận: “Vẫn chạy khi ra ngoài/chuyển tab; chỉ bấm Pause mới dừng”. Chuyển tab, mất focus và frame bị browser hạn chế không tạo visibility/gap pause. Đồng hồ ngày, lò, kiên nhẫn khách, sinh khách và hỏa tốc tính thời gian thực đã trôi khi quay lại. Pause/Cài đặt/Menu và các modal nghiệp vụ hiện có vẫn giữ lease của mình; thời gian trong các trạng thái dừng không được cộng khi tiếp tục. Giữ tiền/kho/save và giao diện.
</frozen-after-approval>

## Approach & Code Map

Browser có thể ngừng render khi tab ẩn. Reconcile elapsed wall time bằng các bước simulation nhỏ, tránh catch-up bị long-delta guard chặn và tránh đếm hai lần. Không dùng thư viện, worker/service worker hoặc lưu giữa ca. Bounded catch-up theo thời gian ca; khi simulation tạo modal pause thì dừng ở đó, không tiếp tục qua quyết định chưa trả lời.

- `src/infrastructure/BrowserPlayLifecycle.ts`: visibility/focus không tự tạo lease; đồng bộ elapsed trước thay đổi focus/visibility.
- `src/runtime/PlayLifecycle.ts`: quản lý wall-clock và reset khi pause, giữ API cần thiết cho menu/session.
- `src/scenes/CozyScene.ts`: nối frame với clock mới, không advance thêm delta trùng.
- `src/runtime/CozyRuntime.ts`: chỉ thêm API tick bounded nếu cần; giữ các luật.

## Tasks & Acceptance

- [x] Bỏ tự pause theo hidden/blur/gap của browser, giữ modal/Menu/save và guard API legacy trực tiếp.
- [x] Đồng bộ elapsed thời gian ẩn/frame chậm theo bước 50ms; không duplicate hoặc cộng thời gian Pause.
- [x] Unit: ẩn/hiện, focus, nhiều lần quay lại, long gap, manual pause/owner khác; cleanup listener.
- [x] E2E 360×640: thời gian tiến khi rời tab; lò/kiên nhẫn/sinh khách/hỏa tốc; Pause/Cài đặt/Menu đúng lease.
- [x] Build và kiểm tra tập trung, cập nhật project context/mốc UI; acceptance review đã đạt.

## Limits

Browser có thể đóng/freeze tab hoặc ứng dụng bị hệ điều hành kill; không thêm lưu giữa ca. Trong tab đang tồn tại, thời gian reconcile khi browser cho chạy lại. Không đổi layout hoặc gameplay balance.

## Verification

Build TypeScript/Vite đạt. 8 file/57 unit tests đạt: PlayLifecycle, BrowserPlayLifecycle, MainMenuSession, CozyCampaignSession, CozyKitchenV2, CozyTutorial, CozyEpic5, CozyHistory. 8 E2E Chromium 360×640 đạt: simulation/express tiếp khi hidden và ngừng render 5.4s, Pause/Cài đặt loại thời gian hidden, owner khác giữ nguyên, Menu giữ phiên/không ghi lưu, hỏa tốc và Chợ giữ luật. Bốn luồng chính được chạy lại trên build cuối sau sửa action boundaries.

Phát hiện và sửa adapter BootScene cũ không còn phù hợp port mới; giữ mode campaign hoạt động và bỏ advance delta trùng. API runtime `advance(>250)` cũ vẫn có guard cho callers trực tiếp; browser dùng `advanceElapsed` bounded nên không tạo gap. Không chứng nhận trình duyệt mobile đã bị kill hoặc full browser matrix.

## Review

Ba reviewer độc lập kiểm tra source và acceptance. Sửa compatibility của BootScene, timestamp lùi không được rebase, và P1 tính thời gian trước thao tác cho lò/ca vừa mở. Clock action boundaries đồng bộ trạng thái cũ trước dispatch/mở/chốt ca, rồi rebase sau chuyển trạng thái. Fake-clock regressions kiểm tra idle 7s → bắt đầu nướng/mở ca vẫn ở 0s; trong ca, thời gian trước khi nướng vẫn tính cho ngày/khách nhưng không cho bánh mới. Không đổi thời gian nướng, giá/kho/checkpoint.

Một lượt thử rộng hơn có 7 assertion cũ thất bại trong CozyRuntime.test/CozySchedule.test (timing lò 3s so với luật hiện hành 6s, lịch/menu cũ). Các assertion/luật ấy đã tồn tại ở baseline trước thay đổi, không đổi trong bản sửa này; không sửa gameplay để khớp tests lịch sử. Bộ kiểm tra tập trung luật hiện hành ở trên đạt.

## Suggested Review Order

- Đồng bộ wall-clock và chặn cộng thời gian đã pause.
  [PlayLifecycle.ts:1](../../src/runtime/PlayLifecycle.ts#L1)
- Lease transitions và tick catch-up bounded giữ luật simulation.
  [CozyRuntime.ts:488](../../src/runtime/CozyRuntime.ts#L488)
- Browser listeners không tự tạo visibility pause.
  [BrowserPlayLifecycle.ts:1](../../src/infrastructure/BrowserPlayLifecycle.ts#L1)
- Scene dùng một nguồn thời gian, giữ adapter campaign cũ.
  [CozyScene.ts:151](../../src/scenes/CozyScene.ts#L151)
  [BootScene.ts:49](../../src/scenes/BootScene.ts#L49)
- Kiểm tra tab bị hạn chế render và manual Pause.
  [reference-pause.spec.ts:62](../../tests/reference-pause.spec.ts#L62)
