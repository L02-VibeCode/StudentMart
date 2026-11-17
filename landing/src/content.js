// Toàn bộ nội dung và liên kết của landing page nằm ở đây.

export const LINKS = {
  repo: 'https://github.com/L02-VibeCode/StudentMart',
  wiki: 'https://github.com/L02-VibeCode/StudentMart/wiki',
  board: 'https://github.com/orgs/L02-VibeCode/projects/1',
  report: 'https://github.com/L02-VibeCode/StudentMart/blob/main/report/main.pdf',
  // TODO: dán link Figma (quyền "Anyone with the link → can view") vào đây.
  // Để trống thì thẻ Figma sẽ không hiển thị.
  figma:
    'https://www.figma.com/design/LGiEoRFkoVCTuTg0QHRxIm/StudentMart---Mobile-App-UI?node-id=8-307&t=gMFgo5DVrmJC2vGT-0',
  org: 'https://github.com/L02-VibeCode',
}

export const NAV = [
  { href: '#about', label: 'Giới thiệu' },
  { href: '#problem', label: 'Vấn đề' },
  { href: '#solution', label: 'Giải pháp' },
  { href: '#features', label: 'Tính năng' },
  { href: '#showcase', label: 'Giao diện' },
  { href: '#team', label: 'Nhóm' },
]

export const HERO = {
  badge: 'MVP · CO3043 · HK261',
  title: 'Đồ cũ quanh trường,',
  titleAccent: 'tìm trong vài phút.',
  lead:
    'StudentMart là chợ C2C dành riêng cho sinh viên Làng Đại học ĐHQG TP.HCM. Đăng tin có cấu trúc, lọc đúng nhu cầu, rồi nhắn thẳng cho người bán ở khu bên cạnh.',
  primary: { label: 'Xem giao diện', href: '#showcase' },
  secondary: { label: 'Tài liệu dự án', href: LINKS.wiki },
  chips: ['Bán', 'Tìm mua', 'Trao đổi'],
  note: 'Không phí trung gian · Hai bên tự hẹn gặp, kiểm tra hàng và thanh toán.',
  artAlt:
    'Banner StudentMart: điện thoại hiển thị danh sách đồ cũ như sách, ba lô, bàn phím và quạt, cùng các biểu tượng vị trí quanh khuôn viên trường.',
  stats: [
    { value: '3', label: 'loại tin dùng chung một luồng' },
    { value: '24', label: 'màn hình đã thiết kế cho MVP' },
    { value: '1', label: 'cụm trường thí điểm' },
  ],
}

export const ABOUT = {
  eyebrow: 'Về sản phẩm',
  title: 'Một chợ đồ cũ, đúng chỗ của nó.',
  lead:
    'StudentMart kết nối sinh viên có món đồ không còn dùng với sinh viên đang cần món đó — trong cùng một khu vực, với thông tin rõ ràng trước khi liên hệ.',
  body:
    'Một tài khoản vừa có thể đăng tin vừa tìm kiếm và liên hệ. Nền tảng đóng vai trò trung gian C2C: việc gặp mặt, kiểm tra hàng và thanh toán nằm ngoài ứng dụng, do hai bên tự thỏa thuận.',
  pillars: [
    {
      title: 'Gần',
      text: 'Khu vực chọn thủ công theo cụm trường, ký túc xá hoặc khu trọ. Không cần GPS, không công khai vị trí chính xác.',
    },
    {
      title: 'Rõ',
      text: 'Tin đăng có cấu trúc: loại tin, danh mục, tình trạng, giá hoặc ngân sách, ảnh thật và trạng thái còn hiệu lực.',
    },
    {
      title: 'Chủ động',
      text: 'Hội thoại gắn với từng tin. Hỏi thêm, thống nhất giá và thời gian, rồi tự hẹn gặp — không qua trung gian.',
    },
  ],
}

export const PROBLEM = {
  eyebrow: 'Vấn đề',
  title: 'Mua bán đồ cũ giữa sinh viên vẫn phải may mắn.',
  lead:
    'Khảo sát ban đầu của nhóm (mẫu nhỏ) ghi nhận bốn khó khăn lặp lại khi sinh viên mua bán đồ cũ qua các kênh hiện có.',
  items: [
    {
      title: 'Tin bị trôi',
      text: 'Bài đăng trong các nhóm trôi khỏi bảng tin sau vài giờ. Người đang cần món đồ không bao giờ nhìn thấy.',
    },
    {
      title: 'Liên hệ không phản hồi',
      text: 'Không biết tin còn hiệu lực hay món đồ đã bán, nên phải nhắn nhiều nơi và chờ.',
    },
    {
      title: 'Thông tin lệch',
      text: 'Ảnh và mô tả không khớp tình trạng thật; phải hỏi lại từ đầu mỗi lần.',
    },
    {
      title: 'Thiếu công cụ lọc',
      text: 'Muốn tìm “tủ lạnh dưới 800k ở khu B” thì phải đọc hàng trăm bài không liên quan.',
    },
  ],
  footnote:
    'Đây là giả thuyết cần kiểm chứng trong pilot, không phải số liệu thị trường. Nguồn: khảo sát V1 của nhóm.',
}

export const SOLUTION = {
  eyebrow: 'Giải pháp',
  title: 'Bốn lớp, một chuỗi duy nhất.',
  lead:
    'Mỗi khó khăn ở trên được xử lý bằng một phần cụ thể của sản phẩm — không phải bằng cách thêm tính năng.',
  items: [
    {
      title: 'Tin đăng có cấu trúc',
      text: 'Bán cần ảnh, tình trạng và giá; Tìm mua cần nhu cầu và ngân sách; Trao đổi cần món đang có và món muốn đổi.',
    },
    {
      title: 'Tìm đúng thay vì đọc hết',
      text: 'Từ khóa kết hợp loại tin, danh mục, khu vực và khoảng giá — lọc theo đúng thứ người mua nghĩ tới.',
    },
    {
      title: 'Hội thoại gắn với tin',
      text: 'Một hội thoại cho mỗi cặp người và mỗi tin. Tin đóng vẫn giữ được lịch sử nếu còn quyền.',
    },
    {
      title: 'Tín hiệu tin cậy có giới hạn',
      text: 'Nhãn xác thực email trường là tùy chọn và chỉ xác nhận quyền truy cập email tại thời điểm xác thực — không phải điểm uy tín.',
    },
  ],
}

export const FEATURES = {
  eyebrow: 'Tính năng',
  title: 'Phạm vi MVP.',
  lead:
    'Chín nhóm chức năng đủ để chạy trọn chuỗi giá trị: đăng tin → tìm → xem → liên hệ → giao dịch → cập nhật trạng thái.',
  items: [
    {
      icon: 'user',
      title: 'Tài khoản & phiên',
      text: 'Đăng ký, đăng nhập, đăng xuất. Phiên được lưu an toàn trên thiết bị và kiểm tra lại trước màn hình riêng tư.',
    },
    {
      icon: 'tag',
      title: 'Đăng tin ba loại',
      text: 'Bán, Tìm mua và Trao đổi dùng chung một cơ chế đăng tin, tìm kiếm và chat.',
    },
    {
      icon: 'search',
      title: 'Tìm kiếm & lọc',
      text: 'Từ khóa, loại tin, danh mục, khu vực và khoảng giá hoặc ngân sách khi tin có giá.',
    },
    {
      icon: 'file',
      title: 'Chi tiết tin',
      text: 'Tình trạng, mô tả, khu vực, trạng thái tin và hồ sơ chủ tin; phân biệt trường tự khai với nhãn xác thực.',
    },
    {
      icon: 'message',
      title: 'Chat theo tin',
      text: 'Hội thoại văn bản giữa hai người, có lịch sử và trạng thái chưa đọc.',
    },
    {
      icon: 'bell',
      title: 'Thông báo đẩy',
      text: 'Báo tin nhắn mới và mở đúng hội thoại sau khi kiểm tra phiên cùng quyền truy cập.',
    },
    {
      icon: 'shield',
      title: 'Xác thực email trường',
      text: 'OTP tùy chọn. Tài khoản chưa xác thực vẫn đăng tin và chat bình thường.',
    },
    {
      icon: 'flag',
      title: 'Báo cáo & chặn',
      text: 'Báo cáo tin hoặc tài khoản, chặn liên hệ; quản trị xử lý và lưu lại căn cứ.',
    },
    {
      icon: 'save',
      title: 'Nháp & phục hồi',
      text: 'Giữ nội dung tin đang soạn trên thiết bị và cho thử lại khi mất mạng.',
    },
  ],
  footnote:
    'Danh sách phản ánh phạm vi MVP của nhóm; tiến độ từng hạng mục theo dõi trên Project board.',
}

export const STEPS = {
  eyebrow: 'Cách hoạt động',
  title: 'Sáu bước, không có bước nào ngoài ứng dụng.',
  lead:
    'Chuỗi giá trị cốt lõi của StudentMart — và cũng là luồng được kiểm thử chính trong MVP.',
  items: [
    {
      title: 'Đăng tin',
      text: 'Chọn Bán, Tìm mua hoặc Trao đổi. Thêm ảnh, mô tả, tình trạng, giá hoặc ngân sách và khu vực.',
    },
    {
      title: 'Tìm & lọc',
      text: 'Lọc theo loại tin, danh mục, khu vực và khoảng giá để chỉ thấy tin phù hợp.',
    },
    {
      title: 'Xem chi tiết',
      text: 'Đọc tình trạng, mô tả và hồ sơ chủ tin trước khi quyết định liên hệ.',
    },
    {
      title: 'Nhắn trực tiếp',
      text: 'Bắt đầu hội thoại từ chính tin đang mở; hỏi thêm và thống nhất giá, thời gian, địa điểm.',
    },
    {
      title: 'Gặp & tự giao dịch',
      text: 'Hai bên gặp nhau, kiểm tra hàng và thanh toán ngoài ứng dụng.',
    },
    {
      title: 'Cập nhật trạng thái',
      text: 'Chủ tin đánh dấu đã bán, đã tìm được hoặc đã trao đổi để đóng vòng lặp.',
    },
  ],
}

export const SCREENS = [
  {
    src: '/screens/03-home.png',
    title: 'Trang chủ',
    caption: 'Tìm kiếm, tab loại tin, danh mục và tin mới nhất trong khu vực.',
    alt: 'Màn hình trang chủ StudentMart: thanh tìm kiếm, ba tab loại tin, sáu danh mục và các tin đăng mới nhất.',
  },
  {
    src: '/screens/05-filter.png',
    title: 'Bộ lọc',
    caption: 'Loại tin, danh mục, khu vực và khoảng giá — áp dụng ngay.',
    alt: 'Màn hình bộ lọc với các nhóm loại tin, danh mục, khu vực và khoảng giá.',
  },
  {
    src: '/screens/06-listing-detail.png',
    title: 'Chi tiết tin',
    caption: 'Tình trạng, mô tả, khu vực và hồ sơ chủ tin trước khi liên hệ.',
    alt: 'Màn hình chi tiết sản phẩm: ảnh giáo trình Java, giá 85.000đ, tình trạng và mô tả.',
  },
  {
    src: '/screens/11-chat.png',
    title: 'Hội thoại',
    caption: 'Chat gắn với từng tin, có lịch sử và trạng thái chưa đọc.',
    alt: 'Màn hình hội thoại giữa hai người dùng về một tin đăng giáo trình Java.',
  },
  {
    src: '/screens/07-create-listing.png',
    title: 'Đăng tin',
    caption: 'Chọn Bán, Tìm mua hoặc Trao đổi — dùng chung một luồng.',
    alt: 'Màn hình đăng tin với ba lựa chọn Bán, Tìm mua và Trao đổi.',
  },
  {
    src: '/screens/08-my-listings.png',
    title: 'Tin của tôi',
    caption: 'Sửa, đóng hoặc đánh dấu hoàn tất tin đã đăng.',
    alt: 'Màn hình Tin đăng của tôi với hai tin đang hiển thị và các nút chỉnh sửa, đóng tin.',
  },
  {
    src: '/screens/15-verify-otp.png',
    title: 'Xác thực email trường',
    caption: 'OTP tùy chọn; nhãn xác thực có giới hạn được giải thích rõ.',
    alt: 'Màn hình nhập mã OTP gồm sáu ô số để xác thực email trường.',
  },
  {
    src: '/screens/18-report.png',
    title: 'Báo cáo & chặn',
    caption: 'Báo cáo tin hoặc tài khoản, chặn liên hệ khi cần.',
    alt: 'Màn hình báo cáo vi phạm với các lựa chọn lý do và nút gửi báo cáo.',
  },
]

export const PALETTE = [
  { name: 'Primary Orange', hex: '#F07824', use: 'CTA, nhấn mạnh, giá', dark: true },
  { name: 'Primary Dark', hex: '#0D4D5B', use: 'Nền đậm, tiêu đề', dark: true },
  { name: 'Primary Light', hex: '#FFF0DF', use: 'Nền phụ, badge', dark: false },
  { name: 'Background', hex: '#F5F5F5', use: 'Nền ứng dụng', dark: false },
  { name: 'Surface', hex: '#FFFFFF', use: 'Card, form', dark: false },
  { name: 'Text Primary', hex: '#252525', use: 'Chữ chính', dark: true },
  { name: 'Text Secondary', hex: '#777777', use: 'Chữ phụ', dark: true },
  { name: 'Border', hex: '#EBEBEB', use: 'Viền, phân cách', dark: false },
  { name: 'Success', hex: '#29B862', use: 'Thành công', dark: true },
  { name: 'Error', hex: '#E54448', use: 'Lỗi', dark: true },
]

export const TYPE_SCALE = [
  { role: 'Display', size: '48 px', weight: '800', sample: 'Chợ đồ cũ sinh viên' },
  { role: 'Heading', size: '32 px', weight: '700', sample: 'Tìm đúng món, đúng khu vực' },
  { role: 'Subheading', size: '22 px', weight: '600', sample: 'Tin đăng có cấu trúc' },
  { role: 'Body', size: '16 px', weight: '400', sample: 'Nội dung mô tả món đồ, tình trạng và khu vực giao dịch.' },
  { role: 'Caption', size: '13 px', weight: '500', sample: 'Cập nhật 2 giờ trước · KTX khu B' },
]

export const SPACING = [4, 8, 12, 16, 24, 32, 48, 64]
export const RADII = [8, 12, 18, 28, 999]

export const TEAM = [
  { name: 'Nguyễn Gia Khiêm', id: '2211572', role: 'Nhóm trưởng' },
  { name: 'Phạm Trương Quân Bằng', id: '2210300', role: 'Thành viên' },
  { name: 'Lưu Việt Đức', id: '2310779', role: 'Thành viên' },
  { name: 'Nguyễn Minh Thái', id: '2313101', role: 'Thành viên' },
  { name: 'Nguyễn Thanh Tùng', id: '2449106', role: 'Thành viên' },
]

export const DOCS = [
  {
    title: 'GitHub Repository',
    text: 'Mã nguồn mobile (React Native + Expo) và backend (NestJS + PostgreSQL).',
    href: LINKS.repo,
    icon: 'github',
  },
  {
    title: 'Wiki tài liệu',
    text: 'Nghiên cứu người dùng, quyết định sản phẩm, phạm vi MVP, yêu cầu và luồng sử dụng.',
    href: LINKS.wiki,
    icon: 'book',
  },
  {
    title: 'Project board',
    text: 'Tiến độ công việc theo từng task, assignee và milestone.',
    href: LINKS.board,
    icon: 'layout',
  },
  {
    title: 'Báo cáo môn học',
    text: 'Báo cáo đầy đủ của dự án CO3043, xuất bản dạng PDF.',
    href: LINKS.report,
    icon: 'file',
  },
]

if (LINKS.figma) {
  DOCS.unshift({
    title: 'Figma thiết kế',
    text: 'Hệ thống thiết kế, 24 màn hình MVP và các trạng thái lỗi.',
    href: LINKS.figma,
    icon: 'layers',
  })
}

export const FOOTER = {
  tagline: 'Chợ đồ cũ dành cho sinh viên Làng Đại học ĐHQG TP.HCM.',
  course: 'CO3043 — Phát triển ứng dụng di động · HK261',
  org: 'L02-VibeCode',
}
