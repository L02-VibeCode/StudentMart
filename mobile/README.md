# StudentMart Mobile

**Kiến trúc:** Three-Layer theo feature, MVVM nhẹ cho UI React Native + Expo.

Ứng dụng dùng Expo SDK 58, React 19.3, React Native 0.88.1 và TypeScript 6. Yêu cầu Node.js 22.13+ (nhánh 22.x), 24.3+ (nhánh 24.x), hoặc 26+.

## Chạy cục bộ

Từ repository root: `pnpm run setup`, sau đó `pnpm run dev`. Hoặc chạy riêng trong `mobile/`: `pnpm install --frozen-lockfile` và `pnpm start`.

Khi chạy dev qua LAN và không đặt `EXPO_PUBLIC_API_URL`, app lấy host từ `expo-constants` (`Constants.expoConfig.hostUri`) rồi dùng cổng 3000. Vì vậy điện thoại quét QR của Metro trên `192.168.1.53:8081` sẽ gọi `http://192.168.1.53:3000`, thay vì localhost của điện thoại. IP thay đổi theo mạng; không hardcode IP máy vào source.

Nếu backend ở máy/cổng khác, dùng Expo tunnel hoặc build release, copy `.env.example` thành `.env` và đặt `EXPO_PUBLIC_API_URL` là origin API không có `/api/v1`. Ví dụ trên điện thoại: `http://192.168.1.53:3000` (thay bằng IPv4 hiện tại của máy chạy backend); release dùng origin HTTPS thật. Giá trị env không rỗng được ưu tiên hơn auto-detect. Android Emulator dùng `http://10.0.2.2:3000`; iOS Simulator dùng `http://localhost:3000`. Expo tunnel chỉ chuyển tiếp Metro, không chuyển tiếp backend. Khởi động lại Expo/reload app sau khi đổi env. Chỉ đặt cấu hình public trong biến `EXPO_PUBLIC_*`.

Màn hình khởi đầu là form đăng ký #88: tên hiển thị, email, mật khẩu và xác nhận; có validation, loading, lỗi và chặn submit lặp. Chỉ gửi `{email,password,displayName}` tới `POST /api/v1/auth/register`; thành công mới chuyển màn hình đăng nhập, xóa password khỏi state form và không tạo phiên/verify. Màn hình đăng nhập hiện là đích điều hướng; API/login/session thuộc TASK-16.03, chưa được triển khai.

Giao diện dùng React Native primitives và system font, `react-native-safe-area-context` xử lý safe area; `expo-constants` lấy Metro host. Hai native dependency được chọn theo SDK bằng `pnpm --filter studentmart-mobile exec expo install expo-constants react-native-safe-area-context --pnpm` và đã nằm trong manifest/lockfile. Không cần cài riêng khi clone, chỉ `pnpm install --frozen-lockfile`. Chưa thêm router/UI kit.

`pnpm run typecheck` kiểm tra TypeScript; `pnpm test` trong mobile chạy Vitest cho validation, state đăng ký, HTTP adapter và API origin. Từ root, `pnpm test` chạy cả contract/BE/FE; `pnpm --filter studentmart-backend test:integration` kiểm tra client mobile qua HTTP thật tới PostgreSQL (dùng email UUID và cleanup). Xem [ma trận nghiệm thu #86/#87/#88](../docs/implementation/task-16-02-audit.md).

`pnpm run android` mở Android; `pnpm run ios` yêu cầu macOS cho simulator. Dùng Expo Go tương thích SDK 58 từ [expo.dev/go](https://expo.dev/go) hoặc development build; development build cũ cần build lại sau khi nâng SDK. Web chưa được cấu hình trong starter mobile.

### Kiểm tra điện thoại sau khi quét QR

1. Máy tính và điện thoại cùng mạng LAN/Wi-Fi (máy tính có thể dùng Ethernet cùng router). Chạy cả backend và Expo bằng `.\scripts\run.ps1` từ root.
2. Trên trình duyệt điện thoại mở `http://<IPv4-máy-tính>:3000/health`. Phải thấy `{"status":"ok"}`. Có thể mở `/api/docs` để thử API. Nếu không mở được: kiểm tra backend đang chạy và bind `0.0.0.0`, quyền Windows Firewall cho Node/cổng 3000 trên mạng Private, quyền Local Network của Expo Go trên iOS, guest Wi-Fi/AP isolation/VPN. Backend CORS không khắc phục được IP sai hoặc mạng bị chặn trong app native.
3. Reload Expo Go. Nếu vẫn thấy màn hình cũ, dừng Metro rồi chạy `pnpm --filter studentmart-mobile exec expo start --lan --clear` và quét QR mới. Nếu có env cũ `localhost:3000`, xóa giá trị để auto-detect LAN hoặc thay bằng IP máy.
4. App phải hiện **Tạo tài khoản StudentMart** ngay cả khi backend offline. Trong bản dev, mở **Kiểm tra kết nối (dev)** ở cuối form để xem API origin đang dùng và kiểm tra `/health`.
5. Thử email mới, mật khẩu khớp → tạo thành công rồi chuyển đăng nhập; thử email cũ → lỗi email; sai confirm → không gửi; bấm nhanh hai lần khi đang tạo → một request. Không nhập mật khẩu dùng cho dịch vụ khác khi thử local.

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
