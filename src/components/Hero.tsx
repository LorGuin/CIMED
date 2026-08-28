import { Link } from 'react-router-dom'
import './Hero.scss'

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__grid">
        <div className="hero__content">
          <h1 className="hero__title">
            <span className="hero__title-brand">CIMED</span>: Centro Integral de Medicina y
            Diagnóstico
          </h1>
          <p className="hero__text">
            Brindamos atención médica integral con foco en la{' '}
            <span className="hero__highlight">prevención</span>, el{' '}
            <span className="hero__highlight">diagnóstico temprano</span> y el{' '}
            <span className="hero__highlight">bienestar continuo</span> de nuestros pacientes.
            Contamos con profesionales comprometidos y servicios de diagnóstico para ofrecerte un
            cuidado integral y de calidad.
          </p>
          <p className="hero__text">
            Gestioná tu próxima atención de manera ágil y cómoda. Solicitá tu turno hoy y
            confirmalo directo en tu{' '}
            <span className="hero__highlight hero__highlight--whatsapp">WhatsApp</span>.
          </p>

          <div className="hero__actions">
            <Link className="btn-primary hero__cta" to="/turno">
              📅 Pedir turno
            </Link>
            <a className="btn-outline" href="#especialidades">
              Conocé a nuestros médicos
            </a>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <span className="hero__circle hero__circle--1" />
          <span className="hero__circle hero__circle--2" />
          <span className="hero__circle hero__circle--3" />

          <img className="hero__logo" src="/logo-cimed.png" alt="" />

          <span className="hero__badge hero__badge--1">🧠</span>
          <span className="hero__badge hero__badge--2">❤️</span>
          <span className="hero__badge hero__badge--3">🔬</span>
          <span className="hero__badge hero__badge--4">🧪</span>
          <span className="hero__badge hero__badge--5">🩸</span>
        </div>
      </div>
    </section>
  )
}
