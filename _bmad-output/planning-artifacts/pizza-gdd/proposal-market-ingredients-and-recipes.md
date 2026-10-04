---
title: 'Đề xuất danh sách nguyên liệu chợ và tám công thức pizza'
date: '2026-10-04'
status: implemented-provisional-balance
scope: epic-5-catalog-recipes-and-planner
source: user
---

# Danh sách nguyên liệu và công thức đề xuất

## Quyết định triển khai Epic5 — cập nhật tiếp 2026-10-04

Người dùng yêu cầu làm5.1, bỏ giới hạn demo3ngày, mở pizza bằng tiền mua công thức rồi yêu cầu hoàn tất Epic5. Phạm vi hiện hành theo [spec Epic5](../../implementation-artifacts/spec-5-1-expanded-ingredient-and-recipe-catalog.md), thay các đoạn “chỉ ghi tài liệu/chưa được phép kích hoạt” lịch sử phía dưới. Tám món dùng thành phần đúng bảng; đơn vị tạm là phần, mỗi thành phần1phần/bánh. Giữ giá/hạn19nguyên liệu hiện có; không thêm sốt kem/pesto/cay vào tám món chính.

Giá bán gốc tạm: Phô mai50, Nấm65, Xúc xích75, Pepperoni85, Rau củ80, Gà BBQ90, Hải sản100, Giăm bông dứa95xu. Phô mai/Nấm mở sẵn; mua công thức còn lại150/200/200/250/300/250xu tương ứng. Người chơi đã mở món trong save cũ giữ quyền; không bắt mua lại. Các số này là cấu hình triển khai tạm cần playtest, không tự suy từ references và không mô tả là cân bằng đã duyệt.

Không áp dụng lịch unlockXP/ngày cho mua công thức mới. Tiền và sở hữu lưu atomic trong chuẩn bị; ca giữ đơn/giá đã nhận. Đã triển khai chuyển save cũ, kể cả kết thúc demo 3 ngày, giữ tiền/kho/tiến độ. Trạng thái kiểm tra cuối nằm trong spec/sprint. Các câu “chưa triển khai” bên dưới lưu lịch sử đề xuất, không mô tả trạng thái hiện tại.

Ghi nguyên văn nội dung đề xuất của người dùng, chuẩn hóa thành danh mục để chốt dữ liệu sau. **Chưa triển khai; chưa thay phạm vi demo, cơ chế mở khóa hoặc giao diện đã duyệt.** Không coi danh sách này là quyền tự thêm toàn bộ nguyên liệu/công thức vào game hiện tại.

**Cập nhật cùng ngày:** Trong yêu cầu màn Kho, người dùng xác nhận **đủ 19 nguyên liệu đã chốt**. Danh mục nguyên liệu dưới đây được chốt; tám công thức vẫn ở trạng thái đề xuất, giá/định lượng chưa chốt. Yêu cầu Kho và gợi ý mua được ghi tại [tài liệu riêng](../../implementation-artifacts/requirement-stock-and-purchase-suggestions.md), chưa triển khai.

## Nguyên liệu ở chợ — 19 loại

| Nhóm | Số loại | Nguyên liệu |
| --- | --- | --- |
| Đế bánh | 1 | Đế bánh pizza |
| Sốt | 5 | Sốt cà chua; sốt kem trắng; sốt BBQ; sốt pesto; sốt cay |
| Phô mai | 1 | Phô mai mozzarella |
| Thịt | 4 | Xúc xích; pepperoni; thịt gà; giăm bông |
| Hải sản | 2 | Tôm; mực |
| Rau củ và trái cây | 6 | Nấm; ớt chuông; hành tây; bắp ngọt; ô liu; dứa |

## Công thức — 8 loại pizza

**Tất cả dùng 1 đế bánh pizza.** Các nguyên liệu còn lại xác định thành phần, chưa xác định lượng dùng mỗi bánh.

| Pizza | Sốt | Phô mai | Topping |
| --- | --- | --- | --- |
| Phô mai | Cà chua | Mozzarella | Không |
| Nấm | Cà chua | Mozzarella | Nấm |
| Xúc xích | Cà chua | Mozzarella | Xúc xích |
| Pepperoni | Cà chua | Mozzarella | Pepperoni |
| Rau củ | Cà chua | Mozzarella | Ớt chuông, hành tây, bắp, ô liu |
| Gà BBQ | BBQ | Mozzarella | Gà, hành tây |
| Hải sản | Cà chua | Mozzarella | Tôm, mực |
| Giăm bông dứa | Cà chua | Mozzarella | Giăm bông, dứa |

“Cà chua” trong cột sốt là **sốt cà chua**, không phải một nguyên liệu topping cà chua mới. “Bắp” trong công thức rau củ là **bắp ngọt** trong danh mục chợ; “gà” là **thịt gà**.

## Quy tắc dữ liệu

- Đây là **công thức đề xuất cho game**, chưa phải cấu hình đã chốt để triển khai.
- **Kem trắng, pesto và sốt cay** dành cho biến thể hoặc yêu cầu tùy chỉnh; chưa bắt buộc trong tám công thức trên. Không tự tạo công thức biến thể hoặc cơ chế tùy chỉnh ở lượt ghi tài liệu này.
- Mỗi nguyên liệu cần có **ID, tên, icon, giá mua, số lượng tồn, hạn sử dụng và đơn vị**. Tồn kho là dữ liệu thực tế của người chơi; hạn sử dụng của hàng đang có phải tương thích với quy tắc theo lô hiện hành, không thay bằng một số tồn/hạn dùng cố định từ danh mục.
- **Giá mua và lượng nguyên liệu mỗi bánh cần chốt riêng.** Một đế/bánh đã xác định; không tự mặc định mọi loại sốt/phô mai/topping đều dùng một phần. ID cụ thể, icon và đơn vị từng nguyên liệu chưa được chỉ định trong đề xuất; không tự coi chúng là đã chốt.
- **“Xóa tất cả” là nút thao tác, không phải nguyên liệu**; không đưa vào danh mục chợ, tồn kho hoặc công thức.
- Không tự đổi công thức, giá, ID runtime, quy tắc mở khóa hoặc số ô trên UI hiện tại để khớp đề xuất. Việc tích hợp với demo/campaign và bố cục chợ/bếp sẽ được xác định khi người dùng yêu cầu triển khai.

## Các điểm cần chốt trước triển khai

- Giá mua và đơn vị định lượng từng nguyên liệu; lượng sốt, mozzarella và mỗi topping trên một bánh.
- ID và icon tương ứng; hạn sử dụng theo từng loại/lô theo luật hiện hành.
- Phạm vi đưa vào demo hoặc phần sau, lịch mở khóa và ánh xạ các món/ô đang có; đề xuất này không tự nâng phạm vi demo ba công thức lên tám.

Không chạy build/test cho lượt chỉ cập nhật tài liệu này. [Nhật ký quyết định](decision-log.md) ghi trạng thái đề xuất; [GDD hiện hành](gdd.md) vẫn quyết định luật và phạm vi đã duyệt.
