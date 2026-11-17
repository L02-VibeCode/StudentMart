import Reveal from './Reveal.jsx'
import { STEPS } from '../content.js'

export default function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">{STEPS.eyebrow}</p>
            <h2>{STEPS.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">{STEPS.lead}</p>
          </Reveal>
        </div>

        <ol className="steps">
          {STEPS.items.map((step, i) => (
            <Reveal as="li" className="step" key={step.title} delay={(i % 3) * 70}>
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
