import Reveal from './Reveal.jsx'
import { TEAM } from '../content.js'

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

export default function Team() {
  return (
    <section className="section alt" id="team">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Nhóm</p>
            <h2>Năm người, một học kỳ.</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead">
              Dự án môn CO3043 — Phát triển ứng dụng di động, HK261, tổ chức L02-VibeCode.
            </p>
          </Reveal>
        </div>

        <div className="team-grid">
          {TEAM.map((member, i) => (
            <Reveal className="member card" key={member.id} delay={i * 60}>
              <span className="avatar" aria-hidden="true">
                {initials(member.name)}
              </span>
              <h3>{member.name}</h3>
              <p className="member-id">MSSV {member.id}</p>
              <span className={`role ${member.role === 'Nhóm trưởng' ? 'is-lead' : ''}`}>
                {member.role}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
