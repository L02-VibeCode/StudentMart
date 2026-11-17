import Reveal from './Reveal.jsx'
import Icon from './Icon.jsx'
import { DOCS } from '../content.js'

export default function Links() {
  return (
    <section className="section" id="links">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Tài liệu</p>
            <h2>Đi sâu vào dự án.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">
              Toàn bộ nghiên cứu, quyết định sản phẩm, mã nguồn và báo cáo đều công khai.
            </p>
          </Reveal>
        </div>

        <div className="doc-grid">
          {DOCS.map((doc, i) => (
            <Reveal key={doc.title} delay={(i % 2) * 60}>
              <a className="doc-card" href={doc.href} target="_blank" rel="noreferrer">
                <span className="doc-icon">
                  <Icon name={doc.icon} size={24} />
                </span>
                <span className="doc-body">
                  <strong>{doc.title}</strong>
                  <span>{doc.text}</span>
                </span>
                <Icon name="arrow" size={20} className="doc-arrow" />
              </a>
            </Reveal>
          ))}
        </div>

        <p className="footnote">
          Liên kết mở trong tab mới. Nếu file Figma yêu cầu quyền truy cập, hãy dùng email trường
          của nhóm.
        </p>
      </div>
    </section>
  )
}
