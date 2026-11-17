import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Problem from './components/Problem.jsx'
import Solution from './components/Solution.jsx'
import Features from './components/Features.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Showcase from './components/Showcase.jsx'
import DesignSystem from './components/DesignSystem.jsx'
import Team from './components/Team.jsx'
import Links from './components/Links.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua điều hướng
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <Showcase />
        <DesignSystem />
        <Team />
        <Links />
      </main>
      <Footer />
    </>
  )
}
