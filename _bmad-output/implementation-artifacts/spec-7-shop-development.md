---
title: 'Epic 7 — Phát triển quán, đồ sở hữu và hiệu ứng ngày'
type: feature
created: '2026-10-04'
status: done
baseline_commit: c9bf239
context:
  - _bmad-output/implementation-artifacts/epic-7-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
  - _bmad-output/implementation-artifacts/requirement-decoration-and-amenity-effects.md
---

<frozen-after-approval>

## Intent

Người dùng giao triển khai Epic7, gồm mua/đặt/cất trang trí, thiết bị/tiện nghi, mở rộng, bonus gameplay, giao dịch chuẩn bị và save. Phạm vi quảng bá/sửa chữa còn có trong epic gốc. Giữ phong cách/bố cục hiện tại, năm tab, sáu mục Quán, sáu ô khách/tám món/một lò; không cài thư viện hoặc sửa nhân sự E08. Đơn app vẫn Giao là hoàn tất ngay theo yêu cầu mới nhất.

## Luật đã chốt

Trang trí: cây bàn3%, tranh5%, đèn5%, bảng hiệu8%, cây lớn5%, rèm3% khách ghé; cap30%. Tiện nghi: ghế5%, Wi-Fi8%, quạt5%, máy lạnh10%, loa5% kiên nhẫn; quạt/máy lạnh lấy max, cap40%; bàn ghế+2 chỗ chờ riêng. Cộng trên gốc, mua chưa đặt không bonus. Mỗi loại một bản. Chỉ mua/đặt/cất trong chuẩn bị; ca dùng snapshot hiệu ứng lúc mở ngày. Không tăng giá/sao/nướng từ bonus trang trí. Tiền/sở hữu atomic, save cũ không tự có đồ; hủy/preview không ghi, retry không mua trùng. Đặt/cất xác nhận lưu nhất quán, không lưu giữa ca.

</frozen-after-approval>

## Quyết định người dùng và giới hạn đợt triển khai

Người dùng thay bảng giá đề xuất bằng bảng chính thức dưới đây, sau đó yêu cầu mọi món giá500–10000xu. Bổ sung cây lớn1500, rèm1000, quạt1500, bàn ghế4000xu; giữ giá tám món người dùng đã chỉ định. Bàn ghế chờ quyết định mô hình2chỗ đợi riêng/cộng vào đơn, chưa bật mua nếu chưa có luật sức chứa. Mở rộng2 có giá nhưng chính người dùng yêu cầu chốt bố cục, không bật mua. Thiết bị mới/quảng bá/hư hỏng chưa có luật nên giữ backlog, không đánh dấu toàn Epic7 done.

| Đồ | Giá đã chốt (xu) |
|---|---:|
| Cây trang trí / Tranh pizza / Đèn trang trí | 500 / 800 / 1000 |
| Biển hiệu | 2500 |
| Ghế chờ / Wi-Fi | 1200 / 2000 |
| Điều hòa / Nhạc trong quán | 5000 / 3000 |
| Chậu cây lớn / Rèm / Quạt / Bàn ghế khách | 1500 / 1000 / 1500 / 4000 |
| Lò cấp2 / cấp3 | 2000 / 5000 |
| Mở rộng1 (4→6) / mở rộng2 (chờ bố cục) | 6000 / 10000 |

Triển khai vị trí lắp cố định riêng mỗi đồ trong preview Quán; Đặt mở xem trước vị trí/bonus rồi xác nhận, không thay bếp hoặc kéo thả tự do. Sinh khách tăng kỳ vọng qua cơ hội thêm theo xác suất bonus, hash ổn định day/slot để không đổi khi reload; chỉ khách thương mại tại quầy, không nhân app/help/referral; khoảng trống/tick hợp lệ, cap30 outcome và hàng chờ4/6 giữ nguyên. Patience bonus áp dụng khách tại quầy, không đổi hạn app90s. Snapshot đóng băng đầu ca. Đồ mua chưa đặt không bonus; thẻ/preview đọc dữ liệu thật, nền minh họa giữ nhãn minh họa.

Giao dịch đồ trong campaign: chuẩn bị candidate trên bản sao, giữ current money/ownership cho tới commit thành công; save lease khóa các hành động, retry cùng request/payload. Khi commit đạt áp dụng candidate vào chính runtime scene đang dùng; không thay mất reference/lease. Đặt/cất cũng chỉ lưu lúc xác nhận. Save optional metadata chứa acquired actual price/placed slot/spent/pendingSpent; validate tổng capital qua reports và pending. Giá nâng cấp mới không định giá lại đồ/lò/queue đã mua: nhận dạng lịch sử bằng bản giá/receipt, validate vẫn giữ old150/250/200xu. Save cũ default chưa có đồ mới và mua nâng cấp tiếp theo theo giá mới.

## Code Map

- `src/domain/ShopEffects.ts`: quy tắc hiệu ứng đã chốt, snapshot immutable; không giá/vị trí.
- `src/domain/ShopEffects.test.ts`: ví dụ67.8s, max cooling, tổng29%/28%, chỗ chờ riêng, không bonus trùng.
- `src/presentation/ReferenceShop.ts`: sáu mục/art crops/layout hiện có; nơi nối thẻ sở hữu/chi tiết.
- `src/scenes/CozyScene.ts`: khung xác nhận/lease, renderer và hub preview hiện có.
- `src/runtime/CozyRuntime.ts`: chuẩn bị/mở ngày/scheduler/patience/accounting; snapshot hiệu ứng khi mở.
- `src/runtime/CozyCampaignSession.ts`: pipeline commit/retry/revision/khóa mở ca, cần mua thành công sau commit.
- `src/domain/CozyCheckpoint.ts`, `CozyStock.ts`, `DayAccounts.ts`: validation save/tiền/kho; tách chi phí tài sản khỏi giá vốn.

## Tasks & Acceptance

- [x] Tổng hợp context Epic7 và kiểm tra nguồn cấu hình, không suy giá từ references.
- [x] Làm pure domain effect đã chốt và4unit, nối runtime snapshot đầu ca.
- [x] Chốt bảng giá người dùng; giới hạn món/luật chưa chốt ở backlog rõ ràng.
- [x] Nối11món sở hữu/bố trí/transaction/schema với runtime và renderer đúng bố cục.
- [x] Nối bonus ngày/sinh khách/kiên nhẫn; giữ cap4/6, bàn ghế4000xu chờ luật chỗ đợi.
- [x] Unit money/save/retry/migration/effects; E2E tập trung360×640; build và review độc lập.

Given ghế và Wi-Fi đang đặt, when tính thời gian gốc60s, then67.8s. Given quạt và máy lạnh cùng đặt, when tính cooling, then10% chứ không15%. Given đủ12đồ đang đặt, when tính bonus, then khách29%, kiên nhẫn28%, chỗ chờ+2 riêng. Given đồ mua chưa đặt, when mở ca, then không bonus từ đồ đó. Given save cũ, when tải sau tích hợp, then tiền/kho/tiến độ giữ nguyên và đồ mới chưa sở hữu.

## Verification

Build đạt; 110unit trong15file hiện hành đạt, gồm6Epic7/4pureeffects và hồi quy Epic6/history/nativelegacy/checkpoint/session/stock/lifecycle. Kiểm tra Chromium360×640 tập trung, không fullmatrix. Các test lịch sử3s/luật cũ ghi deferred-work từ trước; không đổi gameplay theo chúng.

7 E2E đạt: 3 kiểm tra Epic7 (thiếu tiền/bố cục, lỗi lưu–retry–đặt/cất–reload, nâng cấp và ghi chi phí đúng một ngày), 4 hồi quy Epic6. Ba review độc lập đã hoàn tất và các phát hiện hợp lệ đã sửa. Trạng thái done chỉ áp dụng phạm vi đã chốt trong spec này; toàn Epic7 vẫn in-progress.

## Suggested Review Order

1. [Catalog và giá](../../src/config/shopCatalog.ts), [giá nâng cấp](../../src/config/kitchenEconomy.ts).
2. [Hiệu ứng](../../src/domain/ShopEffects.ts), [lịch sinh khách](../../src/domain/ShopSchedule.ts), [runtime](../../src/runtime/CozyRuntime.ts).
3. [Giao dịch campaign](../../src/runtime/CozyCampaignSession.ts), [metadata đồ](../../src/domain/ShopCheckpoint.ts), [tương thích save](../../src/domain/CozyCheckpoint.ts).
4. [Thẻ Quán](../../src/presentation/ReferenceShop.ts), [vị trí](../../src/presentation/ShopPlacement.ts), [xác nhận và preview](../../src/scenes/CozyScene.ts).
5. [Unit Epic7](../../src/runtime/CozyEpic7.test.ts), [E2E](../../tests/epic7-shop.spec.ts), [ảnh kiểm tra](ui-baseline-2026-10-02.md).

## Phần chưa triển khai trong toàn Epic7

Bàn ghế đã có giá4000xu; đang chờ người dùng chọn mô hình2chỗ đợi riêng hoặc cộng vào số đơn/đổi bố cục. Chưa bật mua. Mở rộng2 giá10000xu chờ sức chứa/bố cục theo chính bảng người dùng. Thiết bị mới (lò2/tủ lạnh/bàn làm), quảng bá, hư hỏng/sửa chữa chưa có luật và chưa có quyền dùng cấu hình tạm. Đây là phạm vi còn lại củaEpic7; không đánh dấu toàn epicdone.

## Review và bản sửa

Ba review độc lập không tìm thấy lỗi atomic/capital/save/migration cụ thể. Đã sửa bonus kiên nhẫn cho khách referral trả tiền (bonus lượt sinh vẫn không nhân referral), thêm preview vị trí thật dùng tọa độ cố định chia sẻ, giữ vị trí khi cất món khác, hiển thị current→expected trước mua, đổi nhãn trạng thái cũ và đánh số lò1/2/3 theo bảng người dùng. Nghi vấn thiếu nútX trongE2E được bác bỏ vì button chung tự tạo notification-close và browsercheck đã đạt. LỗiE2E giả lập save bị lặp sau reload đã sửa harness bằng sessionStorage; production không cần thay.
