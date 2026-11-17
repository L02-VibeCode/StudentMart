import { FOOTER, LINKS, NAV } from '../content.js'
import Icon from './Icon.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <a className="brand brand--footer" href="#top">
            <img src="/brand/logo.jpg" alt="" width="34" height="34" />
            <span className="brand-word">
              Student<span>Mart</span>
            </span>
          </a>
          <p>{FOOTER.tagline}</p>
          <p className="footer-course">{FOOTER.course}</p>
        </div>

        <nav className="footer-nav" aria-label="Liên kết chân trang">
          <div>
            <h4>Điều hướng</h4>
            {NAV.slice(0, 3).map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
          <div>
            <h4>Tài liệu</h4>
            <a href={LINKS.repo} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={LINKS.wiki} target="_blank" rel="noreferrer">
              Wiki
            </a>
            <a href={LINKS.report} target="_blank" rel="noreferrer">
              Báo cáo PDF
            </a>
          </div>
        </nav>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} StudentMart · {FOOTER.org}</span>
        <a className="footer-gh" href={LINKS.repo} target="_blank" rel="noreferrer">
          <Icon name="github" size={18} />
          Mã nguồn
        </a>
      </div>
    </footer>
  )
}
