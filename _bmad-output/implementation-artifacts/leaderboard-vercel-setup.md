# Kết nối bảng xếp hạng trên Vercel

Code hỗ trợ đặt tên và bảng chung theo tiền hiện có, giảm dần; bằng tiền xét ngày cao hơn rồi ID ổn định. Tính cả 100.000 xu của mã VIETVUIVE. Một ID/token riêng được giữ trong trình duyệt; trùng tên không gộp người chơi. Bấm Bắt đầu mới thay kết quả của người chơi đó bằng lượt mới, không giữ tiền cao nhất lịch sử.

## Cấu hình cần thực hiện trên tài khoản của bạn

1. Tạo project Supabase trong [Supabase](https://supabase.com/dashboard) hoặc kết nối qua [Vercel Marketplace](https://supabase.com/docs/guides/integrations/vercel-marketplace). Chưa cần bật anonymous sign-in vì API Vercel quản lý token riêng của người chơi.
2. Trong SQL Editor của Supabase, chạy toàn bộ [leaderboard.sql](../../supabase/leaderboard.sql). Bảng có RLS và cấm truy cập trực tiếp từ `anon`/`authenticated`; chỉ API server gọi hai RPC được cấp quyền.
3. Trong Vercel → Project → Settings → Environment Variables, thêm `SUPABASE_URL` (Project URL) và `SUPABASE_SERVICE_ROLE_KEY` (legacy API key `service_role`, JWT). Đặt ở môi trường bạn muốn chạy, rồi Redeploy.
4. Giữ key riêng trong Vercel, không gửi vào chat/GitHub và không đặt tên `VITE_...`. File [.env.example](../../.env.example) chỉ chứa placeholder.
5. Repo có [vercel.json](../../vercel.json) dùng build `npm run build-nolog`, output `dist`; API `/api/leaderboard` là Vercel Function. Không cấu hình rewrite toàn bộ đường dẫn sang `index.html` làm che API.

## Kiểm tra sau deploy

Mở link bằng hai trình duyệt/thiết bị riêng, Bắt đầu và đặt hai tên khác nhau. Khi lưu xong, về menu → Bảng xếp hạng → Làm mới: cả hai thấy cùng dữ liệu, dòng mình có dấu nhận biết. Cho một người nhận mã 100.000 xu, lưu thành công rồi Làm mới ở trình duyệt kia để đối chiếu tiền. Chơi/chốt ngày để kiểm tra ngày mới; mua đồ đã lưu giảm tiền trên bảng như tiền thực tế.

Nếu chưa cấu hình database/API, bảng thông báo chưa kết nối và không tạo người chơi giả. Mất mạng không khóa game/lưu local; bản cập nhật cuối chờ trong bộ nhớ trình duyệt và được gửi lại khi có lưu mới hoặc bấm Làm mới.

## Phạm vi dữ liệu

Tên/ID/token và bản chưa gửi được lưu localStorage; chiến dịch vẫn lưu IndexedDB như trước. Chỉ publish checkpoint đã ghi thành công, không cập nhật từng đồng giữa ca. Vì vậy ngày trên bảng là ngày chuẩn bị đã lưu (chốt ngày 1 chuyển sang ngày 2), không phải bộ đếm riêng các ngày đã hoàn thành. Xóa dữ liệu trình duyệt hoặc đổi thiết bị tạo người chơi mới; chưa có tài khoản hoặc khôi phục tiến độ qua thiết bị.

API kiểm tra tính hợp lệ/đối soát checkpoint, băm token và chặn cập nhật row của người khác; key Supabase chỉ ở server. Đây chưa phải máy chủ mô phỏng game để chống mọi hình thức sửa client/gian lận. SQL và hai thiết bị thật cần kiểm chứng trên Supabase sau khi tài khoản được cấu hình; test tự động hiện dùng API/database giả lập có kiểm soát.

## Nguồn thiết lập

[Storage trên Vercel](https://vercel.com/docs/marketplace-storage), [Supabase/Vercel](https://supabase.com/docs/guides/integrations/vercel-marketplace), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
