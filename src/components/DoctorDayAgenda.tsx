import { useMemo, useState } from 'react'
import type { DoctorProfile } from '../firebase/doctors'
import type { Turno } from '../firebase/turnos'
import { formatDateDisplay, getAllSlots, todayStr } from '../utils/availability'
import './DoctorDayAgenda.scss'

interface Props {
  doctors: DoctorProfile[]
  turnos: Turno[]
}

// Agenda simplificada: Secretaría elige un médico y un día, y ve de un vistazo qué horarios están
// libres y cuáles ya están ocupados — sin tener que buscarlo entre toda la lista de turnos. Usa la
// misma lógica de franjas semanales que ya calcula la disponibilidad real en /turno.
export default function DoctorDayAgenda({ doctors, turnos }: Props) {
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState(todayStr())

  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId) ?? null, [doctors, doctorId])

  const allSlots = useMemo(() => {
    if (!doctor) return []
    return getAllSlots(doctor.availability, date, doctor.slotMinutes)
  }, [doctor, date])

  const takenTimes = useMemo(
    () =>
      turnos
        .filter((t) => t.doctorId === doctorId && t.date === date && t.status !== 'cancelado')
        .map((t) => t.time),
    [turnos, doctorId, date]
  )

  const freeCount = allSlots.filter((t) => !takenTimes.includes(t)).length

  return (
    <div className="doctor-day-agenda">
      <h3>Agenda simplificada</h3>
      <p className="doctor-day-agenda__hint">
        Elegí un médico y un día para ver qué horarios le quedan libres, de un vistazo.
      </p>

      <div className="doctor-day-agenda__controls">
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Elegí un médico…</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {!doctor && <p className="doctor-day-agenda__hint">Todavía no elegiste un médico.</p>}

      {doctor && allSlots.length === 0 && (
        <p className="doctor-day-agenda__hint">
          {doctor.name} no tiene horarios cargados para el {formatDateDisplay(date)}.
        </p>
      )}

      {doctor && allSlots.length > 0 && (
        <>
          <div className="doctor-day-agenda__summary">
            <strong>{freeCount}</strong> libres de {allSlots.length} — {formatDateDisplay(date)}
          </div>

          <div className="doctor-day-agenda__legend">
            <span>
              <i className="doctor-day-agenda__dot doctor-day-agenda__dot--free" /> Libre
            </span>
            <span>
              <i className="doctor-day-agenda__dot doctor-day-agenda__dot--taken" /> Ocupado
            </span>
          </div>

          <div className="doctor-day-agenda__slots">
            {allSlots.map((t) => {
              const taken = takenTimes.includes(t)
              return (
                <span
                  key={t}
                  className={`doctor-day-agenda__slot ${taken ? 'doctor-day-agenda__slot--taken' : 'doctor-day-agenda__slot--free'}`}
                >
                  {t}
                </span>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
