---
title: 'Bỏ viền focus đỏ khi click/chạm'
type: bugfix
created: '2026-10-06'
status: done
route: one-shot
---

# Bỏ viền focus đỏ khi click/chạm

## Intent

**Problem:** Click/chạm nút để lại viền focus nâu đỏ trong Menu/Cài đặt.

**Approach:** Ẩn viền khi dùng chuột/chạm, giữ viền khi điều hướng bằng Tab/phím mũi tên. Không đổi art nút, callback, pause hoặc nhận mã. Typecheck đạt; E2E Settings tập trung Chromium360×640 đạt. Review phát hiện đường chạm × chưa xóa modality; đã sửa cùng các đường chạm còn lại, không còn finding mở.

## Suggested Review Order

- Chọn chế độ hiển thị viền theo cách tương tác.
  [MainMenuScene.ts:33](../../src/scenes/MainMenuScene.ts#L33)
- Xóa focus bàn phím của Cài đặt khi chạm.
  [CozyScene.ts:297](../../src/scenes/CozyScene.ts#L297)
