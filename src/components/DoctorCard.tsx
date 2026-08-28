import type { Doctor } from '../data/doctors'
import { buildWhatsAppLink } from '../utils/whatsapp'
import './DoctorCard.scss'

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card__photo-wrap">
        <img
          className="doctor-card__photo"
          src={doctor.photo}
          alt={`${doctor.name} - ${doctor.specialty}`}
          loading="lazy"
        />
      </div>

      <div className="doctor-card__body">
        <h3>{doctor.name}</h3>
        <p className="doctor-card__specialty">{doctor.specialty}</p>

        {doctor.services && (
          <ul className="doctor-card__services">
            {doctor.services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}

        {doctor.note && <p className="doctor-card__note">{doctor.note}</p>}

        <a
          className="btn-whatsapp doctor-card__cta"
          href={buildWhatsAppLink(doctor.whatsappMessage)}
          target="_blank"
          rel="noreferrer"
        >
          Pedir turno
        </a>
      </div>
    </article>
  )
}
