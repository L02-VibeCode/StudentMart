# StudentMart

## Local development

GitHub workflows and agent skills are local-only: `.github/` and `.agents/` are excluded from Git. Automatic CI/CD is not configured by this branch; run the checks below locally. See [CI/CD reference and current status](docs/ci-cd.md).

The starter uses **React Native + Expo (SDK 58)** in `mobile/` and **NestJS 11 + Fastify** in `backend/`, both with TypeScript. Use Node.js 22.13+ on the 22.x line, 24.3+ on the 24.x line, or 26+, with pnpm 10.34.3. The root pnpm workspace manages both applications with one `pnpm-lock.yaml`.

```sh
pnpm run setup
pnpm --filter studentmart-backend db:init
pnpm run dev
```

On Windows PowerShell, use `pnpm.cmd` if script execution policy blocks `pnpm`.

### PowerShell scripts

```powershell
.\scripts\run.ps1               # Chạy đồng thời Expo và NestJS
.\scripts\run.ps1 --frontend    # Chỉ chạy Expo
.\scripts\run.ps1 --backend     # Chỉ chạy NestJS
.\scripts\add.ps1 AddAccountBio # Sinh migration từ thay đổi entity; chưa apply
.\scripts\up.ps1                # Tạo database nếu thiếu và apply migration đang chờ
.\scripts\check.ps1             # Kiểm tra kết nối, bảng, migration và schema
```

Các script tự xác định repository root nên có thể gọi từ thư mục khác. `add.ps1` mặc định dùng tên `SchemaChange` khi không truyền tên; hãy review SQL trước khi chạy `up.ps1`. TypeORM trả exit code 1 nếu không có thay đổi để sinh migration. `check.ps1` chỉ đọc database, trả code 1 khi không kết nối được, còn migration chờ hoặc schema lệch entity. `run.ps1` dùng Ctrl+C để dừng server. Nếu execution policy chặn `.ps1`, chạy bằng `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1` (thay tên script tương ứng); không cần thay đổi policy toàn máy.

`pnpm run dev` starts the API on port 3000 and Expo on port 8081. Scan the QR code with an Expo Go version compatible with SDK 58 (see [Expo Go downloads](https://expo.dev/go)), or use an emulator/development build. iOS Simulator requires macOS; physical iPhones can connect to Expo from Windows.

For a physical phone in LAN development, the app uses Metro's host on port 3000 automatically when `EXPO_PUBLIC_API_URL` is unset or blank. For a separate API host/port or a release build, set this variable in `mobile/.env` to the API origin (e.g. `http://<computer-LAN-IP>:3000` for local testing). Keep the phone and computer on the same network and allow port 3000 through the local firewall. Restart Expo after changing the environment. Android Emulator uses `http://10.0.2.2:3000`; iOS Simulator uses `http://localhost:3000`. See [phone troubleshooting](mobile/README.md#kiểm-tra-điện-thoại-sau-khi-quét-qr).

Before initialization, copy `backend/.env.example` to `backend/.env`, configure `DATABASE_URL` for PostgreSQL database `student-mart`, and set a random `AUTH_RATE_LIMIT_SECRET` of at least 32 characters (see [backend setup](backend/README.md)). `db:init` creates the database if missing and applies pending TypeORM migrations. The API connects to PostgreSQL at startup and binds to `0.0.0.0` for local device access. `GET http://localhost:3000/health` returns `{"status":"ok"}`. Mobile verifies saved sessions before access to private screens and offers a public exploration shell. Live listing/search/chat content still depends on TASK-04/06/22; the app shows unavailable states without demo data. See [TASK-16.04 acceptance and dependencies](docs/implementation/task-16-04-session-guards.md).

```sh
pnpm run dev:backend  # API only, with reload
pnpm run dev:mobile   # Expo only
pnpm run typecheck
pnpm test
pnpm run build       # Compile backend
pnpm --filter studentmart-backend start
```

The backend includes registration, login, current-account and session-revocation APIs. Mobile login stores credentials with Expo SecureStore and confirms identity through `/accounts/me`. See the [TASK-16.03 verification matrix](docs/implementation/task-16-03-login.md). After starting the backend, open **[Swagger UI](http://localhost:3000/api/docs)** to inspect and test implemented APIs. OpenAPI exports: `/api/docs/openapi.json` and `/api/docs/openapi.yaml`. See [API docs installation and usage](backend/README.md#swagger-ui--tài-liệu-và-thử-api), [mobile setup](mobile/README.md) and [backend setup](backend/README.md).

Baseline hợp đồng tài khoản TASK-16.01 (#83): [OpenAPI v1](docs/contracts/accounts.openapi.yaml), [mô hình tài khoản, phiên và migration dự kiến](docs/contracts/account-model.md), [hợp đồng tích hợp mobile](docs/contracts/account-mobile.md). Đây là đặc tả cho các ticket triển khai sau; endpoint chưa được triển khai bởi ticket hợp đồng. Dữ liệu lookup TASK-15 và provider avatar cần được xác nhận trước các phần phụ thuộc.

Hai sub-ticket #84/#85 có [ma trận nghiệm thu](docs/contracts/acceptance.md), [review thiết kế mobile](docs/contracts/account-design-review.md) và [payload mẫu](docs/contracts/examples.json). Chạy `pnpm test:contracts` để kiểm tra schema/permission/projection cục bộ; `pnpm test` chạy cả contract tests và unit test backend.

Quy trình giao task cho agents (nhánh theo ticket, tiêu chí nghiệm thu, commit/PR, GitHub Project và chờ người dùng approve trước khi merge) được quy định tại [AGENTS.md](AGENTS.md).

**Ứng dụng kết nối sinh viên mua, bán và trao đổi đồ cũ trong Làng Đại học ĐHQG TP.HCM.**

StudentMart là nền tảng trung gian **C2C**, giúp người dùng đăng tin, tìm lựa chọn phù hợp và liên hệ trực tiếp với nhau. Hai bên tự thỏa thuận, gặp mặt, kiểm tra hàng và thanh toán hoặc trao đổi ngoài ứng dụng.

Giá trị đề xuất là giúp sinh viên tìm tin phù hợp và kết nối với người giao dịch trong khu vực thuận tiện, với thông tin rõ ràng trước khi liên hệ.

[Tài liệu dự án](https://github.com/L02-VibeCode/StudentMart/wiki) · [Project Board](https://github.com/orgs/L02-VibeCode/projects/1) · [Danh sách công việc](https://github.com/L02-VibeCode/StudentMart/issues)

## Vấn đề và định hướng

Nhu cầu mua bán đồ cũ có thể xuất hiện khi sinh viên chuyển trọ, nâng cấp thiết bị, kết thúc môn học hoặc cần tiết kiệm chi phí.

Khảo sát ban đầu ghi nhận những khó khăn như tin đăng bị trôi, liên hệ không được phản hồi và thông tin hàng chưa đúng mô tả. Tuy nhiên, mức độ ảnh hưởng của các vấn đề này và động lực chuyển từ Facebook hoặc Chợ Tốt sang một ứng dụng mới vẫn cần được nghiên cứu thêm.

StudentMart tập trung vào:

- Tin đăng có cấu trúc, phù hợp với từng nhu cầu.
- Tìm kiếm theo loại tin, danh mục, giá hoặc ngân sách và khu vực.
- Thông tin món đồ, người đăng và trạng thái tin rõ ràng.
- Hội thoại gắn với tin đăng để hỏi thêm và thỏa thuận giao dịch.
- Thử nghiệm trong một cụm trường, KTX hoặc khu trọ thuộc Làng Đại học ĐHQG TP.HCM.

## Người dùng mục tiêu

- Sinh viên có đồ không còn sử dụng và muốn bán lại.
- Sinh viên tìm mua đồ phù hợp với nhu cầu và ngân sách.
- Sinh viên muốn đăng tìm mua khi chưa thấy tin phù hợp.
- Sinh viên có món đồ muốn trao đổi.

Một tài khoản có thể vừa đăng tin vừa tìm kiếm và liên hệ. Quản trị viên là vai trò vận hành, phụ trách xem xét báo cáo và xử lý nội dung vi phạm.

## Phạm vi MVP

### Chuỗi giá trị cốt lõi

**Đăng tin → Tìm/lọc → Xem chi tiết → Liên hệ → Tự giao dịch trực tiếp → Cập nhật trạng thái tin.**

### Các chức năng dự kiến

| Chức năng | Phạm vi |
|---|---|
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, hồ sơ cơ bản và phân quyền. |
| Đăng và quản lý tin | Tạo, sửa, gỡ, đóng hoặc đánh dấu hoàn tất tin Bán / Tìm mua / Trao đổi. |
| Tìm kiếm và bộ lọc | Từ khóa, loại tin, danh mục, khu vực và giá/ngân sách khi áp dụng. |
| Chi tiết tin | Nội dung món đồ hoặc nhu cầu, trạng thái, khu vực và hồ sơ chủ tin. |
| Chat theo tin | Hội thoại văn bản giữa hai người, lịch sử và trạng thái chưa đọc. |
| Push notification | Thông báo tin nhắn mới và mở đúng hội thoại sau khi kiểm tra quyền. |
| Xác thực email trường | OTP tùy chọn và nhãn xác thực có giải thích rõ giới hạn. |
| Báo cáo và chặn | Báo cáo tin/tài khoản, chặn liên hệ và xử lý quản trị tối thiểu. |
| Bản nháp và phục hồi lỗi | Giữ nội dung tin đang soạn trên thiết bị và hỗ trợ thử lại khi lỗi mạng. |
| Đo lường thử nghiệm | Ghi nhận hoạt động tối thiểu và nhật ký pilot để đánh giá chuỗi giá trị. |

Ba loại tin sử dụng chung cơ chế đăng tin, tìm kiếm và chat; không có quy trình đặt hàng hoặc ghép trao đổi tự động.

### Quy tắc quan trọng

- **Xác thực email trường là tùy chọn:** tài khoản chưa xác thực vẫn được đăng tin và chat.
- **Nhãn verify có giới hạn:** chỉ xác nhận quyền truy cập email trường được hỗ trợ tại thời điểm xác thực; không bảo đảm danh tính sinh viên hiện tại, uy tín hoặc chất lượng hàng.
- **Push thuộc MVP đầu tiên:** người dùng có thể từ chối quyền nhận thông báo và vẫn sử dụng hộp thư, chat.
- **Khu vực được chọn thủ công:** không bắt buộc GPS hoặc công khai vị trí chính xác.
- **Chỉ tạo hội thoại mới từ tin đang mở:** hội thoại đã có có thể tiếp tục sau khi chủ tin hoàn tất hoặc đóng tin, nếu còn quyền và không có quan hệ chặn.
- **Kết quả giao dịch do chủ tin cập nhật:** đóng hoặc gỡ tin không được tính là giao dịch hoàn tất.

### Ngoài phạm vi MVP

- Giỏ hàng, đặt hàng, thanh toán hoặc giữ tiền trung gian.
- Giao hàng và kết nối shipper.
- GPS thời gian thực và theo dõi vị trí.
- Ghép trao đổi tự động hoặc trao đổi nhiều bên.
- Rating/Review, điểm uy tín và gợi ý bằng AI.
- Lưu yêu thích, chia sẻ tin, quảng cáo và gói đẩy tin trả phí.
- Dashboard phân tích nâng cao.
- Mở rộng ra ngoài Làng Đại học ĐHQG TP.HCM.

Chi tiết phạm vi và căn cứ ưu tiên nằm trong [MVP Scope](https://github.com/L02-VibeCode/StudentMart/wiki/MVP-Scope) và [Impact–Effort Matrix](https://github.com/L02-VibeCode/StudentMart/wiki/Impact%E2%80%93Effort-Matrix).

## Công nghệ lựa chọn

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Ứng dụng mobile | **React Native + Expo** | Giao diện, camera/chọn ảnh, bản nháp cục bộ và tích hợp thông báo. |
| Backend | **NestJS 11 + Fastify (Node.js)** | API, xác thực tài khoản, phân quyền, tin đăng, chat và xử lý sự kiện thông báo. |
| Cơ sở dữ liệu | **PostgreSQL** | Lưu dữ liệu tài khoản, tin đăng, hội thoại và dữ liệu nghiệp vụ. |
| Quản lý mã nguồn | **GitHub** | Repository, branch, Pull Request và review. |
| Tài liệu | **GitHub Wiki** | Nghiên cứu, yêu cầu, quyết định sản phẩm và truy vết. |
| Quản lý công việc | **GitHub Issues + Projects** | Backlog, phân công, milestone và tiến độ thực tế. |

Ứng dụng được định hướng phát triển cross-platform. Phạm vi hệ điều hành phát hành sẽ được xác định theo thiết bị kiểm thử và khả năng triển khai.

Framework backend đã chọn NestJS với Fastify adapter và TypeORM cho PostgreSQL. Dịch vụ lưu ảnh, gửi email và phương án tích hợp push sẽ được chốt trong bước thiết kế kỹ thuật.

## Trạng thái dự án

Dự án đã có nền tảng chạy cục bộ cho Expo mobile và NestJS backend; các chức năng MVP chưa được triển khai.

Khảo sát V1 ghi nhận **13 phản hồi sàng lọc và 11 người tiếp tục trả lời**. Đây là dữ liệu tự báo cáo trong mẫu nhỏ, chưa xác nhận hành vi sử dụng StudentMart.

| Milestone | Mục tiêu |
|---|---|
| **M1 — Nghiên cứu và nền tảng** | Làm rõ vấn đề, đánh giá bằng chứng, chốt phạm vi và tổ chức công việc. |
| **M2 — Thiết kế, triển khai và nghiệm thu MVP** | Hoàn thiện chuỗi giá trị, tích hợp các chức năng trong phạm vi và kiểm thử bản cài đặt. |
| **M3 — Pilot và điều chỉnh** | Thử nghiệm với người và tin đăng thật, ghi nhận kết quả và cập nhật quyết định. |

Trạng thái và người phụ trách từng công việc được theo dõi trên [GitHub Project](https://github.com/orgs/L02-VibeCode/projects/1). Danh sách tính năng trong README là phạm vi dự kiến, không phải xác nhận đã triển khai.

## Kiến trúc và cấu trúc repository

StudentMart dùng **Three-Layer Architecture**, nhóm mã theo chức năng. Mobile áp dụng **MVVM nhẹ** bằng Screen và hook ViewModel; backend áp dụng **Controller → Service → Repository**.

Đã tạo khung thư mục `mobile/` và `backend/` với ba tầng cho từng feature/module, manifest và ứng dụng khởi động được. Backend có entity Account và migration khởi tạo; các thư mục nghiệp vụ chưa triển khai dùng `.gitkeep`.

```text
StudentMart/
├── mobile/
│   ├── README.md
│   ├── assets/
│   ├── src/
│   │   ├── features/              # 6 feature; mỗi feature có presentation/business/data
│   │   ├── business/workflows/    # Phối hợp phiên tài khoản và thông báo
│   │   ├── shared/                # UI, theme, HTTP, storage, media, catalog, config
│   │   ├── bootstrap/
│   │   └── navigation/
│   └── tests/                     # Unit và integration phía mobile
├── backend/
│   ├── README.md
│   ├── src/
│   │   ├── modules/               # 9 module; mỗi module có presentation/business/data
│   │   ├── business/workflows/    # Use case và transaction liên module
│   │   ├── shared/                # HTTP, DB, provider, config, logging
│   │   ├── bootstrap/
│   │   └── workers/
│   ├── database/                  # Migrations, seeds và reference-data
│   └── tests/                     # Unit, integration và support
├── docs/
│   ├── schema.md
│   └── solution_tree.md
├── StudentMart.wiki/
├── stephen-skills/
└── README.md
```

Xem [solution tree và lựa chọn kiến trúc](docs/solution_tree.md), [schema/ERD](docs/schema.md), [hướng dẫn mobile](mobile/README.md) và [hướng dẫn backend](backend/README.md).

### Nguyên tắc tổ chức

- `presentation/` xử lý giao diện/HTTP; `business/` xử lý state/action client hoặc nghiệp vụ server theo trách nhiệm; `data/` xử lý API, storage hoặc PostgreSQL.
- Với mobile: Screen → ViewModel → Business Service → Repository. Với backend: Controller → Service/Workflow → Repository.
- Một backend chia module, không cần microservices. Quyền sở hữu/thành viên/admin và transaction vẫn kiểm tra tại backend.
- Mỗi ứng dụng có manifest riêng; pnpm workspace dùng chung `pnpm-lock.yaml` ở root. Các lệnh chạy nằm trong phần Local development.
- Chỉ thêm use-case class, interface, mapper hoặc abstraction khi có nhu cầu; không bắt một file/lớp cho mỗi thao tác CRUD.
- Wiki giữ yêu cầu và nghiên cứu; docs giữ thiết kế kỹ thuật. Không commit secret, dữ liệu nhận dạng, dependency hoặc build output.

## Quy trình cộng tác

Công việc được theo dõi theo workflow:

**Backlog → To Do → In Progress → Review → Done**

- Mỗi task đã cam kết thực hiện có Assignee, đầu ra và tiêu chí chấp nhận rõ ràng.
- Công việc triển khai đi từ Issue → Branch → Pull Request → Review → Merge.
- Nhánh làm việc tham chiếu mã task, ví dụ: `feat/task-04-listings` hoặc `docs/task-02-evidence`.
- Thay đổi mã nguồn vào `main` thông qua Pull Request và review.
- Chỉ chuyển task sang Done khi có đầu ra được kiểm tra và liên kết bằng chứng tương ứng.
- Không đưa file `.env`, API key, token, mật khẩu hoặc dữ liệu nghiên cứu có thông tin nhận dạng lên repository.
- Thay đổi phạm vi phải được phản ánh vào tài liệu và các Issue liên quan.

Quy ước truy vết:

| Mã | Ý nghĩa |
|---|---|
| `A1–A5` | Giả định quan trọng. |
| `D01–D07` | Quyết định sản phẩm. |
| `UN01–UN13` | Nhu cầu người dùng. |
| `R01–R13` | Yêu cầu chức năng. |
| `US01–US13` | User Stories. |
| `UF01–UF05` | User Flows, có các nhánh chi tiết. |
| `TASK-01–TASK-25` | Công việc trên GitHub Issues. |

## Tài liệu dự án

| Nội dung | Liên kết |
|---|---|
| Trang tổng quan | [Wiki Home](https://github.com/L02-VibeCode/StudentMart/wiki) |
| Định hướng sản phẩm | [Project Direction](https://github.com/L02-VibeCode/StudentMart/wiki/Project-Direction) |
| Lý do chọn mobile | [Mobile Product Rationale](https://github.com/L02-VibeCode/StudentMart/wiki/Mobile-Product-Rationale) |
| Giả định quan trọng | [Critical Assumptions](https://github.com/L02-VibeCode/StudentMart/wiki/Critical-Assumptions) |
| Kế hoạch bằng chứng | [Evidence Plan](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Plan) |
| Nghiên cứu người dùng | [User and Market Research](https://github.com/L02-VibeCode/StudentMart/wiki/User-and-Market-Research) |
| Giải pháp hiện có | [Existing Solutions and Alternatives](https://github.com/L02-VibeCode/StudentMart/wiki/Existing-Solutions-and-Alternatives) |
| Đánh giá bằng chứng | [Evidence Evaluation](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Evaluation) |
| Quyết định sản phẩm | [Product Decisions](https://github.com/L02-VibeCode/StudentMart/wiki/Product-Decisions) |
| Mô hình sản phẩm | [Business Canvas](https://github.com/L02-VibeCode/StudentMart/wiki/Business-Canvas) |
| Ưu tiên tính năng | [Impact–Effort Matrix](https://github.com/L02-VibeCode/StudentMart/wiki/Impact%E2%80%93Effort-Matrix) |
| Phạm vi MVP | [MVP Scope](https://github.com/L02-VibeCode/StudentMart/wiki/MVP-Scope) |
| User Stories | [User Stories](https://github.com/L02-VibeCode/StudentMart/wiki/User-Stories) |
| Luồng người dùng | [Critical User Flows](https://github.com/L02-VibeCode/StudentMart/wiki/Critical-User-Flows) |
| Kế hoạch dự án | [Project Plan](https://github.com/L02-VibeCode/StudentMart/wiki/Project-Plan) |
| Truy vết | [Traceability](https://github.com/L02-VibeCode/StudentMart/wiki/Traceability) |
| Bằng chứng nghiên cứu | [Evidence Register](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Register) |

## Thành viên

| Họ tên | Mã số sinh viên | Vai trò |
|---|---|---|
| Nguyễn Gia Khiêm | 2211572 | Nhóm trưởng |
| Phạm Trương Quân Bằng | 2210300 | Thành viên |
| Lưu Việt Đức | 2310779 | Thành viên |
| Nguyễn Minh Thái | 2313101 | Thành viên |
| Nguyễn Thanh Tùng | 2449106 | Thành viên |

Dự án thuộc môn **CO3043 — Phát triển ứng dụng di động**, học kỳ **HK261**.

- **Giảng viên:** Hoàng Lê Hải Thanh.
- **Organization:** [L02-VibeCode](https://github.com/L02-VibeCode).
- **Project Board:** [StudentMart — Project 1](https://github.com/orgs/L02-VibeCode/projects/1).
