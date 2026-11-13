# TASK-16.01 — Đối chiếu thiết kế mobile và hợp đồng tài khoản

Phạm vi review: [#85](https://github.com/L02-VibeCode/StudentMart/issues/85) thuộc [#83](https://github.com/L02-VibeCode/StudentMart/issues/83), đối chiếu [accounts.openapi.yaml](accounts.openapi.yaml), [account-mobile.md](account-mobile.md) và [account-model.md](account-model.md). R01/R06 → US01/US06.

## Nguồn đã kiểm tra trực tiếp

Ba ảnh local sau đã được mở bằng công cụ xem ảnh trong phiên review. Chúng là bằng chứng giao diện tham chiếu, không phải bằng chứng app/API đã chạy hoặc review file Figma trực tiếp.

| Nguồn | Nội dung nhìn thấy | Dùng cho review |
|---|---|---|
| [Design system](<../../design/Pasted 2026-11-13 at 12.42.04 PM.png>) | Palette, Inter, spacing/radius, button/input states, cards, navigation, component preview | Màu sắc, typography, form states và accessibility |
| [Đăng nhập/đăng ký](<../../design/Pasted 2026-11-13 at 12.50.27 PM.png>) | Hai form email/mật khẩu; register thêm Họ và tên/xác nhận mật khẩu; liên kết chuyển form | Mapping request và các trạng thái còn thiếu |
| [Cá nhân/chỉnh sửa/verify](<../../design/Pasted 2026-11-13 at 12.52.23 PM.png>) | Profile, edit profile, avatar, trường tự khai, khu vực, verify flow và các lỗi demo OTP | Projection, phân quyền, dữ liệu hồ sơ và ranh giới TASK-18 |

Không thay ảnh, thiết kế UI mới, cài dependency hay sửa runtime trong review này. Công việc triển khai nằm ở TASK-16.02–16.10.

## Ma trận thiết kế → field/API

Các đường dẫn API trong bảng nằm dưới `/api/v1`. Hợp đồng máy đọc quyết định field và quyền; giá trị demo trong ảnh không trở thành seed hoặc dữ liệu tài khoản thật.

| Chi tiết nhìn thấy trong ảnh | Mapping đã chốt | Kết luận và việc cần làm khi triển khai |
|---|---|---|
| Register: “Họ và tên” | `RegisterRequest.displayName` | Đây là tên hiển thị 1–100 ký tự sau trim, không phải xác minh tên pháp lý; không thêm `firstName`/`lastName` vào API |
| Register/login: “Email” | `email` trong register/login | Email thông thường, trim/lowercase, tối đa 254 ký tự; không giới hạn email trường và không cấp nhãn verify từ domain login |
| Register/login: “Mật khẩu” | `password` | 8–128 Unicode code point, không trim/đổi case/Unicode-normalize; icon mắt chỉ đổi hiển thị trong form |
| Register: “Xác nhận mật khẩu” | `confirmPassword` cục bộ | So khớp chính xác với password; không gửi API, không lưu hay log |
| “Tạo tài khoản” | `POST /auth/register` → 201 `{account}` | Không có session trong response; thành công chuyển sang đăng nhập, không tự xác thực email trường |
| “Đăng nhập” | `POST /auth/login` → 200 `{account,session}` | Lưu credential theo SecureStore contract rồi xác lập auth state; không dùng dữ liệu cứng từ ảnh |
| “Đăng ký ngay” / “Đăng nhập” bên dưới form | Điều hướng auth cục bộ | Không phát API chỉ vì đổi form; hủy login phải xử lý return-to intent như mobile contract |
| Cá nhân: avatar và “Linh Nguyễn” | `PrivateAccount.avatarUrl`, `displayName` | Avatar null dùng mặc định; tên từ account hiện tại, không seed tên/ảnh mẫu trong bản nghiệm thu |
| “ĐH Công nghệ Thông tin” kèm “Trường tự khai” | `declaredSchool` | Nhãn đang phân biệt đúng dữ liệu tự khai. Khi edit, gửi `declaredSchoolId` từ lookup TASK-15, không gửi tên trường tự gõ hoặc suy ra verify |
| “KTX khu B” và chọn “Khu vực” | `PrivateAccount.area`, PATCH `areaId` | Khu vực chọn thủ công từ danh sách đã duyệt; không cần GPS; area không nằm trong public profile DTO |
| Badge “Đã xác thực email trường” | `schoolVerification.status` do server trả | Chỉ render VERIFIED khi có nguồn thật. Khi TASK-18 chưa sẵn sàng dùng UNVERIFIED; không lấy badge trong ảnh làm trạng thái mặc định |
| Nội dung giải thích giới hạn badge | Copy mô tả tín hiệu verify | Giữ ý nghĩa chỉ xác nhận quyền truy cập email trường tại thời điểm xác thực, không bảo đảm uy tín/chất lượng; không đổi thành “người bán đáng tin cậy” |
| “Chỉnh sửa hồ sơ” | Nạp `GET /accounts/me`, gửi `PATCH /accounts/me` | Chỉ sửa account của phiên; không nhận accountId tùy ý hoặc role/verify từ form |
| Edit: “Tên hiển thị”, “Trường (tự khai)”, “Khu vực” | `displayName`, `declaredSchoolId`, `areaId` | Khớp whitelist; nullable lookup phải có thao tác bỏ lựa chọn. Frame chưa thể hiện đủ empty/error/loading/clear-selection |
| Giới thiệu bản thân | `bio` trong private/public DTO và PATCH | Không có hàng nhập/hiển thị bio trong các frame profile/edit đang xem. Yêu cầu TASK-16.07 có bio, nên cần bổ sung UI ở ticket thực hiện, không đánh dấu field đã có trong thiết kế |
| “Thay ảnh đại diện” và glyph camera | `PUT /accounts/me/avatar`, multipart `file` | Chỉ picker thư viện trong TASK-16.08; glyph camera không tự cấp phạm vi dùng camera/chụp ảnh |
| Xóa ảnh đại diện | `DELETE /accounts/me/avatar` → 204 | Frame edit chưa có thao tác Xóa ảnh. Cần bổ sung lựa chọn xóa về avatar mặc định, giữ avatar cũ khi hủy/lỗi; không xóa account |
| “Lưu thay đổi” | PATCH chỉ field đã đổi | Chưa thay đổi/đang lưu thì disabled; 200 cập nhật state từ response; lỗi giữ form; object rỗng không gửi |
| “Tin của tôi — 3 đang hiển thị” | Chức năng/listing count thuộc nguồn tin đăng | Đây là dữ liệu demo; contract tài khoản không có field thống kê. Chỉ hiển thị con số khi listing API có nguồn thật, nếu chưa có thì bỏ số và ghi phần tích hợp pending |
| “Cài đặt thông báo”, “Danh sách tài khoản đã chặn” | Điều hướng sang TASK-19/TASK-22 | Không thêm field vào account PATCH hoặc triển khai các module đó trong contract ticket |
| “Đăng xuất” | `POST /auth/logout` và cleanup mobile | Frame mới có nút, chưa có confirm/offline/error. Cần reset navigation/private cache và chống response phiên cũ như hợp đồng |
| Verify: email trường, masked email, OTP, đổi email | Luồng riêng TASK-18 | Không gửi bằng register hoặc PATCH profile; source private verification tách email login, public DTO không lộ email |
| Demo OTP `123456`, timer 04:59 và gửi lại 00:30 | Dữ liệu prototype TASK-18 | Ảnh ghi rõ demo không gửi email thật. Không hardcode OTP/timer thành hành vi auth/runtime, không dùng ảnh làm bằng chứng OTP thật đã chạy |
| Hồ sơ công khai của chủ tin | `GET /accounts/{accountId}` → `PublicAccount` | Ảnh được xem là profile của chính mình, có edit/logout/settings; không tái dùng nguyên màn hình này cho người khác. Screen public phải bỏ email/role/area/private timestamp và các thao tác riêng |

Mật khẩu và tên/giới thiệu dùng đếm Unicode code point (`Array.from(value).length`) theo model/OpenAPI. Không lấy độ dài hoặc rule từ ví dụ input “Tên sản phẩm cần ít nhất 10 ký tự” trong design system để áp lên tên hiển thị tài khoản: đó là ví dụ component của domain tin đăng.

## Các trạng thái chưa được frame auth/profile thể hiện

Design system có biến thể input default/focus/error và button pressed/disabled; các frame auth đang xem là trạng thái mặc định. Error panels ở ảnh profile thuộc verify, không thay thế state của register/login/profile.

| Luồng | Trạng thái phải bổ sung theo contract | Ticket thực hiện |
|---|---|---|
| Register | Inline validation, password mismatch, email trùng, đang gửi, lỗi mạng, thành công rồi chuyển login; chặn submit song song | 16.02 |
| Login | Sai thông tin chung, bị hạn chế, RATE_LIMITED/Retry-After, đang gửi, lỗi mạng/SecureStore; không lộ account có tồn tại | 16.03 |
| Khởi động app | checking trước `/accounts/me`, guest, authenticated, offline chưa xác minh, expired; không nhấp nháy login | 16.04 |
| Quay về tác vụ | Khách chọn liên hệ tin → login → trở đúng tin; hủy không gửi tin/đăng bài; quyền/tin được kiểm tra lại | 16.04 |
| Profile | Loading, lỗi/thử lại, avatar/bio/trường/khu vực trống và account switch; không hardcode avatar, tên, badge hoặc số tin | 16.06 |
| Edit profile | Field bio, bỏ lựa chọn lookup, field error, lỗi lookup, saving, giữ form khi lỗi, unsaved-change confirmation | 16.07 |
| Avatar | Quyền thư viện, hủy picker, invalid/oversize file, upload/loading, lỗi/retry và xóa avatar; không tự retry mutation | 16.08 |
| Logout | Xác nhận, cleanup cục bộ khi offline, lỗi xóa credential bền vững, hủy request/epoch, Back không mở dữ liệu A ở phiên B | 16.05 |
| Public profile | Không tồn tại/không public, loading/error/retry, dữ liệu fallback, chỉ field public và không có edit/settings/logout người khác | 16.09 |

Thiết kế hiện tại chưa cho thấy JSON errors hoặc API calls, vì vậy không thể kết luận validation server/permission đã chạy từ screenshot. Hiển thị lỗi phải dựa `error.code`/`error.fields`, không so khớp message mẫu. Chưa verify trường vẫn được dùng luồng có quyền.

## Accessibility và tính nhất quán cần xử lý

- Design system nêu primary `#F07824`, chữ trắng, và có ghi chú rằng độ tương phản khoảng 2,8:1, chưa đạt AA; yêu cầu duyệt phương án trước phát hành. Tính lại bằng relative luminance từ hai màu thu được khoảng **2,83:1**, nhất quán với ghi chú. Các nút trắng trên cam trong auth/profile cần accessibility review và phương án text/background phù hợp trước nghiệm thu UI; không coi ảnh thiết kế là bằng chứng contrast đạt. Review này không tự thay brand color.
- Typography tham chiếu là Inter hỗ trợ tiếng Việt; chưa có font dependency/runtime trong shell. Nếu tải font phải xác minh bản có đủ glyph và font scaling. Có thể dùng system font fallback theo skill; không tuyên bố đã cài Inter.
- Design system quy định primary button cao 48 px, input 52 px, lề ngang 16 px, section gap 24 px và safe area tách khỏi navigation. Khi chuyển native phải xác minh touch target, bàn phím và màn hình nhỏ; ảnh tĩnh không chứng minh keyboard/focus đã đạt.
- Tabs trong design system dùng “Trang chủ / Danh mục / Đăng tin / Tin nhắn / Cá nhân”; frame profile dùng “Khám phá / Tin của tôi / Đăng tin / Hộp thư / Cá nhân”. Đây là chênh lệch tên/đích điều hướng cần thống nhất khi dựng navigation; không tự tạo route/API mới để khớp cả hai bản.
- Error state cần nội dung và icon/nhãn, không chỉ viền màu. Label input phải luôn nhìn thấy, nút mắt/đổi/xóa avatar có accessibility label; kiểm tra các thao tác này trên thiết bị/emulator ở ticket UI.

## Kết luận review cho #85

Các field email/password/displayName, trường tự khai, khu vực, avatar và badge đã có mapping rõ giữa ảnh và contract. Các khoảng trống được ghi nhận cụ thể: bio, thao tác xóa avatar, clear lookup, loading/error/offline, logout confirmation, public profile và navigation naming. Các khoảng trống này trở thành yêu cầu triển khai/đối chiếu của ticket tương ứng; không đồng nghĩa contract cần thêm field auth ngoài whitelist hoặc tác vụ UI đã hoàn tất.

Bằng chứng của review là ba ảnh local đã xem, bảng mapping và đối chiếu OpenAPI/model/mobile contract. Chưa có app screen thực hiện, runtime API call, kiểm thử SecureStore hoặc test thiết bị trong review này. PR #81 và bất kỳ prototype có dữ liệu mẫu nào vẫn cần được đối chiếu trước khi dùng làm evidence triển khai.
