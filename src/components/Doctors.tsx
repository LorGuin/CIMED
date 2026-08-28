import { doctors } from '../data/doctors'
import DoctorCard from './DoctorCard'
import './Doctors.scss'

export default function Doctors() {
  return (
    <section id="especialidades" className="doctors">
      <div className="doctors__inner">
        <div className="doctors__header">
          <span className="section-eyebrow">Nuestro equipo</span>
          <h2>Especialidades y profesionales</h2>
          <p>Conocé a los médicos de CIMED y pedí tu turno directo por WhatsApp.</p>
        </div>

        <div className="doctors__grid">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </div>
    </section>
  )
}
