---
title: 'Thu chi bám ảnh tham chiếu, có icon từng dòng'
type: feature
created: '2026-10-08'
status: done
baseline_commit: 9193993
---

## Intent

Người dùng yêu cầu bảng Thu chi dựa vào ảnh `public/assets/references/bảng doanh thu chi tiết.png`, phản hồi bản trước có quá ít icon. Thay riêng nội dung Thu chi theo reference: tiêu đề có hình sổ, lợi nhuận có đồng xu lớn, mỗi mục/dòng có icon phù hợp, tên bên trái và số tiền bên phải, đường phân dòng, phần đối chiếu xanh và dòng tiền riêng vàng. Giữ khung compact300×476 vừa chỉnh, chức năng/cỡ chữ và số liệu thật; Đánh giá/hub/bếp giữ nguyên.

## Tasks

- [x] `src/presentation/ReferenceFinanceArt.ts` — crop/cache artwork từ texture reference-finance đã tải; chỉ cắt icon, không chữ hoặc số mẫu.
- [x] `src/presentation/ReferenceSummary.ts` — bảng các mục/doanh thu từng món/giá vốn từng nguyên liệu/chi phí/đối chiếu/dòng tiền theo ảnh. Mọi dòng kế toán hiện hành còn đầy đủ, không lấy số hoặc suy ra dữ liệu từ ảnh. Món/nguyên liệu ngoài ảnh dùng icon nhóm doanh thu/nguyên liệu từ cùng reference. Icon/dòng scroll đúng clip, cỡ chữ lớn xếp hàng đủ cao.
- [x] `tests/reference-summary.spec.ts` — kiểm tra artwork nguồn, số lượng icon từng dòng, dữ liệu row khớp report, cuộn/bộ lọc/close; chữ200% và dòng dài clip đúng.
- [x] Tài liệu UI/context — ảnh Thu chi mới và phạm vi người dùng yêu cầu.

## Acceptance

- Given report thật, when mở Thu chi, then hình minh họa lấy từ reference, nhiều icon theo từng dòng, tiền căn phải đúng dữ liệu; không có chữ/số mẫu từ ảnh.
- Given nhiều món/nguyên liệu hoặc save legacy, when xem báo cáo, then đủ dòng thực hoặc thông báo thiếu chi tiết, không dựng dòng giả.
- Given cuộn/chữ200%, when đọc toàn bộ, then icon và text cuộn cùng nhau trong viewport, không chồng hàng/header/footer.
- Given Đánh giá/hub/bếp, when dùng, then không thay bố trí đã triển khai.

## Verification

Build và E2E tập trung Chromium360×640; xem ảnh đầu bảng, các phần dưới và sau cuộn.


## Results

Build/typecheck đạt. Sáu kiểm tra tập trung Chromium360×640 đạt: báo cáo thật và cuộn riêng, số dư âm, 0/1/2 đánh giá và đánh giá dài chữ200%. Luồng chính chụp thêm Thu chi200%/cuối danh sách nên timeout tăng60giây. Ba review độc lập: đã sửa dấu âm ASCII; fallback ngoài ảnh thống nhất icon nhóm từ reference. Ảnh ở ui-baseline/reference-finance-art-2026-10-08. Không sửa gameplay hoặc luật kế toán.
