# Epic 3 — Context kinh tế trước triển khai

Ngày: 2026-10-03. Phạm vi: P02/P08 trên luồng Cozy RAM hiện hành. Tài liệu này là context phân tích, không phải story ready-for-dev hoặc xác nhận Epic 3 đã hoàn thành.

## Nguồn và quyết định có hiệu lực

- `_bmad-output/planning-artifacts/pizza-gdd/epics.md`, E03: chợ theo ngày; số lượng/hạn dùng/thuê; giữ kho và tiêu hao; dòng tiền, giá vốn, tồn kho, hủy hàng, lợi nhuận; lương/sửa chữa 0 có giải thích.
- `_bmad-output/planning-artifacts/pizza-gdd/gdd.md`, các mục “Vòng phục vụ và giữ nguyên liệu”, “Khách, giá, đánh giá và uy tín”, “Chợ, hạn dùng và kế toán”, “Ba ngày, kết thúc và lưu tiến độ”: luật chi tiết bên dưới.
- `_bmad-output/game-architecture.md`, X03/X04/X06 và IP01/IP02: mutation do domain/runtime sở hữu, typed command, nguyên tử, không mutation từ scene/animation; persistence chốt ngày thuộc Epic 4.
- `_bmad-output/project-context.md` và `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`: chỉ đọc/sửa phạm vi liên quan, không redesign UI đã duyệt; giữ RAM Cozy, kết thúc ngày thủ công và ba ngày; full browser matrix không chạy cho từng story.
- `src/domain/CozyStock.ts`, `src/runtime/CozyRuntime.ts`, `src/domain/CozyOrder.ts`, `src/domain/CustomerProgression.ts`, `src/scenes/CozyScene.ts`: owners hiện hành cần mở rộng, không dựng runtime song song.

## Luật phải giữ

1. Đầu phiên 300 xu, kho trống. Giá cơ sở đế/sốt/phô mai/nấm/xúc xích: 5/3/7/5/10; hệ số ngày 1/2/3: 1/1.1/0.9; làm tròn mỗi đơn vị. Không công khai giá ngày chưa tới. Chợ nguồn cung không giới hạn, không vay/bán lại, không mua vượt tiền, chỉ mua trước mở cửa.
2. Đế/sốt/phô mai còn dùng đến hết ngày mua + 1; nấm/xúc xích đến hết ngày mua. Lô còn hạn được dùng theo hạn sớm nhất, rồi ID lô. Giữ kho cũng phải kiểm tra hạn. Mỗi lô giữ giá mua thực tế.
3. Phiếu giữ đủ nguyên liệu, chưa làm không tiêu hao. Khi nướng tiêu hao đúng các nguyên liệu thực tế đã chọn; phần giữ không dùng được giải phóng. Topping ngoài công thức chỉ được lấy từ phần chưa giữ cho phiếu khác. Bỏ bánh không hoàn kho, làm lại cần giữ nguyên liệu mới. Hết hạn phiếu/đóng ngày trả phần giữ chưa dùng, không hoàn giá vốn đã tiêu hao.
4. Giá từng món 80–140% tham chiếu, làm tròn xu, chỉ đặt trước mở cửa; giá chốt trên phiếu không đổi. Tiếp tục dùng `menuPrice`, `agreedPrice`, `priceAccepted` hiện có và luật khách từ Epic 2. Xúc xích/cấp/unlock thuộc Epic 4, không tự mở món khóa ở Epic 3.
5. Thuê 20 xu/ngày. Lương 0 vì chưa có nhân viên; sửa chữa 0 vì demo chưa hỏng thiết bị. Tiền thuê dự kiến và cảnh báo thiếu thuê hiển thị trước mở cửa.
6. Dòng tiền: tiền cuối = tiền đầu + bán hàng + thưởng − mua hàng − thuê − lương − sửa − khác. Lợi nhuận = bán hàng − nguyên liệu đã dùng − hết hạn − thuê − lương − sửa − khác. Mua hàng không bị trừ thêm vào lợi nhuận; thưởng không thuộc doanh thu pizza. Hủy hàng không trừ tiền mặt lần hai. Tồn cuối định giá theo giá mua.
7. Chốt ngày đúng một lần; đóng phiếu trước khi hủy lô và trừ thuê. Không replay ngày đã chốt, không mở ngày 4. Thiếu vốn xét sau chốt; cảnh báo trước mở cửa nếu tiền dưới thuê hoặc không đủ hàng cho một món. Luồng RAM hiện hành được giữ; không tuyên bố save/reload campaign hoàn thành.

## Hiện trạng và khoảng trống có bằng chứng

| Vùng | Đã có | Khoảng trống |
| --- | --- | --- |
| `CozyStock.buy` / `datedIngredientPrice` | Giá 3 ngày; lô riêng; quantity 1–100; chống mua vượt tiền; từ chối ngày đã settle | Ngày hiện hành chưa là owner trong stock; `reserve` không nhận ngày, `owned/available` không lọc hạn. Purchase không có command ID cho duplicate retry. |
| `CozyRuntime.buy`, `prepareAgain`, `returnToOrders` | Mua trong prep ngày 1/hub ngày sau; kho/tiền qua ngày | `buy` chỉ xét `phase==='preparation'` nên `prepareAgain()` giữa ca cho mua khi `shiftOpen===true`, trái luật chỉ trước mở cửa. Scene vẫn có nút “Mua thêm nguyên liệu”/“Mua thêm”. |
| `CozyStock.reserve`, `commit` | Giữ số lượng theo nguyên liệu; consume FEFO thực tế; release/expire idempotent; giá vốn lô thật | Reservation không giữ phân bổ lô/ngày; commit không kiểm tra hạn. `consumed` chỉ được thuộc `ticket.amounts`, vì vậy topping ngoài công thức bị từ chối dù có kho rảnh. |
| `CozyOrder.bakeReady`, `CozyRuntime.dispatch` | Toggle nguyên liệu; đủ công thức mới nướng; một lò; bỏ/làm lại | BakeReady bắt buộc khớp đúng công thức và số lượng; dispatch cấm nguyên liệu ngoài công thức, trái luồng làm sai món/topping thực tế trong GDD. Cần tách “có thể nướng” và “đúng công thức”, giữ fixture tutorial hiện có. |
| `setMenuPrice`, `customer.price` | Runtime xét prep trước shift/hub; 80–140%; ticket có finalPrice; bargain đóng giá | `CozyScene.market/dayHub` chỉ hiển thị giá/chọn món, không có thao tác giá. Cần UI giá trước mở cửa và vô hiệu giữa ca. |
| `CozyStock.ledger/settle`, `closeDay` | Purchases/consumed/expired/rent; idempotent settlement; profit đúng cơ bản | Chưa ledger cashStart/cashEnd/rewards/inventoryValue/wages/repairs/other/cumulativeProfit hoặc breakdown giá vốn món tặng. `summary.cash` chỉ số cuối, UI capsule đọc tiền hiện tại sau mua ngày sau. Phải giữ summary ngày cũ bất biến. |
| `CozyScene.dayHub` | Tổng kết doanh thu/chi phí/lãi; hàng text mua/dùng/hết hạn/thuê; kho từng lô dùng modalText có cuộn | Chưa cho người chơi phân biệt đầy đủ dòng tiền và chi phí, định giá tồn, giải thích zero wages/repair. Chợ ngày 1 chưa hiển thị hạn lô; dự báo thuê thiếu. |
| Tests | `CozyStock.test.ts` có giá vốn qua ngày/settle idempotent/reserve concurrent/invalid quantities; `tests/day-end.spec.ts` kiểm tra chốt thủ công, carried stock, report thật | Chưa chứng minh cấm mua mid-shift, giữ lô còn hạn, extra topping không ăn kho người khác, pricing tương tác thực, cash bridge/stock valuation/zero cost explanations. |

`src/domain/demo.ts` đã chứa một campaign runtime cũ với economics/save support. CozyStock hiện import catalog từ đây. Chỉ tái sử dụng catalog; không chuyển luồng đang chơi sang DemoGame, không sao chép logic campaign hoặc khẳng định save của DemoGame là save Cozy.

## Tách đề xuất ba story với AC cụ thể

### 3.1 Chợ trước mở cửa và điều chỉnh giá bán

1. Phiên mới có 300 xu/kho trống; mua trên ngày 1/2/3 dùng đơn giá làm tròn đúng. Invalid ingredient/date/quantity hoặc vượt tiền bị từ chối và không đổi tiền/lô/books. Retry cùng purchase command ID không mua/trừ tiền hai lần; hai thao tác độc lập vẫn mua được.
2. Chỉ mua/đặt giá khi ca chưa mở hoặc hub chuẩn bị ngày chưa mở. Sau mở cửa, kể cả dùng `prepareAgain`, mọi purchase/pricing mutation đều bị từ chối; lý do rõ. Giữ thao tác chọn recipe giữa ca hiện có để không phá regression Epic 2, recipe/price của phiếu đã tạo bất biến. Thiếu nguyên liệu không mở cửa. Không reset stock/cash ngày sau.
3. Người chơi nhìn thấy giá, số lượng, hạn dùng, tiền thuê dự kiến 20 và cảnh báo nếu tiền sau chuẩn bị dưới thuê. Không hiển thị bảng giá ngày tương lai; terminal hub không tính giá ngày 4.
4. UI cho đặt giá từng món hiện mở trong khoảng 80–140%; selector hiển thị giá thực; giá ngoài khoảng/NaN bị từ chối. Arrival tạo ticket dùng giá đã đặt, bargain dùng giá cuối đã giảm; đổi giá ngày sau không đổi finalPrice ticket/ngày đã chốt.
5. Giữ tất cả tọa độ/bảng màu/nút/base surface đã duyệt; root quyết định nút recipe hiện có vẫn chọn món và mở detail modal màu kem cho điều chỉnh giá trước mở cửa. Không thêm hàng nút làm reflow market; có cả market ngày 1 và hub chuẩn bị ngày sau.

### 3.2 Giữ lô còn hạn, tiêu hao thực tế và làm lại

1. Tạo ticket nguyên tử kiểm tra chỗ/giá/đủ nguyên liệu còn hạn; reservation nhận day và có FEFO allocation/invariant rõ. Không có partial reservation khi thiếu một nguyên liệu, không giành phần giữ của phiếu khác.
2. Ba phiếu song song có tổng giữ không vượt hàng còn hạn. Reserve/commit từ ngày quá hạn bị từ chối; same ticket ID không giữ/trừ hai lần.
3. Giữ phạm vi correct assembly đã audit trong story 1.4: runtime đòi đủ công thức trước nướng, không mở hỗ trợ topping ngoài công thức trong Epic 3. GDD đoạn 149 yêu cầu topping ngoài công thức dùng kho rảnh là khoảng trống pre-existing được ghi nhận riêng, không tuyên bố đã hoàn thành luật rộng hơn. Domain commit subset vẫn trả phần giữ không dùng như hiện có.
4. Bắt đầu nướng atomically consumes đúng tập nguyên liệu thực tế, theo FEFO/cost lô đã phân bổ; bỏ hết phần giữ không dùng. Preflight từ chối bất kỳ shortage trước mutation. Nguyên liệu assembly chưa nướng không làm giảm owned/cost.
5. Hết hạn/hủy/đóng ngày release phần chưa consume idempotent. Đã nướng rồi bỏ/hết hạn không refund; làm lại cần hàng mới, thiếu hàng báo rõ. Không phá một lò, pause lease, tutorial độc lập, delivery sai món/confirmed delivery của Epic 2.

### 3.3 Sổ thu chi thật, hủy lô và đóng ngày một lần

1. Ledger ngày lưu snapshot bắt đầu, purchases, sales, rewards riêng (0 khi Epic 4 chưa có), consumed cost, expired cost, rent=20, wages=0, repairs=0, other=0, retained inventory quantity/value và cashEnd/profit; UI giải thích các số 0 đúng lý do.
2. Với mọi scenario, hai phương trình tiền/lợi nhuận ở phần luật đúng; cộng mua − consumed − expired bảo toàn giá trị kho qua ngày. Hủy lô dùng giá mua thực tế, không theo giá ngày mới, không trừ tiền mặt lần hai.
3. Đóng ngày release/end tất cả phiếu → snapshot/rewards hiện có → hủy lô expiry<=ngày → thuê → ledger → thiếu vốn/terminal; repeated close/settle/reopen hub không đổi tiền/kho/revenue/ratings. Không thực hiện Epic 4 rewards/save sớm.
4. Mua chuẩn bị ngày sau được book vào ngày sau, cash hiện tại giảm nhưng report đã chốt giữ nguyên cashEnd/lợi nhuận/purchases/lots snapshot. Profit tích lũy qua ngày nếu hiển thị lấy tổng profit đã chốt, không số placeholder.
5. Retained lots ngày mua+1 dùng được hết ngày đó và chỉ bị hủy khi chốt ngày đó; nấm dùng hết ngày mua. Report và kho thể hiện giá trị tồn thật, không trộn dòng tiền và chi phí. Đơn tặng tương lai có mục consumed giúp đỡ riêng, không hai lần hoặc tính doanh thu.
6. Sau day 3 hoặc thiếu vốn chỉ xem report, không mua/open day4/replay. Ngày sau mở bằng nút hiện có, cảnh báo trước mở nếu tiền thuê thiếu; closedDays RAM vẫn bảo vệ. Persistence/resume/revision commit test để Epic 4.

## Ranh giới UI cần giải quyết

Mốc market ngày 1 có bốn hàng nguyên liệu (143/214/285/356), hai nút recipe y=431, message y=487, footer y=545; hub Chợ có bốn hàng 231/299/367/435, hai nút recipe y=505, message y=556 và footer y=580. Không còn chỗ cho cặp giá +/- đạt 48 CSS px mà giữ nguyên layout. Thêm hàng giá hoặc chia nút recipe thành nút nhỏ sẽ là thay bố cục đã duyệt.

Quyết định root: thao tác trên nút món hiện có vẫn chọn món và mở detail overlay đặt giá; chạm thẻ số liệu hiện có mở detail cash bridge và giá trị tồn. Không thêm controls vào base surface, đóng overlay về đúng tab/tọa độ. Label hàng hiện có có thể thay dữ liệu thật/hạn/thuê trong vùng text hiện hành. Overlay mới vẫn phải đạt touch target, pause owned lease và không đè che thông tin cần quyết định. Đây là activation feature Epic 3 trên controls hiện có, không redesign; nếu implementation vượt phương án này và cần sửa base layout thì phải nêu xung đột trước khi sửa.

## Kiểm tra và hạn chế

- Unit tập trung owners: CozyStock, CozyOrder, CozyRuntime; sử dụng thời gian mô phỏng, snapshot trước/sau, idempotency và bảo toàn tiền/kho. Trường hợp quan trọng: mua mid-shift; lô ngày 1 vs 2; 3 reservations; expire while assembly/baking; repeated settle; report bất biến sau mua ngày 2.
- E2E tập trung market/pricing và existing day-end flow trên Chromium một viewport baseline, bảo đảm nút/text không overflow; không chạy full Chromium/WebKit nhiều viewport cho mỗi story.
- Giữ versions/dependencies hiện có, TypeScript thuần/domain không Phaser/DOM/storage, không thêm thư viện hoặc nâng stack. Không cần research framework mới cho luật kinh tế này.
- Không sửa menu gentle-wind, HUD 5 sốt/10 nguyên liệu, queue sáu ô/thực tế cap ba, bảng treo/năm tab/ba thẻ/bốn ô chuẩn bị hoặc footer xanh ngoài phạm vi đã quyết định.
- Khoảng trống Epic 4: XP/unlock xúc xích, rewards/mission/help scripting, lịch ba ngày chính thức, persistence/checkpoint và reload; báo rõ chưa hoàn thành, không làm story Epic 3 phình sang đó.
