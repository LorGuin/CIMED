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
          <h2>CIMED | Tu salud en manos expertas, en pleno corazón de Mendoza</h2>
          <p>
            En CIMED Centro Médico reunimos especialistas en Cardiología, Neurología, Clínica Médica
            y Diabetología, brindándote una atención integral y de confianza en un solo lugar.
          </p>
          <p className="about__lab-highlight">
            Además, dentro de nuestra institución contamos con el{' '}
            <strong>Laboratorio de Análisis Clínicos de la Dra. Alicia Vicente Nieves</strong>,
            garantizando resultados de alta precisión diagnóstica para tus controles y estudios.
          </p>
          <div className="about__hours">
            <h3>📍 Horarios de atención</h3>
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
            alt="Fachada de CIMED, Centro Integral de Medicina y Diagnóstico"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
