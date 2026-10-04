# Chợ: nguyên liệu nền trong suốt và nhập số lượng

Date: 2026-10-04
Status: done

Người dùng yêu cầu xóa nền ảnh nguyên liệu trong Chợ và cho bấm vào số lượng để nhập nhiều phần. Phạm vi chỉ gồm icon và chọn số lượng; giữ bố cục Chợ, luật tiền/kho, xác nhận mua và checkpoint hiện có.

## Triển khai

- `public/assets/market-ingredients-transparent.png`: 19 nguyên liệu nền trong suốt, tạo bằng imagegen dựa trên hình bếp hiện có; dùng riêng trong Chợ.
- `src/presentation/MarketIngredientArt.ts`: lấy đúng hình từng nguyên liệu và căn giữa theo tỷ lệ, không có ô nền nâu.
- `src/presentation/MarketQuantityInput.ts`: ô nhập số với bàn phím số, chọn sẵn giá trị hiện tại; nhận số nguyên 1–100 theo giới hạn mua đang dùng. Enter/Đã chọn áp dụng; Escape/Hủy/× đóng và giữ số cũ. Số không hợp lệ không áp dụng.
- `ReferenceMarket.ts` và `CozyScene.ts`: bấm số mở bảng nhập có nền tối và pause lease riêng; đóng chỉ giải phóng lease của bảng. Chọn số chưa mua hàng; tiếp tục dùng xác nhận Mua cũ. Dọn input khi scene đóng.

## Kiểm chứng

- `npm run build-nolog` đạt; cảnh báo kích thước bundle hiện có.
- 8 E2E Chromium 390×844 đạt trong `tests/reference-market.spec.ts` và `tests/preparation-summary.spec.ts`.
- Kiểm tra nhập 37, tăng/giảm, hủy, từ chối 0/âm/lẻ/101/1000/chuỗi rỗng, số tiền và tồn sau mua; kiểm tra alpha thật của asset và icon cuối danh sách.
- Luồng mua → Kho → mở ca → dùng nguyên liệu → cuối ngày → mua ngày sau, thiếu tiền, chặn lưu, pause độc lập và hỏa tốc đều đạt.
- Review độc lập phát hiện dòng hướng dẫn bị input che; đã đưa dòng xuống dưới input và kiểm tra lại bằng ảnh renderer thật.

Ảnh kiểm chứng: [nguyên liệu](ui-baseline/market-transparent-ingredients-2026-10-04.png), [nhập số lượng](ui-baseline/market-quantity-input-2026-10-04.png). Không chạy browser matrix toàn bộ cho thay đổi này.
