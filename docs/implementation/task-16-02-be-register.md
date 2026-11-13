# T16.02-BE — API đăng ký (#87)

Nhánh `feat/task-16-02-be-register` tạo từ `origin/main` tại `00a374fd`. Phạm vi là đăng ký email/password cho app mobile StudentMart, theo hợp đồng #83; tái sử dụng Account và AccountsService.

## Hành vi

- `POST /api/v1/auth/register`: whitelist email/password/displayName, normalize email, trim tên, đếm độ dài theo Unicode code point; mật khẩu không trim/normalize.
- Scrypt với salt ngẫu nhiên 16 byte, N=16384/r=8/p=1, key 64 byte; giữ format hash hiện có `scrypt$N$r$p$salt$hash`.
- Chỉ tạo MEMBER; input role, schoolVerification và các field ngoài hợp đồng bị từ chối. Không tự xác thực email trường.
- `201` trả AccountResponse không có credential/session, trường hồ sơ chưa khai báo null và schoolVerification UNVERIFIED.
- Lỗi `400/409/413/415/429/500/503` theo envelope chung; không lộ SQL, constraint, stack hoặc password. Có no-store và request ID do server tạo.
- Giới hạn 5 lần thử/15 phút/IP trước parse/hash; JSON tối đa 16 KiB. X-Forwarded-For không được tin mặc định. Bộ đếm memory giới hạn 10.000 IP, đầy trả 503; restart reset, nhiều replica cần store dùng chung.

## Database

Migration `1794564730669-EnforceNormalizedAccountEmail.ts` sinh bằng `scripts/add.ps1 EnforceNormalizedAccountEmail`, review cả up/down. Up chỉ thêm CHECK `email = lower(btrim(email))`; down chỉ bỏ CHECK này. Giữ unique constraint hiện có để xử lý tranh chấp ngay trong PostgreSQL. Không sửa migration cũ, không bật synchronize.

Trước apply, kiểm tra chỉ đọc trên `student-mart`: 0 email chưa normalize. Đã apply bằng `scripts/up.ps1` ngày 2026-11-13. `scripts/check.ps1`: connection OK, hai migration applied, không pending, schema khớp entity. Không ghi credentials hoặc dữ liệu tài khoản thật vào tài liệu.

## Kiểm tra

Chạy từ repository root, Node.js/PowerShell, pnpm; integration dùng DATABASE_URL của backend trỏ PostgreSQL `student-mart` đã migrate:

```powershell
pnpm --filter studentmart-backend typecheck
pnpm --filter studentmart-backend build
pnpm test
pnpm --filter studentmart-backend test:integration
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
```

Unit/contract kiểm tra validation, field injection, Unicode, no-store, request ID, lỗi nội bộ được lọc, rate limit/expiry, malformed JSON và body limit. Integration thực hiện HTTP qua NestJS/Fastify với PostgreSQL thật: hai request cùng email khác case/khoảng trắng cho đúng một 201 và một 409, chỉ lưu một Account, kiểm tra hash và mật khẩu có khoảng trắng, role MEMBER, từ chối role/verify injection, CHECK từ chối email chưa normalize. Response thành công được validate bằng OpenAPI schema.

Test service rollback transaction; test concurrent HTTP cleanup đúng email UUID `@example.invalid` do test tạo. Các test không tự migrate/reset database.

Kết quả ngày 2026-11-13: backend typecheck/build PASS; 54 contract test và 15 unit test PASS; 2 integration test PostgreSQL PASS. Database check PASS, không pending migration và không schema drift. Kiểm tra HTTP sử dụng Fastify injection trong cùng process; chưa kiểm tra mạng LAN/thiết bị mobile.

## Phần tiếp theo

Mobile đăng ký thuộc #88; chưa xác nhận tích hợp trên thiết bị hoặc đánh dấu task cha #86 Done. Đăng nhập, quản lý phiên, hồ sơ và xác thực email trường thuộc ticket riêng.
