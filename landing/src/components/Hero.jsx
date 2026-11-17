import Icon from './Icon.jsx'
import { HERO } from '../content.js'

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="badge">
              <Icon name="spark" size={15} />
              {HERO.badge}
            </span>

            <h1>
              {HERO.title}
              <br />
              <em>{HERO.titleAccent}</em>
            </h1>

            <p className="hero-lead">{HERO.lead}</p>

            <div className="hero-actions">
              <a className="btn btn-primary btn-lg" href={HERO.primary.href}>
                {HERO.primary.label}
                <Icon name="arrow" size={18} />
              </a>
              <a
                className="btn btn-ghost btn-lg"
                href={HERO.secondary.href}
                target="_blank"
                rel="noreferrer"
              >
                {HERO.secondary.label}
                <Icon name="external" size={16} />
              </a>
            </div>

            <div className="chips" aria-label="Ba loại tin đăng">
              {HERO.chips.map((chip) => (
                <span className="chip" key={chip}>
                  {chip}
                </span>
              ))}
            </div>

            <p className="hero-note">{HERO.note}</p>
          </div>

          <div className="hero-art">
            <img src="/brand/banner.jpg" alt={HERO.artAlt} width="1672" height="941" />
          </div>
        </div>

        <dl className="stats">
          {HERO.stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
