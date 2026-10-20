# StudentMart

**Ứng dụng kết nối sinh viên mua, bán và trao đổi đồ cũ trong Làng Đại học ĐHQG TP.HCM.**

StudentMart là nền tảng trung gian **C2C**, giúp người dùng đăng tin, tìm lựa chọn phù hợp và liên hệ trực tiếp với nhau. Hai bên tự thỏa thuận, gặp mặt, kiểm tra hàng và thanh toán hoặc trao đổi ngoài ứng dụng.

Giá trị đề xuất là giúp sinh viên tìm tin phù hợp và kết nối với người giao dịch trong khu vực thuận tiện, với thông tin rõ ràng trước khi liên hệ.

[Tài liệu dự án](https://github.com/L02-VibeCode/StudentMart/wiki) · [Project Board](https://github.com/orgs/L02-VibeCode/projects/1) · [Danh sách công việc](https://github.com/L02-VibeCode/StudentMart/issues)

## Vấn đề và định hướng

Nhu cầu mua bán đồ cũ có thể xuất hiện khi sinh viên chuyển trọ, nâng cấp thiết bị, kết thúc môn học hoặc cần tiết kiệm chi phí.

Khảo sát ban đầu ghi nhận những khó khăn như tin đăng bị trôi, liên hệ không được phản hồi và thông tin hàng chưa đúng mô tả. Tuy nhiên, mức độ ảnh hưởng của các vấn đề này và động lực chuyển từ Facebook hoặc Chợ Tốt sang một ứng dụng mới vẫn cần được nghiên cứu thêm.

StudentMart tập trung vào:

- Tin đăng có cấu trúc, phù hợp với từng nhu cầu.
- Tìm kiếm theo loại tin, danh mục, giá hoặc ngân sách và khu vực.
- Thông tin món đồ, người đăng và trạng thái tin rõ ràng.
- Hội thoại gắn với tin đăng để hỏi thêm và thỏa thuận giao dịch.
- Thử nghiệm trong một cụm trường, KTX hoặc khu trọ thuộc Làng Đại học ĐHQG TP.HCM.

## Người dùng mục tiêu

- Sinh viên có đồ không còn sử dụng và muốn bán lại.
- Sinh viên tìm mua đồ phù hợp với nhu cầu và ngân sách.
- Sinh viên muốn đăng tìm mua khi chưa thấy tin phù hợp.
- Sinh viên có món đồ muốn trao đổi.

Một tài khoản có thể vừa đăng tin vừa tìm kiếm và liên hệ. Quản trị viên là vai trò vận hành, phụ trách xem xét báo cáo và xử lý nội dung vi phạm.

## Phạm vi MVP

### Chuỗi giá trị cốt lõi

**Đăng tin → Tìm/lọc → Xem chi tiết → Liên hệ → Tự giao dịch trực tiếp → Cập nhật trạng thái tin.**

### Các chức năng dự kiến

| Chức năng | Phạm vi |
|---|---|
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, hồ sơ cơ bản và phân quyền. |
| Đăng và quản lý tin | Tạo, sửa, gỡ, đóng hoặc đánh dấu hoàn tất tin Bán / Tìm mua / Trao đổi. |
| Tìm kiếm và bộ lọc | Từ khóa, loại tin, danh mục, khu vực và giá/ngân sách khi áp dụng. |
| Chi tiết tin | Nội dung món đồ hoặc nhu cầu, trạng thái, khu vực và hồ sơ chủ tin. |
| Chat theo tin | Hội thoại văn bản giữa hai người, lịch sử và trạng thái chưa đọc. |
| Push notification | Thông báo tin nhắn mới và mở đúng hội thoại sau khi kiểm tra quyền. |
| Xác thực email trường | OTP tùy chọn và nhãn xác thực có giải thích rõ giới hạn. |
| Báo cáo và chặn | Báo cáo tin/tài khoản, chặn liên hệ và xử lý quản trị tối thiểu. |
| Bản nháp và phục hồi lỗi | Giữ nội dung tin đang soạn trên thiết bị và hỗ trợ thử lại khi lỗi mạng. |
| Đo lường thử nghiệm | Ghi nhận hoạt động tối thiểu và nhật ký pilot để đánh giá chuỗi giá trị. |

Ba loại tin sử dụng chung cơ chế đăng tin, tìm kiếm và chat; không có quy trình đặt hàng hoặc ghép trao đổi tự động.

### Quy tắc quan trọng

- **Xác thực email trường là tùy chọn:** tài khoản chưa xác thực vẫn được đăng tin và chat.
- **Nhãn verify có giới hạn:** chỉ xác nhận quyền truy cập email trường được hỗ trợ tại thời điểm xác thực; không bảo đảm danh tính sinh viên hiện tại, uy tín hoặc chất lượng hàng.
- **Push thuộc MVP đầu tiên:** người dùng có thể từ chối quyền nhận thông báo và vẫn sử dụng hộp thư, chat.
- **Khu vực được chọn thủ công:** không bắt buộc GPS hoặc công khai vị trí chính xác.
- **Chỉ tạo hội thoại mới từ tin đang mở:** hội thoại đã có có thể tiếp tục sau khi chủ tin hoàn tất hoặc đóng tin, nếu còn quyền và không có quan hệ chặn.
- **Kết quả giao dịch do chủ tin cập nhật:** đóng hoặc gỡ tin không được tính là giao dịch hoàn tất.

### Ngoài phạm vi MVP

- Giỏ hàng, đặt hàng, thanh toán hoặc giữ tiền trung gian.
- Giao hàng và kết nối shipper.
- GPS thời gian thực và theo dõi vị trí.
- Ghép trao đổi tự động hoặc trao đổi nhiều bên.
- Rating/Review, điểm uy tín và gợi ý bằng AI.
- Lưu yêu thích, chia sẻ tin, quảng cáo và gói đẩy tin trả phí.
- Dashboard phân tích nâng cao.
- Mở rộng ra ngoài Làng Đại học ĐHQG TP.HCM.

Chi tiết phạm vi và căn cứ ưu tiên nằm trong [MVP Scope](https://github.com/L02-VibeCode/StudentMart/wiki/MVP-Scope) và [Impact–Effort Matrix](https://github.com/L02-VibeCode/StudentMart/wiki/Impact%E2%80%93Effort-Matrix).

## Công nghệ lựa chọn

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Ứng dụng mobile | **React Native + Expo** | Giao diện, camera/chọn ảnh, bản nháp cục bộ và tích hợp thông báo. |
| Backend | **Node.js** | API, xác thực tài khoản, phân quyền, tin đăng, chat và xử lý sự kiện thông báo. |
| Cơ sở dữ liệu | **PostgreSQL** | Lưu dữ liệu tài khoản, tin đăng, hội thoại và dữ liệu nghiệp vụ. |
| Quản lý mã nguồn | **GitHub** | Repository, branch, Pull Request và review. |
| Tài liệu | **GitHub Wiki** | Nghiên cứu, yêu cầu, quyết định sản phẩm và truy vết. |
| Quản lý công việc | **GitHub Issues + Projects** | Backlog, phân công, milestone và tiến độ thực tế. |

Ứng dụng được định hướng phát triển cross-platform. Phạm vi hệ điều hành phát hành sẽ được xác định theo thiết bị kiểm thử và khả năng triển khai.

Framework backend, ORM, dịch vụ lưu ảnh, gửi email và phương án tích hợp push sẽ được chốt trong bước thiết kế kỹ thuật. README sẽ bổ sung phiên bản công nghệ, cấu hình và lệnh chạy khi có mã nguồn tương ứng.

## Trạng thái dự án

Dự án đang ở giai đoạn nghiên cứu sản phẩm và chuẩn bị thiết kế MVP; chưa bắt đầu triển khai ứng dụng theo kế hoạch hiện tại.

Khảo sát V1 ghi nhận **13 phản hồi sàng lọc và 11 người tiếp tục trả lời**. Đây là dữ liệu tự báo cáo trong mẫu nhỏ, chưa xác nhận hành vi sử dụng StudentMart.

| Milestone | Mục tiêu |
|---|---|
| **M1 — Nghiên cứu và nền tảng** | Làm rõ vấn đề, đánh giá bằng chứng, chốt phạm vi và tổ chức công việc. |
| **M2 — Thiết kế, triển khai và nghiệm thu MVP** | Hoàn thiện chuỗi giá trị, tích hợp các chức năng trong phạm vi và kiểm thử bản cài đặt. |
| **M3 — Pilot và điều chỉnh** | Thử nghiệm với người và tin đăng thật, ghi nhận kết quả và cập nhật quyết định. |

Trạng thái và người phụ trách từng công việc được theo dõi trên [GitHub Project](https://github.com/orgs/L02-VibeCode/projects/1). Danh sách tính năng trong README là phạm vi dự kiến, không phải xác nhận đã triển khai.

## Cấu trúc repository dự kiến

StudentMart quản lý ứng dụng mobile và backend trong cùng repository. Mỗi phần có cấu hình và thư viện riêng; mã nguồn được tổ chức theo chức năng để thuận tiện phân công và bảo trì.

```text
StudentMart/
├── mobile/                         # React Native + Expo
│   ├── src/
│   │   ├── app/                    # Màn hình và điều hướng nếu dùng Expo Router
│   │   ├── features/
│   │   │   ├── auth/               # Đăng nhập, đăng ký và xác thực email
│   │   │   ├── listings/           # Đăng, tìm kiếm và quản lý tin
│   │   │   ├── chat/               # Hội thoại và hộp thư
│   │   │   ├── notifications/      # Quyền thông báo và xử lý push
│   │   │   ├── profile/            # Hồ sơ người dùng
│   │   │   └── moderation/         # Báo cáo, chặn và quản trị tối thiểu
│   │   ├── components/             # Thành phần giao diện dùng chung
│   │   ├── services/               # API client và lưu trữ cục bộ
│   │   ├── theme/                  # Màu sắc, typography và spacing
│   │   └── config/                 # Cấu hình ứng dụng
│   ├── assets/                     # Ảnh, font và tài nguyên tĩnh
│   ├── app.config.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                        # Node.js
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Xác thực tài khoản và email trường
│   │   │   ├── users/              # Hồ sơ người dùng
│   │   │   ├── listings/           # Tin đăng, tìm kiếm và khu vực
│   │   │   ├── chat/               # Hội thoại và tin nhắn
│   │   │   ├── notifications/      # Thiết bị nhận thông báo và gửi push
│   │   │   └── moderation/         # Báo cáo, chặn và xử lý vi phạm
│   │   ├── services/               # Kết nối PostgreSQL, email và lưu ảnh
│   │   ├── common/                 # Xử lý lỗi và tiện ích dùng chung
│   │   ├── config/                 # Cấu hình môi trường
│   │   ├── app.ts                  # Khởi tạo ứng dụng
│   │   └── main.ts                 # Khởi chạy server
│   ├── database/
│   │   ├── migrations/             # Lịch sử thay đổi cấu trúc dữ liệu
│   │   └── seeds/                  # Dữ liệu phát triển và kiểm thử
│   ├── tests/                      # Kiểm thử API và tích hợp
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                           # Thiết lập môi trường, API và thiết kế dữ liệu
├── scripts/                        # Script hỗ trợ khi cần
├── .github/
│   ├── workflows/                  # Kiểm tra tự động
│   └── pull_request_template.md
├── .gitignore
└── README.md
```

### Nguyên tắc tổ chức

- `mobile/` và `backend/` được cài đặt, chạy và quản lý thư viện riêng. Mỗi phần có một lockfile được commit.
- Màn hình điều hướng kết nối tới mã nguồn trong `features/`; các chức năng liên quan được đặt cùng nhau.
- Backend triển khai dưới dạng một ứng dụng thống nhất. Mỗi module chứa phần tiếp nhận yêu cầu, kiểm tra dữ liệu và xử lý nghiệp vụ tương ứng.
- Chỉ tách mã dùng chung khi có nhu cầu thực tế; không tạo sẵn nhiều lớp hoặc thư mục rỗng.
- Kiểm tra quyền được thực hiện tại backend; việc ẩn nút hoặc màn hình trên mobile không thay thế phân quyền.
- Unit test có thể đặt gần mã nguồn; kiểm thử tích hợp backend đặt trong `backend/tests/`.
- GitHub Wiki lưu tài liệu sản phẩm và nghiên cứu. `docs/` lưu tài liệu kỹ thuật gắn với mã nguồn.
- Không commit `.env`, khóa dịch vụ, dữ liệu cá nhân, `node_modules/` hoặc bản build. `.env.example` chỉ chứa cấu hình minh họa.
- Cấu trúc chi tiết được điều chỉnh theo framework backend và công cụ migration được lựa chọn. TypeScript là phương án dự kiến cho cả hai phần.

Cấu trúc sẽ được cập nhật khi khởi tạo mã nguồn. Tài liệu sản phẩm chính được quản lý trên [GitHub Wiki](https://github.com/L02-VibeCode/StudentMart/wiki).

## Quy trình cộng tác

Công việc được theo dõi theo workflow:

**Backlog → To Do → In Progress → Review → Done**

- Mỗi task đã cam kết thực hiện có Assignee, đầu ra và tiêu chí chấp nhận rõ ràng.
- Công việc triển khai đi từ Issue → Branch → Pull Request → Review → Merge.
- Nhánh làm việc tham chiếu mã task, ví dụ: `feat/task-04-listings` hoặc `docs/task-02-evidence`.
- Thay đổi mã nguồn vào `main` thông qua Pull Request và review.
- Chỉ chuyển task sang Done khi có đầu ra được kiểm tra và liên kết bằng chứng tương ứng.
- Không đưa file `.env`, API key, token, mật khẩu hoặc dữ liệu nghiên cứu có thông tin nhận dạng lên repository.
- Thay đổi phạm vi phải được phản ánh vào tài liệu và các Issue liên quan.

Quy ước truy vết:

| Mã | Ý nghĩa |
|---|---|
| `A1–A5` | Giả định quan trọng. |
| `D01–D07` | Quyết định sản phẩm. |
| `UN01–UN13` | Nhu cầu người dùng. |
| `R01–R13` | Yêu cầu chức năng. |
| `US01–US13` | User Stories. |
| `UF01–UF05` | User Flows, có các nhánh chi tiết. |
| `TASK-01–TASK-25` | Công việc trên GitHub Issues. |

## Tài liệu dự án

| Nội dung | Liên kết |
|---|---|
| Trang tổng quan | [Wiki Home](https://github.com/L02-VibeCode/StudentMart/wiki) |
| Định hướng sản phẩm | [Project Direction](https://github.com/L02-VibeCode/StudentMart/wiki/Project-Direction) |
| Lý do chọn mobile | [Mobile Product Rationale](https://github.com/L02-VibeCode/StudentMart/wiki/Mobile-Product-Rationale) |
| Giả định quan trọng | [Critical Assumptions](https://github.com/L02-VibeCode/StudentMart/wiki/Critical-Assumptions) |
| Kế hoạch bằng chứng | [Evidence Plan](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Plan) |
| Nghiên cứu người dùng | [User and Market Research](https://github.com/L02-VibeCode/StudentMart/wiki/User-and-Market-Research) |
| Giải pháp hiện có | [Existing Solutions and Alternatives](https://github.com/L02-VibeCode/StudentMart/wiki/Existing-Solutions-and-Alternatives) |
| Đánh giá bằng chứng | [Evidence Evaluation](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Evaluation) |
| Quyết định sản phẩm | [Product Decisions](https://github.com/L02-VibeCode/StudentMart/wiki/Product-Decisions) |
| Mô hình sản phẩm | [Business Canvas](https://github.com/L02-VibeCode/StudentMart/wiki/Business-Canvas) |
| Ưu tiên tính năng | [Impact–Effort Matrix](https://github.com/L02-VibeCode/StudentMart/wiki/Impact%E2%80%93Effort-Matrix) |
| Phạm vi MVP | [MVP Scope](https://github.com/L02-VibeCode/StudentMart/wiki/MVP-Scope) |
| User Stories | [User Stories](https://github.com/L02-VibeCode/StudentMart/wiki/User-Stories) |
| Luồng người dùng | [Critical User Flows](https://github.com/L02-VibeCode/StudentMart/wiki/Critical-User-Flows) |
| Kế hoạch dự án | [Project Plan](https://github.com/L02-VibeCode/StudentMart/wiki/Project-Plan) |
| Truy vết | [Traceability](https://github.com/L02-VibeCode/StudentMart/wiki/Traceability) |
| Bằng chứng nghiên cứu | [Evidence Register](https://github.com/L02-VibeCode/StudentMart/wiki/Evidence-Register) |

## Thành viên

| Họ tên | Mã số sinh viên | Vai trò |
|---|---|---|
| Nguyễn Gia Khiêm | 2211572 | Nhóm trưởng |
| Phạm Trương Quân Bằng | 2210300 | Thành viên |
| Lưu Việt Đức | 2310779 | Thành viên |
| Nguyễn Minh Thái | 2313101 | Thành viên |
| Nguyễn Thanh Tùng | 2449106 | Thành viên |

Dự án thuộc môn **CO3043 — Phát triển ứng dụng di động**, học kỳ **HK261**.

- **Giảng viên:** Hoàng Lê Hải Thanh.
- **Organization:** [L02-VibeCode](https://github.com/L02-VibeCode).
- **Project Board:** [StudentMart — Project 1](https://github.com/orgs/L02-VibeCode/projects/1).
