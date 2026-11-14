# GitHub Actions CI/CD — #116

> Current status (#98): the user requested that all of `.github/` remain local-only and untracked. The workflows described below are historical/local references and are no longer shipped in this branch. GitHub Actions PR checks and manual CD cannot be assumed to run after this change. Existing historical runs remain on GitHub. Run typecheck, tests, backend build/schema/integration and Expo checks locally. Docker/EAS files outside `.github/` remain available.

Phạm vi đã xác nhận: backend NestJS trên VPS/Docker; mobile production Android/iOS qua Expo EAS, **không tự submit store**. Người dùng hiện chưa có VPS/domain hoặc EAS project. Vì vậy CI chạy thực tế trên GitHub, còn CD được chuẩn bị cấu hình và chặn khi thiếu hạ tầng/credentials/approval; chưa có bằng chứng deploy hoặc EAS production build thành công.

## CI kiểm tra PR

`.github/workflows/ci.yml` chạy khi PR vào main, push main, manual hoặc được CD gọi lại. Không dùng pull_request_target, không đọc production secrets; GITHUB_TOKEN chỉ contents:read, checkout không lưu credential. Node24 và pnpm10.34.3 (khớp packageManager), cache pnpm store, cài frozen lockfile.

- Job **Verify FE, BE and PostgreSQL**: typecheck; contract/unit tests; build/backend migrations; schema check; integration với PostgreSQL16 service tạm; Expo dependency check và export Android/iOS.
- Database luôn `student-mart` trên localhost của runner, user/password chỉ dùng cho container CI. Không dùng DATABASE_URL thật hoặc migration lên VPS.
- Artifacts lưu7 ngày: backend/dist và mobile/dist. Không upload env, source credentials hoặc node_modules. Backend artifact chưa kèm runtime dependencies; mobile export là validation bundle, không phải APK/AAB/IPA, có API origin `.invalid` dành cho CI, không dùng bản này phát hành.
- Job **Build API container**: validate Compose và shell syntax, build image production, kiểm tra user node và runtime/contract; không push image khi PR.
- Commit mới hủy CI cũ cùng PR. Các Action dùng SHA đã kiểm chứng từ repository chính chủ, version ghi trong comment.

`.github` trước đây bị ignore toàn bộ. Giờ chỉ allowlist3 workflow StudentMart; prompt và workflow .NET/CMS cũ local vẫn không được track/publish.

Sau lần CI đầu có checks, chủ repo có thể cấu hình Settings → Rules/Branches cho main: yêu cầu PR, approval và hai check trên pass, cấm bypass theo chính sách nhóm. Task này chưa tự thay branch protection hoặc cấp quyền merge. CI pass không thay review của người dùng và không có auto-merge.

## Docker và VPS

`backend/Dockerfile`: build workspace bằng pnpm, tạo runtime với production dependencies, copy dist/OpenAPI, chạy user node và healthcheck. `.dockerignore` loại secrets/env/git/local tooling. `infra/compose.production.yml` chỉ chạy API; database không được tạo/reset tự động. API bind host127.0.0.1:3000, cần reverse proxy HTTPS trên VPS. Dùng external PostgreSQL `student-mart` có backup/restore do chủ hạ tầng quản lý.

Chuẩn bị VPS trước:

1. Tạo VPS Linux có Docker Engine/Compose hỗ trợ `up --wait`, domain + TLS/reverse proxy, kết nối PostgreSQL.
2. Tạo thư mục `/opt/studentmart` cho deployment user; cấu hình file `/opt/studentmart/backend.env`, quyền hạn chế (ví dụ600). File chứa NODE_ENV=production, HOST=0.0.0.0, PORT=3000, DATABASE_URL, AUTH_RATE_LIMIT_SECRET và CORS_ORIGINS phù hợp. DATABASE_URL là địa chỉ DB truy cập được từ container, không mặc định localhost của VPS.
3. Deployment user phải dùng được Docker. Đăng nhập GHCR trên VPS với credential read:packages phù hợp nếu package private; không đưa registry credential vào repo. Package mới mặc định có thể private.
4. Xác minh SSH host fingerprint qua kênh tin cậy, tạo known_hosts đúng host/port. Không dùng StrictHostKeyChecking=no hoặc tin ssh-keyscan chưa xác minh.
5. Tạo GitHub Environment **production-backend**, giới hạn main và thiết lập ít nhất một Required reviewer. Workflow kiểm tra reviewer trước; nếu environment chưa có/không có reviewer thì dừng.

Secrets trong production-backend:

| Tên | Nội dung |
|---|---|
| VPS_HOST | Host/IP VPS |
| VPS_USER | Deployment user đã chuẩn bị |
| VPS_SSH_KEY | Private key riêng cho deploy, không gửi qua chat |
| VPS_KNOWN_HOSTS | known_hosts đã xác minh, hỗ trợ port tùy chỉnh |

Variable tùy chọn `VPS_PORT`, mặc định22. Không cần GitHub secret DATABASE_URL cho VPS: backend.env được giữ trên máy đích.

Chạy Actions → **Deploy backend to VPS**, chọn main:

- Preflight yêu cầu main và required reviewer; chạy lại CI, chờ approval environment.
- Build/push GHCR bằng GITHUB_TOKEN packages:write chỉ trong job CD, tag theo commit và deploy bằng digest bất biến.
- SSH/SCP dùng key tạm, strict host verification, không log key/env; cài Compose/script đã review vào `/opt/studentmart`.
- Mặc định không apply migration; database check từ image mới phải pass trước thay container.
- Chỉ chọn `apply_migrations` sau khi review SQL và xác nhận backup/restore; workflow yêu cầu `backup_confirmed`. Không rollback database tự động.
- Chạy `compose up -d --wait`; thất bại sẽ thử image app trước từ `current-image`, không revert DB hoặc xóa volumes. Rollback app sau migration chỉ an toàn nếu schema còn tương thích; operator phải kiểm tra chiến lược này trước production.

Để rollback chủ động, operator dùng digest đã review trước đó và script `bash /opt/studentmart/backend.sh '<image-tag@sha256:digest>' false false`. Script kiểm tra schema trước, không mặc định rollback DB. Quy trình này chưa được thử trên VPS thật vì VPS chưa có.

## Production mobile qua EAS

`mobile/eas.json` profile production, distribution store, Android/iOS, version remote+autoIncrement; không có submit job. `mobile/app.config.js` chỉ lấy public project/app metadata nếu được cung cấp, không đổi Expo Go local khi biến chưa có.

Trước khi chạy CD:

1. Tạo Expo account/project, khởi tạo EAS và chốt application IDs. Cần Android signing và Apple Developer/signing cho iOS. Theo [Expo CI guide](https://docs.expo.dev/build/building-on-ci/), hoàn thành build đầu/provisioning credentials tương ứng trước khi chạy non-interactive.
2. Tạo Environment **production-mobile**, giới hạn main và Required reviewer.
3. Secret `EXPO_TOKEN` là access token Expo, lưu trong environment, không commit/đưa vào EXPO_PUBLIC_*.
4. Đặt environment variables:

| Variable | Nội dung |
|---|---|
| EXPO_OWNER | Expo user/organization sở hữu project |
| EAS_PROJECT_ID | UUID project thật đã khởi tạo |
| ANDROID_APPLICATION_ID | Android applicationId chốt trước phát hành |
| IOS_BUNDLE_IDENTIFIER | iOS bundle identifier chốt trước phát hành |
| EXPO_PUBLIC_API_URL | HTTPS API origin thật, không /api/v1 hoặc credentials |

Actions → **Build mobile production on EAS**, main → CI → environment approval → EAS27.10.0 build all production/non-interactive/wait. Preflight từ chối thiếu project/app IDs hoặc API localhost/test. Script `check-eas-config.cjs --prepare` chỉ chuyển5 biến public vào env của build profile tạm trên runner để remote EAS build cũng dùng đúng API origin; không chuyển token/secrets vào app. URL được bake vào app là public, không đặt secret ở đó.

Build EAS có thể tiêu tốn quota/phí; workflow không chạy tự động khi push/PR. Không có EAS update hoặc submit store tự động. Chủ project kiểm tra build Android/iOS trong EAS và thực hiện submit riêng khi được phê duyệt. Chưa chạy EAS production vì chưa có project/credentials.

## Xác minh và đọc lỗi

- Workflow đã parse YAML, actionlint và shell syntax được kiểm tra. CI thực tế trên PR là bằng chứng runner; xem tab Checks/Actions và run URL ghi trong issue/PR.
- Migration/integration fail: đọc job database, không chuyển DATABASE_URL sang database thật để sửa CI.
- Docker fail: xem job container; lệnh build local tương đương `docker build -f backend/Dockerfile -t studentmart-api:test .`.
- CD preflight fail do environment/config chưa có là đúng thiết kế, không phải deploy thành công.
- Native/EAS build không thay kiểm tra UI, SecureStore, permissions trên thiết bị.

Tài liệu nguồn: [PostgreSQL service](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [Docker Compose production](https://docs.docker.com/compose/how-tos/production/), [GitHub environment approvals](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments), [Expo CI](https://docs.expo.dev/build/building-on-ci/).
