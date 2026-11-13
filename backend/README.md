# StudentMart Backend

**Kiến trúc:** một backend Node.js chia module, mỗi module dùng Three-Layer: Controller → Service → Repository.

Backend TypeScript đã khởi tạo bằng NestJS 11 với Fastify adapter. Đọc [solution_tree.md](../docs/solution_tree.md), [schema.md](../docs/schema.md) và [hướng dẫn agent](../stephen-skills/AGENTS.md).

## Chạy cục bộ

Yêu cầu Node.js 22.12+ và pnpm 10.34.3. Trong `backend/`:

```sh
pnpm install --frozen-lockfile
pnpm run db:init
pnpm run start:dev
pnpm run typecheck
pnpm test
pnpm run build
pnpm start
```

Copy `.env.example` thành `.env` nếu muốn thay đổi cấu hình. Mặc định API lắng nghe `0.0.0.0:3000` để điện thoại cùng mạng LAN truy cập được. `GET /health` trả về `{"status":"ok"}`. `CORS_ORIGINS` là danh sách origin cách nhau bằng dấu phẩy cho browser client; ứng dụng native không bị browser CORS giới hạn.

`DATABASE_URL` được đọc từ `backend/.env` khi khởi động và được kiểm tra trong `loadConfig()`. Tên database là `student-mart`; định dạng: `postgresql://USER:PASSWORD@HOST:5432/student-mart`. Các ký tự đặc biệt trong username/password cần URL-encode. Biến môi trường của process được ưu tiên hơn file `.env`. File `.env` và file nguồn credentials cục bộ `env-varibale.md` được Git ignore; `.env.example` chỉ chứa giá trị mẫu. Khi chạy backend, `DATABASE_URL` là bắt buộc và NestJS mở connection pool qua TypeORM.

`src/app.module.ts` đăng ký module/controller NestJS; `src/bootstrap/app.ts` tạo app và `src/bootstrap/server.ts` nạp env rồi mở cổng. Nest CLI build vào `dist/`; `pnpm start` chạy `dist/bootstrap/server.js`. Unit test kiểm tra HTTP bằng Fastify injection và tắt kết nối database một cách tường minh. API đăng ký đã triển khai; đăng nhập và phiên thuộc ticket tiếp theo.

## API đăng ký — #87

`POST /api/v1/auth/register` nhận JSON chỉ gồm `email`, `password`, `displayName`; xem [OpenAPI](../docs/contracts/accounts.openapi.yaml). Email được trim/lowercase, tên được trim, mật khẩu giữ nguyên. Giới hạn lần lượt là 254, 8–128 và 1–100 Unicode code point. Field ngoài whitelist (kể cả role/verify) trả `400 VALIDATION_ERROR`.

Thành công trả `201 {account: ...}`, role `MEMBER`, trạng thái trường `UNVERIFIED`, các field hồ sơ chưa khai báo là `null`; không cấp phiên. DTO liệt kê rõ từng field và không chứa password/hash. Email trùng sau normalize trả `409 EMAIL_ALREADY_EXISTS`, kể cả hai request đồng thời. PostgreSQL enforce cả unique và CHECK email đã normalize.

Response dùng `Cache-Control: no-store`, `X-Request-Id` do server tạo; lỗi có envelope `{error:{code,message,fields?,requestId}}` và không trả lỗi SQL/stack/input. Request JSON tối đa 16 KiB (`413` nếu vượt); content type không hỗ trợ trả `415`. Giới hạn đăng ký là 5 lần thử/15 phút/IP, tính cả request sai, vượt trả `429` cùng `Retry-After`. Bộ đếm hiện nằm trong memory của một process, tối đa 10.000 IP đang lưu; đầy trả `503`. Restart sẽ reset bộ đếm; cần store dùng chung trước khi chạy nhiều replica. Không bật trust proxy nên `X-Forwarded-For` không thay đổi IP được tính; khi thêm reverse proxy cần cấu hình trust theo hạ tầng thực tế.

Xem [bằng chứng triển khai và kiểm tra #87](../docs/implementation/task-16-02-be-register.md).

## Account và migration code first

TypeORM quản lý entity `src/modules/accounts/business/account.entity.ts`, ánh xạ tới bảng PostgreSQL `"Account"` (phải giữ dấu nháy kép trong SQL do tên có chữ hoa). Các cột: UUID `id`, email duy nhất, `password_hash`, `display_name`, role `MEMBER`/`ADMIN`, `created_at`, `updated_at`.

`AccountsService.create()` kiểm tra dữ liệu, trim/lowercase email, trim tên hiển thị và hash mật khẩu bằng scrypt với salt ngẫu nhiên. Tài khoản mới luôn là MEMBER; hàm trả về không chứa hash. TypeORM cũng không select hash mặc định. Đọc dữ liệu để trả API vẫn cần DTO cho phép rõ các trường công khai. Không seed tài khoản/admin hoặc mật khẩu mặc định.

`synchronize: false` và `migrationsRun: false`: ứng dụng không tự sửa schema khi khởi động. Entity là nguồn để sinh migration; SQL trong migration được review rồi mới apply. Lệnh dưới đây chạy từ `backend/`:

```sh
pnpm run db:create       # Tạo student-mart nếu chưa tồn tại; giữ nguyên database đã có
pnpm run migration:show
pnpm run migration:run
pnpm run db:init         # db:create rồi migration:run; dùng cho lần khởi tạo đầu
pnpm run test:integration
```

Sau khi sửa entity, chạy `pnpm run migration:generate src/shared/database/migrations/TenThayDoi`, kiểm tra SQL đã sinh rồi chạy `pnpm run migration:run`. Các lệnh CLI tự build trước khi đọc DataSource đã compile. Lệnh `pnpm run migration:revert` hoàn tác migration cuối; hoàn tác migration Account sẽ xóa bảng và dữ liệu trong bảng đó.

Migration nằm ở `src/shared/database/migrations/`; lịch sử nằm trong bảng `typeorm_migrations`. Yêu cầu PostgreSQL 13+ cho `gen_random_uuid()`. Lệnh tạo database dùng database bảo trì `postgres`, cần quyền CREATEDB nếu `student-mart` chưa tồn tại. Khi database đã được cấp sẵn, chỉ cần `migration:run` và quyền DDL trong schema `public`.

Integration test yêu cầu database đã migrate, kiểm tra lưu Account, UUID/timestamps, email unique, ẩn hash và schema khớp entity. Test service dùng transaction/rollback. Test HTTP đồng thời dùng connection riêng và cleanup đúng email UUID do test tạo; không reset dữ liệu khác hoặc tự chạy migration.

## Đặt code ở đâu?

| Vị trí | Trách nhiệm |
|---|---|
| src/modules/<module>/presentation/ | Route, Controller, validate HTTP và ánh xạ lỗi |
| src/modules/<module>/business/ | Service, model và policy nghiệp vụ; không phụ thuộc request/response của framework |
| src/modules/<module>/data/ | Repository/truy vấn các bảng module sở hữu, dùng transaction được truyền vào |
| src/business/workflows/ | Transaction/use case phối hợp nhiều module |
| src/shared/http/ | Middleware session và request context |
| src/shared/database/ | Connection, transaction context và khóa/gate |
| src/shared/providers/ | Adapter email/storage/push/crypto theo công nghệ được chọn |
| src/shared/config/, src/shared/logging/ | Config và log được lọc |
| src/bootstrap/, src/workers/ | Ghép dependency/lifecycle và công việc nền gọi business |
| database/migrations/, seeds/, reference-data/ | Migration, seed và lookup đã chốt |
| tests/unit/, integration/, support/ | Policy/service, API + PostgreSQL thật và fixture/provider fake |

Module hiện có: auth, users, catalog, media, listings, chat, notifications, moderation, analytics. Mapping một chủ sở hữu cho mỗi bảng trong tổng 25 bảng nằm ở solution_tree.md.

Controller không chứa SQL/nghiệp vụ; Repository không trả HTTP response. Service/workflow dùng cùng transaction qua các module; không commit message rồi tạo outbox trong một transaction khác. Worker dùng cùng kiểm tra quyền/binding với API.

Giữ các bất biến: verify tùy chọn, không tự chat, một hội thoại/cặp người/tin, retry không trùng, lịch sử theo quyền, owner_state tách moderation_state. Framework đã chọn NestJS và ORM đã chọn TypeORM; không tự chốt provider hoặc nội dung lookup chưa được duyệt.

Các .gitkeep chỉ giữ khung trong Git, bỏ khi có code thật. Backend dùng pnpm workspace với lockfile chung ở repository root và Vitest cho test. Migration dùng TypeORM; chỉ apply migration đã được review trong phạm vi thay đổi được yêu cầu.
