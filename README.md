# StudentMart

**Nền tảng mua bán đồ cũ dành cho sinh viên.**

StudentMart giúp sinh viên bán lại những món đồ không còn sử dụng và tìm mua sản phẩm phù hợp với ngân sách từ chính cộng đồng sinh viên.

## StudentMart đang xây dựng gì?

Việc mua bán đồ cũ khá phổ biến với sinh viên, đặc biệt khi chuyển trọ, kết thúc học kỳ hoặc cần tiết kiệm chi phí. Tuy nhiên, các tin đăng hiện thường nằm rải rác trên mạng xã hội, group mua bán hoặc các nền tảng chung.

StudentMart được định hướng là một ứng dụng mobile tập trung vào cộng đồng sinh viên, nơi người dùng có thể:

- Đăng bán sản phẩm kèm ảnh, thông tin và giá.
- Tìm kiếm đồ cũ phù hợp với nhu cầu.
- Lọc sản phẩm theo danh mục, mức giá hoặc khu vực gần.
- Liên hệ với người bán để trao đổi về giao dịch.

Sản phẩm tập trung vào nhu cầu và bối cảnh giao dịch của sinh viên, thay vì trở thành một marketplace công khai quá rộng.

## Phiên bản đầu tiên

Phiên bản đầu tiên tập trung vào một hành trình mua bán hoàn chỉnh:

```text
Đăng bán sản phẩm
    ↓
Tìm kiếm hoặc xem sản phẩm
    ↓
Xem thông tin chi tiết
    ↓
Liên hệ người bán
    ↓
Thỏa thuận giao dịch
```

Các tính năng chưa thuộc phiên bản đầu tiên gồm thanh toán trực tuyến, vận chuyển, gợi ý bằng AI, tích điểm, dashboard cho người bán, quảng cáo trả phí và đấu giá.

## Nguyên tắc phát triển sản phẩm

- **Phù hợp với sinh viên:** Danh mục và trải nghiệm cần phản ánh nhu cầu thực tế của sinh viên.
- **Ưu tiên giao dịch gần:** Hỗ trợ việc mua bán trong cùng trường hoặc khu vực sinh viên gần nhau.
- **Đề cao sự tin cậy:** Thông tin sản phẩm rõ ràng và xác thực sinh viên quan trọng hơn việc thêm nhiều tính năng.
- **Phát triển vừa đủ:** Mỗi tính năng mới phải hỗ trợ trực tiếp cho một hành động trong quy trình mua bán.

## Trạng thái phát triển

StudentMart hiện đang chuyển từ giai đoạn xác định định hướng sản phẩm sang lập kế hoạch cho MVP.

Các phần nhóm sẽ ưu tiên phát triển gồm:

1. Đăng sản phẩm.
2. Tìm kiếm và lọc sản phẩm.
3. Xem chi tiết sản phẩm.
4. Liên hệ giữa người mua và người bán.

Công nghệ, nền tảng hỗ trợ và các dịch vụ tích hợp sẽ được cập nhật khi nhóm chốt và kiểm chứng phương án triển khai.

## Cấu trúc repository dự kiến

```text
StudentMart/
├── README.md
├── mobile/          # Mã nguồn ứng dụng mobile
├── backend/         # API và các dịch vụ phía máy chủ
├── docs/            # Tài liệu kỹ thuật và tài nguyên hỗ trợ
└── .github/         # Cấu hình Issue và Pull Request
```

## Quy trình làm việc

Công việc phát triển được quản lý qua GitHub Issues và Project Board.

Mỗi thay đổi nên đi theo quy trình:

```text
Issue
  → Branch
  → Pull Request
  → Review
  → Merge
```

Mỗi task nên sử dụng một branch riêng. Không push trực tiếp vào `main`, đồng thời không đưa file môi trường, API key hoặc thông tin bí mật lên repository.

## Tài liệu và kế hoạch

- [Tài liệu sản phẩm](https://github.com/L02-VibeCode/StudentMart/wiki)
- [GitHub Organization](https://github.com/L02-VibeCode)
- Project Board: sẽ cập nhật sau
- Thiết kế giao diện: sẽ cập nhật sau

## Nhóm thực hiện

Dự án được phát triển bởi nhóm **L02-VibeCode**.
