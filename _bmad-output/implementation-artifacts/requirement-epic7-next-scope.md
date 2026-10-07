---
title: 'Epic 7 — phạm vi tiếp theo theo quyết định người dùng'
date: '2026-10-07'
status: decisions-partially-confirmed
scope: planning-only
source: user
---

# Epic 7 — quyết định mới

Tài liệu này ghi yêu cầu mới để chuẩn bị triển khai, chưa chứng nhận code hoặc story ready-for-dev. Những quyết định đã chốt dưới đây thay các đề xuất cũ tương ứng trong epics/spec Epic 7.

## Đã chốt

- **Bỏ lò thứ hai**, thay mục đó bằng **3 ô nước**. Không xây hệ thống hai lò hoặc tự cho làm nhiều đơn song song. Ba ô nước thay khu vực lò thứ hai; giữ lò thứ nhất và bố cục các phần khác. Ba loại đã chốt: nước suối, Coca, nước cam. Chưa chốt cách phục vụ, công dụng/giá/điều kiện mở; đây là yêu cầu chuẩn bị triển khai, chưa sửa UI/gameplay.
- **Tủ lạnh kéo dài hạn bảo quản gấp 4 lần.** Đây là hiệu ứng hạn dùng, không phải nhân lượng tồn, giá vốn hoặc tiền. Các loại sốt đã không hết hạn tiếp tục giữ luật đó. Chưa chốt cách áp dụng cho lô đang có và ngày kích hoạt; không tự hồi sinh nguyên liệu đã hủy.
- **Bỏ mục Bàn làm pizza.** Món thay thế sẽ được người dùng cập nhật sau; không tự thêm bàn sản xuất hoặc công dụng mới. Việc này không bỏ thớt/bàn thao tác hiện tại và không liên quan món Bàn ghế khách +10% kiên nhẫn đã có.
- **Mở rộng lần 1: 4→5 ô khách, +10% khách quán. Lần 2: 5→6 ô khách, tổng +30% khách quán.** Lần 2 cộng thêm 20 điểm phần trăm vào lần 1. Bonus chỉ áp dụng khách quầy, không nhân đơn app hoặc số bánh mỗi đơn. Burst tối đa 2/3 độc lập sức chứa vẫn giữ. Code cũ 4→6 ở lần 1 cần chuyển sang luật mới, giữ tiến độ nâng cấp của save cũ. Cách cộng với bonus trang trí còn cần chốt.
- **Quảng bá có trả tiền, chỉ cho xem trước số tốp/lượt khách hôm đó, không tăng lượng khách.** Số liệu lấy từ lịch seeded mà runtime thật sẽ dùng; phân biệt tốp, lượt đơn và số pizza, không hứa nhận đủ khi hàng chờ đầy. Mức phí, thời điểm mua và phạm vi quầy/app còn cần chốt.
- **Không có hư hỏng/sửa chữa** trong Epic 7. Bỏ nhánh thiết kế, story và cơ chế ngẫu nhiên cho thiết bị hỏng. Quyết định này không thay các sự kiện mất tiền thuộc Epic 9.

## Đang cần trả lời

1. Mở rộng đã chốt 4→5→6 ô, bonus +10% rồi tổng +30%; còn chốt cách cộng với trang trí. Giá đã có: lần 1 6000 xu, lần 2 10000 xu.
2. Quảng bá chỉ xem trước, không tăng khách; cần bổ sung mức phí, phạm vi quầy/app và thời điểm sử dụng trước story triển khai.
3. Ba ô nước đã có tên: nước suối, Coca, nước cam; còn cách phục vụ (bán riêng/kèm pizza hay tiện nghi), công dụng, giá và điều kiện mở.
4. Tủ lạnh: giá/điều kiện mở; hạn gấp 4 tính trên thời hạn gốc nào, áp dụng cho lô đang có hay lô mới, và kích hoạt từ lúc nào?

## Thứ tự chuẩn bị story

1. Hoàn thiện luật tủ lạnh và kiểm tra hạn lô/save cũ; ghi story phần còn lại của 7.2.
2. Hoàn thiện mở rộng 4→5→6 ô/bonus +10% rồi tổng +30%; ghi story phần còn lại của7.3/7.4, nối dự báo và lịch thật.
3. Chốt quảng bá có phí và thông tin tốp; bổ sung story riêng vào Epic 7 khi hợp đồng rõ.
4. Nước triển khai sau khi có công dụng; món thay Bàn làm pizza để sau theo yêu cầu người dùng.

## Ranh giới triển khai

Giữ UI ngoài đúng các mục được yêu cầu thay, năm tab/sáu nhóm Quán và bố cục bếp hiện có. Không thiết kế lại toàn trang hoặc tăng burst khi mở ô. Mua trong chuẩn bị qua pipeline candidate → commit → confirm hiện có, retry cùng payload không trừ trùng; không thêm lưu giữa ca. Save phải giữ tiền, lô, tiến độ và các nâng cấp đã mua. Các con số chưa chốt không được tự biến thành config tạm.

Nguồn liên quan: [phạm vi Epic 7 đã triển khai](spec-7-shop-development.md), [luật sức chứa](spec-7-capacity-and-table-patience.md), [lịch và ngân sách mới](spec-shift-clock-and-customer-budget.md).
