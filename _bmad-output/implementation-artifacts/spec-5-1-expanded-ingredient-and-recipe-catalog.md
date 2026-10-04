---
title: '5.1 — Danh mục nguyên liệu và công thức mở rộng'
type: feature
created: '2026-10-04'
status: done
story_key: 5-1-expanded-ingredient-and-recipe-catalog
baseline_commit: NO_VCS
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
  - _bmad-output/planning-artifacts/pizza-gdd/proposal-market-ingredients-and-recipes.md
---

## Intent

Người dùng yêu cầu triển khai5.1, sau đó chỉ định bỏ demo3ngày và mở khóa pizza bằng tiền mua công thức. Không giữ phương án chỉ catalog/khóa trong demo ở bản trước. Chợ/Kho hiện có19nguyên liệu và icon trong suốt, nhưng metadata tách giữa demo.ts/kitchenEconomy.ts và công thức runtime chỉ có3món. Chuẩn hóa catalog và nối mua công thức vào ngày chuẩn bị; tiếp tục ngày4trở đi, không tự kết thúc thành công ở ngày3. Tồn và hạn của lô tiếp tục thuộc phiên, không thuộc catalog tĩnh.

## Lịch sử lựa chọn trước khi người dùng giao toàn Epic 5

1. Định lượng: đề xuất đơn vị phần, mỗi thành phần1phần (đế1), giữ giá/hạn hiện có làm cấu hình tạm; hoặc nhận bảng riêng. Tài liệu cũ cấm tự mặc định một phần, nên chưa được dùng đề xuất như giá trị đã duyệt.
2. Người dùng đã chốt cơ chế: mua công thức bằng tiền để mở, không cần ngày/cấp mở khóa và không kết thúc ở ngày3. Giá mua/giá bán/định lượng chưa chốt; đang hỏi xác nhận bảng tạm: mua Xúc xích150/Pepperoni200/Rau củ200/Gà BBQ250/Hải sản300/Giăm bông dứa250; bán lần lượt75/85/80/90/100/95xu. Phô mai/Nấm giữ mở sẵn là phương án đề xuất giữ phiên hiện có, chưa coi người dùng đã chốt toàn bộ bảng.

## Quyết định thay đổi phạm vi — 2026-10-04

- Mua công thức thuộc tab Quán/Menu & giá, trong chuẩn bị: xác nhận → trừ tiền một lần → sở hữu/mở món; có rồi không mua lại, thiếu tiền không thay state. Recipe ownership phải lưu cùng tiền theo giao dịch atomic, không lưu giữa ca.
- Bỏ kết thúc demo ở ngày3 trong runtime/presentation/checkpoint. Không đổi save cũ bằng reset; công thức đã mở của người chơi phải được bảo toàn khi chuyển cơ chế, không bắt mua lại. Save terminal ngày3 cần chuyển sang trạng thái chuẩn bị ngày4 hợp lệ theo migration được kiểm tra.
- Giới hạn ngày3 nằm cả stock snapshot, giá theo ngày, progression, lịch khách, checkpoint validation và UI. Phải mở rộng đồng bộ; không chỉ xóa điều kiện ending hoặc để ngày4 ra NaN.
- Lịch/giá/ngày sau3 sẽ dùng quy tắc nối tiếp được ghi rõ trong spec triển khai, không tự tuyên bố đã có30ngày nội dung. Phạm vi mới không bao gồm nhân viên/trang trí/giao hàng.
- Các câu hỏi ở trên là lịch sử trước yêu cầu “làm xong epic 5 luôn”. Phạm vi thực thi bên dưới dùng cấu hình tạm được ghi rõ, không phải bảng cân bằng đã playtest.

## Code Map

- src/domain/demo.ts: năm nguyên liệu gốc, ba công thức/giá đang dùng, prototype riêng cũng đọc dữ liệu này.
- src/config/kitchenEconomy.ts:14nguyên liệu bổ sung với giá tạm; quy tắc hỏa tốc/nâng cấp giữ nguyên.
- src/domain/CozyStock.ts:19IDs, giá theo ngày, hạn theo loại/lô, giữ/tiêu hao và checkpoint validation.
- src/presentation/MarketIngredientArt.ts: atlas trong suốt19icon và thứ tự crop.
- src/presentation/ReferenceMarket.ts, ReferenceStock.ts: mua/kho đã hoạt động; chỉ nối metadata, giữ layout.
- src/domain/CozyProgression.ts, CozyCheckpoint.ts: giới hạn3món, mở xúc xích sau60XP từ ngày sau, save cũ. Catalog mới không tự mở rộng giới hạn này.
- src/presentation/StockPlanning.ts: dùng công thức runtime; không tự bật5.2fullmenu hoặc dự báo khách.

## Tasks đã triển khai theo phạm vi toàn Epic 5

- [x] src/config/ingredientCatalog.ts: nguồn metadata 19 IDs, group/unit/basePrice/expiryOffset/icon; giữ giá/hạn/lô hiện có.
- [x] src/config/recipeCatalog.ts: tám món đúng proposal, định lượng cấu hình tạm; kem trắng/pesto/cay không tự thuộc tám món.
- [x] CozyStock.ts và presentation đọc catalog chung; giữ API/ID/FEFO và tương thích lô đã lưu.
- [x] Mua/mở sáu công thức, giữ hai món đầu và quyền mở cũ; mapping đủ tám ô bếp.
- [x] Unit catalog, compatibility và migration save v1 thật; build và E2E tập trung Chợ/Kho/ca.

## Acceptance

- Given catalog nguyên liệu, when Chợ/Kho đọc, then có19mục đúng icon/ID và dữ liệu thật, không reset tồn/tiền.
- Given catalog công thức, when đọc tám món, then thành phần đúng proposal và định lượng đúng quyết định, không âm thầm mở khóa món.
- Given checkpoint cũ, when restore, then tiền/lô/đơn vị/giá vốn/hạn đã lưu vẫn hợp lệ.
- Given mua/giữ/tiêu hao/hoàn ngày, then luật giao dịch một lần, FEFO và ngày hết hạn vẫn đúng.
- Given UI đã duyệt, then bố cục các tab/bếp/menu không đổi bởi việc chuẩn hóa dữ liệu.

## Trạng thái khảo sát

Người dùng yêu cầu tiếp “làm xong epic5luôn”, giao triển khai toàn bộ5.1/5.2 theo cơ chế mua công thức. Dùng bảng giá/định lượng đề xuất làm cấu hình provisional có ghi chú cân bằng, không mô tả là giá đã playtest. Đây thay checkpoint hỏi bảng riêng ở lượt trước. Phô mai/Nấm mở sẵn; các món đã mở ở save cũ được bảo toàn. Không tự bật trang trí/nhân viên/giao hàng hoặc tạo30ngày cốt truyện.

## Phạm vi thực thi toàn Epic5 (story5.1/5.2)

- Tám recipes: cheese50/mushroom65/sausage75/pepperoni85/vegetable80/chicken-bbq90/seafood100/ham-pineapple95 giá bán gốc; sáu recipe mua theo giá đề xuất150/200/200/250/300/250. Mỗi ingredient1phần, dough1. Giữ toàn bộ giá/hạn19ingredient hiện có.
- Công thức sở hữu mở ngay trong chuẩn bị; không dựa XP/ngày. Không sửa đơn đã nhận, không mua trong ca. atomic save tiền+recipe, retry/double-tap không thu hai lần.
- Bỏ terminalcomplete ở3; từday4 dùng ca240s/grace120s và10slot theo nhịp ngày3, không lặp help/thưởng truyện. Giá mua lặp chu kỳ1/1.1/.9 theo ngày; goalday4+ dùng mẫu3đơn/4sao với claimduy nhất mỗi ngày. Giữ phá sản hiện có. Đây cấu hình tiếp nối tạm, không full30daystory.
- Migration đọc savev1 cũ/checksum trước khi chuyển, bảo toàn tiền/lô/XP/menu/recipe đã mở; terminalcomplete ngày3 có thể tiếp ngày4. Không ghi đè lỗi/corrupt/insolvent. NativeIndexedDB giữ pipeline/revision hiện có.
- Tab Quán/Menu hiển thị đủ8món, owned/edit hoặc locked/buy với số tiền thiếu. Scroll/page để360×640 vừa, giữ header/footer/theme và vùng các màn khác.
- Gợi ý5.2: đầy đủ menu đang bán đã sở hữu, nhập0–100phần từng món; cộng chung rồi trừ available một lần, không trừ hàng expired/reserved. Scroll/page8món và19nguyên liệu, readonly và điChợ tự mua.
- Đảm bảo mọi khách/scheduler chỉ gọi recipeđã sở hữu/đangbán; kitchen8ô/art đã có giữbounds và đọc đúng công thức khi mở.

## Phần kinh tế dài hạn của Epic5

Yêu cầu hoàn tất Epic5 cũng gồm ba bullet lịch sử của E05. Cấu hình tiếp nối tạm: nhà cung cấp quen mở sau500xu mua thường tích lũy, hiệu lực từ ngày sau, giảm10%giá mua thường (làm tròn xu nguyên); hỏa tốc không cộng điều kiện hoặc nhận ưu đãi. Giá vốn/hạn lô đã nhận không tính lại. Metadata/trạng thái nhà cung cấp đi cùng save, không dùng ảnh làm luật.

Day4+ firstslotkháchquen khi regularLatestStars>=4 hoặc helpSucceeded; giữ phản ứng giá và tính sao từ tốc độ/chất lượng hiện có. Một referral mỗi ngày khi reputation>=55, không vượt sức chứa hàng chờ, không replaythưởng truyện ngày2/3. Theo dõi tồn/lợi nhuận/quyền sở hữu qua nhiều ngày bằng báo cáo và checkpoint thật. Không có phần nhân viên/giao hàng/đồ trang trí trong phạm vi này. Đây cấu hình tạm cần playtest, không tuyên bố nội dungcốttruyện30ngày.

Kiểm tra thêm ordinary-vs-express/suppliernextday/discountrounding/legacyunitcost, quan hệ/referralday4+/cap/repeatclaim và phục hồi tiếp ngày sau một ngày lỗ còn đủ vốn.

## Acceptance bổ sung

- Buy/cancel/insufficient/saveerror/retry/doubletap cho recipe không sai tiền/sở hữu; reload có recipe đã mua, savev1oldkhông mấtdata.
- Day3→4→5 có giá/hạn/schedule/goal hợp lệ, không endingcomplete/NaN; ngàyđãchốt không replay, insolvency vẫnđúng.
- Full8forecast/sharedingredients0targets/expired/reserved đủtests; 360×640menu/planner không tràn.
- Build + unitcore/migration + E2E tập trung mua/mởrecipe/forecasts/day4/reload đạt trướcđánhdấu5.1/5.2done. Epic5 nhàcungcấp/kháchdài hạn phải cótest/status thật trướckhiđánhdấuEpicdone, không giả nhận đã có nghiệp vụ ấy.

## Kết quả triển khai và review — 2026-10-04

- Story 5.1/5.2 và phần supplier/khách dài hạn đã triển khai theo cấu hình tạm bên trên. Giá cân bằng và nhịp sau ngày 3 cần playtest; không chứng nhận đủ cốt truyện 30 ngày.
- Save schema 2; kiểm tra checksum v1 trước migration, giữ campaign/revision/CAS. Fixture v1 tạo từ runtime gốc gồm phiên đầu, kết thúc ngày 3 và quyền Xúc xích đã mở bằng bốn đơn thật. Native IndexedDB kiểm tra ngày 3 → 4 → chốt → 5 → reload giữ tiền/campaign.
- Mua công thức dùng pipeline atomic hiện có; lỗi `put` đồng bộ trong callback được bắt, abort và cho thử lại. Bếp đọc recipe catalog, tránh key cũ BBQ/Ham làm lỗi boot. Giá nhà cung cấp ở dòng Chợ/modal/phép mua cùng đọc `runtime.price`.
- Review độc lập phát hiện lịch sử lặp cumulative progression gây tăng dữ liệu bậc hai: đã lưu master một lần và prefix ở báo cáo, giữ API lịch sử đọc lại. Test gameplay 200 ngày kiểm tra tăng tuyến tính, reload ngày 201 và chống sửa dữ liệu. Review tiếp phát hiện full-history input có thể được nhận rồi compact thành dữ liệu sai; đã kiểm tra unlock/outcomes/claims/goals của cả hai dạng trước normalization, test từ fixture thật và reviewer xác nhận sửa hết.
- Hai reviewer độc lập (blind/edge), cùng lượt acceptance audit bổ sung và kiểm tra acceptance của agent chính. Không tuyên bố ba reviewer độc lập; hạn mức thread không cho tạo reviewer thứ ba. Không VCS trong workspace nên không có commit/diff Git.
- Build TypeScript/Vite đạt; 12 file/75 unit tests đạt. 18 E2E tập trung Chromium 360×640 đạt, gồm Chợ → Kho → mở ca → dùng → cuối ngày → mua ngày sau, pause/hỏa tốc, tab/header/menu/planner và save cũ. Bốn E2E Epic 5 được chạy lại trên build cuối sau vá lịch sử. Không chạy full browser matrix hoặc thay kết quả human playtest.

## Suggested Review Order

**Sở hữu và lưu phiên**

- Mua công thức trong chuẩn bị, giữ tính một lần của giao dịch.
  [CozyRuntime.ts:43](../../src/runtime/CozyRuntime.ts#L43)
- Xác thực, chuyển save cũ và compact lịch sử trước restore.
  [CozyCheckpoint.ts:34](../../src/domain/CozyCheckpoint.ts#L34)
- Pipeline lưu atomic và thử lại khi ghi thất bại.
  [CozyCampaignSession.ts:1](../../src/runtime/CozyCampaignSession.ts#L1)

**Kinh tế và giao diện**

- Dùng cùng catalog công thức cho menu, bếp và nhu cầu kho.
  [recipeCatalog.ts:1](../../src/config/recipeCatalog.ts#L1)
- Giữ giá lô cũ, FEFO và ưu đãi mua thường từ ngày sau.
  [CozyStock.ts:1](../../src/domain/CozyStock.ts#L1)
- Phân trang menu và gợi ý, giữ theme/header/footer.
  [ReferenceShop.ts:1](../../src/presentation/ReferenceShop.ts#L1)
  [StockPlannerPanel.ts:1](../../src/presentation/StockPlannerPanel.ts#L1)

**Bằng chứng kiểm tra**

- Kiểm tra dài hạn, save tuyến tính và dữ liệu lịch sử sai.
  [CozyHistory.test.ts:1](../../src/runtime/CozyHistory.test.ts#L1)
- Mua/cancel/lỗi lưu/reload, forecast tám món và giá supplier.
  [epic5-ui.spec.ts:1](../../tests/epic5-ui.spec.ts#L1)
- Restore v1 thật rồi chốt/reload ngày 5 cùng campaign.
  [epic5-legacy-restore.spec.ts:1](../../tests/epic5-legacy-restore.spec.ts#L1)
