import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import { specialties, getSpecialtyIcon } from '../data/specialties'
import './Specialties.scss'

export default function Specialties() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .finally(() => setLoading(false))
  }, [])

  // La fila de íconos de arriba ("Nuestras Especialidades") se arma sola a partir de los médicos
  // ya cargados: apenas se carga un médico con una especialidad nueva desde el Panel de
  // Administrador, aparece acá también — sin tener que tocar código ni pedirlo. `getSpecialtyIcon`
  // le busca un ícono acorde por palabra clave (cardiología, dermatología, pediatría, etc.); si es
  // una especialidad rarísima que no matchea ninguna, le pone un ícono genérico así igual aparece.
  const specialtyList = useMemo(() => {
    const found = new Map<string, string>()
    doctors.forEach((doctor) => {
      const label = doctor.shortSpecialty?.trim()
      if (!label || found.has(label)) return
      found.set(label, getSpecialtyIcon(label))
    })
    // Antes de que carguen los médicos (o si todavía no hay ninguno), mostramos la lista base para
    // que la sección no se vea vacía.
    if (found.size === 0) return specialties
    return Array.from(found, ([label, icon]) => ({ label, icon }))
  }, [doctors])

  const initials = (name: string) =>
    name
      .replace(/^(Dr\.|Dra\.)\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('')

  return (
    <section id="especialidades" className="specialties">
      <div className="specialties__header">
        <span className="section-eyebrow">Nuestro equipo</span>
        <h2>Especialidades y profesionales</h2>
        <p>Elegí a tu médico y reservá el turno online en menos de un minuto.</p>
      </div>

      <div className="specialties__icons">
        {specialtyList.map((s) => (
          <div className="specialties__icon-item" key={s.label}>
            <span className="specialties__icon" aria-hidden="true">{s.icon}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {!loading && doctors.length === 0 && (
        <p className="specialties__empty">
          Todavía no hay médicos cargados. Se agregan desde el Panel de Administrador.
        </p>
      )}

      <div className="specialties__doctors">
        {doctors.map((doctor) => (
          <Link
            key={doctor.id}
            className="doctor-chip"
            to={`/turno?doctor=${doctor.id}`}
            title={`Pedir turno con ${doctor.name}`}
          >
            <span className="doctor-chip__media">
              {doctor.photoUrl ? (
                <img
                  src={doctor.photoUrl}
                  alt={doctor.name}
                  loading="lazy"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="doctor-chip__initials" aria-hidden="true">
                  {initials(doctor.name)}
                </span>
              )}
            </span>
            <span className="doctor-chip__body">
              <span className="doctor-chip__label">{doctor.shortSpecialty}</span>
              <strong className="doctor-chip__name">{doctor.name}</strong>
              <span className="doctor-chip__cta">
                Pedir turno <span aria-hidden="true">→</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
