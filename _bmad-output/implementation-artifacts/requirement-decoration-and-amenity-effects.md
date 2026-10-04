---
title: 'Trang trí và Tiện nghi — chỉ số, mua, bố trí, gameplay và lưu'
date: '2026-10-04'
status: documented-not-implemented
scope: documentation-only
source: user
---

# Trang trí và Tiện nghi — yêu cầu chức năng

**Chỉ ghi tài liệu/backlog E07; chưa code, xem ảnh references hoặc chạy build/test.** Khi được yêu cầu làm mới xem ảnh. Chỉ số bên dưới do người dùng xác định, thay ghi chú cũ rằng công dụng Trang trí/Tiện nghi hoàn toàn chưa chốt. Thiết bị/nhân viên có thông số riêng.

## Công dụng và chỉ số

| Trang trí | Tăng khách ghé |
| --- | --- |
| Cây để bàn | +3% |
| Tranh pizza | +5% |
| Đèn trang trí | +5% |
| Bảng hiệu | +8% |
| Chậu cây lớn | +5% |
| Rèm cửa | +3% |

| Tiện nghi | Tác dụng |
| --- | --- |
| Ghế chờ | +5% kiên nhẫn |
| Wi-Fi | +8% kiên nhẫn |
| Quạt đứng | +5% kiên nhẫn |
| Máy lạnh | +10% kiên nhẫn |
| Loa nghe nhạc | +5% kiên nhẫn |
| Bàn ghế khách | +2 chỗ chờ |

**Giá mua dùng cấu hình đã chốt của dự án, không lấy giá ảnh.** Không đặt bảng giá mới tại đây. Khi triển khai xác định nguồn giá/ID chính xác; thiếu thì chốt trước khi bật Mua. Lượt đối chiếu cấu hình nội dung hiện có chưa xác định được bảng giá các đồ trên; không coi đó là quyền tự đặt giá.

## Luồng mua

**Quán → Trang trí/Tiện nghi → chọn đồ → xem chi tiết → xác nhận mua.** Hai nhóm có danh sách riêng.

Khung chi tiết hiển thị **hình, tên, giá, tác dụng, sở hữu, hiệu quả hiện tại/dự kiến sau khi đặt**, nút **Mua** hoặc **Đặt vào quán/Cất đi**. Dự kiến tính đúng cap/nhóm không cộng dồn.

Khi xác nhận:

1. Kiểm tra **chuẩn bị ngày mới**, không mua trong ca.
2. Kiểm tra lại **tiền, quyền sở hữu, điều kiện** trên trạng thái thật.
3. **Trừ tiền và ghi nhận sở hữu trong cùng giao dịch**.
4. **Lưu thành công rồi cập nhật UI** thành kết quả mua hoàn tất.
5. Cho người chơi chọn đặt; mua không tự đặt/cộng hiệu ứng.

- Thiếu tiền: báo **số tiền còn thiếu**, không cho xác nhận; tiền/sở hữu không đổi.
- Bấm liên tiếp/retry: chỉ xử lý một lần; mỗi loại chỉ sở hữu **một bản** trong phiên bản này. Đồ đã sở hữu không bắt mua lại.
- Lỗi lưu: **không mất tiền mà thiếu đồ**. Pending/lỗi chưa là mua thành công, thử lại cùng định danh giao dịch để tránh trừ/ghi lặp.
- Xem/hủy/xem trước không tạo giao dịch mua.

## Đặt và cất

- **Đặt vào quán → vị trí hợp lệ → xem trước → xác nhận đặt**.
- Hủy đặt: vẫn sở hữu, chưa có hiệu ứng mới. Đồ đặt hiển thị trong quán và thuộc tập đang kích hoạt.
- **Cất đi** gỡ hình/hiệu ứng, giữ sở hữu; không tự bán/hoàn tiền.
- Không đặt chồng vùng thao tác, lò hoặc nút gameplay. Tiện nghi cố định dùng vị trí lắp đặt định sẵn.
- Chỉ đổi đồ/bố trí trong chuẩn bị, **không đổi trong ca bán**. Hiệu quả dự kiến trong chuẩn bị đổi theo đặt/cất; ca dùng bộ hiệu ứng đã chốt khi mở ngày.

## Cộng hiệu ứng

- Các loại khác nhau **cộng phần trăm trên chỉ số gốc**, không nhân nối tiếp; chỉ tính đồ **đang đặt/kích hoạt**, không tính đồ cất.
- **Quạt và máy lạnh lấy mức cao hơn**: quạt 5%, máy lạnh 10%, cả hai vẫn 10%.
- `bonusKhach = min(0.30, tổng bonus trang trí đang đặt)`.
- `bonusCho = min(0.40, bonus ghế + Wi-Fi + loa đang đặt + max(bonus quạt, bonus máy lạnh đang đặt))`.
- Bàn ghế **+2 chỗ chờ riêng**, không vượt giới hạn bố trí. Không tự đồng nhất chỗ chờ với cap phiếu hoạt động hoặc số avatar UI.
- Ví dụ **60 × (1 + 0.05 + 0.08) = 67.8 giây**, không nhân lần lượt 1.05/1.08.
- Đối chiếu toàn bộ danh mục: trang trí 29%; tiện nghi tăng kiên nhẫn sau loại trừ quạt/máy lạnh 28%. Trần **30%/40%** vẫn áp dụng; không đổi chỉ số item để chạm trần.

## Gameplay khi mở ngày

- Tính hiệu ứng từ đồ đang đặt/kích hoạt, **chốt bộ dùng cho ngày đó**.
- **Thời gian đợi = thời gian gốc từng khách × (1 + bonusCho)**.
- Tăng khách nối **hệ thống sinh khách thực tế**, giữ quy tắc đầy hàng chờ và không vượt sức chứa. Là **tăng kỳ vọng**, không bảo đảm số khách cố định mỗi ngày; không chỉ thay nhãn UI.
- Không thay đồ trong ca; hiệu ứng không tự tăng **giá bán, điểm đánh giá hoặc tốc độ nướng**.
- Chính sách sinh khách kỳ vọng, model sức chứa/giới hạn bố trí/vị trí hợp lệ cần chi tiết hóa trước tích hợp. Không tự thêm số slot cố định hoặc đổi lịch demo ở lượt ghi tài liệu.

## Dữ liệu và lưu

Mỗi đồ có **ID ổn định, tên, nhóm, giá, icon/asset, loại hiệu ứng, giá trị, nhóm không cộng dồn, vị trí hợp lệ, điều kiện mua**.

Tiến độ lưu **sở hữu, đồ đang đặt/vị trí, cấp nâng cấp nếu có**. Tính lại hiệu ứng từ đồ đang đặt; không cộng trực tiếp vào chỉ số gốc rồi lưu/cộng lặp mỗi lần tải.

**Save cũ:** đồ mới mặc định chưa sở hữu/chưa đặt, giữ tiền/tiến độ cũ. Migration trên bản sao được kiểm tra, không tự reset/cấp đồ hoặc ghi đè trước khi chuyển đổi hợp lệ và lưu thành công.

### Ranh giới lưu mới, chưa triển khai

“Lưu mua thành công rồi cập nhật UI” bổ sung **giao dịch bền mua đồ trong chuẩn bị** ngoài ranh giới tạo chiến dịch/chốt ngày cũ. Tiền/sở hữu phải cùng kết quả atomic, không ghi đồ độc lập có thể lệch tiền. Xác nhận bố trí/cấp nâng cấp phải khôi phục nhất quán sau reload; lịch ghi đặt/cất phải được thiết kế để đáp ứng yêu cầu này.

Khi triển khai chi tiết hóa schema/version, commit ID/revision, lỗi/retry/xung đột và bảo toàn tiền/kho/tiến độ. Không đổi ngày đã chốt, tạo checkpoint ngày cũ, ghi mỗi cú chạm/xem trước hoặc vô tình lưu/khôi phục giữa ca. Không mở ngày khi giao dịch/lưu còn pending. **Đây là yêu cầu mới, không phải bằng chứng save hiện tại đã hỗ trợ.**

## UI và nghiệm thu

- Thẻ ghi đúng **“+5% khách ghé”** hoặc **“+5% thời gian đợi”** theo chỉ số thực; bàn ghế ghi +2 chỗ chờ. Nhãn **“Đã sở hữu”**, **“Đang đặt”** đúng dữ liệu.
- Thiếu tiền không cho xác nhận. Mọi nút bật nối **chức năng thật**, không đổi hình/thông báo giả thay nghiệp vụ. Chưa làm thì trạng thái rõ và không bật hành động nghiệp vụ.
- Giữ kem–gỗ–viền đồng và UI ngoài phạm vi/vùng thao tác bếp đã duyệt.

Kiểm tra khi được yêu cầu triển khai:

1. Đủ tiền: đúng giá/đồ; thiếu tiền/hủy/không đạt điều kiện: tiền/sở hữu không đổi.
2. Double-tap/retry không trừ hai lần; lỗi lưu không mất tiền thiếu đồ.
3. Mua chưa đặt không bonus; đặt/cất/hủy đổi hình/hiệu ứng đúng; vị trí sai bị chặn.
4. Mở ngày dùng bonus thật cho sinh khách/kiên nhẫn, không vượt sức chứa; không đổi trong ca hoặc tác động giá/sao/nướng.
5. Quạt+máy lạnh không cộng dồn; cộng trên gốc, đúng 67.8 giây/cap30%/40%, sức chứa tính riêng.
6. Reload giữ đồ/vị trí/cấp, không nhân đôi bonus; save cũ giữ tiền/tiến độ, chưa sở hữu đồ mới.
7. **Build và test liên quan thành công** khi triển khai, kiểm tra tập trung theo nhịp dự án; chưa chạy ở lượt chỉ tài liệu.

Phân việc: **7.1 trang trí/sở hữu/bố trí; 7.2 tiện nghi và thiết bị riêng; 7.4 bonus ngày/sinh khách; 7.5 giao dịch chuẩn bị/save/migration**. UI/luồng thuộc3.8; UI xong chưa là nghiệp vụ xong. Xem [epics](../planning-artifacts/pizza-gdd/epics.md), [Quán](requirement-shop-tab.md).
