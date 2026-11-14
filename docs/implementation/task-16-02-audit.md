# Nghiệm thu TASK-16.02 — #86, #87, #88

Đối chiếu nội dung GitHub của ba issue với code trên nhánh `feat/task-16-02-be-register`, ngày 2026-11-13. Tại thời điểm đối chiếu, cả ba issue đang OPEN. Tài liệu ghi bằng chứng triển khai cục bộ và xác nhận trên thiết bị do người dùng cung cấp; không tự coi là đã merge.

## Phát hiện trước khi sửa

- #87 đã có API đăng ký, Account, migration và test PostgreSQL.
- #88 chưa có implementation: `mobile/App.tsx` chỉ hiển thị shell và nút kiểm tra health. Vì vậy #86 chưa đủ FE/BE, không thể coi cả task đã xong chỉ từ kết quả #87.
- `mobile/.env` chưa tồn tại; cấu hình cũ dùng localhost trên iOS hoặc địa chỉ emulator trên Android, không phù hợp điện thoại thật. Mẫu env cũng đặt localhost. Trên điện thoại, localhost trỏ về chính điện thoại.

## Đối chiếu sau thay đổi

| Tiêu chí | Implementation/bằng chứng | Trạng thái |
|---|---|---|
| Account + migration chỉ phần thiếu | Migration CreateAccount và EnforceNormalizedAccountEmail đã apply; schema được kiểm tra trong integration | PASS BE |
| Email normalize + unique khi đồng thời | Service trim/lowercase; CHECK + unique PostgreSQL; hai HTTP request trả một 201 và một 409 | PASS |
| Hash, không lưu/trả password thô | Scrypt + salt, hidden hash, DTO whitelist, test kiểm tra hash và password có khoảng trắng | PASS |
| Server validation, MEMBER, không tự verify | Strict input; role/verification injection trả 400; response MEMBER/UNVERIFIED | PASS |
| Form và validation FE | Màn hình đăng ký có tên/email/password/confirm; Unicode code points, exact confirmation, bàn phím email, toggle password | Code + unit PASS; tương tác native cần kiểm tra thiết bị |
| Loading, disable, chống submit lặp | Model chặn đồng bộ ngay khi submit; button/input disabled; test gọi submit ba lần chỉ một HTTP request và một Account | PASS automated |
| Lỗi email/field/network và giữ form | Mapping 400/409/429/5xx, timeout 15 giây; giữ input khi lỗi, không tự retry POST, không điều hướng khi lỗi | PASS automated |
| Chỉ chuyển sau thành công server | Client yêu cầu 201 và dữ liệu MEMBER/UNVERIFIED; reset password, chuyển màn hình đăng nhập với email prefill | Model/API PASS; cần kiểm tra điều hướng UI trên thiết bị |
| Không tự cấp phiên/verify | Không lưu credential; không gửi confirm/role/verify; đăng ký không đăng nhập | PASS |
| Tích hợp FE client ↔ HTTP ↔ PostgreSQL | Integration tự động dùng HTTP thật + PostgreSQL; người dùng xác nhận tạo tài khoản thành công trên điện thoại qua Expo | PASS automated và luồng thành công trên điện thoại theo xác nhận người dùng |
| API docs khớp | Swagger chỉ có health/register; schema đăng ký từ hợp đồng OpenAPI, unit docs + API integration | PASS |
| Safe area, bàn phím, font scaling và QR trên điện thoại | Android/iOS export thành công; người dùng đã kết nối Expo, thấy màn hình đăng ký và tạo tài khoản | QR/hiển thị/đăng ký thành công đã xác nhận; chi tiết keyboard/font scaling/safe area chưa xác nhận |

Kết luận: phần BE #87 đã có implementation và bằng chứng tự động. Phần FE #88 đã được bổ sung và người dùng đã xác nhận luồng đăng ký thành công trên điện thoại. Các trường hợp lỗi/submit lặp trên UI, điều hướng sau thành công và chi tiết bàn phím/bố cục vẫn cần xác nhận riêng trước khi chốt nghiệm thu #86/#88. Đăng nhập API/session nằm ngoài #86, thuộc TASK-16.03; màn hình đăng nhập hiện là đích điều hướng có thông báo tính năng chưa sẵn sàng.

## Xác nhận trên điện thoại từ người dùng — 2026-11-13

Người dùng xác nhận: kết nối được Expo trên điện thoại, đã thấy màn hình đăng ký và tạo tài khoản thành công. Đây là bằng chứng thủ công từ người dùng, không phải thao tác thiết bị do agent thực hiện. Chưa cung cấp hệ điều hành/model máy hoặc xác nhận riêng các ca email trùng, dữ liệu sai, mất mạng, submit lặp và điều hướng sau thành công. Không ghi email hoặc mật khẩu tài khoản thử vào tài liệu.

## Kết nối Expo trên điện thoại

App dev lấy `Constants.expoConfig.hostUri` khi EXPO_PUBLIC_API_URL trống; bỏ cổng Metro và dùng 3000. Biến public được đặt rõ vẫn được ưu tiên. Không hardcode IP. Metro tunnel không chuyển tiếp API, nên trường hợp tunnel phải cấu hình API origin truy cập được riêng.

Kiểm tra từ máy trong phiên này: IPv4 Ethernet `192.168.1.53`; health qua localhost và `192.168.1.53:3000` đều 200. Manifest Metro ở `192.168.1.53:8081` trả hostUri cùng IP. Đây là bằng chứng truy cập từ máy tính, chưa chứng minh điện thoại qua được firewall/router. Trên điện thoại mở `http://192.168.1.53:3000/health` để kiểm tra; IP có thể đổi sau khi thay mạng.

Sau khi thêm dependency, Metro đang chạy giữ cache cũ và trả 500 UnableToResolveError với safe-area-context. Đã xác minh và restart đúng process Expo cổng 8081 bằng `expo start --lan --clear --port 8081`; backend tiếp tục trả 200. Bundle dev Android và iOS trên chính Metro LAN hiện tại đều trả 200, chứa màn hình đăng ký và model mới. Metro đang chạy nền; có thể reload/mở lại project trong Expo Go tại `exp://192.168.1.53:8081`.

Hướng dẫn reload, env, Expo Go, firewall, Local Network và bài kiểm tra thủ công: [mobile README](../../mobile/README.md#kiểm-tra-điện-thoại-sau-khi-quét-qr).

## Lệnh kiểm tra

```powershell
pnpm typecheck
pnpm test
pnpm --filter studentmart-backend test:integration
pnpm --filter studentmart-mobile exec expo install --check
pnpm --filter studentmart-mobile exec expo export --platform all --output-dir dist
# Từ mobile/:
pnpm dlx expo-doctor@latest
```

Đã PASS: 54 contract test, 16 unit BE, 16 unit FE; dependency check, Expo Doctor 20/20, export Android/iOS, typecheck FE/BE, bộ integration PostgreSQL (3 test, gồm client mobile gửi HTTP thật). Test không reset database hoặc tự apply migration; chỉ xóa đúng email UUID do test tạo.
