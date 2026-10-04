---
title: 'Kho nguyên liệu và gợi ý mua theo menu'
date: '2026-10-04'
status: implemented-full-owned-menu
scope: stock-ui-and-full-owned-menu-planner
source: user
---

# Kho nguyên liệu và gợi ý mua

## Cập nhật Epic 5 — 2026-10-04

Đã nối đủ tám công thức vào menu sở hữu và gợi ý mua. Người chơi chọn số phần 0–100 bằng cách bấm con số để nhập, hoặc dùng nút tăng/giảm. Phân trang ba món/năm nguyên liệu, giữ header/footer/theme ở 360×640. Chỉ tính món đã sở hữu và đang bán; cộng nhu cầu chung rồi trừ kho khả dụng một lần, loại hàng hết hạn/đã giữ. Gợi ý chỉ đọc dữ liệu, không mua hoặc trừ tiền. Định lượng tạm một phần mỗi thành phần/bánh (đế một), theo cấu hình công khai trong [spec Epic 5](spec-5-1-expanded-ingredient-and-recipe-catalog.md); cần playtest cân bằng. Những ghi chú thiếu định lượng/cách nhập trong lịch sử bên dưới đã được thay bởi cập nhật này. Ngưỡng lọc Kho vẫn do người chơi nhập, không tự áp ngưỡng gameplay chung.

**Đã triển khai Kho theo yêu cầu tiếp theo của người dùng ngày 2026-10-04:** 19 nguyên liệu, bộ lọc, cuộn, chi tiết lô thật, nút sang Chợ và gợi ý mua cho các công thức đang được game hỗ trợ. Xem [spec triển khai](spec-stock-shop-missions-ui.md). Gợi ý chỉ tính toán, không tự mua hoặc thay luật Kho.

**Cập nhật Chợ trước đó:** Chợ mua thường có 19 nguyên liệu, bộ lọc nhóm, chọn lượng, giá/tổng tiền/tồn thật và xác nhận mua theo [spec Chợ](spec-reference-market-purchases.md). Bản Kho tiếp theo giữ nguyên giao dịch này. Do chưa chốt ngưỡng chung, người chơi nhập tiêu chí khi dùng bộ lọc Sắp hết/Sắp hết hạn lần đầu; không âm thầm áp dụng ngưỡng gameplay mới. Gợi ý dùng menu thực tế và số phần người chơi chọn, cộng nhu cầu chung rồi trừ lượng khả dụng một lần. Tám công thức đầy đủ và biến thể chưa có định lượng vẫn chờ chốt, không được giả lập từ ảnh.

## Màn Kho nguyên liệu

- Quản lý đủ **19 nguyên liệu đã chốt** theo [danh mục](../planning-artifacts/pizza-gdd/proposal-market-ingredients-and-recipes.md), kể cả nguyên liệu đang hết hàng. “Xóa tất cả” không thuộc danh mục.
- Mỗi nguyên liệu hiển thị **icon, tên, lượng còn dùng được và hạn sử dụng** từ dữ liệu kho thật. Hàng hết hạn không cộng vào lượng còn dùng được; không gộp các lô khác hạn thành một hạn dùng giả. Nếu có hàng đã giữ cho đơn, phân biệt với lượng khả dụng để chuẩn bị/mua thêm.
- Bộ lọc: **Tất cả / Sắp hết / Sắp hết hạn**.
- Bấm từng nguyên liệu để xem **các lô và hạn dùng** tương ứng của chính nguyên liệu đó.
- **Ưu tiên dùng lô sắp hết hạn; nguyên liệu hết hạn không được dùng.** Giữ quy tắc giữ kho/trừ kho và mốc hết hạn hiện có; không tự thay bằng thứ tự nhập lô nếu trái ưu tiên hạn dùng.
- Nút **“Đi chợ mua thêm”** chuyển sang tab **Chợ**, giữ cùng phiên, tiền/kho và ngày chuẩn bị.

## Gợi ý mua

- Đầu vào: **món dự định bán/menu đang bán, số phần cần chuẩn bị và tồn kho còn dùng được**.
- Với từng nguyên liệu liên quan, lượng cần chuẩn bị là tổng nhu cầu từ các món dự định bán và số phần tương ứng, theo định lượng công thức được chốt. Cộng nhu cầu chung của nhiều món trước khi trừ tồn kho; không trừ cùng lượng tồn nhiều lần cho từng món.
- **Lượng cần mua = max(0, lượng cần chuẩn bị − lượng khả dụng).** Tính trong cùng đơn vị của nguyên liệu/công thức.
- **Lượng khả dụng không gồm hàng hết hạn hoặc đã giữ cho đơn.** Đánh giá hạn dùng theo ngày cần chuẩn bị và quy tắc hiện hành, không tính hàng chỉ còn dùng được trong ngày trước đó cho ngày sắp mở.
- Chỉ đề xuất **nguyên liệu liên quan đến menu đang bán**. Nguyên liệu hết hoặc tồn ít nhưng không thuộc menu không tự tạo gợi ý mua. Kem trắng/pesto/sốt cay chỉ liên quan khi có biến thể/yêu cầu tùy chỉnh thực sự được chọn, không mặc định thuộc tám công thức.
- Gợi ý chỉ cung cấp thông tin: **không tự mua, không trừ tiền**, không giữ kho hoặc tạo giao dịch. Người chơi tự quyết định mua ở Chợ.
- Đổi menu, số phần hoặc tồn khả dụng phải cho kết quả gợi ý tương ứng với dữ liệu mới; không dùng giá trị cố định theo ảnh.

## Ví dụ trong ảnh — minh họa có điều kiện

- **Nấm còn ít:** cân nhắc mua thêm nếu nhu cầu menu vượt lượng khả dụng.
- **Tôm và giăm bông hết:** mua nếu bán món cần chúng, không khuyến nghị vô điều kiện chỉ vì tồn bằng 0.
- **Phô mai và nấm sắp hết hạn:** ưu tiên dùng sớm khi còn hợp lệ; không cho dùng sau hạn.
- Đây là ví dụ mô tả ảnh, **không phải tồn kho/hạn dùng mặc định hoặc dữ liệu bắt buộc xuất hiện trong game**.

## Cần chốt trước triển khai

- Ngưỡng **“Sắp hết”** và khoảng thời gian/ngày của **“Sắp hết hạn”** chưa được người dùng xác định. Không tự ghi một ngưỡng số như đã duyệt.
- Giá, đơn vị và định lượng sốt/phô mai/topping mỗi bánh vẫn chưa chốt theo tài liệu danh mục. Một đế/bánh đã xác định. Chưa đủ định lượng để đưa ra con số gợi ý mua cho mọi công thức; không mặc định tất cả nguyên liệu bằng một phần.
- Cách người chơi nhập/chọn số phần cần chuẩn bị chưa xác định; không tự thêm cơ chế dự báo khách, tự đặt mục tiêu hoặc mở khóa món.
- Việc chốt danh mục 19 nguyên liệu không tự duyệt lại bảng nguyên liệu bếp, toàn bộ layout hub hoặc phạm vi demo. Chỉ thay phần Kho/gợi ý mua khi được yêu cầu thực hiện.

## Kiểm tra tập trung khi triển khai

- Đủ 19 mục, đúng icon/tên/tồn và các lô; ba bộ lọc khớp tiêu chí sau khi được chốt; xem lô đúng nguyên liệu; nút mua thêm đến Chợ.
- Lô gần hết hạn được ưu tiên, hàng hết hạn bị loại; không lấy hàng giữ cho đơn làm lượng khả dụng.
- Menu nhiều món cùng dùng một nguyên liệu: cộng nhu cầu, trừ tồn một lần; lượng mua không âm. Đổi menu/số phần làm gợi ý đổi đúng; menu không liên quan không đề xuất tôm/giăm bông chỉ vì hết hàng.
- Xem kho/gợi ý hoặc chuyển tab không làm mất hàng, tự mua hay trừ tiền. Kiểm tra phần liên quan, không tự chạy toàn bộ browser matrix.
