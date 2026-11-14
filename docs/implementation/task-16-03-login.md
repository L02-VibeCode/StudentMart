# TASK-16.03 — Đăng nhập (#89, #90, #91)

Nhánh `feat/task-16-03-login` tạo từ `origin/main` tại `00a374fd`, ngày 2026-11-14. Main chưa có các commit của TASK-16.02 nên nhánh này đưa nguyên các commit đăng ký/Swagger/Expo LAN đã làm vào làm tiền đề; main không bị sửa hoặc merge tự động. PR sẽ nêu rõ phần dependency để người dùng review trước khi quyết định merge.

## Tiêu chí và bằng chứng

| Tiêu chí của task/ticket | Implementation và kiểm tra | Kết quả |
|---|---|---|
| Email/password đúng truy cập đúng tài khoản | POST login tạo phiên; mobile chỉ công bố authenticated sau SecureStore và GET me khớp accountId | PASS tự động qua HTTP + PostgreSQL |
| Sai thông tin không tạo phiên | Scrypt async + dummy hash cho email không tồn tại; thông báo INVALID_CREDENTIALS thống nhất; kiểm tra số session không tăng | PASS |
| Cơ chế phiên theo 16.01 | Token crypto 32 byte/base64url 43 ký tự, chỉ SHA256 digest ở DB, hết hạn tuyệt đối 30 ngày, revokedAt | PASS |
| Không log password/token | DTO whitelist, no-store, error envelope an toàn; test spy console với token/password test; snapshot và màn hình không chứa token | PASS tự động |
| Loading, tránh submit song song | Model guard đồng bộ, disable input/nút, một request đang xử lý; concurrent test chỉ một login/session | PASS |
| Chưa verify trường vẫn đăng nhập | Không chặn theo domain/verification; response derive UNVERIFIED khi chưa có TASK-18 | PASS |
| Tài khoản bị hạn chế | Account.login_disabled_at nullable, nội bộ server, được kiểm tra ở login/me; không nhận từ input hoặc xuất DTO | PASS |
| API danh tính chỉ lấy từ phiên server | GET me dùng Authorization → digest → AuthSession → Account; accountId query không chọn được người khác | PASS |
| Hết hạn/thu hồi | 401 SESSION_EXPIRED/UNAUTHENTICATED; logout idempotent phục vụ cleanup; test expire/revoke/malformed bearer | PASS |
| Giới hạn thử theo contract | Hai bucket IP + HMAC email normalize, tối đa 5 thất bại/15 phút, reserve cho request đồng thời, Retry-After | PASS; bộ đếm memory một process |
| Lưu phiên mobile đúng cơ chế | Expo SecureStore ~58.0.3, record versioned chỉ token/expiresAt/accountId, không AsyncStorage/password/profile | Adapter/định dạng PASS; native keystore cần test trên thiết bị |
| SecureStore lỗi không tạo auth giả | Write lỗi → best-effort revoke + clear; clear/read lỗi → khóa private UI; không log native error/record | PASS qua adapter giả lập |
| Danh tính Cá nhân khớp phiên | Màn hình chỉ nhận PrivateAccount từ me, key theo account ID; test A → B không còn A | PASS state/API; cần nghiệm thu thao tác UI native |
| Lỗi mạng, 401, 403, 429 | Lỗi mạng/5xx giữ form hoặc credential để xác nhận; 401 dọn phiên, 403 không tự cấp quyền; cooldown Retry-After, không retry POST tự động | PASS |
| Tránh response/ghi phiên cũ ghi đè B | Epoch + hàng đợi ghi SecureStore + xóa private state trước đổi tài khoản; regression race write/logout và response A về muộn | PASS |
| Chưa xác nhận revoke phải báo đúng | Chính xác 204 mới xác nhận; giữ cờ chưa xác nhận thu hồi qua lần thử xóa local lỗi; không lưu token cũ vào retry queue trên disk | PASS regression |
| Review/reuse PR #81 | Xem phần đối chiếu bên dưới | Đã review; không tái sử dụng auth persistence không phù hợp |
| API docs khớp code | Swagger discover route thực, dùng OpenAPI; login/me/error HTTP response validate bằng Ajv/formats | PASS |

## Database và backend

Migration `1794622765393-AddAuthSessions.ts` sinh từ entity bằng `scripts/add.ps1 AddAuthSessions`. Up tạo AuthSession (UUID, FK Account RESTRICT, unique token_hash, CHECK expiry/revocation, index account/expiry) và thêm Account.login_disabled_at nullable. Không sửa migration đã apply, không tạo bảng User cạnh tranh, không seed user/password và không thay dữ liệu tài khoản cũ. Down xóa phần mới, chỉ review, không chạy revert.

Đã apply bằng `scripts/up.ps1` vào `student-mart`. Database check xác nhận 3 migration đã apply, không pending và schema khớp entity. `synchronize: false`, `migrationsRun: false` giữ nguyên.

AUTH_RATE_LIMIT_SECRET được cấu hình ở backend env, không đưa lên mobile hoặc log. Account.login_disabled_at là nguồn restriction tối thiểu do server/vận hành quản lý; UI quản trị thuộc task moderation sau. Bộ đếm failure/reservation nằm trong process và giới hạn memory; restart reset. Cần store chung trước khi scale nhiều replica. Không coi restriction là xác thực email trường.

Các endpoint có trong thay đổi: POST `/api/v1/auth/login`, GET `/api/v1/accounts/me`, POST `/api/v1/auth/logout`. Logout tối thiểu là thao tác bù khi SecureStore ghi lỗi và phục vụ đổi tài khoản; chưa tuyên bố hoàn tất toàn bộ TASK-16.05 về logout/chat/push/private cache của tính năng chưa có.

## Review PR #81

PR #81 hiện CLOSED, nhánh nguồn không còn. Đã đọc diff/file `mobile/src/features/auth/authStore.ts` và App.tsx qua GitHub. Phần cũ dùng database user local trong AsyncStorage, lưu password thô, tạo token từ email/thời gian, register cấp phiên và hiển thị token trên UI. Các hành vi đó trái hợp đồng opaque server session và SecureStore hiện tại nên không cherry-pick/merge code đó.

Ý tưởng phân vùng dữ liệu theo tài khoản được giữ ở mức nguyên tắc: identity server, account ID, epoch, reset private state/navigation khi đổi người dùng. Không thêm ghi chú/demo profile hoặc nguồn user local vào sản phẩm. Không coi trạng thái PR cũ là bằng chứng nghiệm thu.

## Kiểm tra và giới hạn

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm --filter studentmart-backend build
pnpm --filter studentmart-backend test:integration
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
pnpm --filter studentmart-mobile exec expo install --check
pnpm --filter studentmart-mobile exec expo export --platform all --output-dir dist
# Từ mobile/:
pnpm dlx expo-doctor@latest
```

Integration `backend/tests/integration/mobile-login.test.ts` chạy LoginModel/AuthCoordinator/AuthApi mobile qua HTTP thật tới NestJS/PostgreSQL, tạo hai email UUID `@example.invalid` rồi xóa đúng Account/AuthSession test. Bao phủ login đúng/sai, submit lặp, me bỏ qua accountId injection, đọc record versioned, đổi tài khoản, khôi phục qua me và session bị revoke. Native SecureStore được thay bằng adapter memory trong integration; test không tự migrate/reset DB.

Đã export Android/iOS và Expo Doctor 20/20. Đây là bằng chứng bundle/dependency, không thay thế test native. Chưa có xác nhận trực tiếp thao tác đăng nhập, đọc/ghi/xóa SecureStore hoặc keyboard/safe area trên điện thoại trong thay đổi này; xác nhận đăng ký trước đó không được dùng thay cho bằng chứng login mới.

Kết quả cuối ngày 2026-11-14: frozen-lockfile install PASS; typecheck FE/BE và backend build PASS; 54 contract + 20 unit BE + 38 unit FE = 112 test PASS; 7 integration PostgreSQL PASS; database check không pending/schema drift. Smoke test bản build kết nối PostgreSQL trả 200 cho Swagger UI/JSON, có đúng 5 route health/register/login/logout/me, và me không có bearer trả 401. Không để server smoke test chạy lại sau khi kiểm tra.

Checklist review trên thiết bị:

- [ ] Đăng nhập tài khoản đã đăng ký, Cá nhân hiển thị đúng email/tên, chưa verify vẫn dùng được.
- [ ] Sai mật khẩu/email không tồn tại có cùng lỗi, không vào Cá nhân.
- [ ] Bấm nhanh nhiều lần, mất mạng, cooldown rate-limit và giữ form hoạt động đúng.
- [ ] Đóng/mở app xác minh lại với me; không mở private UI khi offline chưa xác minh.
- [ ] Đổi A → B; Back/response cũ không mở danh tính A; thử lỗi đọc/ghi/xóa SecureStore trên native khi có môi trường phù hợp.
- [ ] Bố cục màn hình nhỏ, safe area, bàn phím, font scaling và toggle password.

Quy tắc hoàn thành: code/kiểm thử tự động và PR được cung cấp để review; không đánh dấu issue Done chỉ vì đã tạo source/PR, không tự merge. Chờ người dùng kiểm tra, review và approve PR; agent không merge main.
