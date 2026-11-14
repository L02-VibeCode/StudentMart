# StudentMart Mobile

**Kiến trúc:** Three-Layer theo feature, MVVM nhẹ cho UI React Native + Expo.

Ứng dụng dùng Expo SDK 58, React 19.3, React Native 0.88.1 và TypeScript 6. Yêu cầu Node.js 22.13+ (nhánh 22.x), 24.3+ (nhánh 24.x), hoặc 26+.

## Chạy cục bộ

Từ repository root: `pnpm run setup`, sau đó `pnpm run dev`. Hoặc chạy riêng trong `mobile/`: `pnpm install --frozen-lockfile` và `pnpm start`.

Khi chạy dev qua LAN và không đặt `EXPO_PUBLIC_API_URL`, app lấy host từ `expo-constants` (`Constants.expoConfig.hostUri`) rồi dùng cổng 3000. Vì vậy điện thoại quét QR của Metro trên `192.168.1.53:8081` sẽ gọi `http://192.168.1.53:3000`, thay vì localhost của điện thoại. IP thay đổi theo mạng; không hardcode IP máy vào source.

Nếu backend ở máy/cổng khác, dùng Expo tunnel hoặc build release, copy `.env.example` thành `.env` và đặt `EXPO_PUBLIC_API_URL` là origin API không có `/api/v1`. Ví dụ trên điện thoại: `http://192.168.1.53:3000` (thay bằng IPv4 hiện tại của máy chạy backend); release dùng origin HTTPS thật. Giá trị env không rỗng được ưu tiên hơn auto-detect. Android Emulator dùng `http://10.0.2.2:3000`; iOS Simulator dùng `http://localhost:3000`. Expo tunnel chỉ chuyển tiếp Metro, không chuyển tiếp backend. Khởi động lại Expo/reload app sau khi đổi env. Chỉ đặt cấu hình public trong biến `EXPO_PUBLIC_*`.

App khởi động xác nhận credential đã lưu bằng `GET /api/v1/accounts/me`, hiển thị trạng thái kiểm tra và không nhấp nháy login. Sau đó mở khu vực khám phá công khai. Các nút Cá nhân/Đăng tin/Liên hệ yêu cầu phiên đã xác minh; khách được đưa tới login với intent ngữ nghĩa, có thể Hủy để về đúng ngữ cảnh. Đăng ký vẫn chỉ gửi `{email,password,displayName}`, thành công chuyển login, không cấp phiên hoặc verify. Đăng nhập lưu credential rồi nạp đúng danh tính; sai thông tin/lỗi mạng giữ form, chặn submit đồng thời và có cooldown Retry-After.

**Giới hạn domain hiện tại:** API tin đăng/tìm kiếm/chi tiết/chat của #5/#7/#23 chưa được triển khai. Màn hình khám phá có trạng thái chưa tải được tin; gateway mặc định fail closed, không có dữ liệu demo hoặc endpoint giả. Các port nội bộ ListingGateway/return-to intent và test fixture không phải bằng chứng đã tích hợp API domain. Chi tiết AC đã đạt/chưa đạt: [TASK-16.04 #92/#93/#94](../docs/implementation/task-16-04-session-guards.md).

Giao diện dùng React Native primitives và system font, `react-native-safe-area-context` xử lý safe area; `expo-constants` lấy Metro host. Credential dùng `expo-secure-store` ~58.0.3 với plugin trong app.json; Android/iOS dùng `WHEN_UNLOCKED_THIS_DEVICE_ONLY` khi nền tảng hỗ trợ. Các dependency được chọn theo SDK qua `pnpm --filter studentmart-mobile exec expo install expo-constants react-native-safe-area-context expo-secure-store --pnpm`, đã nằm trong manifest/lockfile. Không cần cài riêng khi clone, chỉ `pnpm install --frozen-lockfile`. Với development build cũ, build lại native sau khi thêm SecureStore; Expo Go phải tương thích SDK58. Chưa thêm router/UI kit.

SecureStore lưu một record ở key `studentmart.auth.session.v1`, chỉ gồm `{token,expiresAt,accountId}`. Không dùng AsyncStorage cho credential hoặc lưu password/toàn bộ hồ sơ. Chỉ mở Cá nhân khi `/me` trả đúng ID của phiên, không tin dữ liệu local. Khi ghi SecureStore lỗi, app không công bố đã đăng nhập, thử xóa record và thu hồi token mới. Nếu đọc/xóa record lỗi, app khóa dữ liệu cá nhân và cho thử lại. Lỗi mạng/5xx giữ credential để xác nhận lại, 401/hết hạn xóa phiên; 403 hiển thị bị hạn chế, không tự cấp quyền.

Khi app có phiên trở về foreground, `AppState` buộc xác minh lại; form khách không bị reset chỉ vì autofill/background. `runPrivate` chụp epoch/account, đọc lại me và truyền AbortSignal; thay phiên sẽ abort request cũ và bỏ response đến muộn. 401 loại credential, 403 từ me chuyển trạng thái restricted nhưng giữ credential, 403 của riêng tài nguyên chỉ chặn hành động đó. Policy thực sự vẫn do backend quyết định. Trạng thái kiểm tra/quyền của listing không được mang sang epoch hoặc người dùng mới.

Return intent chỉ cho phép contactListing + UUID, createListing và openPrivateProfile; không nhận URL, token, role, accountId hoặc callback từ input. Sau login phải đọc lại tài nguyên và kiểm tra quyền server trước khi điều hướng. Hủy/Back xóa intent, không tự gửi tin hoặc đăng bài. Trên Android dùng [BackHandler](https://reactnative.dev/docs/backhandler); foreground dùng [AppState](https://reactnative.dev/docs/appstate). Việc nối cổng quyền vào API tin/chat thật còn pending các task domain.

Màn hình Cá nhân hiện hiển thị tên/email/quyền/trạng thái xác thực từ `/me`, chưa có chức năng chỉnh sửa hoặc thống kê tin đăng. **Đổi tài khoản** yêu cầu xác nhận, dọn danh tính và credential trước khi đăng nhập tài khoản khác. Nếu máy chủ chưa xác nhận thu hồi, app thông báo đúng giới hạn này. Epoch và hàng đợi ghi SecureStore ngăn response/ghi phiên cũ làm xuất hiện dữ liệu tài khoản trước.

`pnpm run typecheck` kiểm tra TypeScript; `pnpm test` trong mobile chạy Vitest cho validation, state đăng ký, HTTP adapter và API origin. Từ root, `pnpm test` chạy cả contract/BE/FE; `pnpm --filter studentmart-backend test:integration` kiểm tra client mobile qua HTTP thật tới PostgreSQL (dùng email UUID và cleanup). Xem [ma trận nghiệm thu #86/#87/#88](../docs/implementation/task-16-02-audit.md).

`pnpm run android` mở Android; `pnpm run ios` yêu cầu macOS cho simulator. Dùng Expo Go tương thích SDK 58 từ [expo.dev/go](https://expo.dev/go) hoặc development build; development build cũ cần build lại sau khi nâng SDK. Web chưa được cấu hình trong starter mobile.

### Kiểm tra điện thoại sau khi quét QR

1. Máy tính và điện thoại cùng mạng LAN/Wi-Fi (máy tính có thể dùng Ethernet cùng router). Chạy cả backend và Expo bằng `.\scripts\run.ps1` từ root.
2. Trên trình duyệt điện thoại mở `http://<IPv4-máy-tính>:3000/health`. Phải thấy `{"status":"ok"}`. Có thể mở `/api/docs` để thử API. Nếu không mở được: kiểm tra backend đang chạy và bind `0.0.0.0`, quyền Windows Firewall cho Node/cổng 3000 trên mạng Private, quyền Local Network của Expo Go trên iOS, guest Wi-Fi/AP isolation/VPN. Backend CORS không khắc phục được IP sai hoặc mạng bị chặn trong app native.
3. Reload Expo Go. Nếu vẫn thấy màn hình cũ, dừng Metro rồi chạy `pnpm --filter studentmart-mobile exec expo start --lan --clear` và quét QR mới. Nếu có env cũ `localhost:3000`, xóa giá trị để auto-detect LAN hoặc thay bằng IP máy.
4. Sau bước kiểm tra phiên, app mở **Khám phá StudentMart**; chọn **Đăng nhập/Cá nhân** hoặc **Đăng ký ngay** trong login để tạo tài khoản. Nếu có credential nhưng chưa xác minh, không mở dữ liệu Cá nhân; có thể tiếp tục khám phá công khai mà không tự được cấp quyền. Trong bản dev, mở **Kiểm tra kết nối (dev)** ở cuối form login/register để xem API origin đang dùng và kiểm tra `/health`.
5. Thử email mới, mật khẩu khớp → tạo thành công rồi chuyển đăng nhập; thử email cũ → lỗi email; sai confirm → không gửi; bấm nhanh hai lần khi đang tạo → một request. Không nhập mật khẩu dùng cho dịch vụ khác khi thử local.
6. Đăng nhập với email/mật khẩu đã tạo → màn hình Cá nhân phải hiện đúng tên/email; tài khoản chưa verify vẫn đăng nhập. Sai mật khẩu → lỗi chung, không vào Cá nhân. Bấm nhanh nhiều lần → một request khi đang xử lý. Dùng Đổi tài khoản để thử B và xác nhận không còn danh tính A. Đóng/mở app để kiểm tra SecureStore và `/me` trên hệ điều hành thực tế.

Ma trận nghiệm thu đăng nhập và giới hạn kiểm thử native: [TASK-16.03 #89/#90/#91](../docs/implementation/task-16-03-login.md). Typecheck/export và adapter giả không thay thế kiểm tra đọc/ghi SecureStore, keyboard, safe area trên thiết bị thật.

Với #92: thử mở lại app, foreground sau khi phiên bị revoke/expire hoặc tài khoản bị hạn chế; không thấy dữ liệu riêng trước khi xác minh. Kiểm tra Cá nhân → login → đúng tài khoản, Hủy login → về công khai, Back Android và chuyển A → B. Contact/đăng tin thật chưa thể nghiệm thu đến khi có API domain, không coi test fixture là dữ liệu thật.

Từ root, chạy `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 --frontend` để mở Expo. Nếu Metro còn cache của SDK cũ, chạy `pnpm --filter studentmart-mobile exec expo start --clear`.

## Đặt code ở đâu?

| Vị trí | Trách nhiệm |
|---|---|
| src/features/<feature>/presentation/ | Screen, component và hook useXxxViewModel; state/action giao diện |
| src/features/<feature>/business/ | Model, service và rule client; điều phối dữ liệu, không import JSX/navigation |
| src/features/<feature>/data/ | API, repository, DTO mapping và persistence riêng của feature |
| src/business/workflows/ | Phối hợp nhiều feature: logout/đổi account, mở notification |
| src/shared/presentation/ | UI dùng chung và theme |
| src/shared/data/ | HTTP, storage theo account, media và catalog adapter |
| src/shared/config/ | Cấu hình public của app |
| src/bootstrap/ | Ghép dependency/provider |
| src/navigation/ | Điều hướng và wrapper route theo router sẽ chọn |
| tests/unit/, tests/integration/ | Kiểm tra rule/ViewModel và luồng client khi có mã |

Feature hiện có: auth, listings, chat, notifications, profile, moderation.

Luồng gọi: **Screen → hook ViewModel → business service → data repository → API/local storage**. Data không import Screen/ViewModel; Screen không gọi HTTP hoặc đọc storage trực tiếp.

Hook là cách tổ chức state UI, không tự giữ dữ liệu qua app bị kill. Nháp và pending message cần persistence phân vùng theo tài khoản. Verify tùy chọn; từ chối push vẫn dùng inbox; backend mới quyết định quyền cuối cùng.

Mỗi thư mục lá có .gitkeep để giữ khung trong Git; bỏ khi đã có code thật. Các .ts/.tsx trong tài liệu mẫu là tên file sẽ viết sau, không phải implementation sẵn có. Mobile dùng pnpm workspace với lockfile chung ở repository root; router chưa được chọn. Không dùng khóa server trong cấu hình public.
