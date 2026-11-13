const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repository = 'L02-VibeCode/StudentMart';
const endpoint = `repos/${repository}`;
const baseUrl = `https://github.com/${repository}/issues/`;
const parentNumber = 17;
const oldNumbers = [39, 40, 43, 44, 76, 77, 78, 79, 80, 82];
const archive = path.join(os.tmpdir(), 'studentmart-task16-restructure');
const sourcePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('Pass the Task 16 source attachment path.');
const source = fs.readFileSync(sourcePath, 'utf8');
const definitions = [
  { id: '01', deps: [], type: 'documentation', trace: 'R01, R06; US01, US06',
    be: ['Chốt hợp đồng API, dữ liệu và vòng đời phiên', 'Review Account đã có; xác định field hồ sơ, session và migration bổ sung, không tạo lại bảng đã tồn tại.', 'Chốt đăng ký email/mật khẩu; request/response, validation, lỗi, bảo vệ API và dữ liệu public/private.', 'Thống nhất cơ chế tạo, khôi phục, hết hạn và thu hồi phiên; giới hạn đăng nhập và không log credentials.', 'Danh sách trường/khu vực theo TASK-15; auth provider/storage avatar phải được quyết định trước ticket liên quan.'],
    fe: ['Chốt model mobile, validation và trạng thái auth', 'Đối chiếu DTO FE với hợp đồng BE, enum/lỗi, loading/guest/authenticated/expired và return-to intent.', 'Chốt lưu credential phù hợp mobile, vùng cache theo account và quy trình logout khi offline.', 'Review form đăng ký/đăng nhập/hồ sơ theo thiết kế; phân biệt email login và verify trường tùy chọn.', 'Lập ma trận màn hình/API/permission và xác nhận FE/BE dùng cùng field trước khi triển khai.'] },
  { id: '02', deps: ['01'], type: 'feature', trace: 'R01; US01',
    be: ['API đăng ký và lưu Account an toàn', 'Mở rộng Account/AccountsService hiện có theo hợp đồng; migration chỉ cho phần thiếu.', 'Chuẩn hóa email và enforce unique ở PostgreSQL kể cả request đồng thời; hash mật khẩu, DTO không lộ hash.', 'Validation server, lỗi email trùng/dữ liệu sai; chỉ cấp MEMBER, không tự verify email trường.', 'Vitest và integration test cho hợp lệ, email trùng sau normalize, dữ liệu sai và role injection.'],
    fe: ['Màn hình đăng ký kết nối API thật', 'Form email/mật khẩu/xác nhận mật khẩu, validation đồng bộ contract và bàn phím phù hợp.', 'Loading, disable submit đang xử lý, lỗi field/email trùng/network dễ hiểu; không làm mất dữ liệu cần sửa.', 'Sau tạo thành công chuyển đăng nhập; không tự cấp verify hoặc báo thành công khi chưa được BE xác nhận.', 'Kiểm tra đăng ký end-to-end với tài khoản thật và request submit lặp.'] },
  { id: '03', deps: ['02'], type: 'feature', trace: 'R01; US01',
    be: ['API đăng nhập, tạo phiên và nhận diện hiện tại', 'Xác thực email/mật khẩu, tạo phiên bằng cơ chế đã chốt ở 16.01.', 'Sai thông tin không tạo phiên; lỗi an toàn và cơ chế giới hạn thử theo contract.', 'Không log password/token; API danh tính hiện tại chỉ nhận tài khoản từ phiên server.', 'Kiểm tra đúng/sai mật khẩu, hết hạn/thu hồi và tài khoản chưa verify trường.'],
    fe: ['Màn hình đăng nhập và lưu phiên mobile', 'Kết nối API login, lưu credential bằng cơ chế đã chốt và nạp đúng user hiện tại.', 'Loading, chặn submit song song; lỗi mạng, sai thông tin và không được phép truy cập.', 'Đổi state auth sau server xác nhận, mở đúng tài khoản; không đưa credential vào log.', 'Review/reuse phần phù hợp từ PR #81 đang mở; không coi PR chưa merge là đã nghiệm thu.'] },
  { id: '04', deps: ['03'], type: 'feature', trace: 'R01; US01; UF01b, UF02a, UF04',
    be: ['Xác minh phiên và guard quyền trên API riêng', 'Guard xác thực/phân quyền: owner, conversation member và admin theo endpoint thực tế.', 'API công khai cho khách; API riêng từ chối request thiếu/giả/hết hạn/thu hồi phiên.', 'Xác thực lại quyền khi tiếp tục intent; không tin accountId/role do client tự khai.', 'Test 401/403 và A không truy cập B; phối hợp TASK-04/06/22 mà không triển khai thay các task đó.'],
    fe: ['Khôi phục phiên, route guard và return-to intent', 'Bootstrap có trạng thái chờ xác minh, không nhấp nháy login; phiên lỗi được loại bỏ.', 'Khách được xem tin/tìm kiếm/chi tiết; đăng tin/chat/dữ liệu riêng yêu cầu login.', 'Quay về đúng tin/hành động sau login; hủy login không tự gửi tin hoặc đăng bài.', 'Test mở lại app, phiên hết hạn và bị mất quyền; UI guard kết hợp API guard thật.'] },
  { id: '05', deps: ['04'], type: 'feature', trace: 'R01; US01',
    be: ['Thu hồi phiên đăng xuất và điểm tích hợp push', 'Logout kết thúc phiên hiện tại; gọi lại an toàn, credential cũ không vào API riêng.', 'Chốt giới hạn khi client offline; không báo phiên server đã thu hồi nếu chưa xác nhận.', 'Chuẩn bị hook tháo push binding cho TASK-19 và disconnect realtime nếu đã có.', 'Test token/session cũ, logout lặp và không ảnh hưởng dữ liệu công khai/tài khoản khác.'],
    fe: ['Đăng xuất, dọn dữ liệu riêng và đổi tài khoản', 'Xác nhận logout, xóa credential/cache riêng, hủy request đang bay và kết nối chat nếu có.', 'Offline vẫn dọn auth cục bộ; phản hồi đúng giới hạn kết thúc phiên server.', 'Reset navigation để Back không mở dữ liệu riêng; B không thấy cache/draft/message của A.', 'Review PR #81 đang mở, kiểm tra lỗi race khi response A về sau khi login B; hook TASK-19.'] },
  { id: '06', deps: ['04'], type: 'feature', trace: 'R01; US01',
    be: ['API hồ sơ của tài khoản hiện tại', 'Trả avatar, tên, trường tự khai, khu vực, giới thiệu và trạng thái verify theo nguồn thật.', 'Nhận danh tính từ phiên; không lấy accountId tùy ý để trả hồ sơ riêng.', 'Không lộ password/hash/token; field thiếu có null/default theo contract.', 'Test A/B, hết hạn và projection; không giả thống kê tin đăng chưa có nguồn.'],
    fe: ['Màn hình Cá nhân dùng dữ liệu thật', 'Dựng theo thiết kế Figma được cung cấp, ViewModel/repository gọi API profile.', 'Avatar/giới thiệu trống có fallback; loading/error/retry; cache gắn account.', 'Điểm điều hướng edit và verify TASK-18; chưa verify không bị trình bày như vi phạm.', 'Không hardcode thống kê tin; test đúng danh tính sau login/đổi account.'] },
  { id: '07', deps: ['06'], type: 'feature', trace: 'R01; US01; bổ sung AC chỉnh sửa hồ sơ cho US01',
    be: ['API cập nhật hồ sơ và whitelist field', 'Cho sửa tên, trường tự khai, khu vực, giới thiệu; validation và lookup theo TASK-15.', 'Chỉ sửa chính mình, whitelist field; từ chối role/verify/accountId injection.', 'Email trường thay đổi qua TASK-18; trường tự khai không tự cấp nhãn.', 'Migration profile nếu thiếu; test lưu/mở lại, A không sửa B và rollback lỗi.'],
    fe: ['Form sửa hồ sơ, giữ dữ liệu lỗi và đồng bộ', 'Form prefill profile, chọn lookup trường/khu vực, kiểm tra theo hợp đồng.', 'Nút Lưu disable khi chưa đổi/đang xử lý; xác nhận rời màn hình có thay đổi.', 'Lỗi giữ nội dung; server xác nhận rồi cập nhật profile trong app.', 'Test lưu và mở lại, mất mạng, validation và không hiển thị field sửa role/verify.'] },
  { id: '08', deps: ['07'], type: 'feature', trace: 'R01, R06; US01, US06',
    be: ['Upload, gắn và xóa avatar đúng quyền', 'Dùng storage/media đã chốt; phụ thuộc hợp đồng media và provider, không tự chọn dịch vụ.', 'Giới hạn file/size đã thống nhất, kiểm tra nội dung phía server; chỉ gắn media thuộc account.', 'Upload lỗi giữ avatar hiện tại; delete chỉ xóa liên kết/avatar theo policy, không xóa account.', 'Test file giả/quá dung lượng, ownership, retry và cập nhật avatar không ghi đè field khác.'],
    fe: ['Chọn ảnh thư viện, upload và xóa avatar', 'Image picker qua Expo-compatible API, xử lý permission/hủy; không thêm camera.', 'Upload/progress/error/retry và hành động xóa về avatar mặc định.', 'Giữ avatar cũ khi hủy/lỗi, chỉ cập nhật sau xác nhận BE.', 'Kiểm tra trên thiết bị/emulator với file hợp lệ/không hợp lệ, xóa avatar và mở lại app.'] },
  { id: '09', deps: ['06'], type: 'feature', trace: 'R06; US06; liên kết TASK-06',
    be: ['API hồ sơ công khai với DTO riêng', 'Public projection riêng cho khách: tên, avatar, giới thiệu, trường tự khai và nhãn verify.', 'Không trả email login/trường, hash, token, session hoặc địa chỉ riêng.', 'Xử lý account không tồn tại/không được hiển thị; test field whitelist và quyền.', 'Phối hợp #49 về chi tiết tin; danh sách tin đang mở chỉ tích hợp khi listing API sẵn sàng.'],
    fe: ['Hồ sơ chủ tin và liên kết từ chi tiết', 'Điều hướng từ thẻ chủ tin, dùng public API; không có nút sửa profile người khác.', 'Hiển thị loading/empty/error, fallback và giải thích giới hạn nhãn verify.', 'Phối hợp #54 của TASK-06; danh sách tin đang mở cần listing API thật, chưa có thì ghi pending.', 'Không thêm Rating/Review; khách xem được profile công khai.'] },
  { id: '10', deps: ['02', '03', '04', '05', '06', '07', '08', '09'], type: 'test', trace: 'US01, US06; kết quả liên kết TASK-24',
    be: ['Nghiệm thu API tài khoản, hồ sơ và phân quyền', 'Vitest/integration PostgreSQL: register/login/session/logout/private/public/profile/avatar.', 'Test A không đọc/sửa B, role/verify injection, token hết hạn/thu hồi và email unique đồng thời.', 'Kiểm tra DTO public không lộ dữ liệu riêng; không log credential, hash hoặc token.', 'Cập nhật API docs và evidence lệnh/môi trường/kết quả/lỗi, liên kết TASK-24; không reset DB người dùng.'],
    fe: ['Nghiệm thu mobile tài khoản và hồ sơ end-to-end', 'Chạy trên ít nhất một thiết bị/emulator: khách → đăng ký → login → profile → sửa/avatar → logout.', 'Kiểm tra return-to intent/hủy login, restore phiên hợp lệ/hết hạn, offline và A logout → B login.', 'Chưa verify trường vẫn dùng luồng chính; loading/error và accessibility/keyboard đúng.', 'Evidence thiết bị/OS/mạng/build, kết quả và bug thực tế; không thay thế nghiệm thu toàn MVP TASK-24.'] },
];

function gh(args, input) {
  return execFileSync('gh', args, { encoding: 'utf8', input, maxBuffer: 20 * 1024 * 1024 });
}
function api(route, method = 'GET', payload) {
  const args = ['api', route, '--method', method];
  if (payload !== undefined) args.push('--input', '-');
  const output = gh(args, payload === undefined ? undefined : JSON.stringify(payload));
  return output.trim() ? JSON.parse(output) : null;
}
function save(name, value) {
  fs.writeFileSync(path.join(archive, name), JSON.stringify(value, null, 2));
}
function paragraphs(id) {
  const marker = `TASK-16.${id} — `;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing source section ${id}`);
  const next = source.indexOf('\nTASK-16.', start + marker.length);
  return source.slice(start, next < 0 ? source.length : next).trim();
}
function checklist(lines) { return lines.map(line => `- [ ] ${line}`).join('\n'); }
function marker(key) { return `<!-- studentmart:task16-v3:${key} -->`; }

fs.mkdirSync(archive, { recursive: true });
const statePath = path.join(archive, 'state.json');
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { repository, issues: {}, linked: [], deleted: [] };
state.retired ??= [];
if (process.argv.includes('--finalize') && Object.keys(state.issues).length !== 30) throw new Error('Finalize requires all 30 issues already created.');
if (state.repository !== repository) throw new Error('Archive repository mismatch');
const persist = () => save('state.json', state);
const original = api(`${endpoint}/issues?state=all&per_page=100`);
if (!fs.existsSync(path.join(archive, 'issues-before.json'))) {
  save('issues-before.json', original);
  save('project-before.json', JSON.parse(gh(['project', 'item-list', '1', '--owner', 'L02-VibeCode', '--limit', '200', '--format', 'json'])));
  save('fields-before.json', JSON.parse(gh(['project', 'field-list', '1', '--owner', 'L02-VibeCode', '--format', 'json'])));
  for (const number of oldNumbers) save(`issue-${number}-comments.json`, api(`${endpoint}/issues/${number}/comments`));
  fs.writeFileSync(path.join(archive, 'source.txt'), source);
}
const plan = definitions.map(def => ({
  task: `TASK-16.${def.id} — ${paragraphs(def.id).split('\n')[0].split(' — ').slice(1).join(' — ')}`,
  dependencies: def.deps.map(id => `TASK-16.${id}`),
  tickets: ['be', 'fe'].map(area => `[${def.type === 'feature' && area === 'fe' && !['04', '05'].includes(def.id) ? 'ui' : def.type}][${area.toUpperCase()}][T16.${def.id}-${area.toUpperCase()}] ${def[area][0]}`),
}));
save('plan.json', plan);
console.log(`Backup and plan: ${archive}`);
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);

const labels = api(`${endpoint}/labels?per_page=100`);
for (const [name, color, description] of [
  ['task', 'D4C5F9', 'Functional work package with FE/BE tickets'],
  ['ui', 'C5DEF5', 'Mobile user interface and API integration'],
  ['test', 'BFDADC', 'Verification and acceptance evidence'],
]) if (!labels.some(label => label.name === name)) api(`${endpoint}/labels`, 'POST', { name, color, description });
const types = api('orgs/L02-VibeCode/issue-types');
function issueType(kind) { return types.find(type => type.name === (kind === 'feature' || kind === 'ui' ? 'Feature' : 'Task'))?.name; }
function ensureIssue(key, payload) {
  if (state.issues[key]) return state.issues[key];
  const found = original.find(issue => issue.body?.includes(marker(key)));
  const issue = found ?? api(`${endpoint}/issues`, 'POST', { ...payload, body: marker(key) + '\n' + payload.body });
  state.issues[key] = { number: issue.number, id: issue.id, node_id: issue.node_id, title: issue.title, url: issue.html_url };
  persist();
  console.log(`ISSUE ${key} #${issue.number}`);
  return state.issues[key];
}
function link(parent, child) {
  const key = `${parent}:${child.number}`;
  if (state.linked.includes(key)) return;
  const current = api(`${endpoint}/issues/${parent}/sub_issues`);
  if (!current.some(issue => issue.id === child.id)) api(`${endpoint}/issues/${parent}/sub_issues`, 'POST', { sub_issue_id: child.id });
  state.linked.push(key); persist();
}
for (const [index, def] of definitions.entries()) {
  const dependencies = def.deps.map(id => `${baseUrl}${state.issues[id].number}`).join(', ') || 'Hợp đồng đầu vào TASK-02; danh sách TASK-15 (#16).';
  const body = `## Mục tiêu và phạm vi\nTask cha: #17. Chức năng được nghiệm thu xuyên suốt React Native/Expo mobile ↔ API NestJS ↔ PostgreSQL.\n\n## Nguồn yêu cầu\n${paragraphs(def.id)}\n\n## Phụ thuộc thực hiện\n${dependencies}\n\n## Phân công FE/BE\n${checklist([`BE: ${def.be.slice(1).join(' ')}`, `FE: ${def.fe.slice(1).join(' ')}`])}\n\n## Quy tắc hoàn thành\n- [ ] Hai ticket FE/BE hoàn tất và có bằng chứng tích hợp; không chỉ dựng UI hoặc API riêng lẻ.\n- [ ] Tiêu chí nguồn ở trên đạt, test quyền/lỗi được ghi nhận, API docs khớp code.\n- [ ] Không còn bug chặn luồng hoặc truy cập chéo tài khoản.\n\n## Truy vết\n${def.trace}. Milestone M2.\n\n## Hiện trạng\nAccount entity, service và migration nền đã có; kiểm tra code trước khi mở rộng. PR #81 đang OPEN, chưa merge và chưa được coi là đạt nghiệm thu.\n`;
  const task = ensureIssue(def.id, { title: plan[index].task, body, labels: ['task'], milestone: 2, assignees: ['stephen89-hcmut'], type: issueType('task') });
  link(parentNumber, task);
  for (const [areaIndex, area] of ['be', 'fe'].entries()) {
    const key = `${def.id}-${area}`;
    const category = def.type === 'feature' && area === 'fe' && !['04', '05'].includes(def.id) ? 'ui' : def.type;
    const ticketBody = `## Quản lý\n- Task chức năng: #${task.number} (${plan[index].task}).\n- Task tổng: #17.\n- Mã ticket: T16.${def.id}-${area.toUpperCase()}. Loại: ${category}. Phạm vi: ${area === 'fe' ? 'FE — React Native / Expo app mobile' : 'BE — NestJS API / TypeORM / PostgreSQL'}.\n- Trạng thái: To Do. Priority: ${def.id === '01' ? 'P0' : 'P1'}. Milestone: M2.\n\n## Mục tiêu\n${def[area][0]}.\n\n## Công việc và tiêu chí nghiệm thu\n${checklist(def[area].slice(1))}\n\n## Phụ thuộc\n${dependencies}\n${area === 'fe' && state.issues[`${def.id}-be`] ? `Phối hợp contract/API với #${state.issues[`${def.id}-be`].number}; dựng UI có thể song song, nghiệm thu cần tích hợp API thật.` : 'Phối hợp với ticket cùng task; giữ contract FE/BE thống nhất.'}\n\n## Đầu ra và bằng chứng\n- [ ] PR/source và tài liệu liên quan.\n- [ ] Lệnh test hoặc bước chạy, môi trường/thiết bị, kết quả và giới hạn được ghi rõ.\n- [ ] Tích hợp FE/BE theo AC của task cha; không đánh dấu Done chỉ vì đã tạo issue.\n\n## Truy vết\n${def.trace}. Email trường verify là tùy chọn; không thêm Google Auth vào bộ ticket email/password này.\n\n## Liên quan\n${['03', '05'].includes(def.id) && area === 'fe' ? 'PR https://github.com/L02-VibeCode/StudentMart/pull/81 đang mở: review và đối chiếu phần có thể tái sử dụng.' : 'Căn cứ nội dung Task 16 người dùng cung cấp; scope và quyết định kỹ thuật của StudentMart.'}\n`;
    const ticket = ensureIssue(key, { title: plan[index].tickets[areaIndex], body: ticketBody, labels: [category, area === 'fe' ? 'area:mobile' : 'area:backend', ...(def.id === '10' ? ['area:qa'] : [])], milestone: 2, type: issueType(category) });
    link(task.number, ticket);
  }
}

const replacementKeys = { 39: '03', 40: '04', 43: '06', 44: '07', 76: '02-be', 77: '03-be', 78: '05-be', 79: '01', 80: '03-fe', 82: '01' };
const mappingRows = oldNumbers.map(number => `| #${number} | #${state.issues[replacementKeys[number]].number} |`).join('\n');
const taskRows = definitions.map(def => `| #${state.issues[def.id].number} — TASK-16.${def.id} | #${state.issues[`${def.id}-be`].number} | #${state.issues[`${def.id}-fe`].number} |`).join('\n');
const parent = api(`${endpoint}/issues/17`);
const parentBody = `<!-- studentmart-setup:TASK-16 -->\n${marker('parent')}\n## Mục tiêu\nTriển khai tài khoản, phân quyền và hồ sơ cho StudentMart — app mua bán/tìm mua/trao đổi cho sinh viên Làng Đại học ĐHQG TP.HCM. Mobile React Native/Expo, API NestJS, TypeORM/PostgreSQL.\n\n## Quy ước tổ chức\nTASK-16 là task tổng. TASK-16.01–16.10 là các task theo chức năng, mỗi task có ticket FE và BE. Ticket đặt tên [loại][FE|BE][T16.xx-FE|BE] Công việc; loại feature, ui, documentation, test. Bug chỉ tạo khi có lỗi được tái hiện, có bước tái hiện/expected/actual và liên kết làm sub-issue của task chức năng. Không tạo bug giả trước triển khai.\n\n## Sub-issues theo chức năng\n| Task | Ticket BE | Ticket FE |\n|---|---|---|\n${taskRows}\n\n## Điều kiện nghiệm thu\n- [ ] Cả 10 task hoàn tất end-to-end, có API docs và bằng chứng test thực tế.\n- [ ] Không còn lỗi đăng nhập hoặc truy cập sai quyền; phiên hết hạn/đăng xuất/đổi tài khoản không lộ dữ liệu riêng.\n- [ ] Chưa verify email trường vẫn dùng luồng chính; email login và email verify tách biệt.\n- [ ] Khách xem được hồ sơ công khai; role/verify không bị client tự sửa.\n- [ ] Hồ sơ/edit/avatar có dữ liệu thật và privacy projection riêng.\n- [ ] Liên kết kết quả sang TASK-24 (#25); không thay nghiệm thu toàn MVP.\n\n## Phụ thuộc và tích hợp\nTASK-02 #3; lookup TASK-15 #16; verify TASK-18 #19; push binding TASK-19 #20; public owner profile phối hợp TASK-06 #7 và #49/#54; storage/avatar cần provider được chốt trước triển khai.\n\n## Truy vết\nR01, R06; US01, US06; UF01b, UF02a, UF03, UF04, UF05. Mốc M2.\n\n## Chuyển đổi bộ issue cũ\nCác issue dưới được sao lưu rồi xóa theo yêu cầu, thay bằng cấu trúc mới; số issue cũ trong bảng là tham chiếu lịch sử đã xóa.\n| Issue cũ | Điểm vào thay thế |\n|---|---|\n${mappingRows}\n\nAUTH-GOOGLE cũ không còn trong scope email/mật khẩu; thay bằng điểm quyết định contract, không tự thêm provider. PR #81 vẫn mở và được liên kết vào ticket mobile mới; không đánh dấu công việc đã Done. Account nền đã có, cần kiểm tra/reuse thay vì tạo lại.\n`;
api(`${endpoint}/issues/17`, 'PATCH', { title: 'TASK-16 — Triển khai tài khoản, phân quyền và hồ sơ', body: parentBody, state: 'open', type: issueType('task'), labels: [...new Set([...parent.labels.map(label => label.name), 'task'])] });

const fields = JSON.parse(fs.readFileSync(path.join(archive, 'fields-before.json'), 'utf8')).fields;
const project = JSON.parse(gh(['project', 'view', '1', '--owner', 'L02-VibeCode', '--format', 'json']));
function projectFields(issue, def, area) {
  if (process.argv.includes('--finalize')) return;
  const item = JSON.parse(gh(['project', 'item-add', '1', '--owner', 'L02-VibeCode', '--url', issue.url, '--format', 'json']));
  const selections = { Status: 'To Do', Priority: def?.id === '01' ? 'P0' : 'P1', 'Work category': def?.id === '01' ? 'Documentation' : def?.id === '10' ? 'Testing' : 'Development' };
  const values = Object.entries(selections).map(([name, option]) => ({ fieldId: fields.find(field => field.name === name).id, value: { singleSelectOptionId: fields.find(field => field.name === name).options.find(value => value.name === option).id } }));
  values.push({ fieldId: fields.find(field => field.name === 'Owner role').id, value: { text: area === 'fe' ? 'FE' : area === 'be' ? 'BE' : 'FE + BE' } });
  values.push({ fieldId: fields.find(field => field.name === 'Dependencies').id, value: { text: def?.deps.map(id => `#${state.issues[id].number}`).join(', ') || 'TASK-02 #3; TASK-15 #16' } });
  values.push({ fieldId: fields.find(field => field.name === 'Traceability').id, value: { text: def?.trace || 'R01, R06; US01, US06' } });
  const variables = { projectId: project.id, itemId: item.id };
  const declaration = ['$projectId:ID!', '$itemId:ID!'];
  const mutations = values.map((entry, index) => {
    variables[`field${index}`] = entry.fieldId;
    variables[`value${index}`] = entry.value;
    declaration.push(`$field${index}:ID!`, `$value${index}:ProjectV2FieldValue!`);
    return `edit${index}:updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$field${index},value:$value${index}}){projectV2Item{id}}`;
  });
  const result = api('graphql', 'POST', { query: `mutation(${declaration.join(',')}){${mutations.join('\n')}}`, variables });
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  console.log(`PROJECT #${issue.number}`);
}
projectFields({ number: 17, url: `${baseUrl}17` });
for (const def of definitions) {
  projectFields(state.issues[def.id], def);
  for (const area of ['be', 'fe']) projectFields(state.issues[`${def.id}-${area}`], def, area);
}

const replacementLinks = number => `${baseUrl}${state.issues[replacementKeys[number]].number}`;
const allIssues = api(`${endpoint}/issues?state=all&per_page=100`);
for (const issue of allIssues) {
  if (oldNumbers.includes(issue.number) || issue.number === 17 || issue.pull_request) continue;
  let body = issue.body || '';
  for (const number of oldNumbers) {
    body = body.replace(new RegExp(`https://github.com/L02-VibeCode/StudentMart/issues/${number}(?![0-9])`, 'g'), replacementLinks(number));
    body = body.replace(new RegExp(`(^|[^A-Za-z0-9/])#${number}(?![0-9])`, 'g'), (match, prefix) => prefix + '#' + state.issues[replacementKeys[number]].number);
  }
  if (body !== issue.body) {
    save(`reference-before-${issue.number}.json`, issue);
    api(`${endpoint}/issues/${issue.number}`, 'PATCH', { body });
    console.log(`REFERENCES #${issue.number}`);
  }
}
const pr = api(`${endpoint}/pulls/81`);
if (!fs.existsSync(path.join(archive, 'pr-81-before.json'))) save('pr-81-before.json', pr);
const prBody = (pr.body || '')
  .replace(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#80(?![0-9])/gi, 'Liên quan #' + state.issues['03-fe'].number)
  .replace(/#80(?![0-9])/g, '#' + state.issues['03-fe'].number);
const note = `\n\n## Task 16 — liên kết ticket mới\nPR này cần được review đối chiếu #${state.issues['02-fe'].number}, #${state.issues['03-fe'].number}, #${state.issues['05-fe'].number}; không tự coi toàn bộ tiêu chí các ticket đã đạt. Issue AUTH-MOBILE #80 cũ đã được thay theo cấu trúc của #17.`;
if (!prBody.includes('## Task 16 — liên kết ticket mới')) api(`${endpoint}/pulls/81`, 'PATCH', { body: prBody + note });

const rootChildren = api(`${endpoint}/issues/17/sub_issues`);
for (const def of definitions) {
  const task = state.issues[def.id];
  if (!rootChildren.some(issue => issue.id === task.id)) throw new Error(`Missing task ${def.id}`);
  const children = api(`${endpoint}/issues/${task.number}/sub_issues`);
  for (const area of ['be', 'fe']) if (!children.some(issue => issue.id === state.issues[`${def.id}-${area}`].id)) throw new Error('Missing FE/BE ticket');
}
for (const number of oldNumbers) {
  if (state.deleted.includes(number) || state.retired.includes(number)) continue;
  if (!original.some(issue => issue.number === number)) throw new Error(`Old issue #${number} not captured; refusing deletion`);
  if (!state.deletePermissionDenied) {
    try {
      gh(['issue', 'delete', String(number), '--repo', repository, '--yes']);
      state.deleted.push(number);
      console.log(`DELETED old issue #${number}`);
    } catch (error) {
      if (!String(error.stderr).includes('Viewer not authorized to delete')) throw error;
      state.deletePermissionDenied = true;
    }
  }
  if (!state.deleted.includes(number)) {
    const issue = api(`${endpoint}/issues/${number}`);
    const note = `\n\n## Đã thay thế theo cấu trúc Task 16\nIssue này được thay bằng ${replacementLinks(number)} và bộ sub-issue của #17. Đóng NOT_PLANNED vì thay đổi tổ chức công việc, không phải đã triển khai xong. Nội dung đã sao lưu; GitHub không cấp quyền deleteIssue cho tài khoản thực hiện. Xem bảng mapping ở #17.\n`;
    api(`${endpoint}/issues/${number}`, 'PATCH', { state: 'closed', state_reason: 'not_planned', labels: [...new Set([...issue.labels.map(label => label.name), 'duplicate'])], body: issue.body + note });
    const children = api(`${endpoint}/issues/17/sub_issues`);
    if (children.some(child => child.number === number)) api(`${endpoint}/issues/17/sub_issue`, 'DELETE', { sub_issue_id: issue.id });
    const items = JSON.parse(gh(['project', 'item-list', '1', '--owner', 'L02-VibeCode', '--limit', '200', '--format', 'json'])).items;
    for (const item of items.filter(item => item.content?.number === number && item.content?.repository === repository)) gh(['project', 'item-delete', '1', '--owner', 'L02-VibeCode', '--id', item.id]);
    state.retired.push(number);
    console.log(`RETIRED old issue #${number}: closed not_planned; delete permission unavailable.`);
  }
  persist();
}
const finalBody = parentBody.replace('Các issue dưới được sao lưu rồi xóa theo yêu cầu, thay bằng cấu trúc mới; số issue cũ trong bảng là tham chiếu lịch sử đã xóa.', state.retired.length ? 'Các issue dưới đã được sao lưu, đóng NOT_PLANNED vì được thay thế và tháo khỏi cấu trúc/Project cũ. GitHub không cấp quyền deleteIssue cho tài khoản thực hiện, nên chưa xóa vĩnh viễn. Trạng thái đóng không có nghĩa công việc đã hoàn tất.' : 'Các issue dưới đã được sao lưu rồi xóa theo yêu cầu, thay bằng cấu trúc mới.');
api(`${endpoint}/issues/17`, 'PATCH', { body: finalBody });
save('parent-after.json', api(`${endpoint}/issues/17`));
save('project-after.json', JSON.parse(gh(['project', 'item-list', '1', '--owner', 'L02-VibeCode', '--limit', '200', '--format', 'json'])));
console.log(`DONE: 10 function tasks + 20 FE/BE tickets; archive ${archive}`);
