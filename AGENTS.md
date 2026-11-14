# StudentMart — quy trình giao việc cho agents

Đọc `.codex/project-context.md`, source/manifest hiện có và skill được chỉ định trước khi triển khai. StudentMart là app mobile React Native/Expo và backend NestJS/TypeORM/PostgreSQL cho sinh viên mua bán, tìm mua và trao đổi; dùng pnpm.

## Khi nhận task/ticket GitHub

Khi người dùng giao `#ticketid` để triển khai, đây là chỉ dẫn thường trực cho phép agent chính tự khám phá sub-issues và phân công sub-agents theo công việc. Áp dụng skill [ticket-delivery](.agents/skills/ticket-delivery/SKILL.md). Đọc quan hệ sub-issue thật qua GitHub API, không chỉ suy từ title/body; không có sub-issue thì xử lý issue đó, không tự tạo ticket mới ngoài scope.

Phân công BE/API/schema → backend-dev + typeorm-migrations; mobile/UI → frontend-dev + frontend-design; kiểm thử tích hợp/AC → qa-engineer; chỉ dùng pm khi scope/AC thiếu rõ và tech-lead khi cần quyết định kiến trúc/hợp đồng liên module. Không mặc định gọi tất cả vai trò hoặc thay model. Agent chính giữ ownership nhánh/Project/PR; child agent chỉ commit file được giao sau kiểm tra. Tổng hợp kết quả, báo rõ AC đạt/chưa đạt cho người dùng rồi tạo PR chờ review/approve, không coi báo cáo hoàn tất là quyền merge.

1. Đọc task cha, sub-ticket, hợp đồng API, phụ thuộc, tiêu chí nghiệm thu và quy tắc hoàn thành. Đối chiếu code thật, không coi issue đóng hoặc PR chưa merge là bằng chứng tính năng đã chạy.
2. Kiểm tra working tree; giữ thay đổi của người dùng. Fetch main và tạo nhánh feature theo ticket từ origin/main. Nếu tiền đề chưa merge, nêu rõ phạm vi dependency trong PR; không tự merge main để vượt qua phụ thuộc.
3. Chỉ ủy nhiệm khi người dùng/chính sách cho phép. Giao rõ ownership file cho từng agent, yêu cầu phối hợp và không revert thay đổi của agent khác. Agent con không tự đổi nhánh hoặc stage/commit file ngoài phạm vi được giao.
4. Cập nhật task/sub-ticket trong GitHub Project StudentMart sang In Progress khi bắt đầu. Dùng field/options thực tế của project, giữ assignee/priority/milestone không liên quan. Khi PR sẵn sàng review, chuyển sang Review và liên kết PR/bằng chứng. Không tự chuyển Done hoặc đóng issue chỉ vì đã có code/PR.
5. Triển khai theo hợp đồng và scope ticket. Không tạo API/tài nguyên/dữ liệu demo của task khác để giả đạt AC. Nếu thiếu dependency, hoàn thành phần độc lập, ghi rõ tiêu chí chưa nghiệm thu và dependency thật trong issue/PR/Project.
6. Dùng skill được chỉ định. Với schema, dùng typeorm-migrations: sinh migration từ entity, review up/down, chỉ apply trong phạm vi được cho phép, giữ synchronize/migrationsRun false. Không reset dữ liệu hoặc sửa migration đã apply.
7. Chạy typecheck/build/test phù hợp và đối chiếu từng AC; với native dependency chạy Expo dependency check/Doctor/export. Phân biệt unit/mock, HTTP/PostgreSQL integration và thao tác thiết bị thật. Không ghi nhận kết quả chưa chạy, không log secret/password/token.
8. Commit đầy đủ thành các thay đổi có thể review, chỉ stage file liên quan, không stage env/credentials. Push nhánh feature, tạo PR với base main, mô tả hành vi, dependency, migration/setup, lệnh/kết quả kiểm tra và phần chưa xác nhận.
9. **Chờ người dùng review và approve. Không tự merge vào main, không bật auto-merge.** Approval cũ không áp dụng mặc nhiên cho PR mới. Chỉ xử lý merge khi người dùng cho phép rõ ràng đối với PR đó.
10. Bàn giao link PR/Project, nhánh, commit, kết quả kiểm tra và tiêu chí còn pending. Cập nhật tài liệu setup/sử dụng và bằng chứng nghiệm thu nếu hành vi thay đổi.

## Điểm cập nhật dự án

- `.agents/` và `.github/` được giữ local, ignore và không track trong Git theo yêu cầu người dùng. Không force-add các thư mục này. Nếu checkout mới không có skill local, áp dụng quy trình trong file này và báo giới hạn thay vì giả đã đọc skill. GitHub Actions không được cung cấp bởi source hiện tại; chạy và ghi bằng chứng kiểm tra local, không coi thiếu CI là đã pass.
- Repository: `L02-VibeCode/StudentMart`.
- GitHub Project: https://github.com/orgs/L02-VibeCode/projects/1.
- Phân biệt trạng thái workflow **Review** với tiêu chí đã nghiệm thu. Issue/PR phải ghi phần thiếu, không dùng Review để ngụ ý đã đạt toàn bộ AC.
- Thông tin từ người dùng về thử trên điện thoại là bằng chứng do người dùng cung cấp; không tự suy ra các ca chưa được xác nhận.
