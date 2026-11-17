import Reveal from './Reveal.jsx'
import { PALETTE, RADII, SPACING, TYPE_SCALE } from '../content.js'

export default function DesignSystem() {
  return (
    <section className="section" id="design">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Hệ thống thiết kế</p>
            <h2>Một bộ token, dùng lại ở mọi màn hình.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">
              Palette, kiểu chữ và khoảng cách dưới đây lấy từ board Hệ thống thiết kế v1.0 của
              nhóm: Inter, cam <code>#F07824</code> làm màu nhấn, nền sáng và bo góc mềm.
            </p>
          </Reveal>
        </div>

        <div className="ds-block">
          <h3 className="ds-title">Màu sắc</h3>
          <div className="swatches">
            {PALETTE.map((color, i) => (
              <Reveal className="swatch" key={color.hex} delay={(i % 5) * 40}>
                <span className="swatch-chip" style={{ background: color.hex }} />
                <strong>{color.name}</strong>
                <code>{color.hex}</code>
                <small>{color.use}</small>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="ds-columns">
          <div className="ds-block">
            <h3 className="ds-title">Kiểu chữ</h3>
            <div className="type-list">
              {TYPE_SCALE.map((type) => (
                <div className="type-row" key={type.role}>
                  <p className="type-meta">
                    {type.role} · {type.size} · {type.weight}
                  </p>
                  <p
                    className="type-sample"
                    style={{ fontSize: `${type.size.replace(' px', '')}px`, fontWeight: type.weight }}
                  >
                    {type.sample}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="ds-block">
            <h3 className="ds-title">Thành phần</h3>
            <div className="components-demo">
              <div className="demo-row">
                <button className="btn btn-primary" type="button">
                  Đăng tin
                </button>
                <button className="btn btn-ghost" type="button">
                  Hủy
                </button>
              </div>
              <label className="demo-field">
                <span>Email trường</span>
                <input type="email" placeholder="ban@student.hcmut.edu.vn" />
              </label>
              <div className="demo-row">
                <span className="chip is-active">Bán</span>
                <span className="chip">Tìm mua</span>
                <span className="chip">Trao đổi</span>
              </div>
              <div className="demo-card">
                <div className="demo-card-img" aria-hidden="true" />
                <div>
                  <strong>Giáo trình Lập trình Java</strong>
                  <span className="demo-price">85.000đ</span>
                  <small>KTX khu B · 2 giờ trước</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ds-columns ds-columns--compact">
          <div className="ds-block">
            <h3 className="ds-title">Khoảng cách</h3>
            <ul className="scale-list">
              {SPACING.map((value) => (
                <li key={value}>
                  <span className="scale-bar" style={{ width: `${value * 3}px` }} />
                  <code>{value}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="ds-block">
            <h3 className="ds-title">Bo góc</h3>
            <ul className="radius-list">
              {RADII.map((value) => (
                <li key={value}>
                  <span className="radius-box" style={{ borderRadius: `${Math.min(value, 40)}px` }} />
                  <code>{value === 999 ? 'full' : value}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
