import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { LINKS, NAV } from '../content.js'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="brand" href="#top" aria-label="StudentMart — về đầu trang">
            <img src="/brand/logo.jpg" alt="" width="36" height="36" />
            <span className="brand-word">
              Student<span>Mart</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="btn btn-primary nav-cta" href={LINKS.wiki} target="_blank" rel="noreferrer">
            Tài liệu
            <Icon name="external" size={16} />
          </a>

          <button
            className="nav-burger"
            type="button"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} hidden={!open}>
        <nav aria-label="Điều hướng di động">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="#links" onClick={() => setOpen(false)}>
            Tài liệu dự án
          </a>
        </nav>
        <a className="btn btn-primary" href={LINKS.wiki} target="_blank" rel="noreferrer">
          Mở wiki
          <Icon name="external" size={16} />
        </a>
      </div>
    </>
  )
}
