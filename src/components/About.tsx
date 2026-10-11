import { obrasSociales } from '../data/doctors'
import { useSettings } from '../firebase/SettingsContext'
import './About.scss'

export default function About() {
  const { consultasHours, laboratorioHours, facadePhotoUrl } = useSettings()

  return (
    <section id="nosotros" className="about">
      <div className="about__inner">
        <div className="about__text">
          <span className="section-eyebrow">Quiénes somos</span>
          <h2>Medicina cercana, con la tranquilidad de estar en buenas manos</h2>
          <p>
            En Clínica Aurora reunimos especialistas en Cardiología, Neurología, Clínica Médica,
            Diabetología y Anatomía Patológica, para que resuelvas consultas, estudios y controles
            en un solo lugar.
          </p>
          <p className="about__lab-highlight">
            Además contamos con <strong>laboratorio de análisis clínicos propio</strong>, para que
            tus análisis se hagan en el mismo lugar donde te atendés y lleguen directo a tu médico.
          </p>
          <div className="about__hours">
            <h3>Horarios de atención</h3>
            <div className="about__hours-grid">
              <div className="about__hours-card">
                <span className="about__hours-icon" aria-hidden="true">🩺</span>
                <div>
                  <strong>Consultas médicas</strong>
                  <span>{consultasHours}</span>
                </div>
              </div>
              <div className="about__hours-card">
                <span className="about__hours-icon" aria-hidden="true">🧪</span>
                <div>
                  <strong>Laboratorio de Análisis Clínicos</strong>
                  <span>{laboratorioHours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="about__card">
          <h3>Obras sociales</h3>
          <ul className="about__chips">
            {obrasSociales.map((os) => (
              <li key={os}>{os}</li>
            ))}
          </ul>

          <img
            className="about__facade"
            src={facadePhotoUrl}
            alt="Fachada de Clínica Aurora"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
