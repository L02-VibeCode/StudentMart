# StudentMart — Student Used-Goods Marketplace

> **Mua đồ cũ phù hợp. Bán lại dễ dàng. Trong chính cộng đồng sinh viên.**

StudentMart là ứng dụng mobile hỗ trợ sinh viên mua, bán và trao đổi đồ đã qua sử dụng trong cùng trường hoặc khu vực gần nhau. Dự án hướng đến các giao dịch đơn giản, tiết kiệm và đáng tin cậy hơn so với việc tự tìm kiếm qua nhiều bài đăng trên mạng xã hội.

## 1. Links

| Tài nguyên | Link |
| --- | --- |
| GitHub Organization | [L02-VibeCode](https://github.com/L02-VibeCode) |
| Wiki - tài liệu dự án | [StudentMart Wiki](https://github.com/L02-VibeCode/StudentMart/wiki) |
| Project board | TBD |
| Research evidence | TBD |
| Design | TBD |

> Toàn bộ tài liệu của Assignment 1, bao gồm định hướng sản phẩm, evidence plan, market research, business canvas, MVP scope, user stories và user flows, sẽ được trình bày trên **Wiki**.

## 2. Project Overview

### Problem

Sinh viên thường có đồ không còn sử dụng khi chuyển trọ, chuyển trường hoặc kết thúc học kỳ nhưng gặp khó khăn khi bán lại. Đồng thời, nhiều sinh viên cần mua đồ đã qua sử dụng với giá hợp lý nhưng phải tìm kiếm qua Facebook Marketplace, các group mua bán, Chợ Tốt hoặc người quen.

### Target Users

- Sinh viên đại học và cao đẳng muốn bán đồ cũ.
- Sinh viên cần mua đồ đã qua sử dụng với ngân sách phù hợp.
- Pilot ban đầu tập trung vào một trường hoặc một khu vực sinh viên cụ thể.

### Proposed Solution

StudentMart cung cấp một marketplace dành riêng cho sinh viên. Người bán có thể đăng sản phẩm với ảnh, thông tin và giá; người mua có thể tìm kiếm, lọc, xem chi tiết và liên hệ người bán để thỏa thuận giao dịch.

Điểm định hướng chính của dự án là:

- Tập trung vào cộng đồng sinh viên.
- Ưu tiên giao dịch trong cùng trường hoặc khu vực gần nhau.
- Hướng tới xác thực tài khoản sinh viên để tăng độ tin cậy.
- Tập trung vào các nhóm sản phẩm có nhu cầu phổ biến với sinh viên.

## 3. Assignment 1 Status

Assignment 1 tập trung vào **Product Discovery and Foundation**, chưa phải giai đoạn xây dựng ứng dụng hoàn chỉnh.

Các nội dung đang được hoàn thiện trên Wiki:

- Project Direction
- Mobile Product Rationale
- Critical Assumptions and Evidence Plan
- User and Market Research
- Existing Solutions and Alternatives
- Evidence Evaluation and Product Decisions
- Business Canvas
- MVP Scope and Prioritization
- User Stories and Critical User Flows
- Project Plan

## 4. MVP Scope

### Core Value

Giúp một sinh viên đăng bán đồ cũ dễ dàng và giúp sinh viên khác tìm, liên hệ và hoàn tất giao dịch với người bán trong cộng đồng của mình.

### Core Flow

**Seller:** Đăng nhập → Đăng ảnh, thông tin và giá sản phẩm → Đăng bán.

**Buyer:** Đăng nhập → Tìm kiếm hoặc lọc sản phẩm → Xem chi tiết → Liên hệ/thỏa thuận với người bán → Hoàn tất giao dịch.

### Out of Scope

Các tính năng chủ động không thuộc MVP:

- Thanh toán trực tuyến.
- Hệ thống vận chuyển.
- AI recommendation.
- Seller analytics nâng cao.
- Loyalty hoặc point system.
- Livestream bán hàng, quảng cáo trả phí và đấu giá.

## 5. Mobile Value

StudentMart phù hợp với mobile vì sinh viên có thể:

- Chụp ảnh và đăng bán đồ nhanh bằng camera.
- Tìm sản phẩm hoặc người bán ở khu vực gần bằng location.
- Nhận push notification cho tin nhắn và cập nhật giao dịch.
- Tìm kiếm, đăng bán và liên hệ mọi lúc, mọi nơi.

## 6. Tech Stack

Công nghệ triển khai sẽ được chốt sau giai đoạn Assignment 1, dựa trên MVP và các rủi ro kỹ thuật đã được xác định.

| Thành phần | Trạng thái |
| --- | --- |
| Mobile application | TBD |
| Backend / API | TBD |
| Database | TBD |
| Authentication | TBD |
| Location service | TBD |

## 7. Planned Repository Structure

```text
StudentMart/
├── README.md
├── mobile/          # Source code mobile application
├── backend/         # API and backend services
├── docs/            # Supporting documents and assets
└── .github/         # Issue and pull request templates
```

## 8. Development Workflow

Khi bước vào giai đoạn phát triển, nhóm sẽ sử dụng quy trình sau:

| Branch | Purpose |
| --- | --- |
| `main` | Phiên bản ổn định, luôn có thể demo. |
| `develop` | Nhánh tích hợp cho các tính năng đang phát triển. |
| `feature/<task-name>` | Mỗi tính năng hoặc task sử dụng một nhánh riêng. |
| `fix/<bug-name>` | Sửa lỗi. |
| `docs/<topic>` | Cập nhật tài liệu. |

Mỗi task nên tương ứng với một Issue trên GitHub Project. Sau khi hoàn thành, tạo Pull Request từ `feature/<task-name>` vào `develop` và được ít nhất một thành viên khác review trước khi merge.

## 9. Working Principles

- Không push trực tiếp vào `main`.
- Mỗi task cần có owner và trạng thái rõ ràng trên GitHub Project.
- Pull Request nên nhỏ, tập trung vào một thay đổi.
- Không commit `.env`, API key hoặc thông tin bí mật.
- Các quyết định sản phẩm phải có traceability:

```text
Evidence
→ User Need
→ Requirement
→ User Story
→ MVP Feature
→ User Flow
→ Development Task
```
