# Landing page — asset inventory

Nguồn: Figma của nhóm — https://www.figma.com/design/LGiEoRFkoVCTuTg0QHRxIm/StudentMart---Mobile-App-UI. Ảnh đã nhận ngày 2026-11-17.

## 1. Cấu trúc thư mục

```
landing/
├── public/                 # Vite phục vụ nguyên trạng, có mặt trong build
│   ├── brand/
│   │   ├── logo.jpg        # icon ứng dụng, 1254×1254
│   │   └── banner.jpg      # ảnh chiến dịch, 1672×941 (có chữ bake sẵn)
│   ├── design/             # trống — design system được dựng bằng HTML/CSS
│   └── screens/            # 24 màn hình, PNG 2×, 786×1704
└── source/                 # bản gốc, KHÔNG deploy và KHÔNG commit (đã gitignore)
    ├── pdf/                # 8 file PDF export từ Figma (8 + 24 trang)
    └── design/             # 8 ảnh chụp board design system (độ phân giải tham chiếu)
```

## 2. Màn hình ứng dụng (`public/screens/`)

Đã rasterize từ `source/pdf/StudentMart - Mobile App UI-merged.pdf` bằng PyMuPDF ở 2× (786×1704).

| # | File | Nội dung |
|---|---|---|
| 01 | `01-login.png` | Đăng nhập |
| 02 | `02-register.png` | Đăng ký |
| 03 | `03-home.png` | Trang chủ: tìm kiếm, tab loại tin, danh mục, tin mới |
| 04 | `04-search-results.png` | Kết quả tìm kiếm |
| 05 | `05-filter.png` | Bộ lọc (loại tin, danh mục, khu vực, khoảng giá) |
| 06 | `06-listing-detail.png` | Chi tiết sản phẩm |
| 07 | `07-create-listing.png` | Đăng tin — chọn loại Bán / Tìm mua / Trao đổi |
| 08 | `08-my-listings.png` | Tin đăng của tôi |
| 09 | `09-edit-listing.png` | Chỉnh sửa tin đăng |
| 10 | `10-messages.png` | Danh sách hội thoại |
| 11 | `11-chat.png` | Hội thoại theo tin |
| 12 | `12-profile.png` | Cá nhân |
| 13 | `13-edit-profile.png` | Chỉnh sửa hồ sơ |
| 14 | `14-verify-intro.png` | Xác thực email trường — giới thiệu |
| 15 | `15-verify-otp.png` | Nhập OTP |
| 16 | `16-verify-success.png` | Xác thực thành công |
| 17 | `17-verify-status.png` | Trạng thái & lỗi xác thực |
| 18 | `18-report.png` | Báo cáo vi phạm |
| 19 | `19-block-confirm.png` | Xác nhận chặn |
| 20 | `20-notification-message.png` | Thông báo — tin nhắn mới |
| 21 | `21-notification-approved.png` | Thông báo — tin được duyệt |
| 22 | `22-notification-listing.png` | Thông báo — cập nhật tin đăng |
| 23 | `23-notification-update.png` | Thông báo — cập nhật hồ sơ |
| 24 | `24-notifications-empty.png` | Thông báo — trạng thái rỗng |

## 3. Design system (đọc từ board)

| Token | Giá trị | Dùng cho |
|---|---|---|
| Primary Orange | `#F07824` | CTA, nhấn mạnh, giá |
| Primary Dark | `#0D4D5B` | Nền đậm, chữ trên nền sáng |
| Primary Light | `#FFF0DF` | Nền phụ, badge |
| Background | `#F5F5F5` | Nền trang |
| Surface | `#FFFFFF` | Card |
| Text Primary | `#252525` | Chữ chính |
| Text Secondary | `#777777` | Chữ phụ |
| Border | `#EBEBEB` | Viền, phân cách |
| Success | `#29B862` | Trạng thái thành công |
| Error | `#E54448` | Lỗi |

Typography: **Inter**. Bo góc và khoảng cách lấy theo board (xem `source/design/`).

## 4. Lưu ý khi dùng

- **Logo là icon vuông**, không có bản ngang trong suốt. Trên web: icon + chữ "StudentMart" dựng bằng HTML (Student đậm, Mart cam) để sắc nét ở mọi kích thước. Nếu có SVG/PNG trong suốt thì thay sau.
- **Banner đã có chữ bake sẵn** ("Mua đồ cũ thông minh, gần bạn hơn") và mockup điện thoại. Dùng làm ảnh minh hoạ cạnh tiêu đề HTML, không dùng làm toàn bộ hero để tránh lặp chữ và vỡ bố cục trên mobile.
- **Ảnh board design system quá nhỏ để nhúng trực tiếp** (365–528 px). Section Design System sẽ được dựng bằng HTML/CSS từ bảng token trên; board gốc giữ trong `source/` làm dẫn chứng.
- Không commit Figma token hay credential.
