# StudentMart — landing page

Trang giới thiệu công khai của StudentMart (CO3043 · HK261), dựng bằng **React + Vite**.

- **Bản deploy:** https://student-mart-alpha.vercel.app/
- **Nguồn deploy:** fork `Gnosis844/StudentMart`, Root Directory `landing`, framework Vite.
- **Pull request:** https://github.com/L02-VibeCode/StudentMart/pull/140

## Chạy cục bộ

```sh
cd landing
npm install
npm run dev        # http://localhost:5173
```

```sh
npm run build      # xuất ra dist/
npm run preview    # xem bản build tại http://localhost:4173
```

Yêu cầu Node 20 trở lên (repo dùng Node 22).

> `landing/` dùng **npm** và có `package-lock.json` riêng. Thư mục này **không** nằm trong
> pnpm workspace của repo (`backend`, `mobile`), nên `pnpm install` ở root không ảnh hưởng tới nó.

## Cấu trúc

```text
landing/
├── index.html              # meta, font Inter, favicon
├── public/                 # file tĩnh, phục vụ tại "/"
│   ├── brand/              # logo, banner
│   └── screens/            # 24 màn hình PNG 2× (786×1704)
├── source/                 # bản gốc PDF/board — không deploy, không commit
└── src/
    ├── content.js          # toàn bộ nội dung + liên kết
    ├── styles.css          # design tokens + toàn bộ giao diện
    ├── App.jsx             # ghép 10 section
    └── components/         # mỗi section một file
```

Sửa nội dung trong `src/content.js`; sửa màu/khoảng cách trong `:root` của `src/styles.css`.

## Liên kết

Các URL nằm ở đầu `src/content.js`:

```js
export const LINKS = {
  repo, wiki, board, report,
  figma: '',   // dán link Figma vào đây; để trống thì thẻ Figma không hiện
}
```

## Deploy (Vercel)

1. Đăng nhập [vercel.com](https://vercel.com) bằng GitHub.
2. **Add New → Project → Import** `L02-VibeCode/StudentMart`.
3. **Root Directory:** `landing` (bắt buộc — repo còn `mobile/` và `backend/`).
4. Framework Preset: **Vite**. Build Command `npm run build`, Output `dist`.
5. Deploy → nhận URL công khai.

Sau khi có domain, cập nhật `og:image` trong `index.html` thành URL tuyệt đối
(`https://<domain>/brand/banner.jpg`) để chia sẻ mạng xã hội hiển thị ảnh.

## Ghi chú

- Trang tĩnh một cấp; không có router nên không cần cấu hình rewrite.
- Ảnh màn hình dùng `loading="lazy"`; 8 ảnh hiển thị, 16 ảnh còn lại vẫn deploy cùng để dùng lại sau.
- Font: Inter qua Google Fonts (preconnect).
