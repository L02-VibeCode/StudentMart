import Reveal from './Reveal.jsx'
import Icon from './Icon.jsx'
import { SOLUTION } from '../content.js'

export default function Solution() {
  return (
    <section className="section" id="solution">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">{SOLUTION.eyebrow}</p>
            <h2>{SOLUTION.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{SOLUTION.lead}</p>
          </Reveal>
        </div>

        <ol className="solution-list">
          {SOLUTION.items.map((item, i) => (
            <Reveal as="li" className="solution-item" key={item.title} delay={i * 60}>
              <span className="solution-check" aria-hidden="true">
                <Icon name="check" size={16} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
