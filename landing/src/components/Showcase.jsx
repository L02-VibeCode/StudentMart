import Reveal from './Reveal.jsx'
import { SCREENS } from '../content.js'

export default function Showcase() {
  return (
    <section className="section dark" id="showcase">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Giao diện</p>
            <h2>24 màn hình, một chuỗi liền mạch.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">
              Từ đăng nhập, tìm tin, xem chi tiết đến chat và cập nhật trạng thái — mọi màn hình
              trong MVP đều đã được thiết kế và đối chiếu với hợp đồng dữ liệu.
            </p>
          </Reveal>
        </div>

        <div className="showcase-grid">
          {SCREENS.map((screen, i) => (
            <Reveal className="screen-card" key={screen.src} delay={(i % 4) * 60}>
              <div className="phone">
                <img
                  src={screen.src}
                  alt={screen.alt}
                  width="393"
                  height="852"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3>{screen.title}</h3>
              <p>{screen.caption}</p>
            </Reveal>
          ))}
        </div>

        <p className="showcase-note">
          Bộ đầy đủ 24 màn hình gồm trạng thái rỗng, lỗi và xác thực nằm trong báo cáo và Figma của
          nhóm.
        </p>
      </div>
    </section>
  )
}
