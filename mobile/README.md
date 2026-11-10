# StudentMart Mobile

**Kiến trúc:** Three-Layer theo feature, MVVM nhẹ cho UI React Native + Expo.

Ứng dụng TypeScript đã khởi tạo với Expo SDK 54, React 19.1 và React Native 0.81.5. Quyết định và sơ đồ chi tiết ở [solution_tree.md](../docs/solution_tree.md); dữ liệu/nghiệp vụ ở [schema.md](../docs/schema.md).

## Chạy cục bộ

Từ repository root: `pnpm run setup`, sau đó `pnpm run dev`. Hoặc chạy riêng trong `mobile/`: `pnpm install --frozen-lockfile` và `pnpm start`.

Copy `.env.example` thành `.env` để cấu hình `EXPO_PUBLIC_API_URL`. Với điện thoại thật, dùng IP LAN của máy chạy backend, ví dụ `http://192.168.1.10:3000`; hai thiết bị cần cùng Wi-Fi. Android Emulator dùng `http://10.0.2.2:3000`; iOS Simulator dùng `http://localhost:3000`. Khởi động lại Expo sau khi đổi env. Chỉ đặt cấu hình public trong biến `EXPO_PUBLIC_*`.

Màn hình khởi đầu có nút kiểm tra `GET /health` của backend. `pnpm run typecheck` kiểm tra TypeScript. `pnpm run android` mở Android; `pnpm run ios` yêu cầu macOS cho simulator. Dùng Expo Go tương thích SDK 54 hoặc development build. Web chưa được cấu hình trong starter mobile.

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
