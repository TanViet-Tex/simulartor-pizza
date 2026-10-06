---
title: 'Dự báo và mua nguyên liệu theo công thức trong Chợ'
type: feature
created: '2026-10-06'
status: done
baseline_commit: 'c8408f7'
context: []
---

<frozen-after-approval reason="Người dùng giao triển khai trực tiếp">

## Intent

**Problem:** Chợ chưa dự báo nguyên liệu cho ngày sắp mở hoặc mua một giỏ toàn bộ; nguyên liệu chưa kiểm tra quyền sở hữu công thức ở logic mua.

**Approach:** Dự báo từ lịch khách/menu bán/lịch sử khi có, mặc định ngày đầu. Cộng nhu cầu công thức rồi thêm dự phòng cấu hình, trừ kho còn hạn. Mở nguyên liệu theo ít nhất một công thức sở hữu; gợi ý điền lượng thiếu có thể chỉnh, xác nhận giỏ mua nguyên tử với giá/tiền thật.

**Steering tiếp theo:** Người dùng yêu cầu nút “Mua” ở từng dòng mua ngay không thông báo xác nhận; giữ xác nhận giỏ “Mua tất cả”. Mua lẻ gọi logic giá/tiền/quyền hiện hành trực tiếp.

## Boundaries & Constraints

**Always:** Khóa nguyên liệu theo ownedRecipes, không theo selling; tính lại khi restore và khi mua công thức thành công. Khóa cả mua lẻ/bulk/hỏa tốc, hiển thị icon/công thức cần mua, cấm chỉnh số lượng. Forecast chỉ menu đang bán đã sở hữu và nguyên liệu mở. Mua tất cả kiểm tra lại từng giá/ngày/tiền, trừ tiền và nhập toàn bộ lô một lần; thiếu tiền không nhập một phần, double-tap không trừ trùng. Giữ bố cục Chợ/header/list/footer, mua lẻ, giá ngày/ưu đãi và checkpoint hiện có; không tự mở ca.

**Never:** Tự mua từ dự báo, mở công thức miễn phí, dùng số liệu ảnh làm giá, lưu giữa ca, đổi scene khác hoặc thêm schema để lưu quyền mở dẫn xuất.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Day1 | Không lịch sử | Dự báo mặc định theo lịch khách và menu đang bán | Không tạo lịch sử giả |
| History | Báo cáo có salesByRecipe | Dùng dữ liệu gần nhất để điều chỉnh phân bổ lịch khách | Báo cáo cũ thiếu chi tiết dùng lịch |
| Shared ingredient | Nhiều món dùng cùng nguyên liệu | Cộng hết nhu cầu, dự phòng sau tổng, trừ kho đúng một lần | Không âm lượng thiếu |
| Locked | Chưa sở hữu công thức cần nguyên liệu | Icon khóa/tên công thức, mọi đường mua từ chối | Không trừ tiền/nhập lô |
| Disabled recipe | Sở hữu nhưng tắt bán | Nguyên liệu vẫn mở, món không tham gia dự báo | Không khóa lại |
| Changed quote | Giá/ngày thay sau mở xác nhận | Từ chối giỏ cũ và yêu cầu xem lại | Không mua giá mới âm thầm |
| No funds / duplicate | Thiếu tiền hoặc command đã dùng | Giữ tiền/lô; không mua một phần/lặp | Feedback rõ |

</frozen-after-approval>

## Code Map

- `src/runtime/CozyRuntime.ts` -- owned/menu/schedule/report/prices, guard intent mua, quyền mở dẫn xuất.
- `src/domain/CozyStock.ts` -- nguyên tử tiền/lô/ledger và giá supplier.
- `src/domain/MarketForecast.ts`, `src/config/marketForecast.ts` -- dự báo thuần/config dự phòng.
- `src/presentation/ReferenceMarket.ts` -- giữ viewport321×318, hàng53px, thêm điều khiển trong vùng chữ hiện có.
- `src/scenes/CozyScene.ts` -- quantity0–100, áp dụng gợi ý/quote/dialog/release đúng lease.

## Tasks & Acceptance

**Execution:**
- [x] Domain/runtime/config -- forecast/access/basket quote và guard ba đường mua, tests aggregate/expiry/history/restore/idempotence/funds/prices.
- [x] ReferenceMarket -- icon khóa/tên công thức, nút gợi ý/mua tất cả/tổng, disable controls khóa; giữ list/frame/filter/footer.
- [x] CozyScene -- điền thiếu cho mọi dòng, chỉnh0–100; xác nhận danh sách giá/số dư, quote snapshot và chống doubletap.
- [x] E2E tập trung -- gợi ý/edit/mua/hủy/thiếu tiền/khóa/unlock ngay/save restore, không mở ca.
- [x] Tài liệu hiện hành -- ghi quyền mở/dự báo/giỏ và kết quả kiểm chứng.

**Acceptance Criteria:**
- Given ngày chuẩn bị và menu bán, when bấm Gợi ý mua hôm nay, then từng lượng thiếu được điền theo kho còn hạn và dự phòng.
- Given công thức sở hữu kể cả tắt bán, when vào Chợ hoặc restore, then mọi nguyên liệu của công thức mở và các đường mua kiểm tra cùng quyền.
- Given giỏ hợp lệ, when mở xác nhận, then thấy toàn bộ dòng/tổng/tiền còn; when xác nhận, then kiểm tra giá/tiền và mua tất cả một lần, giữ chuẩn bị.
- Given giỏ thiếu tiền hoặc giá/ngày/quyền thay đổi, when xác nhận, then không thay đổi tiền/kho và không mua một phần.

## Design Notes

Dự phòng mặc định10% cấu hình; lịch sử tối đa3báo cáo chi tiết, pha50% phân bổ lịch sử với lịch khách, làm tròn bảo toàn tổng bánh dự báo. Áp dụng dự phòng sau cộng nhu cầu nguyên liệu. Báo cáo thiếu chi tiết hoặc ngày đầu dùng phân bổ lịch. Nguyên liệu chưa được catalog công thức nào dùng hiển thị chưa có công thức phù hợp.

Bulk giữ semantics mua thường hiện tại: giao dịch tiền/lô nguyên tử trong runtime; dữ liệu đi qua checkpoint đã có, không tự autosave mỗi mua. Giá quote giữ từng dòng/ngày, xác nhận lại trước mutation; idempotence command chung các đường mua.

## Spec Change Log

- Review: chọn3báo cáo chi tiết sau lọc legacy, thay vì legacy chiếm ngân sách lịch sử. Test trộn báo cáo cũ/chi tiết giữ dữ liệu có sẵn.
- Review: nhãn nhập lượng đổi0–100 để khớp quantity0 loại dòng khỏi giỏ.
- Người dùng steering mua lẻ ngay: bỏ dialog mua lẻ, không thêm modal thành công; giữ giỏ bulk xác nhận và guards.

## Verification

- Unit forecast/runtime/stock và các suite mua/menu liên quan.
- TypeScript/Vite build.
- Chromium E2E đúng Chợ/giao dịch ở360×640; không full browser/viewport matrix.

Kết quả cuối: build đạt;27unit tập trung forecast/Epic5/stock/lots đạt. 7E2E Chromium360×640 đạt qua lượt cuối và rerun: dự báo/edit/giỏ/hủy/mua một lần, thiếu tiền không nhập, mua lẻ ngay không popup/double-click, mua công thức cập nhật Chợ/restore, mua qua ngày kế, quantity input và ưu đãi nhà cung cấp. Ảnh renderer thật giữ frame/list/footer đúng baseline. Test CozyMarketFlow legacy progressionArchive tái hiện cùng lỗi ở baseline c8408f7, ghi deferred-work.md.

Review blind/edge/acceptance thực hiện bằng các lens riêng trong cùng reviewer do runtime từ chối tạo thêm thread; hai phát hiện (lọc báo cáo legacy trước lấy3chi tiết, nhãn0–100) đã sửa và unit/build/E2E tương ứng đạt. Steering mua lẻ ngay tiếp theo được kiểm tra trực tiếp bằng double-click thật và hồi quy mua qua ngày/ưu đãi.

## Suggested Review Order

- Quyền mua và quote giỏ dùng cùng giá hiện hành.
  [CozyRuntime.ts:432](../../src/runtime/CozyRuntime.ts#L432)
- Kiểm tra mọi dòng trước khi đổi tiền và lô.
  [CozyStock.ts:84](../../src/domain/CozyStock.ts#L84)
- Cộng nhu cầu, thêm dự phòng rồi trừ kho.
  [MarketForecast.ts:5](../../src/domain/MarketForecast.ts#L5)
- Giữ hàng Chợ, khóa controls và hiển thị tổng.
  [ReferenceMarket.ts:20](../../src/presentation/ReferenceMarket.ts#L20)
- Bulk xác nhận; mua lẻ trực tiếp có chặn bấm kép.
  [CozyScene.ts:930](../../src/scenes/CozyScene.ts#L930)
- Config mặc định và kiểm tra luồng thực.
  [marketForecast.ts:2](../../src/config/marketForecast.ts#L2), [market-forecast.spec.ts:22](../../tests/market-forecast.spec.ts#L22)
