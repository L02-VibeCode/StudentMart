# TASK-16.04 — Khôi phục phiên và bảo vệ màn hình (#92/#93/#94)

Nhánh `feat/task-16-04-session-guards` từ `origin/main` tại `d42688ee`, ngày 2026-11-14, sau khi PR #114 được người dùng merge. Backend giao agent backend-dev với skill typeorm-migrations; frontend theo frontend-design. Quy trình giao việc cho các agent được ghi vào root [AGENTS.md](../../AGENTS.md).

## Phạm vi và phụ thuộc còn thiếu

**Không tuyên bố toàn bộ #92/#93/#94 đã Done.** Main hiện có health/register/login/logout/me, chưa có API listings/search/detail/chat/moderation. Ticket yêu cầu phối hợp TASK-04/06/22, không triển khai thay chúng. Vì vậy thay đổi này cung cấp auth/resource guards, bootstrap, private request scope, semantic return intents và điểm nối domain; không tạo dữ liệu/API production giả để vượt AC.

Phụ thuộc live: #5 (TASK-04 đăng/quản lý tin), #7 (TASK-06 chi tiết/chat), #23 (TASK-22 block/moderation/quyền). Giao diện khám phá có list/search/detail shell truy cập được khi là guest, nhưng gateway runtime mặc định báo chưa sẵn sàng và fail closed cho contact/create. Không có tin demo hoặc write operation ẩn. Cần hợp đồng/API thật của các task đó trước khi nghiệm thu hành trình liên hệ một tin thật.

## Đối chiếu tiêu chí nghiệm thu

| AC | Triển khai/bằng chứng | Trạng thái |
|---|---|---|
| Khôi phục phiên hợp lệ, có checking không nhấp nháy login | Đọc SecureStore, me xác nhận ID; private UI chỉ có dữ liệu sau xác minh; test deferred bootstrap + HTTP/PG restore | PASS source/state/API; native UI cần xác nhận |
| Phiên thiếu/giả/hết hạn/thu hồi bị từ chối | Global SessionGuard mặc định bảo vệ; me/private test401; mobile loại credential401, local expiry không phát private action | PASS API/model |
| Khách xem nội dung công khai | health/register/login explicit PublicRoute, public navigation shell không ép login | PASS current public routes; **listing/search/detail live còn pending #5/#7** |
| Khách không gọi thành công API riêng | Guard mặc định yêu cầu bearer từ server, me lấy CurrentActor; thiếu/giả/revoked/expired401 | PASS thực tế me + test-only resource controllers |
| Owner/member/admin, A không đọc B | RequireAccess AND class/method/stacked policies; nguồn resolver của module sở hữu, thiếu nguồn/ID/member từ chối; role đọc server mỗi request, không admin bypass tự động | PASS infrastructure/HTTP fixture; **cần gắn resolver vào endpoint domain thật #5/#7/#23** |
| Chọn liên hệ → login → đúng tin | Return intent chỉ semantic action + UUID; đọc lại listing/identity, check quyền server trước khi quay đúng ID; callback không có sendMessage/publish | PASS port tests + real guard fixture; **tin/chat live chưa nghiệm thu** |
| Hủy login không tự gửi tin/đăng bài | Hủy/Back xóa intent/generation, trở lại origin; pending login bị hủy không công bố phiên; không tự retry mutation | PASS model/HTTP read-only fixture; Back native cần kiểm tra |
| Quyền phải kiểm tra ở BE | Global authentication + ResourceAccessGuard, không tin accountId/role trong input; nguồn owner/member/role đọc lại khi gửi request | PASS; write domain sau này vẫn phải recheck trong transaction/use case |
| Mất quyền/foreground | Force restore khi app có phiên trở về active; me403 restricted, giữ credential; resource403 chỉ chặn action; guest forms không reset do autofill | PASS model/API; AppState native cần xác nhận |
| Request cũ không ghi đè tài khoản mới | Snapshot epoch/account + AbortSignal;401 trễ của A không clear B; cleanup chỉ chạy khi epoch còn khớp | PASS regression |
| Readiness/intent không dùng quyền của phiên cũ | contactReady gắn epoch/account và bị bỏ khi đổi phiên; resume cũ bị invalidated bằng generation, giữ semantic intent cho xác minh mới | PASS regression A → guest/B/forced restore |
| API docs và schema khớp | Giữ routes/contract hiện có; default bearer + explicit public routes, smoke full app | PASS; không thêm endpoint tin/chat giả |
| Hai ticket và tích hợp hoàn tất trước Done | Có source/test + PR để review, còn các dependency và native checks bên trên | **Chưa đạt toàn bộ quy tắc Done** |

## Backend và migration

SessionGuard, ResourceAccessGuard được đăng ký toàn cục từ AuthModule. Chỉ route có PublicRoute được bỏ live-session guard; logout vẫn tự kiểm tra bearer theo hợp đồng idempotent. CurrentActor lấy từ AuthService.authenticate, đọc phiên và Account hiện tại từ PostgreSQL.

RequireAccess hỗ trợ owner, conversationMember, admin; class/method/stacked rules áp dụng AND. Resolver do module sở hữu tài nguyên cung cấp, fail closed khi thiếu nguồn/membership. ADMIN không vượt quyền owner/member nếu endpoint không chọn policy đó. ID route chỉ chọn resource, không chọn actor. Các controller `/test/access/*` nằm trong tests/support, không đăng ký ở AppModule hoặc đóng gói vào dist source.

Không sửa entity/DataSource schema, không tạo migration rỗng. Skill được dùng để đối chiếu model/options và chạy `scripts/check.ps1`: 3 migration đã apply, không pending/schema drift; synchronize/migrationsRun vẫn false. Không apply migration mới hoặc revert/reset database cho task này.

## Frontend và tích hợp

AuthCoordinator phục hồi phiên, hỗ trợ force-verify, phân biệt restricted với offline. runPrivate xác minh me mới, chụp epoch/account, abort và bỏ kết quả cũ; chỉ tiếp tục quyền action nếu nguồn server cho phép. 401 xóa record và khóa private UI ngay; network/503/429 không tự xóa phiên, 403 của tài nguyên không đăng xuất toàn bộ.

SessionNavigation cho browse/listing công khai và profile/compose có guard. Intent chỉ contactListing(UUID), createListing hoặc openPrivateProfile, từ chối URL/credential/role/callback. Hủy xóa intent và không chạy mutation. Trước resume re-read resource open state và kiểm tra quyền qua gateway; gateway runtime chưa được nối API domain sẽ từ chối thay vì báo thành công. Cá nhân là đường private thật dùng me hiện có.

Kiểm thử integration `mobile-session-guards.test.ts` dùng AuthApi/AuthCoordinator/SessionNavigation thật, HTTP NestJS/PostgreSQL thật; listing metadata và membership resolver là tài nguyên chỉ trong test. Bao phủ public/401, restore, return ID, đổi membership giữa hai lần resume403, revoke→login, restriction giữ credential và cancel không phát write ngoài login/logout. Không dùng fixture làm bằng chứng publication/chat thật đã hoạt động.

## Chạy kiểm tra

```powershell
pnpm typecheck
pnpm test
pnpm --filter studentmart-backend build
pnpm --filter studentmart-backend test:integration
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
pnpm --filter studentmart-mobile exec expo install --check
pnpm --filter studentmart-mobile exec expo export --platform all --output-dir dist
# Trong mobile/:
pnpm dlx expo-doctor@latest
```

Integration tạo email UUID `@example.invalid`, cleanup đúng AuthSession/Account do test tạo, không tự migrate/reset dữ liệu. Export/Doctor không xác nhận thao tác native. Cần kiểm tra trên điện thoại: bootstrap/foreground, keyboard/autofill, Back/hủy login, storage lỗi, expire/revoke và A → B. Sau khi API domain thật có, bổ sung thử list/search/detail public, liên hệ đúng tin, block/permission thay đổi và không tự gửi tin/bài.

Kết quả ngày 2026-11-14: 54 contract + 20 unit BE + 58 unit FE = **132 test PASS**, **11 integration PostgreSQL PASS**; typecheck FE/BE, backend build, database check, Expo dependency check, export Android/iOS và Expo Doctor **20/20 PASS**. Database không pending/schema drift, không migration mới. Full-app smoke của backend xác nhận các route public còn hoạt động và private me401 khi thiếu bearer. Chưa có xác nhận thao tác native của #92 trong phiên này.

## GitHub workflow

#92/#93/#94 đã chuyển In Progress khi bắt đầu. Khi PR có code/test/AC matrix sẵn, chuyển Review, giữ các checkbox phụ thuộc live chưa hoàn tất và ghi rõ #5/#7/#23. Không đóng issue, không đánh Done, không auto-merge. PR base main chờ người dùng review/approve; approval của PR #114 không áp dụng cho PR mới.
