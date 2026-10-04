---
title: Header chung theo ảnh gỗ tối giản
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
---

## Yêu cầu

Người dùng gửi `public/assets/references/Giao diện game pizza gỗ tối giản.png`, yêu cầu thay header cũ của Tổng kết/Chợ/Kho/Quán/Nhiệm vụ bằng mẫu này. Giữ nguyên phần dưới; nền gỗ phía sau phải liền và đều. Phạm vi này thay yêu cầu chờ duyệt header từ mẫu Chợ trước đó, không cho phép thiết kế lại nội dung từng tab.

## Triển khai

- `src/presentation/HubHeader.ts`: một bộ header/navigation chung, crop phần khung giấy, tiền, pause và5icon từ ảnh mới; chữ/tiền/tab chọn và vùng bấm tiếp tục là dữ liệu động. Nền gỗ toàn360×640 dùng cùng painter, không ghép nền cũ với nền ảnh mẫu. Shell texture được dọn khi layer bị hủy.
- `HubCanvasUI.ts`: header/navigation/background ủy quyền painter chung; khung/nút/footer dưới Chợ không đổi.
- `ReferenceMarket.ts`: nạp thêm ảnh header mới; giữ filters/danh sách/giá/tồn/quantity/mua/footer.
- `ReferenceSummary.ts`: chỉ thay background/header/navigation, giữ tọa độ các thẻ, thanh Kho, chi tiết và footer.
- `CozyScene.ts`: Kho/Quán/Nhiệm vụ dùng cùng shell; giữ body từy183 và footer hiện có, gồm trang trí lá phía dưới. Bấm pause ở cả5tab; callback tab theo ID cũ.

## Kiểm chứng

- Build production và E2E tập trung Chromium360×640.
- Chuyển cả5tab, header chung/cash/stock giữ nguyên,5vùng tab ở trêny130 và pause/tiếp tục hoạt động.
- Mua→Kho→mở→dùng→cuối ngày→mua ngày sau, nhập số1–100, hủy, thiếu tiền, save guard, pause độc lập, hỏa tốc và Menu/Tiếp tục vẫn theo runtime cũ.
- Header dùng canvas painter nên test nhãn chuẩn bị đọc thêm `data-hub-header-labels`; giữ ý nghĩa “Ngày1chưa bắt đầu”.
- Review độc lập kiểm tra crop2094×751, chữ/tiền, lifetime, giữ body và nền gỗ, không phát hiện lỗi chức năng.

Không đổi dữ liệu lưu, luật tiền/kho/đơn, không thêm thư viện, không áp dụng theme lại toàn body5tab.

Kết quả: `npm run build-nolog` đạt (cảnh báo bundle Phaser hiện có);10 E2E đạt trong1.2m với `tests/reference-market.spec.ts` và `tests/preparation-summary.spec.ts`, Chromium360×640. Đã xem ảnh renderer thật, lưu [Tổng kết](ui-baseline/shared-header-summary-2026-10-04.png), [Chợ](ui-baseline/shared-header-market-2026-10-04.png), [Kho](ui-baseline/shared-header-stock-2026-10-04.png), [Quán](ui-baseline/shared-header-shop-2026-10-04.png), [Nhiệm vụ](ui-baseline/shared-header-missions-2026-10-04.png). Không chạy full browser matrix.

## Suggested Review Order

- Header/navigation và nền gỗ chung, gồm vòng đời texture.
  [HubHeader.ts:7](../../src/presentation/HubHeader.ts#L7)
- Tổng kết giữ nguyên thẻ dưới header.
  [ReferenceSummary.ts:100](../../src/presentation/ReferenceSummary.ts#L100)
- Các tab Kho/Quán/Nhiệm vụ chỉ thay shell trước body hiện có.
  [CozyScene.ts:614](../../src/scenes/CozyScene.ts#L614)
- Chuyển5tab, giữ tiền/kho và pause.
  [reference-market.spec.ts:156](../../tests/reference-market.spec.ts#L156)
