# StudentMart — Công nghệ và lựa chọn kỹ thuật

**Ngày đối chiếu:** 07/11/2026. Nguồn: manifests/source local, [technical decisions](../docs/technical-decisions.md), [solution tree](../docs/solution_tree.md), Wiki. Không tra phiên bản mới nhất hoặc đổi dependency trong nhiệm vụ tài liệu.

Liên quan: [phạm vi](summary-assigment.md), [kiến trúc](structure-architecture.md), [schema](schema-database.md), [triển khai](work-flow.md).

## 1. Quy ước trạng thái lựa chọn

| Trạng thái | Ý nghĩa |
|---|---|
| Hiện có trong source | Quan sát file/config thực; chưa đồng nghĩa chạy thành công trong môi trường này |
| Đã chọn cho đích | Quyết định dự án đã ghi nhưng chưa hiện thực đầy đủ |
| Đề xuất thiết kế | Phương án trong tài liệu cần review trước implementation |
| Cần chốt | Chưa chọn thư viện/provider/chính sách hoặc thiếu bằng chứng |

Phiên bản trong bảng là **range/giá trị khai báo**, không phải phiên bản resolve hoặc chứng nhận tương thích. Hai app chưa có lockfile riêng khi kiểm kê. Không dùng lockfile root để kết luận đã khóa dependency cho chúng.

## 2. Stack hiện có

| Thành phần | Khai báo / bằng chứng | Trạng thái và giới hạn |
|---|---|---|
| Backend runtime | `engines.node >=22.0.0`, ESM `type: module` trong [manifest](../backend/package.json); decision hướng Node 22 | Chưa xác nhận runtime thực hoặc một version LTS mới nhất |
| Backend TypeScript | `typescript ^5.9.3`; [tsconfig](../backend/tsconfig.json) | Có cấu hình build/typecheck |
| HTTP | `fastify ^5.6.1`; [buildApp](../backend/src/bootstrap/app.ts) | Có GET `/health` trả `{status: "ok"}`; chưa có route nghiệp vụ |
| Validation | `zod ^4.1.12`; [env](../backend/src/shared/config/env.ts) | Đang dùng cho NODE_ENV/HOST/PORT; request contracts chưa viết |
| Dev / test backend | `tsx ^4.20.6`, `vitest ^3.2.4`, `@types/node ^24.10.0` | Có hai ca bootstrap bằng Fastify injection; `@types/node` không xác định runtime thực |
| Expo | `expo ^54.0.0`, `expo-status-bar ^3.0.8` trong [manifest](../mobile/package.json) | Có AppEntry, [App.tsx](../mobile/App.tsx) và [app config](../mobile/app.json) |
| React / React Native | `react 19.1.0`, `react-native 0.81.5` | Shell hiển thị StudentMart; chưa có UI feature |
| Mobile TypeScript | `typescript ~5.9.2`, `@types/react ~19.1.10`; [tsconfig](../mobile/tsconfig.json) | Có script typecheck; chưa chạy lại trong nhiệm vụ |
| Dữ liệu server | PostgreSQL theo README/schema/kiến trúc | Đã chọn đích; chưa có driver/ORM, version server hoặc migration thực thi |

README, README từng app, solution tree và source-map cũ còn nói chưa có manifest/app hoặc framework chưa chọn. Bộ doc này dùng source + technical decisions cho hiện trạng bootstrap, đồng thời giữ các quyết định Three-Layer/MVVM và phạm vi sản phẩm của tài liệu cũ.

## 3. Vì sao giữ các lựa chọn này

| Lựa chọn | Lý do trong bối cảnh dự án | Đánh đổi và phương án khác |
|---|---|---|
| React Native + Expo | Stack sản phẩm đã chọn; phục vụ mobile, ảnh, lifecycle và thông báo | Cần kiểm thiết bị/OS/build; không tự thay Flutter hoặc native khi chỉ viết tài liệu |
| TypeScript | Đã có ở hai app; mô hình hóa state và DTO rõ hơn | Kiểu tĩnh không thay validate dữ liệu mạng hoặc phân quyền |
| Fastify + Zod | Bootstrap đã chọn và có code; tạo nền API/env validation | Không tự thêm framework HTTP thứ hai; vẫn phải thiết kế controller/service/repository |
| PostgreSQL | Quan hệ, FK/UQ, transaction và outbox phù hợp thiết kế đã có | Cần migration/test DB thật; không thay bằng mock hoặc database khác để coi ràng buộc đã đạt |
| Một backend chia module | Kế thừa solution tree; dễ phối hợp transaction trong quy mô đồ án | Microservices cần thêm hợp đồng/vận hành mà phạm vi chưa yêu cầu |
| PostgreSQL outbox | Đề xuất schema lưu message/job cùng commit | Cần worker/lease/retry; queue ngoài chỉ cân nhắc nếu có nhu cầu thực |

Đây là giải thích lựa chọn của StudentMart, không phải khuyến nghị xếp hạng công nghệ chung. Các thư viện còn mở được chọn khi ticket cần chúng và có kiểm chứng trên phiên bản dự án.

## 4. Mobile: UI, state, lưu trữ và điều hướng

Mobile tổ chức 6 feature với Presentation–Business–Data. Screen/component render state và chuyển action cho hook ViewModel. Hook gọi business service; repository xử lý API và persistence. Không đặt HTTP/storage trực tiếp trong JSX.

| Phần | Hướng áp dụng | Cần chốt |
|---|---|---|
| Navigation | Wrapper route gọi screen feature; mở thông báo qua workflow kiểm session/quyền | Router, route contract, môi trường deep link |
| State và form | Phân biệt loading/empty/error; sending/unconfirmed/failed/acknowledged; chống response cũ đè state mới | State/form library nếu có nhu cầu; không bắt buộc thêm ngay |
| Session | Lưu credential phiên theo chính sách bảo vệ phù hợp; dọn/khóa dữ liệu A trước phiên B | Công cụ secure storage, refresh/lifecycle contract |
| Draft/pending | Persist theo account; giữ key và payload khi chưa rõ kết quả | Local persistence, thời điểm ghi/cleanup, xử lý ảnh URI |
| Media | Chọn/chụp, quyền camera/ảnh, upload state/retry | SDK/provider, format/size/quota, build permissions |
| Push | Quyền OS, registration/binding, inbox fallback, tap reauth | SDK/provider, OS hỗ trợ và bản cài kiểm thử |

Không cam kết web hoặc cả Android/iOS đã sẵn sàng chỉ vì có script trong manifest. Phạm vi phát hành lấy theo thiết bị và khả năng nghiệm thu.

## 5. Backend, database và hợp đồng

Controller xử lý HTTP/validation/actor/error mapping. Service/policy xử lý nghiệp vụ; workflow phối hợp liên module; repository truy vấn PostgreSQL bằng transaction context chung. Chín module và ownership 25 bảng ở [architecture](structure-architecture.md).

| Quyết định | Hiện trạng | Đầu ra cần có |
|---|---|---|
| Auth | Chưa triển khai; schema mô tả phương án email/password và session | Chọn local/provider, hash/token/rotation/expiry/revoke; không trộn login với verify trường |
| ORM / query / migration | Chưa có dependency hoặc runner | Chọn một hướng, mapping type và transaction; migration ràng buộc/trigger/seed/test |
| API contract | Mới có `/health` | Payload/response/errors, pagination, idempotency/version và phân quyền từng thao tác |
| Chat transport | Chưa chọn | REST/polling hoặc realtime được chốt theo nhu cầu; history trong DB vẫn là nguồn sự thật |
| Search | Thiết kế dùng PostgreSQL | Thử tiếng Việt/không dấu, filter/pagination; chưa cần search service riêng |
| Provider adapter | Thư mục khung | Email/storage/push/crypto tách khỏi policy; fake để kiểm lỗi lặp lại được |

Một `contracts/openapi.yaml` hoặc generated client là artifact **dự kiến nếu nhóm chọn**; hiện chưa tạo và không dẫn như file có sẵn. Không mặc định schema proposal là API công khai.

## 6. Bảo vệ dữ liệu và vận hành

Giữ actor từ session, kiểm ownership/membership/admin ở backend và kiểm lại khi worker dispatch. Public projection chỉ có trường cho phép. OTP không lưu thô; credential/session/token được bảo vệ theo thiết kế đã duyệt. Không đưa secret vào cấu hình public của Expo, response/log hoặc analytics.

Ảnh upload phải được server kiểm file/owner/purpose/state trước READY. Push chỉ dùng nội dung chung; job không chứa body chat. Logout/switch phải revoke session/subscription, tăng binding version và chặn dữ liệu local cũ.

Config hiện tại mới validate NODE_ENV/HOST/PORT: mặc định development, `127.0.0.1`, port 3000. DB/provider/quota/TTL/retry/retention và chiến lược deploy chưa được bootstrap cấu hình. Cần chốt timeout/gate cho dispatch, không giữ transaction DB chờ mạng vô hạn.

## 7. Script thực có và cách xác minh

Các lệnh dưới tồn tại trong manifests, cần chạy trong đúng thư mục sau khi dependency được cài và môi trường đủ. Phiên viết tài liệu này không cài dependency hoặc chạy ứng dụng.

| Thư mục | Lệnh | Tác dụng / giới hạn |
|---|---|---|
| `backend/` | `npm run dev` | `tsx watch src/bootstrap/server.ts`; health server, chưa kết nối DB |
| `backend/` | `npm run typecheck` | Kiểm TypeScript, không phát sinh dist |
| `backend/` | `npm test` | Vitest run; hiện chỉ bootstrap, không chứng minh nghiệp vụ |
| `backend/` | `npm run build` rồi `npm start` | Tạo dist bằng tsc rồi chạy `dist/bootstrap/server.js` |
| `mobile/` | `npm start` | Expo dev server; LAN/device phải được cấu hình khi thử thật |
| `mobile/` | `npm run android` / `npm run ios` / `npm run web` | Script khởi chạy target; chưa chứng minh toolchain, dependency hoặc OS đã sẵn sàng |
| `mobile/` | `npm run typecheck` | Kiểm TypeScript; chưa có mobile test runner được chọn |

[Technical decisions](../docs/technical-decisions.md) ghi backend typecheck/test đã pass ở lần bootstrap trước. Đây là kết quả được tài liệu nguồn ghi lại, chưa được chạy lại trong nhiệm vụ này. Không có script lint/migrate/device-build trong manifests hiện tại.

## 8. Kiểm thử và triển khai đích

| Mức | Công nghệ / yêu cầu | Trạng thái |
|---|---|---|
| Unit backend | Vitest cho config/policy/service | Bootstrap đã có file test; policy nghiệp vụ chưa có |
| API/DB integration | Fastify injection + PostgreSQL test thật; fixture/provider fake | Chưa có DB runner/toolchain; cần BL-006/007/008/009 |
| Mobile unit/integration | Form/ViewModel, persistence, session switch và navigation | Runner chưa chọn |
| OTP/push/device | Thiết bị thật, OS/build/permission/app lifecycle và evidence | TASK-17/TASK-24, chưa có kết quả trong task tài liệu |
| CI | Gọi script thực, DB test và báo bước chưa chạy chính xác | BL-010; chưa thấy workflow CI trong root |
| Deploy | API + PostgreSQL + storage/email/push; worker cùng codebase | Host/domain/TLS/secrets/backup/build channel chưa chọn |

Thiết kế không bắt container hoặc cloud cụ thể khi chưa có quyết định. Môi trường test phải tách dev/pilot, migration có đường nâng cấp và kế hoạch phục hồi được kiểm trước khi dùng dữ liệu chung.

## 9. Thứ tự chốt phần còn thiếu

1. Đối chiếu BL-001/004/005 với bootstrap hiện có, chốt lockfile/công cụ còn thiếu; giữ mã đúng đã làm.
2. Chốt contract/policy/lookup ở BL-002/003; chọn DB runner và test environment ở BL-006.
3. Spike OTP/push sớm ở BL-011; ghi provider, thiết bị, build và kết quả thật.
4. Triển khai schema/auth/media/listings rồi chat/outbox/binding; không hoãn verify/push khỏi MVP đầu.
5. CI, bản cài, nghiệm thu và pilot theo [work-flow.md](work-flow.md). Ngày, chi phí và capacity để nhóm xác nhận khi có dữ liệu.
