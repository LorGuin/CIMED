import { Link } from 'react-router-dom'
import './Hero.scss'

const HIGHLIGHTS = [
  { value: '5', label: 'especialidades' },
  { value: '24 hs', label: 'turnos online' },
  { value: 'Propio', label: 'laboratorio' },
]

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero__grid">
        <div className="hero__content">
          <span className="section-eyebrow">Clínica Aurora · Mendoza</span>
          <h1 className="hero__title">
            Cuidamos tu salud <em>desde el primer día.</em>
          </h1>
          <p className="hero__text">
            Atención médica integral con foco en la prevención, el diagnóstico temprano y el
            acompañamiento continuo. Especialistas, laboratorio y estudios en un solo lugar.
          </p>

          <div className="hero__actions">
            <Link className="btn-primary hero__cta" to="/turno">
              Pedir turno online
            </Link>
            <a className="btn-outline" href="#especialidades">
              Conocé al equipo
            </a>
          </div>

          <ul className="hero__stats">
            {HIGHLIGHTS.map((h) => (
              <li key={h.label}>
                <strong>{h.value}</strong>
                <span>{h.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ilustración decorativa: un amanecer (la marca) con tarjetas que muestran cómo funciona
            el turnero — elegir horario y confirmar por WhatsApp. */}
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__sky">
            <span className="hero__sun" />
            <span className="hero__ray hero__ray--1" />
            <span className="hero__ray hero__ray--2" />
            <span className="hero__ray hero__ray--3" />
            <span className="hero__hill hero__hill--back" />
            <span className="hero__hill hero__hill--front" />
          </div>

          <div className="hero__card hero__card--turno">
            <span className="hero__card-label">Próximo turno disponible</span>
            <strong>Cardiología</strong>
            <div className="hero__slots">
              <span>09:00</span>
              <span className="is-selected">09:30</span>
              <span>10:30</span>
            </div>
          </div>

          <div className="hero__card hero__card--ok">
            <span className="hero__check">✓</span>
            <div>
              <strong>Turno confirmado</strong>
              <span>Te avisamos por WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
