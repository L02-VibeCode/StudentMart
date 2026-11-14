# TASK-16.01 — Hợp đồng tài khoản và phiên

Baseline v1 cho [#83](https://github.com/L02-VibeCode/StudentMart/issues/83), BE [#84](https://github.com/L02-VibeCode/StudentMart/issues/84), FE [#85](https://github.com/L02-VibeCode/StudentMart/issues/85). Truy vết R01/R06 → US01/US06. Đây là quyết định thiết kế cho các ticket tiếp theo, chưa phải API đã triển khai.

Nguồn máy đọc là [accounts.openapi.yaml](accounts.openapi.yaml); quy tắc mobile ở [account-mobile.md](account-mobile.md). Nếu contract thay đổi, cập nhật cả ba file trước khi FE/BE triển khai khác nhau.

## Hiện trạng được kiểm tra

Runtime note (TASK-16.06 #98/#99, 2026-11-14): the baseline snapshot below describes #83, not the current implementation. Auth/session/registration/logout now exist. GET accounts/me projects current session identity and nullable persisted Account.bio. Migration AddAccountBio1794646099502 adds bio only. School/Area lookup, MediaAsset/avatar and TASK-18 verification have no runtime source yet: return null/UNVERIFIED per contract, without fabricated provider data. Profile edit remains a subsequent ticket; no PATCH implementation is implied here.

Nhánh bắt đầu từ `origin/main` sau PR #113. Backend có entity `Account`, `AccountsService.create()`, migration `CreateAccount1794549817255` và health endpoint. Mobile hiện là Expo shell có kiểm tra `/health`. Chưa có auth controller, session entity, profile fields, lookup seed hay SecureStore dependency. PR #81 là nguồn tham khảo mobile riêng, không được xem là code đã merge/đạt nghiệm thu.

`PublicAccount = Omit<Account, 'passwordHash'>` hiện tại trong service là kiểu nội bộ, **không phải public API DTO** vì vẫn chứa email/role. Các ticket triển khai phải dùng projection whitelist rõ ràng trong OpenAPI, không trả entity trực tiếp.

## Các quyết định đã chốt

| Chủ đề | Baseline v1 | Ticket thực hiện |
|---|---|---|
| Đăng ký | Email thông thường + password + displayName; không yêu cầu email trường; không tự đăng nhập | 16.02 |
| Email | `trim().toLowerCase()`, email hợp lệ, tối đa 254 ký tự; UNIQUE trên giá trị normalize ở PostgreSQL | 16.02 |
| Password | 8–128 ký tự, giữ nguyên whitespace/case/Unicode, hash scrypt với salt riêng; không trả/log credential | 16.02–03 |
| Session | Opaque bearer token, 32 byte ngẫu nhiên, base64url không padding; hash SHA-256 lưu server, không dùng JWT/refresh token | 16.03–05 |
| Thời hạn | Tuyệt đối 30 ngày từ login; không sliding refresh. Hết hạn phải đăng nhập lại; nhiều thiết bị có session riêng | 16.03–04 |
| Mobile storage | Expo SecureStore cho credential nhỏ; memory cho identity đã xác minh; không lưu token bằng storage/cache thông thường | 16.03–05 |
| Route API | Prefix `/api/v1`; Bearer trong Authorization; JSON camelCase, thời điểm ISO 8601 UTC; UUID dạng chuỗi | 16.02–09 |
| Trường và khu vực | ID lookup từ TASK-15; trường tự khai độc lập với trường được xác thực, chọn khu vực thủ công | 16.06–07 |
| Avatar | Chọn thư viện ảnh; file tối đa 5 MiB, JPEG/PNG/WebP, xác minh nội dung server; không thêm camera | 16.08 |
| Role | MEMBER/ADMIN, đăng ký luôn MEMBER; client không được sửa role/verify | 16.02, 16.04, 16.07 |

Lựa chọn opaque token dùng crypto sẵn trong Node + PostgreSQL, tránh khóa thêm thư viện auth trong ticket contract. Token thô chỉ được trả một lần khi login và giữ trong SecureStore ở thiết bị; server chỉ giữ digest. `expiresAt` trả cho client là gợi ý UX, server là nguồn quyết định quyền.

## Ma trận API và quyền

| Method/path (sau `/api/v1`) | Request | Thành công | Quyền và lỗi chính |
|---|---|---|---|
| POST `/auth/register` | RegisterRequest | 201 `{account: PrivateAccount}` | Khách; 400 validation, 409 email trùng, 429 |
| POST `/auth/login` | LoginRequest | 200 `{account, session: {token, expiresAt}}` | Khách; 401 sai thông tin chung, 403 không được phép, 429 |
| POST `/auth/logout` | Không body | 204 không body | Bearer đúng format; thiếu/sai format 401, expired/unknown/revoked vẫn 204 |
| GET `/accounts/me` | Không body | 200 `{account: PrivateAccount}` | Phiên hợp lệ; 401/403 |
| PATCH `/accounts/me` | UpdateProfileRequest | 200 `{account: PrivateAccount}` | Chỉ bản thân; 400 field/lookup không hợp lệ, 401/403 |
| PUT `/accounts/me/avatar` | Multipart chỉ một `file` | 200 `{account: PrivateAccount}` | Chỉ bản thân; 400, 401/403, 413 quá lớn, 415 sai loại |
| DELETE `/accounts/me/avatar` | Không body | 204 không body | Chỉ bản thân; lặp lại an toàn, 401/403 |
| GET `/accounts/{accountId}` | UUID path | 200 `{account: PublicAccount}` | Khách được xem; 400 UUID sai, 404 không có/không public |
| GET `/catalog/schools` | Không body | 200 `{items: [{id,code,name}]}` | Công khai, dữ liệu đã duyệt |
| GET `/catalog/areas` | Không body | 200 `{items: [{id,code,name}]}` | Công khai, không cần GPS |

Lookup v1 là danh sách nhỏ, không paging; sắp `name` rồi `id` để FE hiển thị ổn định. Private/login/register trả `Cache-Control: no-store`; avatar URL phải là URL HTTPS được phép công khai, không là signed URL cho tài nguyên riêng. Các API còn lại của listing/chat/admin được thiết kế ở task sở hữu; guard của 16.04 là điểm tích hợp, không cấp quyền truy cập bằng cách client truyền accountId.

## Validation và lỗi

Các object request dùng whitelist (`additionalProperties: false`); field không được hỗ trợ là 400 thay vì im lặng bỏ qua. `confirmPassword` chỉ tồn tại ở FE, không gửi API. JSON sai cú pháp cũng trả envelope chuẩn 400. Không trim password. Email/displayName/bio được normalize trước validation server; FE làm tương tự để hỗ trợ UX, không thay validation BE. Độ dài chuỗi v1 tính bằng số Unicode code point; phía JS phải dùng `Array.from(value).length` khi cần kiểm tra chuỗi có surrogate pairs để khớp JSON Schema.

- `displayName`: trim, 1–100 ký tự, không toàn khoảng trắng, không null.
- `bio`: trim, tối đa 500 ký tự; `""` chuyển thành null.
- PATCH bỏ field → giữ nguyên; null chỉ để xóa `declaredSchoolId`, `areaId`, `bio`; object rỗng bị từ chối. ID lookup không tồn tại/không còn hỗ trợ → 400 với `fields` tương ứng.
- Có thể bỏ trường/khu vực khi tạo tài khoản và bổ sung sau. Không nhận email login/email trường/role/verify/avatar qua PATCH hồ sơ.
- Các request mutation không được tự động retry mù khi chưa rõ kết quả; nạp lại profile hoặc báo trạng thái chưa rõ để người dùng quyết định. Login retry có thể tạo phiên mới nên UI chặn submit song song.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thông tin chưa hợp lệ.",
    "fields": {"displayName": "Tên hiển thị không được để trống."},
    "requestId": "example-request-001"
  }
}
```

| HTTP | `error.code` | Quy tắc |
|---|---|---|
| 400 | VALIDATION_ERROR | Sai input/JSON/lookup; `fields` tùy trường hợp |
| 409 | EMAIL_ALREADY_EXISTS | UNIQUE PostgreSQL là nguồn sự thật, kể cả đăng ký đồng thời |
| 401 | INVALID_CREDENTIALS | Chỉ login: cùng message/code cho email không tồn tại và password sai |
| 401 | UNAUTHENTICATED | Thiếu/sai format/không có/đã thu hồi session |
| 401 | SESSION_EXPIRED | Session tồn tại nhưng quá expiresAt; đưa về login |
| 403 | FORBIDDEN | Đã xác thực nhưng mất quyền; chưa verify trường không phải lý do cấm |
| 404 | NOT_FOUND | Profile không tồn tại hoặc không được hiển thị |
| 429 | RATE_LIMITED | Header Retry-After (số giây); FE không tự lặp request |
| 413/415 | PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA_TYPE | Avatar vượt giới hạn hoặc nội dung không hợp lệ |
| 503/500 | SERVICE_UNAVAILABLE / INTERNAL_ERROR | Không lộ SQL, stack trace, credentials hoặc chi tiết nội bộ |

`requestId` do server sinh, không dùng ID credential. BE redact Authorization/password/passwordHash/token/tokenHash/multipart bytes khỏi log. Validation message không lặp lại giá trị password/token. Rate-limit v1: login tối đa 5 lần thất bại/15 phút cho mỗi IP và mỗi HMAC của email normalize; register tối đa 5 request/15 phút/IP. Không tạo khóa tài khoản vĩnh viễn; không lưu email thô trong rate-limit log. Secret HMAC phải cấu hình qua env ở ticket triển khai; chưa thêm secret trong ticket này.

## Mô hình dữ liệu và migration dự kiến

| Entity/bảng | Trường/constraint | Quy tắc |
|---|---|---|
| Account (đã có) | UUID id, email varchar(254) UNIQUE, password_hash text, display_name varchar(100), enum role, created_at/updated_at timestamptz | Giữ bảng `"Account"` và migration đã apply. MEMBER mặc định. Hash `select:false` vẫn không thay projection DTO |
| Account (16.03) | login_disabled_at nullable timestamptz, nội bộ server, select:false | Null cho tài khoản được đăng nhập; khi được hệ thống vận hành đặt giá trị, login và API danh tính trả 403. Không nhận từ register/login, không nằm trong DTO, độc lập với xác thực email trường |
| Account (bổ sung) | nullable declared_school_id UUID, area_id UUID, bio varchar(500), avatar_media_id UUID | FK tới lookup/media đã chốt; ON DELETE SET NULL cho profile refs; không xóa account khi xóa avatar |
| AuthSession (mới) | UUID id, account_id UUID FK RESTRICT, token_hash char(64) UNIQUE, created_at/expires_at timestamptz, revoked_at nullable timestamptz | CHECK expires_at > created_at; revoked_at null hoặc >= created_at; index account_id, expires_at; không persist token thô |
| School/Area (TASK-15/catalog) | UUID id, code UNIQUE, name, dữ liệu được duyệt | Giữ stable ID; không cascade xóa Account. Không seed tên/miền giả để vượt qua test |
| MediaAsset (task media) | Ownership, validated format/size, storage reference, trạng thái upload | Avatar chỉ tham chiếu asset hợp lệ của chủ account; provider quyết định trước 16.08 |
| SchoolEmailVerification (TASK-18) | account liên kết email trường, verifiedAt và school đúng nguồn | Không sao chép boolean verify lên Account; response derive từ nguồn verify |

Đây là mô hình dự kiến, chưa có entity/migration mới trong nhánh #83. AuthSession quản lý bởi auth module; Accounts/Profile chịu trách nhiệm profile, catalog sở hữu lookup, media sở hữu asset, TASK-18 sở hữu verification. Tránh hai bảng User/Account cạnh tranh cùng danh tính. Mapping cụ thể MediaAsset/verification cần đọc thiết kế của task sở hữu khi triển khai FK.

Trước khi thêm CHECK email normalize trong migration tiếp theo: kiểm tra dữ liệu email hiện có bằng truy vấn chỉ đọc; nếu có dữ liệu chưa normalize hoặc trùng sau normalize, dừng để xử lý có kiểm soát, không tự xóa/merge account. Service hiện normalize email nhưng constraint hiện tại chỉ UNIQUE, chưa có CHECK normalize; ticket 16.02 cần bổ sung `email = lower(btrim(email))` khi đã xác nhận dữ liệu. Không sửa migration `CreateAccount1794549817255`.

Thứ tự dự kiến: (1) catalog schema/dataset duyệt; (2) bổ sung profile nullable + FKs đủ điều kiện; (3) AuthSession ở 16.03; (4) media FK/avatar ở 16.08 khi media sẵn sàng; (5) source verification ở TASK-18. Có thể tách profile fields độc lập khỏi FKs chưa đủ đầu vào. Mỗi migration có down được review, không bật synchronize. Generation/apply theo skill typeorm-migrations và các wrapper scripts; #83 không chạy add/up hoặc đổi database.

## Vòng đời phiên

1. Register lưu đúng một MEMBER rồi FE chuyển login; response không có session.
2. Login xác minh bằng scrypt async với tham số ghi trong hash, so sánh an toàn, tạo token crypto.randomBytes(32), lưu SHA-256 digest và expiresAt = createdAt + 30 ngày. Với email không tồn tại, dùng dummy hash cùng policy để giảm khác biệt timing. Không đổi scrypt policy của Account đang dùng nếu không có migration/re-hash strategy.
3. Private API hash token được gửi và tìm phiên chưa revoked/chưa hết hạn; lấy account/role từ server mỗi request, không trust state FE. Logout chỉ chấm dứt session được gửi, không logout toàn bộ thiết bị.
4. Restore đọc credential nhỏ từ SecureStore rồi GET me. Trong lúc chờ, chưa cấp quyền private. Offline giữ credential để retry, không suy ra session hợp lệ từ storage; không xóa token chỉ vì timeout/503.
5. Khi 401 xác nhận phiên không hợp lệ, clear local auth/private cache và trở về guest/login. 403 cập nhật quyền, không luôn tự logout.
6. Logout BE revoke session; FE luôn clear local credential/cache/navigation và chặn response cũ kể cả offline. Nếu BE không nhận logout, token cũ còn hiệu lực tới revoke/expiry; phải thông báo đúng giới hạn này. Dừng request mới trước khi clear; xử lý race logout/token-write để token không được ghi lại sau logout.

Transport ngoài development phải dùng HTTPS. Không đặt bearer trong URL/query/deep link hoặc ảnh avatar. Không có refresh endpoint v1; tuyệt đối không retry 401 vô hạn. Account restriction nếu chặn login được kiểm tra server nhưng không biến school verification thành điều kiện đăng nhập.

## Private/public projection

PrivateAccount có email login, role, area, timestamps và private verification timestamp; client chỉ được xem bản thân. PublicAccount chỉ có id, displayName, avatarUrl, declaredSchool, bio và verification `{status,school}`. Public không có email, role, area, timestamp xác thực, token/session/hash/địa chỉ riêng. `declaredSchool` và verified `school` có thể khác nhau; thay trường tự khai không cấp/thu hồi nhãn email.

Trước khi TASK-18 có nguồn xác thực thật, trả UNVERIFIED với school/verifiedAt null; không hardcode VERIFIED, không đoán từ email login. Public profile chưa có listing API thì không trả thống kê hoặc danh sách tin giả; phần đó thuộc phối hợp TASK-06.

## Đầu vào chưa có bằng chứng và phạm vi review

- TASK-15 (#16) hiện có tiêu chí nhưng không có dataset ID/name/domain được đính kèm trong issue; #38 lookup cũng chưa cung cấp dữ liệu. Dùng API và shape lookup đã chốt, nhưng seed thực phải chờ nguồn được duyệt. Đây là dependency cho 16.07/TASK-18, không phải lý do tự đoán tên trường/miền.
- Provider lưu ảnh chưa được chọn; 16.08 phải bổ sung quyết định adapter/storage và cleanup trước triển khai. Contract upload/type/size không phụ thuộc tên provider.
- SecureStore cần được cài bằng expo install ở ticket mobile auth; hiện chưa được cài hoặc kiểm thử thiết bị.
- Tài liệu được đối chiếu FE bởi sub-agent frontend-dev; chưa có human/product review, PR merge hoặc nghiệm thu API runtime. Không đánh dấu #83/#84/#85 Done tự động.

## Nguồn kỹ thuật

- [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3): machine-readable schemas và nullable.
- [Expo SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/): lưu credential native, lưu ý lifecycle/backup; không dùng như nguồn duy nhất của user data.
- [Node crypto](https://nodejs.org/api/crypto.html): randomBytes, SHA-256 digest, async scrypt và timingSafeEqual.

Nguồn kỹ thuật không thay thế quyết định sản phẩm StudentMart hoặc quyền apply database.

## Bằng chứng review và kiểm chứng

Xem [verification.md](verification.md) cho môi trường, công cụ, 40 ca schema payload, kết quả lint/typecheck/unit test và phần chưa được triển khai. Các ticket tiếp theo phải bổ sung evidence runtime thay vì dùng kết quả schema để đánh dấu API đã hoàn thành.
