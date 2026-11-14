# TASK-16.05 — Đăng xuất và xóa trạng thái riêng (#95/#96/#97)

Ngày 2026-11-14, nhánh `feat/95-logout-isolation` tạo từ origin/main sau khi PR #117 đã merge. Phân công: backend-dev #96 dùng typeorm-migrations; frontend-dev #97 dùng frontend-design; QA kiểm tra nguồn, integration và ma trận nghiệm thu. Không coi PR cũ/issue đóng là bằng chứng runtime đã đạt.

## Đối chiếu AC và quy tắc hoàn thành

| Tiêu chí | Implementation/bằng chứng | Trạng thái |
|---|---|---|
| Xác nhận đăng xuất trước khi thực hiện | Màn hình Cá nhân có thao tác đăng xuất, xác nhận; hủy không phát logout | Source/UI và unit; cần thao tác native |
| Kết thúc đúng phiên hiện tại, gọi lặp an toàn | Token hash → server session; revoke durable trước external cleanup; valid-format unknown/revoked/expired được xử lý idempotent theo contract | Backend HTTP/PostgreSQL |
| Credential cũ không gọi API riêng | me/global guard trả401 với session đã revoke | Backend và cross-stack HTTP/PostgreSQL |
| Guest sau local cleanup, kể cả backend offline | endSession không chờ network revoke timeout; clear record/private state, account=null; thông báo chưa xác nhận server revoke khi còn pending/lỗi | Unit + cross-stack deferred/offline |
| Xóa cache/bản nháp/message riêng, không xóa public data | AccountLogoutResources nhận account ID từ phiên, clearPrivate/disconnectRealtime/releasePush theo scope; không global clear | Adapter fixture PASS; domain thật chưa có |
| Không xóa dữ liệu server/tài khoản khác | Kiểm tra Account fixture không đổi; phiên thứ hai của A và phiên B vẫn gọi me thành công; chỉ token gửi logout bị revoke | Real PostgreSQL/HTTP PASS |
| Back không mở lại private A | Reset navigation/intent/readiness; private render vẫn kiểm tra auth và epoch, không dùng state A sau endSession | Source/model; Back native cần xác nhận |
| B không nhìn thấy A, response/ghi phiên A trễ không ảnh hưởng B | Epoch + account-scoped cleanup + serialized storage writes; cross-stack B nhận đúng me và record; late revoke failure không ghi message/state B | Unit + cross-stack PASS |
| SecureStore/local cleanup lỗi | Không báo xóa bền vững thành công; khóa private UI và giữ đủ scope để thử lại | Unit adapter; native failure cần xác nhận |
| Hook TASK-19 push/realtime | Backend hook onSessionRevoked nhận sessionId/accountId do server suy ra; local registry theo account, không token; adapter phải idempotent | Contract/hook tests; chưa có push/chat provider thật |
| Không log token/password hoặc raw provider error | Error an toàn; snapshot/UI/cleanup scope không chứa token; fixtures không ghi credentials thật vào tài liệu | Source/tests |
| Review PR #81 | Đối chiếu review #89: PR #81 đã CLOSED, AsyncStorage/password thô/fake client token không phù hợp; không tái sử dụng persistence đó | Đã review |

Quy tắc Done: source/PR, các kiểm thử tự động và hook đã được cung cấp; **không tự đánh Done hoặc merge**. Chưa có xác nhận thao tác native cho task logout, chưa có chat/push binding thật để kiểm tra end-to-end nhà cung cấp. Các phần đó phải được ghi là pending khi người dùng review.

## Những thay đổi chính

- Backend `auth.service.ts`: lookup session theo digest, revoke trước khi chạy hooks; failure của adapter không hồi sinh token, trả lỗi an toàn và cho lần logout lặp thử cleanup lại. Scope hook chỉ sessionId/accountId, không nhận device/account do client tự khai.
- `logout-cleanup.ts`: điểm tích hợp cho TASK-19/chat; các consumer sau này chỉ tháo resource thuộc phiên và phải idempotent. Chưa tạo bảng/binding/provider giả.
- Mobile registry `account-logout-resources.ts`: đăng ký cleanup dữ liệu riêng, disconnect realtime và tháo local push theo account. Cache public nằm ngoài registry. Bộ nhớ/adapter trong test là bằng chứng boundary, không phải đã có sản phẩm chat/draft/push hoàn chỉnh.
- Coordinator: chặn private access, abort request và dọn local trước, không đợi server; late response không được thay danh tính mới. Token cũ không được ghi thành retry queue plaintext. Navigation reset không thực thi intent cũ sau logout.

## Hạn chế offline và lỗi cleanup

Local logout thành công không chứng minh server đã revoke nếu request không tới được server. Phiên cũ có thể còn hạn tới khi được revoke/hết hạn; app hiển thị giới hạn đó, không tự retry mutation hoặc cất token cũ vào queue bền vững. Nếu storage/cleanup lỗi, UI chặn quyền riêng và cho thử lại; không được nói toàn bộ dữ liệu đã xóa.

Backend external-hook failure xảy ra sau durable revoke nên token vẫn bị chặn dù response503. Adapter cần xử lý retry idempotent; provider thật sẽ được tích hợp ở TASK-19/chat. Không tự xóa Account, listing, conversation hoặc dữ liệu người dùng trên server.

## Bằng chứng kiểm thử

`backend/tests/integration/mobile-logout.test.ts` chạy client AuthApi/AuthCoordinator/CredentialStore qua HTTP thật tới NestJS/PostgreSQL:

- Tạo hai Account UUID `@example.invalid`, đăng nhập A, tạo thêm phiên A và phiên B.
- Local registry xóa riêng cache fixture A và gọi realtime/push fixture A; cache B/public giữ nguyên.
- Logout A → local guest/record trống; đợi server hook rồi chứng minh bearer cũ401, logout lặp an toàn, các phiên còn lại vẫn hợp lệ và Account rows không đổi.
- Đăng nhập B → đúng danh tính/record, không có email A trong private snapshot.
- Mô phỏng revoke không thể tới server: endSession vẫn hoàn tất local, server bearer A còn hợp lệ đúng giới hạn đã báo; sau login B, failure trễ của revoke A không thay B.

Đã chạy focused integration: **2 test PASS** trên PostgreSQL cấu hình hiện tại. Test tự cleanup đúng Account/AuthSession fixture; không reset/truncate DB, không tự migrate. SecureStore và private cache/chat/push dùng adapter memory, không phải native keystore/provider thật.

Lệnh từ root:

```powershell
pnpm typecheck
pnpm test
pnpm --filter studentmart-backend test:integration
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
pnpm --filter studentmart-mobile exec expo export --platform all --output-dir dist
```

Schema: task sử dụng Account/AuthSession hiện có. Không tạo migration rỗng; backend agent đối chiếu options/entity và database check theo skill. Kết quả đầy đủ CI/check cuối được root ghi vào PR/Project sau khi các commit ghép xong.

## Checklist thiết bị và tích hợp còn pending

- [ ] Confirm/hủy logout, Back Android và gesture iOS không mở lại private A.
- [ ] Đóng/mở app sau logout online/offline; thử native SecureStore read/delete failure ở môi trường phù hợp.
- [ ] A → B với module private cache/draft/message thật khi các module đó được triển khai.
- [ ] Disconnect chat thật và tháo push binding/provider/device thật ở TASK-19; mock/export không chứng minh push đã dừng.

Những phần chưa có nguồn/provider không được thay bằng demo để đánh dấu đạt. PR chờ người dùng review/approve, không bật auto-merge.

## Final automated verification

- `pnpm typecheck`: PASS (backend/mobile).
- `pnpm test`: PASS, 54 contract + 20 backend unit + 63 mobile unit = 137 tests.
- Backend HTTP/PostgreSQL integration: PASS, 16 tests across 9 files.
- Backend build and database schema check: PASS, 3 applied migrations, none pending; no schema change for this task.
- Expo dependency check and Android/iOS export: PASS.
- Skill validator: PASS for ticket-delivery, frontend-design and typeorm-migrations.

These automated checks do not replace the native/provider checklist above. GitHub Actions results are linked from the PR.
