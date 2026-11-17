import Reveal from './Reveal.jsx'
import { ABOUT } from '../content.js'

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">{ABOUT.eyebrow}</p>
            <h2>{ABOUT.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{ABOUT.lead}</p>
            <p className="section-body">{ABOUT.body}</p>
          </Reveal>
        </div>

        <div className="pillars">
          {ABOUT.pillars.map((pillar, i) => (
            <Reveal className="pillar card" key={pillar.title} delay={i * 70}>
              <span className="pillar-index">0{i + 1}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
