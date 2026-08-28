import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSettings } from '../firebase/SettingsContext'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import { createTurno, listTurnosByDoctor, type Turno } from '../firebase/turnos'
import { buildWhatsAppLink } from '../utils/whatsapp'
import { formatDateDisplay, getAllSlots, getAvailableSlots, nextAvailableDates } from '../utils/availability'
import './BookAppointment.scss'

const STEP_LABELS = ['Médico', 'Fecha', 'Horario', 'Tus datos']

export default function BookAppointment() {
  const { whatsappNumber } = useSettings()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1)

  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  const [doctorTurnos, setDoctorTurnos] = useState<Turno[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(false)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientDni, setPatientDni] = useState('')
  const [motivo, setMotivo] = useState('')
  const [seniaInformada, setSeniaInformada] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedTurno, setConfirmedTurno] = useState<Turno | null>(null)

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .catch((err) => setDoctorsError(err instanceof Error ? err.message : 'No se pudo cargar la lista de médicos.'))
      .finally(() => setLoadingDoctors(false))
  }, [])

  // Si se entra desde el link de un médico puntual (ej. desde la sección Especialidades de la
  // landing con /turno?doctor=ID), lo preseleccionamos apenas termina de cargar la lista.
  useEffect(() => {
    const preselect = searchParams.get('doctor')
    if (preselect && doctors.some((d) => d.id === preselect) && !selectedDoctorId) {
      selectDoctor(doctors.find((d) => d.id === preselect) as DoctorProfile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, searchParams])

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  )

  const selectDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctorId(doctor.id)
    setDate('')
    setTime('')
    setLoadingTurnos(true)
    listTurnosByDoctor(doctor.id)
      .then(setDoctorTurnos)
      .catch(() => setDoctorTurnos([]))
      .finally(() => setLoadingTurnos(false))
    setStep(2)
  }

  const availableDates = useMemo(() => {
    if (!selectedDoctor) return []
    return nextAvailableDates(selectedDoctor.availability, 14)
  }, [selectedDoctor])

  // Turnos ya cargados (no cancelados) agrupados por fecha, para poder marcar en la agenda qué
  // horarios están ocupados y qué días están completos, en vez de simplemente ocultarlos.
  const takenTimesByDate = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const t of doctorTurnos) {
      if (t.status === 'cancelado') continue
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t.time)
    }
    return map
  }, [doctorTurnos])

  // Para cada día habilitado, si ya tiene todos sus horarios ocupados lo marcamos como "completo"
  // en la grilla de fechas, en vez de dejar que el cliente lo elija y se encuentre recién en el
  // paso siguiente con que no queda nada libre.
  const fullDates = useMemo(() => {
    if (!selectedDoctor) return new Set<string>()
    const full = new Set<string>()
    for (const d of availableDates) {
      const all = getAllSlots(selectedDoctor.availability, d, selectedDoctor.slotMinutes)
      const taken = takenTimesByDate[d] ?? []
      if (all.length > 0 && all.every((t) => taken.includes(t))) full.add(d)
    }
    return full
  }, [selectedDoctor, availableDates, takenTimesByDate])

  const selectDate = (d: string) => {
    if (fullDates.has(d)) return
    setDate(d)
    setTime('')
    setStep(3)
  }

  const takenTimesForDate = useMemo(
    () => doctorTurnos.filter((t) => t.date === date && t.status !== 'cancelado').map((t) => t.time),
    [doctorTurnos, date]
  )

  // Se muestra la agenda completa del día (libres + ocupados) para que quede claro visualmente
  // qué horarios ya no están disponibles, en vez de solo ocultarlos de la lista.
  const allSlotsForDate = useMemo(() => {
    if (!selectedDoctor || !date) return []
    return getAllSlots(selectedDoctor.availability, date, selectedDoctor.slotMinutes)
  }, [selectedDoctor, date])

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !date) return []
    return getAvailableSlots(selectedDoctor.availability, date, selectedDoctor.slotMinutes, takenTimesForDate)
  }, [selectedDoctor, date, takenTimesForDate])

  const selectTime = (t: string) => {
    if (takenTimesForDate.includes(t)) return
    setTime(t)
    setStep(4)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor || !date || !time) return
    setError(null)
    setSubmitting(true)
    try {
      const turno = await createTurno({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName,
        patientPhone,
        patientDni,
        motivo,
        date,
        time,
        seniaInformada,
      })
      setConfirmedTurno(turno)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el turno. Probá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmedTurno && selectedDoctor) {
    const confirmMessage =
      `Hola CIMED! Quiero confirmar mi turno:\n` +
      `Médico: ${selectedDoctor.name}\n` +
      `Fecha: ${formatDateDisplay(confirmedTurno.date)}\n` +
      `Hora: ${confirmedTurno.time}\n` +
      `Paciente: ${confirmedTurno.patientName}` +
      (confirmedTurno.seniaInformada ? '\nYa realicé la transferencia de la seña.' : '')

    return (
      <div className="book book--confirm">
        <div className="book__confirm-card">
          <span className="book__confirm-icon" aria-hidden="true">
            ✅
          </span>
          <h1>¡Turno registrado!</h1>
          <p>
            Guardamos tu turno con <strong>{selectedDoctor.name}</strong> para el{' '}
            <strong>{formatDateDisplay(confirmedTurno.date)}</strong> a las{' '}
            <strong>{confirmedTurno.time} hs</strong>.
          </p>
          <p>
            Para confirmarlo del todo, envianos el mensaje por WhatsApp — nuestro equipo lo revisa y
            te responde a la brevedad.
          </p>
          <a
            className="btn-primary"
            href={buildWhatsAppLink(confirmMessage, whatsappNumber)}
            target="_blank"
            rel="noreferrer"
          >
            Confirmar por WhatsApp
          </a>
          <Link className="book__confirm-back" to="/">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="book">
      <div className="book__header">
        <Link className="book__logo-link" to="/">
          <img src="/logo-cimed.png" alt="CIMED" className="book__logo" />
        </Link>
        <h1>Pedir turno</h1>
      </div>

      <div className="book__steps">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`book__step ${step === i + 1 ? 'book__step--active' : ''} ${step > i + 1 ? 'book__step--done' : ''}`}>
            <span className="book__step-num">{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="book__card">
        {step === 1 && (
          <>
            <h2>Elegí el médico</h2>
            {loadingDoctors && <p>Cargando médicos…</p>}
            {doctorsError && <p className="login-card__error">{doctorsError}</p>}
            {!loadingDoctors && doctors.length === 0 && (
              <p>Todavía no hay médicos cargados. Escribinos por WhatsApp para coordinar tu turno.</p>
            )}
            <div className="book__doctor-grid">
              {doctors.map((d) => (
                <button type="button" key={d.id} className="book__doctor-card" onClick={() => selectDoctor(d)}>
                  {d.photoUrl ? (
                    <img src={d.photoUrl} alt={d.name} />
                  ) : (
                    <span className="book__doctor-initials" aria-hidden="true">
                      {d.name
                        .replace(/^(Dr\.|Dra\.)\s*/i, '')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join('')}
                    </span>
                  )}
                  <strong>{d.name}</strong>
                  <span>{d.shortSpecialty}</span>
                  {d.consultationFee && <span className="book__doctor-fee">{d.consultationFee}</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && selectedDoctor && (
          <>
            <button type="button" className="book__back" onClick={() => setStep(1)}>
              ← Cambiar médico
            </button>
            <h2>Elegí el día</h2>
            <p className="book__doctor-chosen">
              Turno con <strong>{selectedDoctor.name}</strong> — {selectedDoctor.specialty}
            </p>

            {loadingTurnos && <p>Cargando agenda…</p>}

            {!loadingTurnos && availableDates.length === 0 && (
              <div className="book__no-schedule">
                <p>
                  Este médico todavía no tiene horarios cargados en el sistema. Escribinos por
                  WhatsApp y te ayudamos a coordinar el turno.
                </p>
                <a
                  className="btn-primary"
                  href={buildWhatsAppLink(
                    selectedDoctor.whatsappMessage || `Hola CIMED! Quiero pedir un turno con ${selectedDoctor.name}.`,
                    whatsappNumber
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pedir turno por WhatsApp
                </a>
              </div>
            )}

            {!loadingTurnos && availableDates.length > 0 && (
              <>
                <div className="book__legend">
                  <span>
                    <i className="book__legend-dot book__legend-dot--free" /> Con lugar
                  </span>
                  <span>
                    <i className="book__legend-dot book__legend-dot--full" /> Completo
                  </span>
                </div>
                <div className="book__date-grid">
                  {availableDates.map((d) => {
                    const full = fullDates.has(d)
                    return (
                      <button
                        type="button"
                        key={d}
                        className={`book__date-card ${full ? 'book__date-card--full' : ''}`}
                        onClick={() => selectDate(d)}
                        disabled={full}
                      >
                        {formatDateDisplay(d)}
                        {full && <span className="book__date-full-tag">Completo</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {step === 3 && selectedDoctor && date && (
          <>
            <button type="button" className="book__back" onClick={() => setStep(2)}>
              ← Cambiar día
            </button>
            <h2>Elegí el horario</h2>
            <p className="book__doctor-chosen">
              {selectedDoctor.name} — {formatDateDisplay(date)}
            </p>

            {allSlotsForDate.length === 0 ? (
              <p>Este médico no atiende ese día. Probá con otra fecha.</p>
            ) : availableSlots.length === 0 ? (
              <p>No quedan horarios libres ese día. Probá con otra fecha.</p>
            ) : (
              <>
                <div className="book__legend">
                  <span>
                    <i className="book__legend-dot book__legend-dot--free" /> Libre
                  </span>
                  <span>
                    <i className="book__legend-dot book__legend-dot--full" /> Ocupado
                  </span>
                </div>
                <div className="book__time-grid">
                  {allSlotsForDate.map((t) => {
                    const taken = takenTimesForDate.includes(t)
                    return (
                      <button
                        type="button"
                        key={t}
                        className={`book__time-card ${taken ? 'book__time-card--taken' : ''}`}
                        onClick={() => selectTime(t)}
                        disabled={taken}
                      >
                        {t} hs
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {step === 4 && selectedDoctor && date && time && (
          <>
            <button type="button" className="book__back" onClick={() => setStep(3)}>
              ← Cambiar horario
            </button>
            <h2>Tus datos</h2>
            <p className="book__doctor-chosen">
              {selectedDoctor.name} — {formatDateDisplay(date)} a las {time} hs
            </p>
            {selectedDoctor.consultationFee && (
              <p className="book__fee-note">
                Valor de la consulta: <strong>{selectedDoctor.consultationFee}</strong>
              </p>
            )}

            <form className="book__form" onSubmit={handleSubmit}>
              <label>
                Nombre y apellido
                <input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
              </label>
              <label>
                Teléfono de contacto
                <input
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="261 4123456"
                  required
                />
              </label>
              <label>
                DNI (opcional)
                <input value={patientDni} onChange={(e) => setPatientDni(e.target.value)} />
              </label>
              <label>
                Motivo de la consulta (opcional)
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </label>

              {(selectedDoctor.alias || selectedDoctor.qrUrl) && (
                <div className="book__payment">
                  <h3>Seña para reservar el turno</h3>
                  {selectedDoctor.seniaAmount && (
                    <p className="book__senia-amount">
                      Valor de la seña: <strong>{selectedDoctor.seniaAmount}</strong>
                    </p>
                  )}
                  <p>Podés transferir la seña por alias o escaneando el QR:</p>
                  <div className="book__payment-row">
                    {selectedDoctor.qrUrl && <img src={selectedDoctor.qrUrl} alt="Código QR para transferencia" />}
                    {selectedDoctor.alias && (
                      <div className="book__alias">
                        <span>Alias</span>
                        <strong>{selectedDoctor.alias}</strong>
                      </div>
                    )}
                  </div>
                  <label className="book__checkbox">
                    <input
                      type="checkbox"
                      checked={seniaInformada}
                      onChange={(e) => setSeniaInformada(e.target.checked)}
                    />
                    Ya realicé la transferencia de la seña
                  </label>
                  <a
                    className="book__send-receipt"
                    href={buildWhatsAppLink(
                      `Hola! Te envío el comprobante de la seña para mi turno con ${selectedDoctor.name} el ${formatDateDisplay(date)} a las ${time} hs.`,
                      whatsappNumber
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 Enviar comprobante por WhatsApp
                  </a>
                  <p className="book__send-receipt-hint">
                    Se abre WhatsApp (la app en el celular, o WhatsApp Web si estás desde la compu) con
                    el chat del centro ya armado — ahí adjuntás la foto o captura del comprobante y la
                    enviás.
                  </p>
                </div>
              )}

              <p className="book__privacy-note">
                🔒 Estos datos (nombre, teléfono, y DNI o motivo si los cargaste) los usamos solo
                para coordinar tu turno y armar tu ficha en CIMED, conforme a la Ley 25.326 de
                Protección de Datos Personales. Los ve únicamente el personal del centro. Podés
                pedirnos que los corrijamos o eliminemos escribiéndonos por WhatsApp.
              </p>

              {error && <p className="login-card__error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Guardando…' : 'Confirmar turno'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
