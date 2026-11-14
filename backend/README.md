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

Auth API bắt buộc `AUTH_RATE_LIMIT_SECRET` ngẫu nhiên ít nhất 32 ký tự để tạo khóa HMAC của email trong bộ đếm login. Sau khi tạo `backend/.env`, chạy từ root để sinh và ghi secret trực tiếp vào file ignored, không in giá trị ra terminal (lệnh từ chối ghi nếu đã cấu hình):

```powershell
node -e "const fs=require('node:fs'),p='backend/.env';if(/^AUTH_RATE_LIMIT_SECRET=/m.test(fs.readFileSync(p,'utf8')))throw Error('Already configured');fs.appendFileSync(p,'\nAUTH_RATE_LIMIT_SECRET='+require('node:crypto').randomBytes(32).toString('hex')+'\n')"
```

Giữ secret riêng cho môi trường; không đưa vào `EXPO_PUBLIC_*`. Sau đó chạy `scripts/up.ps1` và khởi động API. Database CLI không cần khởi tạo AuthModule; API từ chối khởi động auth khi thiếu secret.

`src/app.module.ts` đăng ký module/controller NestJS; `src/bootstrap/app.ts` tạo app và `src/bootstrap/server.ts` nạp env rồi mở cổng. Nest CLI build vào `dist/`; `pnpm start` chạy `dist/bootstrap/server.js`. Unit test kiểm tra HTTP bằng Fastify injection và tắt kết nối database một cách tường minh. Đã có API đăng ký, đăng nhập, danh tính hiện tại và thu hồi phiên.

## Swagger UI — tài liệu và thử API

Backend dùng `@nestjs/swagger` 11.x để phục vụ Swagger UI, `@fastify/static` 10.x (khớp peer dependency của NestJS Fastify adapter hiện tại) để phục vụ JS/CSS ngay từ backend và `yaml` 2.9.1 để đọc hợp đồng OpenAPI. Cấu hình theo [hướng dẫn chính thức NestJS](https://docs.nestjs.com/openapi/introduction). Dependency nằm trong `backend/package.json`, lockfile chung ở root; không cần cài Swagger CLI hay tải UI từ CDN.

Cài đặt và chạy từ repository root:

```powershell
pnpm install --frozen-lockfile
# Cấu hình backend/.env theo .env.example nếu chưa có, đặc biệt DATABASE_URL.
.\scripts\up.ps1
.\scripts\run.ps1 --backend
```

Lệnh tương đương để chạy riêng API: `pnpm --filter studentmart-backend start:dev`. Nếu PowerShell chặn `pnpm.ps1`, dùng `pnpm.cmd`. Chạy bản build bằng `pnpm --filter studentmart-backend build` rồi `pnpm --filter studentmart-backend start`.

- UI: **http://localhost:3000/api/docs**.
- OpenAPI JSON: http://localhost:3000/api/docs/openapi.json (có thể import vào Postman/Insomnia).
- OpenAPI YAML: http://localhost:3000/api/docs/openapi.yaml.

Nếu đổi PORT, thay 3000 bằng port đã cấu hình. Từ máy khác cùng LAN, thay localhost bằng IP máy chạy backend. Server trong Swagger dùng `/` nên request gửi về đúng host/port đang mở UI.

Trong Swagger, mở `GET /health` rồi **Try it out → Execute** để kiểm tra server. Với `POST /api/v1/auth/register`, sửa JSON request và bấm Execute; UI hiển thị curl, status code, headers và response body. Dùng email test mới cho mỗi lần đăng ký; API lưu Account thật trong database đang cấu hình. Thành công trả 201, email trùng trả 409, input sai trả 400, vượt 5 lần thử/15 phút/IP trả 429. Đăng ký không cần token và không cấp phiên đăng nhập.

Swagger chỉ hiển thị route đã đăng ký trong NestJS, hiện gồm health, register, login, logout và GET accounts/me. Schema/response lấy từ `docs/contracts/accounts.openapi.yaml`; các API dự kiến khác chưa xuất hiện. Khi thêm endpoint, đăng ký controller và bổ sung hợp đồng tương ứng. Thay file hợp đồng rồi restart dev server hoặc build lại. Build tự copy hợp đồng vào `backend/dist/shared/http/accounts.openapi.yaml` để bản build có thể chạy độc lập với thư mục docs nguồn. Không sửa trực tiếp file trong dist.

Để thử đăng nhập: gọi `POST /api/v1/auth/login` với tài khoản đã đăng ký, nhập token từ response vào **Authorize** (scheme bearerSession), rồi gọi `GET /api/v1/accounts/me`. Kết quả phải là tài khoản sở hữu phiên. Dùng `POST /api/v1/auth/logout` để thu hồi phiên thử. Không đưa token/password vào log, issue, ảnh chụp hoặc tài liệu. Swagger không persist Authorization qua reload trình duyệt.

Kiểm tra bằng `pnpm test`, `pnpm typecheck` và `pnpm --filter studentmart-backend build`. Ngày 2026-11-13: 54 contract test + 16 unit test PASS; smoke test HTTP của bản build kết nối PostgreSQL thật trả 200 cho UI, JS/CSS, JSON/YAML và health. OpenAPI chỉ liệt kê `/health` và `/api/v1/auth/register`.

## API đăng ký — #87

`POST /api/v1/auth/register` nhận JSON chỉ gồm `email`, `password`, `displayName`; xem [OpenAPI](../docs/contracts/accounts.openapi.yaml). Email được trim/lowercase, tên được trim, mật khẩu giữ nguyên. Giới hạn lần lượt là 254, 8–128 và 1–100 Unicode code point. Field ngoài whitelist (kể cả role/verify) trả `400 VALIDATION_ERROR`.

Thành công trả `201 {account: ...}`, role `MEMBER`, trạng thái trường `UNVERIFIED`, các field hồ sơ chưa khai báo là `null`; không cấp phiên. DTO liệt kê rõ từng field và không chứa password/hash. Email trùng sau normalize trả `409 EMAIL_ALREADY_EXISTS`, kể cả hai request đồng thời. PostgreSQL enforce cả unique và CHECK email đã normalize.

Response dùng `Cache-Control: no-store`, `X-Request-Id` do server tạo; lỗi có envelope `{error:{code,message,fields?,requestId}}` và không trả lỗi SQL/stack/input. Request JSON tối đa 16 KiB (`413` nếu vượt); content type không hỗ trợ trả `415`. Giới hạn đăng ký là 5 lần thử/15 phút/IP, tính cả request sai, vượt trả `429` cùng `Retry-After`. Bộ đếm hiện nằm trong memory của một process, tối đa 10.000 IP đang lưu; đầy trả `503`. Restart sẽ reset bộ đếm; cần store dùng chung trước khi chạy nhiều replica. Không bật trust proxy nên `X-Forwarded-For` không thay đổi IP được tính; khi thêm reverse proxy cần cấu hình trust theo hạ tầng thực tế.

Xem [bằng chứng triển khai và kiểm tra #87](../docs/implementation/task-16-02-be-register.md).

## API đăng nhập và phiên — #90

`POST /api/v1/auth/login` nhận đúng `{email,password}`; email trim/lowercase, password giữ nguyên và có 8–128 Unicode code point. Backend kiểm tra scrypt theo policy hiện có (N=16384/r=8/p=1), so sánh timing-safe; email không tồn tại vẫn thực hiện dummy scrypt. Email không tồn tại và mật khẩu sai cùng trả `401 INVALID_CREDENTIALS`, không tạo phiên.

Thành công trả `200 {account,session:{token,expiresAt}}`. Token opaque được sinh từ 32 random byte, base64url 43 ký tự; không phải JWT. Bảng `"AuthSession"` chỉ giữ SHA-256 digest, account FK, thời điểm tạo/hết hạn/thu hồi. Phiên hết hạn tuyệt đối sau 30 ngày; không refresh hay gia hạn trượt. Các response login/me/logout có `Cache-Control: no-store`; password, token/digest và restriction không được log hoặc trả trong DTO hồ sơ.

`GET /api/v1/accounts/me` dùng `Authorization: Bearer TOKEN` để nạp account từ phiên server. Query/body accountId không quyết định danh tính. Token thiếu/sai/unknown/revoked trả `401 UNAUTHENTICATED`; phiên quá hạn trả `401 SESSION_EXPIRED`. Mỗi lần gọi nạp quyền account hiện tại. Không yêu cầu verify email trường; khi chưa có nguồn TASK-18, projection vẫn UNVERIFIED.

`POST /api/v1/auth/logout` thu hồi đúng bearer được gửi và trả 204 khi cleanup server đã hoàn tất. Token đúng format nhưng unknown/expired/revoked vẫn xử lý idempotent; thiếu hoặc sai format trả 401. Không dùng accountId/sessionId do client tự khai để chọn phiên cần thu hồi. Một phiên khác của cùng Account hoặc tài khoản khác tiếp tục hoạt động; Account và dữ liệu người dùng không bị xóa.

### Logout và điểm tích hợp — #96

`LogoutCleanupHook.onSessionRevoked({sessionId,accountId})` là cổng server cho TASK-19 tháo push binding theo phiên và realtime disconnect nếu hệ thống đó đã có. `LOGOUT_CLEANUP_HOOKS` được inject vào AuthService qua AuthModule, mặc định là mảng rỗng vì chưa có push binding/chat realtime production. Khi TASK-19/chat triển khai, thay provider này bằng các adapter thực; mỗi adapter phải idempotent, chỉ tác động đúng session/account từ database, không dựa body/query/role client hoặc tháo toàn bộ thiết bị/tài khoản khác.

Service commit `revoked_at` trước khi gọi các hook, không giữ transaction qua dịch vụ ngoài. Mọi hook đều được thử; nếu hook lỗi, trả `503 SERVICE_UNAVAILABLE` an toàn và token vẫn bị từ chối ở API riêng. Gọi logout lại với cùng token đã revoke sẽ thử lại cleanup; timestamp revoke không bị ghi lại. Unknown bearer đúng format không có resource để cleanup và trả 204. Không log token, provider error hoặc dữ liệu binding.

Nếu client offline, backend chưa nhận request nên phiên server còn hiệu lực đến khi thu hồi/hết hạn. Mobile phải xóa credential/private state cục bộ và không tuyên bố server revoke đã hoàn tất. Nếu request timeout/503, kết quả toàn bộ cleanup chưa được xác nhận dù phiên có thể đã revoke. Hiện chưa có durable cleanup queue/outbox hoặc adapter push/realtime thật; crash sau revoke hoặc lỗi hook chỉ được bù qua lần gọi logout tiếp theo khi còn token. TASK-19 cần bổ sung cơ chế retry/durability phù hợp với nguồn binding thực, không được dùng hook hiện tại làm bằng chứng push/chat đã ngắt thật.

Không thay entity/schema cho #96; giữ ba migration và synchronize/migrationsRun=false. Test `backend/tests/integration/logout.test.ts` dùng PostgreSQL thật với UUID account/session riêng: current-session-only, token cũ401, phiên A khác/B vẫn200, repeat/unknown/expired idempotent, ignore client IDs, hook failure không rollback revoke và retry đúng scope. Dữ liệu test được cleanup, không reset dữ liệu thật.

Account bổ sung `login_disabled_at` nullable, mặc định null, `select:false`. Đây là nguồn hạn chế đăng nhập do server quản lý, không có trong register/update/profile DTO; tài khoản bị đặt timestamp trả `403 FORBIDDEN` khi login hoặc gọi me. Không suy luận hạn chế từ role MEMBER hay trạng thái verify. Module quản trị ở task sau chịu trách nhiệm thao tác hạn chế; ticket này không tạo admin API hoặc khóa tài khoản sau nhiều lần thử sai.

Đặt secret ngẫu nhiên ít nhất 32 ký tự trong `backend/.env`:

```dotenv
AUTH_RATE_LIMIT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

Đây là secret chỉ dùng phía server, không đặt `EXPO_PUBLIC_*` hoặc commit giá trị thật. API auth yêu cầu secret khi khởi động; CLI database không cần secret. Login giới hạn hai bucket độc lập: tối đa 5 lần thất bại/15 phút/IP và 5 lần thất bại/15 phút/HMAC(email normalize). Đạt một giới hạn trả 429 + `Retry-After` giây; request đang hash giữ chỗ để không vượt giới hạn khi chạy đồng thời. Thành công/lỗi database không tính là mật khẩu sai; lỗi credentials hoặc tài khoản bị hạn chế tính là lần thất bại. Không tin X-Forwarded-For mặc định.

Bộ đếm dùng fixed window trong memory một process, giới hạn 20.000 bucket, đầy trả 503 và restart sẽ reset; trước khi chạy nhiều replica cần store dùng chung. Không lưu email thô trong khóa limiter. Secret HMAC thay đổi sẽ thay khóa email; không ảnh hưởng digest của phiên đang lưu trong database.

Migration `1794622765393-AddAuthSessions.ts` được sinh bằng `scripts/add.ps1 AddAuthSessions`, review up/down rồi apply `scripts/up.ps1` vào `student-mart` ngày 2026-11-14. Up thêm bảng/index/FK RESTRICT/CHECK thời hạn, cột restriction nullable; không sửa dữ liệu Account cũ. Down xóa bảng phiên/cột mới (không thực hiện). `scripts/check.ps1` sau apply: không pending, schema khớp entity.

Kiểm tra: `pnpm --filter studentmart-backend test` và `pnpm --filter studentmart-backend test:integration`. Tests bao phủ mật khẩu đúng/sai/unknown, digest-only, 30 ngày, me theo bearer, trường verify tùy chọn, expiry/revocation, restriction, logout idempotent, lỗi an toàn, không log credential và giới hạn thử/chạy đồng thời. Account test dùng UUID, session/account được cleanup đúng fixture; không reset database. Swagger tự nhận login/me/logout từ controller và dùng schema hợp đồng chung.

## Guard phiên và quyền tài nguyên — #93

AuthModule đăng ký `SessionGuard` và `ResourceAccessGuard` bằng `APP_GUARD`, theo thứ tự xác thực trước phân quyền. Endpoint Nest mới mặc định yêu cầu phiên hợp lệ. Đánh dấu rõ `@PublicRoute()` cho endpoint cho khách; hiện health/register/login là public. Logout được miễn bước kiểm tra phiên còn sống để giữ tính idempotent của token đúng format, nhưng vẫn tự kiểm tra bearer trong service. Swagger assets/tài liệu vẫn truy cập được như trước.

`SessionGuard` lấy bearer từ header, tra digest của AuthSession và Account hiện tại mỗi request, kiểm tra revoked/expiry/restriction, rồi gắn actor bằng Symbol nội bộ. `@CurrentActor()` chỉ đọc actor do guard tạo; `/accounts/me` dùng nguồn này, không nhận accountId/role của client. Không có credential/hash trong actor account DTO. Response API riêng dùng no-store.

Module sở hữu tài nguyên tích hợp `@RequireAccess(...)` với rule `owner`, `conversationMember` hoặc `admin`. Owner/member cần injection token của provider triển khai `ResourceAccessResolver` và tên route param (`resourceParam`); resolver phải đọc owner/membership từ nguồn server, không trả dữ liệu do body/query tự khai. Mọi rule khai báo cùng phương thức, kể cả decorator lặp, và rule trên class đều được kiểm tra theo AND. Không tìm được provider/resource/member hoặc param thì trả 403; ADMIN không tự vượt qua rule owner/member. Role được đọc lại từ Account, không chốt từ lúc login.

Guard là bước kiểm tra request; mutation nghiệp vụ ở task tài nguyên còn phải kiểm tra quyền/ownership/membership trong transaction phù hợp để tránh thay đổi quyền giữa kiểm tra và ghi. Hợp đồng `ResourceAccessResolver` không phụ thuộc HTTP; decorator/lookup DI nằm ở presentation.

Hiện chưa có production API tin đăng/chat/moderation trong repository. Ticket này không thêm endpoint giả, bảng hoặc dữ liệu mẫu của TASK-04/06/22. `tests/support/access-app.ts` chỉ đăng ký controller/resource provider **trong test** để chứng minh owner/member/admin, A không đọc B, đổi quyền trước request tiếp theo và policy thiếu nguồn phải deny. Nghiệm thu public listing/search/detail và quyền trên endpoint tài nguyên thật còn phụ thuộc các task đó.

Không có thay đổi entity, không sinh/apply migration mới. `scripts/check.ps1` xác nhận 3 migration trước đã apply, không pending và schema khớp entity. Kiểm tra backend: typecheck/build, unit tests, integration PostgreSQL và smoke test app thật; health vẫn 200, register/login sai payload vẫn 400 thay vì bị bắt login, me không bearer 401.

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

Khung module dự kiến gồm auth, users, catalog, media, listings, chat, notifications, moderation, analytics; mapping bảng nằm ở solution_tree.md. Endpoint thực hiện hiện tập trung ở health/accounts/auth. Listings/chat/moderation chưa có API domain, nên việc nối policy owner/member/admin vào các tài nguyên đó vẫn phụ thuộc #5/#7/#23; xem [ma trận TASK-16.04](../docs/implementation/task-16-04-session-guards.md).

Controller không chứa SQL/nghiệp vụ; Repository không trả HTTP response. Service/workflow dùng cùng transaction qua các module; không commit message rồi tạo outbox trong một transaction khác. Worker dùng cùng kiểm tra quyền/binding với API.

Giữ các bất biến: verify tùy chọn, không tự chat, một hội thoại/cặp người/tin, retry không trùng, lịch sử theo quyền, owner_state tách moderation_state. Framework đã chọn NestJS và ORM đã chọn TypeORM; không tự chốt provider hoặc nội dung lookup chưa được duyệt.

Các .gitkeep chỉ giữ khung trong Git, bỏ khi có code thật. Backend dùng pnpm workspace với lockfile chung ở repository root và Vitest cho test. Migration dùng TypeORM; chỉ apply migration đã được review trong phạm vi thay đổi được yêu cầu.
