# Đối chiếu nghiệm thu sub-ticket #84 và #85

Phạm vi của hai issue là **documentation** trong TASK-16.01: có contract cụ thể cho FE/BE thực hiện, kiểm tra được bằng schema và review. Không dùng test schema để khẳng định auth API, phiên hoặc UI đã triển khai. Baseline ở [account-model.md](account-model.md), [account-mobile.md](account-mobile.md) và [accounts.openapi.yaml](accounts.openapi.yaml).

## #84 — BE: API, mô hình và vòng đời phiên

| Tiêu chí | Bằng chứng và trạng thái |
|---|---|
| Review Account, field profile/session và migration bổ sung | Đã đối chiếu entity/service/migration nền; bảng mô hình và thứ tự migration ở account-model. Giữ Account hiện tại, không tạo lại; chỉ ra kiểu PublicAccount nội bộ còn chứa email/role |
| Chốt email/password, request/response, validation/lỗi, public/private | OpenAPI 10 operation; example payload và test whitelist/projection. Register không cấp session hoặc nhãn trường, DTO public riêng |
| Tạo/restore/expiry/revoke session, rate limit, không log credential | Opaque token 32 byte, SHA-256 server, expiry tuyệt đối 30 ngày, logout idempotent, SecureStore/mobile epoch; hai bucket rate limit và redact được mô tả cụ thể |
| Nguồn lookup và provider avatar trước triển khai liên quan | Shape lookup và nguồn TASK-15 đã xác định. **Còn chờ dataset được duyệt và lựa chọn provider avatar thực tế**; không coi dữ liệu demo trong thiết kế là seed. Chặn phần phụ thuộc của 16.07/16.08/TASK-18 cho đến khi có đầu vào |

## #85 — FE: model, validation và trạng thái auth

| Tiêu chí | Bằng chứng và trạng thái |
|---|---|
| DTO/enum/lỗi và checking/guest/authenticated/expired/return-to | account-mobile mục 2–5, 7–8; OpenAPI là nguồn shape. Offline không tự cấp quyền private và không tự xóa credential do lỗi mạng |
| Lưu credential, cache theo account, logout offline | account-mobile mục 6–7: SecureStore chưa cài ở ticket này, account-scoped cache, epoch/AbortController, dọn local dù BE offline và ghi rõ giới hạn server revoke |
| Review form thiết kế, email login khác verify | [account-design-review.md](account-design-review.md): đã đối chiếu ảnh design-system, login/register, profile/edit/verify cục bộ; ghi các khác biệt và bổ sung UX cần cho ticket UI |
| Ma trận màn hình/API/permission và cùng tên field | account-mobile mục 4, example payload và schema tests; phía private/public dùng cùng shape với OpenAPI, không alias role/verify hoặc coi displayName là định danh pháp lý |

## Bộ kiểm tra chạy lại

```powershell
pnpm install --frozen-lockfile
pnpm test:contracts
pnpm typecheck
pnpm test
```

`test:contracts` dùng Node test runner, YAML, Ajv và ajv-formats đã pin devDependencies ở root. 54 test gồm examples hợp lệ, input sai, field injection, privacy projection, Unicode length, trạng thái verify, security inheritance và no-store. Fixtures ở [examples.json](examples.json) chỉ là dữ liệu tổng hợp, không phải seed/catalog hoặc token thật. Test không mở network, không đọc .env và không sửa database.

`pnpm test` chạy cả contract tests và 8 unit test backend hiện có. Kết quả CLI không chứng minh runtime guard, storage, rate limit hoặc upload đã hoạt động; kiểm thử end-to-end thuộc ticket 16.02–16.10.

## Handoff và review

- Đầu ra của #84/#85 đã có bản commit trên nhánh `feat/task-16-01-account-api-contract` để người dùng review local; chưa push hoặc merge.
- Chuyển hai issue sang Review cùng kết quả kiểm tra, giữ OPEN để duyệt quyết định và các đầu vào còn chờ. Không tự coi human review đã hoàn thành.
- 16.02 có thể bắt đầu từ register contract; 16.03 từ opaque session contract; các phần lookup/media có dependency riêng như nêu trên.
- Nếu thay đổi field hoặc chính sách sau review, sửa OpenAPI, hai tài liệu, examples và test tương ứng trong cùng commit.
