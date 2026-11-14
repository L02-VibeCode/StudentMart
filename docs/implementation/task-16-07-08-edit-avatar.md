# TASK-16.07/16.08 — Chỉnh sửa hồ sơ và avatar (#101/#104)

Nhánh `feat/101-104-profile-edit-avatar` được tạo từ main sau PR #119. BE sở hữu #102/#105, FE sở hữu #103/#106; QA đối chiếu tiêu chí và kiểm thử tích hợp. Dùng ảnh tham chiếu local trong `design/` theo xác nhận trước của người dùng. Đây không phải bằng chứng pixel parity trên điện thoại.

## Ma trận nghiệm thu

| Tiêu chí | Kiểm tra/bằng chứng cần có | Giới hạn |
|---|---|---|
| Lưu và mở lại hồ sơ | PATCH session-bound, GET lại từ PostgreSQL; mobile model đồng bộ chỉ sau server xác nhận | Không dùng fixture UI để thay dữ liệu thật |
| A không sửa B | Query accountId không thay actor; body accountId bị từ chối; B giữ nguyên | Danh tính phải lấy từ phiên |
| Whitelist và validation | Reject role/verify/email/avatar injection; payload lỗi không lưu phần displayName hợp lệ | Email trường đi qua TASK-18 |
| Lỗi lưu giữ form | Mô phỏng lỗi mạng ở transport, giữ draft rồi retry tới API thật | Không thay thế kiểm thử mạng thiết bị |
| Chưa thay đổi/đang lưu không gửi tiếp | Unit/model tests và review source | Native chạm liên tục cần thử thiết bị |
| Rời màn hình có thay đổi | Xác nhận rời màn hình, Back Android và nút quay lại | Cần nghiệm thu thao tác trên thiết bị |
| Lookup trường/khu vực | Chỉ dùng catalog được duyệt; không suy ra verification từ trường tự khai | Dataset/provider thực phải được xác nhận, không tự seed danh mục giả |
| Avatar chọn/hủy/lỗi/xóa | Picker thư viện, không camera; giữ avatar cũ tới server xác nhận | Provider chưa được chọn tại thời điểm bắt đầu; không giả upload thành công |
| Avatar validation/ownership | Server kiểm tra file/size/nội dung và actor, không ghi đè field hồ sơ khác | Mock storage không chứng minh provider production |
| Đổi tài khoản | Draft/response gắn identity/epoch, không để dữ liệu A xuất hiện ở B | Adapter CredentialStore trong test không phải SecureStore native |

## Phương pháp QA

`backend/tests/integration/mobile-profile-edit.test.ts` dùng NestJS/Fastify và PostgreSQL `student-mart` thật. Fixture tạo Account UUID với email `@example.invalid`, cleanup đúng Account/AuthSession đã tạo. Không reset/truncate database, không tự migrate hoặc revert.

Lệnh focused từ root:

```powershell
pnpm.cmd --filter studentmart-backend exec vitest run tests/integration/mobile-profile-edit.test.ts
```

Ngày 2026-11-14, focused QA integration **3/3 PASS** trên HTTP/PostgreSQL thật và production mobile edit model/repository. Gồm persistence/mở lại, query không đổi actor, whitelist role/verify/email/avatar/accountId, payload lỗi và lookup không tồn tại không lưu phần hợp lệ, clear bio, không có phiên; mobile lỗi mạng giữ draft rồi retry, response A thực trả trễ sau logout/login B không ghi đè B. CredentialStore trong test là memory adapter; không phải bằng chứng SecureStore native. Test không tự apply migration.

Unit/model, HTTP/PostgreSQL, bundle export và kiểm thử native phải được báo riêng. `.github/` và `.agents/` giữ local/ignore; không coi việc thiếu GitHub Actions là CI pass. Kết quả suite tổng do root ghi sau khi source ghép xong; không mặc định coi toàn bộ test đã pass từ focused run.

## Checklist thiết bị còn cần xác nhận

- [ ] Sửa tên/bio, lưu, mở lại app thấy dữ liệu mới; lỗi mạng giữ nội dung và retry hoạt động.
- [ ] Nút Lưu vô hiệu khi chưa đổi/đang xử lý; rời form có thay đổi bằng nút Back và Android Back cần xác nhận.
- [ ] Picker quyền/hủy, ảnh hợp lệ/không hợp lệ/quá lớn; upload lỗi giữ avatar cũ; xóa rồi mở lại app.
- [ ] Logout A/login B khi request đang chạy không mở lại draft/avatar A.
- [ ] Safe area, keyboard, font scaling, tiếng Việt, screen reader và vùng chạm Android/iOS.

Chưa có bằng chứng thiết bị hoặc provider production thì không đánh dấu các mục này đạt. PR chờ người dùng review/approve, không tự merge hoặc đóng issue chỉ vì source đã có.
