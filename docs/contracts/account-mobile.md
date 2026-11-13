# TASK-16.01 — Hợp đồng tài khoản phía mobile

Truy vết: [#83](https://github.com/L02-VibeCode/StudentMart/issues/83), ticket FE [#85](https://github.com/L02-VibeCode/StudentMart/issues/85), phối hợp ticket BE [#84](https://github.com/L02-VibeCode/StudentMart/issues/84); R01, R06 → US01, US06.

Tài liệu này chốt hành vi cần triển khai cho TASK-16.02–16.10. Các endpoint, lưu phiên và màn hình dưới đây là hợp đồng cho bước tiếp theo; mobile hiện mới có màn hình kiểm tra `GET /health`. Chưa có auth UI, navigation, SecureStore hoặc auth repository được triển khai trong ticket này.

Nguồn giao tiếp chung là [accounts.openapi.yaml](accounts.openapi.yaml); mô hình lưu trữ và kế hoạch migration ở [account-model.md](account-model.md). Khi có thay đổi hợp đồng, sửa cả ba tài liệu trong cùng thay đổi trước khi FE/BE triển khai.

## 1. Phạm vi và quyết định tích hợp

- App dùng React Native, Expo SDK 58, React 19.3 và pnpm. Giữ entrypoint `mobile/index.ts`.
- Đăng ký/đăng nhập dùng email thông thường và mật khẩu. Xác thực email trường là luồng riêng của TASK-18, không phải điều kiện đăng nhập, đăng tin hoặc chat.
- API nghiệp vụ có prefix `/api/v1`. `EXPO_PUBLIC_API_URL` tiếp tục là origin không có prefix, ví dụ `http://10.0.2.2:3000`; repository ghép `/api/v1` đúng một lần. `/health` vẫn ngoài prefix.
- Credential là opaque bearer token, server sinh ngẫu nhiên 32 byte và encode base64url. Mobile gửi `Authorization: Bearer <token>`; không decode như JWT.
- Phiên hết hạn tuyệt đối sau 30 ngày, không gia hạn trượt, không có refresh token/refresh endpoint. Server kiểm tra thời hạn và quyền ở mỗi API riêng.
- Mobile chọn Expo SecureStore để lưu credential. Dependency này chưa có trong manifest; TASK-16.03 phải cài phiên bản tương thích Expo qua pnpm/Expo và kiểm tra trên nền tảng đã chọn.
- SecureStore không bật biometric gating mặc định; cơ chế sinh trắc học không thuộc phạm vi quyết định lần này.
- Không bổ sung Google Auth, camera hay đổi thư viện auth/state/navigation như một phần ngầm của hợp đồng này.

## 2. DTO và quy tắc ánh xạ

Tên field dùng camelCase, identifier dùng UUID string, timestamp dùng ISO 8601 UTC; giá trị thiếu có `null` theo schema, không đổi thành chuỗi rỗng trong repository.

| DTO | Field mobile nhận | Cách dùng |
|---|---|---|
| `PrivateAccount` | `id`, `email`, `displayName`, `role`, `avatarUrl`, `declaredSchool`, `area`, `bio`, `schoolVerification`, `createdAt`, `updatedAt` | Chỉ dữ liệu của account đang xác thực; dùng cho auth state, Cá nhân và chỉnh sửa |
| `PublicAccount` | `id`, `displayName`, `avatarUrl`, `declaredSchool`, `bio`, `schoolVerification` | Hồ sơ chủ tin; không suy diễn thành hồ sơ riêng |
| `Session` | `token`, `expiresAt` | Chỉ token được dùng cho bearer; `expiresAt` hỗ trợ UI/local cleanup, không chứng minh quyền |
| `LookupItem` | `id`, `code`, `name` | Chọn trường/khu vực bằng `id`; hiển thị `name`; không gửi nhãn thay ID |

`declaredSchool` và `area` trong account response là `{ id, name } | null`. `avatarUrl` và `bio` là `string | null`. `role` có `MEMBER | ADMIN`; role không tách người mua/người bán.

`PrivateAccount.schoolVerification` có `{ status, school, verifiedAt }`, trong đó `status` là `UNVERIFIED | VERIFIED`, `school` là `{ id, name } | null`, `verifiedAt` là ISO timestamp hoặc `null`. Bản public chỉ có `{ status, school }`; không chứa địa chỉ email trường hoặc thời điểm xác thực. `declaredSchool` độc lập với `schoolVerification.school`; không tự ghi đè trường tự khai bằng trường đã verify.

Mobile chỉ render nhãn verify theo response server. Dòng giải thích nhãn phải nói đúng rằng người dùng đã truy cập email trường được hỗ trợ; nhãn không bảo đảm danh tính, uy tín hoặc chất lượng đồ dùng. Không có cờ tự tính `isTrusted`, không tự cấp nhãn sau register hay đổi trường tự khai.

Trước khi TASK-18 có nguồn verify thực, server trả `UNVERIFIED` với `school`/`verifiedAt` là null trong private projection, `school` null trong public projection. Khi `VERIFIED`, các giá trị tương ứng phải có dữ liệu nguồn thực.

Public DTO không được có email login, email trường, role, area, timestamp của account, password/hash, token/session hoặc địa chỉ riêng. Screen public không tái sử dụng object `PrivateAccount` rồi chỉ ẩn vài field bằng UI.

## 3. Request và validation trên form

Validation FE giúp phản hồi sớm; backend vẫn là nguồn kiểm tra và lưu dữ liệu cuối cùng. FE hiển thị lỗi field từ error envelope của API, dùng đúng key của request.

Độ dài v1 tính theo Unicode code point để khớp JSON Schema: JavaScript dùng `Array.from(value).length`, không dùng riêng `value.length` khi có surrogate pairs. Không Unicode-normalize mật khẩu; giữ nguyên chuỗi người dùng nhập kể cả whitespace và case.

| Request/field | Quy tắc FE | Dữ liệu gửi |
|---|---|---|
| Register `email` | Trim, lowercase; đúng định dạng email, tối đa 254 ký tự | Email đã chuẩn hóa |
| Register/login `password` | 8–128 ký tự theo hợp đồng; không trim hoặc đổi case | Chuỗi người dùng đã nhập, chỉ trong request qua HTTPS khi triển khai thật |
| Register `displayName` | Trim, 1–100 ký tự sau trim | Tên đã trim |
| Form `confirmPassword` | So khớp password chính xác, không trim | Chỉ tồn tại trong form; không gửi API hoặc lưu |
| Profile `displayName` | Trim, 1–100; không chấp nhận null/rỗng | Gửi khi thay đổi |
| Profile `declaredSchoolId`, `areaId` | UUID từ lookup đã được duyệt hoặc null | ID để chọn; null để bỏ lựa chọn |
| Profile `bio` | Trim; tối đa 500 ký tự; rỗng được chuyển null | Chuỗi hoặc null |

Register chỉ gửi `{ email, password, displayName }`; không gửi role, verify, profile của người khác hoặc field ngoài whitelist. Login gửi `{ email, password }`. Trường hợp field sai hiển thị lỗi tương ứng, không tự sửa mật khẩu nhằm làm validation qua.

`PATCH /accounts/me` chỉ nhận `displayName`, `declaredSchoolId`, `areaId`, `bio`. Gửi các field đã thay đổi; field vắng mặt giữ nguyên, null xóa lựa chọn/giới thiệu. Object rỗng hoặc field ngoài whitelist là 400; không có `accountId` trong request để quyết định người bị sửa. Nút Lưu bị vô hiệu hóa khi form chưa đổi hoặc đang gửi; lỗi giữ lại nội dung. Có xác nhận khi rời màn hình còn thay đổi chưa lưu.

Avatar dùng `PUT /accounts/me/avatar`, multipart field `file`, tối đa 5 MiB (5,242,880 byte), JPEG/PNG/WebP. Client kiểm tra để phản hồi sớm nhưng server kiểm tra nội dung thật, loại và size. `DELETE /accounts/me/avatar` trả 204 rồi mobile lấy lại hồ sơ. Không tự cập nhật avatar trong cache như đã thành công trước phản hồi; hủy picker hoặc upload lỗi giữ avatar đang có. Nguồn ảnh chỉ từ thư viện trong phạm vi TASK-16.08.

Trường/khu vực lấy từ `GET /catalog/schools` và `GET /catalog/areas`, mỗi response `{ items: LookupItem[] }`, không paging trong v1, sắp theo `name` rồi `id`. Dữ liệu do TASK-15 chốt; không tạo danh sách giả để nghiệm thu. Khi lookup chưa có hoặc lỗi, giữ lựa chọn hiện tại, cho thử lại và ghi rõ phụ thuộc chưa tích hợp.

TASK-15 [#16](https://github.com/L02-VibeCode/StudentMart/issues/16) hiện chỉ có tiêu chí, chưa cung cấp dataset/ID/seed và bằng chứng duyệt nguồn. Trạng thái CLOSED của issue không chứng minh đã có dữ liệu lookup. Đây là phụ thuộc còn mở cho triển khai, không được thay bằng danh sách trường/khu vực tự đặt.

## 4. Ma trận màn hình, API và quyền

Các đường dẫn trong bảng đều nằm dưới `/api/v1`. Tên màn hình dưới đây là ngữ nghĩa điều hướng, chưa quyết định thư viện router.

| Màn hình/hành động | API | Quyền và kết quả | Task triển khai |
|---|---|---|---|
| Đăng ký | `POST /auth/register` | Khách; 201 `{ account: PrivateAccount }`, không tạo session; chuyển sang đăng nhập | 16.02 |
| Đăng nhập | `POST /auth/login` | Khách; 200 `{ account: PrivateAccount, session: Session }`; lưu credential rồi xác lập danh tính | 16.03 |
| Khởi động/khôi phục phiên | `GET /accounts/me` | Bearer hợp lệ; 200 `{ account: PrivateAccount }`; không tin chỉ dữ liệu local | 16.04 |
| Đăng xuất | `POST /auth/logout` | Bearer đúng format, token 43 ký tự base64url; 204 cho phiên active/unknown/revoked/expired; thiếu hoặc sai format header/token là 401 | 16.05 |
| Cá nhân | `GET /accounts/me` | Chủ phiên; loading/error/retry, không cho client chọn account khác | 16.06 |
| Chỉnh sửa hồ sơ | `PATCH /accounts/me` | Chủ phiên; 200 `{ account: PrivateAccount }`, cập nhật cache từ response đã xác nhận | 16.07 |
| Chọn trường/khu vực | `GET /catalog/schools`, `GET /catalog/areas` | Public; 200 `{ items }` từ nguồn TASK-15 | 16.01, 16.07 |
| Thay avatar | `PUT /accounts/me/avatar` | Chủ phiên; 200 `{ account: PrivateAccount }` | 16.08 |
| Xóa avatar | `DELETE /accounts/me/avatar` | Chủ phiên; 204, trở về avatar mặc định sau xác nhận và nạp lại profile | 16.08 |
| Hồ sơ chủ tin | `GET /accounts/{accountId}` | Public; 200 `{ account: PublicAccount }`, không có nút sửa hồ sơ người khác | 16.09 |
| Xem danh sách/tìm kiếm/chi tiết tin | API thuộc TASK-05/06 | Khách được xem nội dung công khai; không gọi API auth chỉ để xem tin | 16.04 phối hợp |
| Đăng tin/chat/dữ liệu riêng | API thuộc task chức năng tương ứng | Cần phiên và quyền server; guard mobile chỉ điều phối UX | 16.04 phối hợp |
| Xác thực email trường | Hợp đồng TASK-18 | Điểm điều hướng riêng; không nhét thay đổi email trường vào PATCH hồ sơ | 16.06 phối hợp |

## 5. Máy trạng thái phiên

| State | Điều kiện | Hành vi được phép |
|---|---|---|
| `checking` | Đang đọc SecureStore hoặc xác minh token với `/accounts/me` | Hiển thị chờ, không chớp màn hình login và không phát request riêng đồng thời |
| `guest` | Không có credential hoặc đã logout cục bộ | Xem nội dung public; có thể mở đăng nhập/đăng ký |
| `authenticated` | Login hoặc `/accounts/me` đã xác nhận phiên của account hiện tại | Mở chức năng riêng theo quyền server và account scope |
| `offline` | Có credential nhưng chưa xác minh do lỗi mạng/timeout hoặc dịch vụ tạm lỗi | Giữ credential để thử lại, cho nội dung public, không coi local token là xác minh quyền riêng |
| `expired` | Server trả `SESSION_EXPIRED`, token bị từ chối hoặc local `expiresAt` đã qua | Xóa credential/private state theo epoch hiện tại, thông báo cần đăng nhập lại và giữ intent hợp lệ |

Khởi động không có credential → `guest`. Có credential còn hạn local → `checking` → gọi `/accounts/me`; 200 → `authenticated`, lỗi mạng/503 → `offline`, 401 → `expired`. Local timestamp hết hạn là lý do ngừng dùng token, không phải nguồn cấp quyền. Từ `offline`, thử lại khi người dùng yêu cầu hoặc khi mạng trở lại bằng một request xác minh tại một thời điểm.

Không xóa phiên chỉ vì timeout, mất mạng, 429 hoặc 5xx. 403 nghĩa là thiếu quyền thao tác cụ thể; không tự logout toàn bộ hoặc xóa draft. Khi server xác nhận phiên không còn hợp lệ, chỉ xử lý nếu response vẫn thuộc epoch/account đã gửi request.

Trạng thái đang gửi form là state riêng trong ViewModel, không thay `authenticated` thành `checking` cho mọi request profile. Hạn chế quyền cụ thể có thể được backend trả 403 ngay cả khi role hoặc verify không đổi; UI không suy ra rằng nhãn verify đủ cấp quyền.

## 6. Lưu phiên và phân vùng dữ liệu

TASK-16.03 triển khai một SecureStore record versioned, ví dụ key `studentmart.auth.session.v1` chứa `{ token, expiresAt, accountId }`. Không lưu password, confirmPassword hoặc toàn bộ response profile trong record. `accountId` chỉ hỗ trợ phân vùng local, phải đối chiếu với `GET /accounts/me` trước khi mở state xác thực.

- Không lưu bearer token trong AsyncStorage, log, URL, ảnh chụp test, analytics hoặc `EXPO_PUBLIC_*`.
- Không hứa phiên sống qua uninstall/reinstall; khi mở app luôn xác minh với server. Cơ chế xóa/khôi phục SecureStore phải được kiểm tra thực tế trên nền tảng đã chọn.
- Khi lưu SecureStore sau login thất bại, không báo đã lưu phiên hoặc mở state authenticated bền vững. Xóa credential/state vừa tạo và cố gắng logout token mới; báo lỗi lưu phiên và cho thử lại có chủ đích.
- Đọc SecureStore lỗi không đồng nghĩa backend từ chối token; đưa app về màn hình có lỗi khôi phục và đường đăng nhập lại an toàn, không log nội dung record.
- Profile/cache/draft/pending message chia khóa hoặc vùng theo account ID. Danh mục public được cache riêng; không xóa danh mục công khai hoặc dữ liệu người dùng trên server khi logout.

Danh tính private đã xác minh giữ trong memory; không persist nguyên login/register/private-profile response. Các response đó có `Cache-Control: no-store`, và HTTP cache không được lưu lại. Persistence draft/pending message theo tài khoản là dữ liệu ứng dụng riêng với chính sách phân vùng và cleanup, không phải nơi lưu credential hoặc dump response hồ sơ.

Auth coordinator giữ `authEpoch` tăng mỗi lần logout, chuyển account hoặc thay credential. Request riêng chụp `{ accountId, authEpoch }` lúc gửi, gắn AbortController và chỉ cập nhật state/cache nếu snapshot còn khớp khi nhận response. Epoch ngăn response của A ghi vào cache hoặc màn hình của B, kể cả khi abort đã quá muộn. Tác vụ upload và background retry cũng áp dụng quy tắc này.

Chỉ giữ một thao tác login/restore đồng thời. Khi đăng nhập B sau A, dọn vùng dữ liệu A và navigation riêng trước khi công bố state B. Không phát lại pending request/draft của A dưới credential B.

## 7. Return-to intent và logout

Return-to intent là dữ liệu ngữ nghĩa nội bộ, ví dụ `{ action: "contactListing", listingId }` hoặc `{ action: "createListing" }`. Chỉ cho phép action/ID đã được định nghĩa, không lưu credential, nội dung chat, arbitrary URL hoặc callback thực thi từ đầu vào không tin cậy.

Khách chọn Liên hệ → lưu intent → mở login → login thành công → nạp đúng tin và kiểm tra lại khả năng thao tác. Quay về đúng ngữ cảnh hoặc mở form/hội thoại; không tự gửi tin nhắn hay đăng bài. Hủy login xóa intent dành cho lần điều hướng đó. Nếu tin đã đóng/bị gỡ/quyền thay đổi, hiển thị trạng thái thực tế và bỏ intent không còn thực hiện được.

Logout được xác nhận bằng UI trước khi bắt đầu. Khi người dùng đồng ý:

1. Chụp token đang dùng cho request thu hồi; tăng epoch và chặn request riêng mới.
2. Xóa credential/private state, reset navigation về guest, abort request, đóng kết nối chat riêng nếu đã tích hợp và hủy retry có account scope.
3. Gửi logout bằng token snapshot; request này không được dùng credential mới nếu B đã đăng nhập.
4. Cập nhật điểm tích hợp tháo push binding với TASK-19. Response logout chỉ ảnh hưởng epoch cũ; không được logout B.
5. Offline vẫn dọn trạng thái cục bộ. Hiển thị đúng rằng app đã đăng xuất trên thiết bị, còn phiên server chưa được xác nhận thu hồi và có thể còn hạn đến khi hết hạn tuyệt đối. Không lưu token cũ thành hàng chờ plaintext để retry sau.

Nếu SecureStore xóa thất bại, vẫn khóa quyền và dữ liệu riêng trong process hiện tại nhưng không báo cleanup credential bền vững đã hoàn tất. Hiển thị lỗi cần thử lại xóa an toàn; kiểm tra trường hợp đóng/mở app ở bước nghiệm thu để không che giấu nguy cơ khôi phục record cũ.

## 8. Error envelope, loading và retry

Response lỗi chung:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thông tin chưa hợp lệ.",
    "fields": { "displayName": "Tên hiển thị không được để trống." },
    "requestId": "request-example"
  }
}
```

`fields` là optional; các field khác bắt buộc theo schema. Dùng `code` để điều khiển luồng, `fields` để đặt lỗi form, `message` làm thông báo an toàn. Không điều hướng bằng việc so khớp câu lỗi. Giữ `requestId` để báo lỗi hỗ trợ nhưng không gắn token/password vào log.

| Error code/nhóm | Hành vi mobile |
|---|---|
| `VALIDATION_ERROR` | Hiển thị lỗi field hoặc lỗi chung, focus field đầu khi phù hợp; giữ dữ liệu người dùng cần sửa |
| `EMAIL_ALREADY_EXISTS` | Đánh dấu email và gợi ý đăng nhập; không tự login hoặc kết luận request trước thành công |
| `INVALID_CREDENTIALS` | Thông báo thông tin đăng nhập không đúng; không chỉ ra account có tồn tại hay không |
| `UNAUTHENTICATED`, `SESSION_EXPIRED` | Hết phiên ở API riêng → cleanup theo epoch và yêu cầu login; không dùng vòng lặp refresh token |
| `FORBIDDEN` | Báo không có quyền với thao tác, không tự cấp role/verify hoặc retry cùng request vô hạn |
| `NOT_FOUND` | Trạng thái hồ sơ/tài nguyên không tồn tại hoặc không được hiển thị theo API, có đường quay lại |
| `RATE_LIMITED` | Tôn trọng `Retry-After`, tạm chặn thao tác và thông báo chờ; không tự gửi liên tục |
| `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` | Báo chọn lại ảnh đúng giới hạn/định dạng; avatar hiện có vẫn giữ |
| `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, lỗi mạng/timeout | Lỗi có thể thử lại, không coi như credential bị thu hồi; giữ form/intent phù hợp |

Tất cả form có một request đang xử lý, disable nút tránh submit lặp và feedback accessibility. Không lưu password khi rời form hoặc đưa app về guest; không lưu confirmPassword. Retry GET/profile/lookup theo hành động người dùng hoặc chính sách có giới hạn. Không tự retry register/login sau timeout khi chưa biết server đã tạo account/session hay chưa; cho thử lại có chủ đích, giải thích email trùng khi cần. Không tự đăng lại bài/gửi tin khi return-to intent được khôi phục.

Không tự retry bất kỳ mutation nào (register, login, logout, PATCH profile hoặc upload/delete avatar) ở HTTP interceptor. Với kết quả chưa rõ, tải lại dữ liệu hiện tại khi có thể trước khi người dùng chủ động thử mutation tiếp theo. Baseline rate limit được chốt cho bước triển khai: login có hai bucket độc lập, tối đa 5 lần thất bại/15 phút cho mỗi IP và tối đa 5 lần thất bại/15 phút cho mỗi HMAC(email đã chuẩn hóa); chạm một trong hai giới hạn là bị giới hạn. Register tối đa 5 request/15 phút/IP. Response 429 có `Retry-After` là số giây nguyên không âm; UI không tự bypass bằng thay đổi request. Các giới hạn này chưa được triển khai trong ticket tài liệu #83.

## 9. Bố trí triển khai và kiểm tra giao diện

Feature auth/profile dùng `presentation/` cho Screen và ViewModel hook, `business/` cho model/state/action, `data/` cho API DTO mapping/repository. Auth coordinator dùng điểm bootstrap/workflow dùng chung; screens không đọc SecureStore hay gọi fetch trực tiếp. Chưa thêm thư viện router/state để thực hiện tài liệu này.

Khi có Figma được cung cấp cho ticket màn hình, đối chiếu frame thật trước triển khai. Ticket này chưa truy cập/đánh giá pixel theo Figma và không tuyên bố UI đã đạt thiết kế. Form native cần safe area, keyboard, chữ tiếng Việt, font scaling, nhãn accessibility, trạng thái focus và nút đủ vùng chạm. Các tiêu chí này trở thành checklist của ticket UI tương ứng, không yêu cầu dựng màn hình trong #83.

## 10. Ma trận nghiệm thu dành cho bước triển khai

| Ca kiểm tra | Kết quả cần chứng minh | Ticket |
|---|---|---|
| Register hợp lệ/trùng email/validation bypass | Đúng một account, field thống nhất FE/BE, không tự tạo phiên/verify | 16.02 |
| Login đúng/sai và SecureStore ghi lỗi | Đúng danh tính; không tạo authenticated state giả, không lưu password | 16.03 |
| Mở app có token còn hạn/hết hạn/đã revoke | Có checking; `/me` quyết định quyền; token vô hiệu bị loại | 16.04 |
| Mở app offline với credential | Không mất credential chỉ vì mạng, không tự cấp quyền từ dữ liệu local; retry restore được | 16.04 |
| Khách liên hệ tin rồi login/hủy login | Quay đúng ngữ cảnh; hủy không tự gửi tin/đăng bài | 16.04 |
| Logout A, response A về muộn, login B | Không còn cache/navigation/response riêng của A trên phiên B | 16.05 |
| Logout offline và lỗi xóa SecureStore | UI phản ánh đúng giới hạn server/local; không báo xóa bền vững khi chưa thành công | 16.05 |
| Logout token unknown/revoked/expired và header sai | Token đúng format vẫn nhận 204 idempotent; thiếu/sai format header/token nhận 401 | 16.05 |
| Profile trống avatar/bio và lỗi tải | Fallback đúng, có retry, không thống kê giả | 16.06 |
| Edit profile/lỗi lưu/field role hoặc verify injection | Mở lại thấy dữ liệu đã xác nhận; lỗi giữ form; API từ chối field cấm | 16.07 |
| Chọn/hủy/upload lỗi/xóa avatar | Giữ avatar cũ khi lỗi/hủy, xóa về mặc định sau server xác nhận | 16.08 |
| Public profile và account không tồn tại | Khách xem được field cho phép, không nhận dữ liệu private hoặc nút edit | 16.09 |
| Tài khoản chưa verify trường | Các luồng đăng nhập/tài khoản và thao tác có quyền vẫn dùng được | 16.10 |

Bằng chứng hiện tại của #83 là tài liệu contract/mô hình và rà soát tính nhất quán; chưa có kết quả chạy các luồng auth trên thiết bị. Khi nghiệm thu 16.10, ghi thiết bị/emulator, OS, build, môi trường/mạng, bước chạy, kết quả và lỗi còn lại; liên kết sang TASK-24. Typecheck hoặc export bundle không thay thế kiểm tra UI, SecureStore và phân vùng dữ liệu trên thiết bị.
