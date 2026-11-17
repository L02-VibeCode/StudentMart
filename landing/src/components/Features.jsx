import Reveal from './Reveal.jsx'
import Icon from './Icon.jsx'
import { FEATURES } from '../content.js'

export default function Features() {
  return (
    <section className="section alt" id="features">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">{FEATURES.eyebrow}</p>
            <h2>{FEATURES.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{FEATURES.lead}</p>
          </Reveal>
        </div>

        <div className="feature-grid">
          {FEATURES.items.map((item, i) => (
            <Reveal className="feature card" key={item.title} delay={(i % 3) * 60}>
              <span className="feature-icon">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>

        <p className="footnote">{FEATURES.footnote}</p>
      </div>
    </section>
  )
}
