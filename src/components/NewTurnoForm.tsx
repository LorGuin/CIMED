import { useMemo, useState, type FormEvent } from 'react'
import type { DoctorProfile } from '../firebase/doctors'
import { createTurnoByStaff, type Turno } from '../firebase/turnos'
import { getAvailableSlots } from '../utils/availability'
import './NewTurnoForm.scss'

interface Props {
  doctors: DoctorProfile[]
  // Si viene seteado (panel Médico), el médico queda fijo y no se muestra el selector.
  lockDoctorId?: string
  // Turnos ya cargados, para detectar si el horario elegido choca con uno existente.
  existingTurnos: Turno[]
  onCreated: () => void
}

export default function NewTurnoForm({ doctors, lockDoctorId, existingTurnos, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [doctorId, setDoctorId] = useState(lockDoctorId ?? doctors[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientDni, setPatientDni] = useState('')
  const [motivo, setMotivo] = useState('')
  const [authorizedOverbooking, setAuthorizedOverbooking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveDoctorId = lockDoctorId ?? doctorId
  const selectedDoctor = doctors.find((d) => d.id === effectiveDoctorId) ?? null

  // Un sobreturno es un turno cargado por Secretaría o Médico fuera de la agenda habitual del
  // médico (horario ya ocupado o fuera de sus franjas semanales). Se calcula en vivo, apenas hay
  // fecha y hora elegidas, para poder mostrar el aviso antes de que la persona llegue a guardar.
  const isOverbooking = useMemo(() => {
    if (!selectedDoctor || !date || !time) return false
    const takenTimes = existingTurnos
      .filter((t) => t.doctorId === selectedDoctor.id && t.date === date && t.status !== 'cancelado')
      .map((t) => t.time)
    const normalSlots = getAvailableSlots(selectedDoctor.availability, date, selectedDoctor.slotMinutes, [])
    const isFree = normalSlots.includes(time) && !takenTimes.includes(time)
    return !isFree
  }, [selectedDoctor, date, time, existingTurnos])

  const resetForm = () => {
    setDate('')
    setTime('')
    setPatientName('')
    setPatientPhone('')
    setPatientDni('')
    setMotivo('')
    setAuthorizedOverbooking(false)
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !date || !time) return
    setError(null)

    // Un turno normal (el paciente lo pide desde la web) es una cosa; un sobreturno es otra: solo
    // lo puede cargar Médico o Secretaría, y si lo carga Secretaría en nombre de un médico, tiene
    // que estar previamente autorizado por ese médico — acá lo exigimos con un checkbox explícito
    // antes de dejar guardar (para el propio médico cargando su agenda alcanza con un aviso, ya
    // que se está autorizando a sí mismo).
    if (isOverbooking && !lockDoctorId && !authorizedOverbooking) {
      setError('Para cargar un sobreturno primero tenés que consultarlo con el médico y confirmar el aviso de abajo.')
      return
    }
    if (isOverbooking && lockDoctorId) {
      const ok = confirm(
        'Este horario está ocupado o fuera de tu agenda habitual. ¿Cargarlo igual como sobreturno?'
      )
      if (!ok) return
    }

    setSubmitting(true)
    try {
      await createTurnoByStaff({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName,
        patientPhone,
        patientDni,
        motivo,
        date,
        time,
        isOverbooking,
      })

      resetForm()
      setOpen(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el turno.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary new-turno-form__toggle" onClick={() => setOpen(true)}>
        + Nuevo turno
      </button>
    )
  }

  return (
    <form className="new-turno-form" onSubmit={handleSubmit}>
      <h3>Nuevo turno</h3>
      <p className="new-turno-form__hint">
        Esto es para cargar un turno a mano (distinto al que pide el paciente desde la web). Si el
        horario ya está ocupado o cae fuera de la agenda habitual del médico, es un{' '}
        <strong>sobreturno</strong>
        {!lockDoctorId
          ? ' — solo se puede dar con autorización previa del médico correspondiente.'
          : ' — el sistema te va a avisar antes de guardarlo.'}
      </p>

      {!lockDoctorId && (
        <label>
          Médico
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="new-turno-form__row">
        <label>
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Hora
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </label>
      </div>

      {isOverbooking && !lockDoctorId && (
        <div className="new-turno-form__overbooking-warning">
          <p>
            ⚠️ Este horario ya está ocupado o fuera de la agenda habitual de{' '}
            {selectedDoctor?.name ?? 'este médico'}. Los sobreturnos solo se pueden cargar con
            autorización previa del médico — consultalo antes de continuar.
          </p>
          <label className="new-turno-form__checkbox">
            <input
              type="checkbox"
              checked={authorizedOverbooking}
              onChange={(e) => setAuthorizedOverbooking(e.target.checked)}
            />
            Ya lo consulté con el médico y confirmó el sobreturno.
          </label>
        </div>
      )}

      <label>
        Nombre del paciente
        <input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
      </label>
      <label>
        Teléfono
        <input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} required />
      </label>
      <label>
        DNI (opcional)
        <input value={patientDni} onChange={(e) => setPatientDni(e.target.value)} />
      </label>
      <label>
        Motivo (opcional)
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </label>

      {error && <p className="login-card__error">{error}</p>}

      <div className="new-turno-form__actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar turno'}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            resetForm()
            setOpen(false)
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
