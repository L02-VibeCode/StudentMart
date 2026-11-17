import Reveal from './Reveal.jsx'
import { PROBLEM } from '../content.js'

export default function Problem() {
  return (
    <section className="section alt" id="problem">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">{PROBLEM.eyebrow}</p>
            <h2>{PROBLEM.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{PROBLEM.lead}</p>
          </Reveal>
        </div>

        <div className="problem-grid">
          {PROBLEM.items.map((item, i) => (
            <Reveal className="problem-item" key={item.title} delay={i * 60}>
              <span className="problem-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>

        <p className="footnote">{PROBLEM.footnote}</p>
      </div>
    </section>
  )
}
