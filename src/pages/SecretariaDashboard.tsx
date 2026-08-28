import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import { listAllTurnos, updateTurnoStatus, type Turno, type TurnoStatus } from '../firebase/turnos'
import { archivePastTurnos, buildPatientKey } from '../firebase/patientVisits'
import {
  listAllPatientBackgrounds,
  savePatientBackground,
  type PatientBackground,
  type SavePatientBackgroundInput,
} from '../firebase/patientBackground'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import { buildWhatsAppLink, normalizeArgPhone } from '../utils/whatsapp'
import { formatDateDisplay } from '../utils/availability'
import NewTurnoForm from '../components/NewTurnoForm'
import DoctorDayAgenda from '../components/DoctorDayAgenda'
import PatientFichaToggle from '../components/PatientFichaToggle'
import PatientHistory from '../components/PatientHistory'
import PortalShell from './PortalShell'
import './Dashboard.scss'
import './Turnos.scss'

const STATUS_LABEL: Record<TurnoStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

export default function SecretariaDashboard() {
  const { staff } = useAuth()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [doctorFilter, setDoctorFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [backgrounds, setBackgrounds] = useState<PatientBackground[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      // Antes de traer la lista, se archivan los turnos ya vencidos (cancelados o atendidos) a
      // la ficha de cada paciente — así esta lista no va acumulando historial viejo.
      await archivePastTurnos().catch(() => {})
      setTurnos(await listAllTurnos())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los turnos.')
    } finally {
      setLoading(false)
    }
  }

  // Ficha de cada paciente (datos personales/cobertura + antecedentes) — Secretaría la puede
  // completar antes de la consulta para ahorrarle tiempo al médico. Es la misma ficha que ve el
  // médico (los pacientes son de CIMED, no de un médico en particular).
  const loadBackgrounds = () => {
    listAllPatientBackgrounds().then(setBackgrounds)
  }

  const handleSaveBackground = async (
    t: Turno,
    input: Omit<SavePatientBackgroundInput, 'patientKey' | 'patientName' | 'updatedBy'>
  ) => {
    await savePatientBackground({
      patientKey: buildPatientKey(t.patientDni, t.patientPhone),
      patientName: t.patientName,
      updatedBy: staff?.name ?? 'Secretaría',
      ...input,
    })
    loadBackgrounds()
  }

  useEffect(() => {
    load()
    listDoctors().then(setDoctors)
    loadBackgrounds()
  }, [])

  const doctorNames = useMemo(
    () => Array.from(new Set(turnos.map((t) => t.doctorName))).sort(),
    [turnos]
  )

  const filtered = useMemo(
    () =>
      turnos.filter(
        (t) => (!doctorFilter || t.doctorName === doctorFilter) && (!dateFilter || t.date === dateFilter)
      ),
    [turnos, doctorFilter, dateFilter]
  )

  const handleConfirm = async (t: Turno) => {
    setUpdatingId(t.id)
    try {
      await updateTurnoStatus(t.id, 'confirmado')
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCancel = async (t: Turno) => {
    if (!confirm(`¿Cancelar el turno de ${t.patientName} (${t.doctorName}, ${formatDateDisplay(t.date)} ${t.time} hs)?`)) {
      return
    }
    setUpdatingId(t.id)
    try {
      await updateTurnoStatus(t.id, 'cancelado')
      await load()
      const msg = `Hola ${t.patientName}, te escribimos de CIMED: tu turno con ${t.doctorName} para el ${formatDateDisplay(t.date)} a las ${t.time} hs fue cancelado. Cualquier consulta, escribinos por acá.`
      window.open(buildWhatsAppLink(msg, normalizeArgPhone(t.patientPhone)), '_blank', 'noreferrer')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <PortalShell>
      <h1>Panel de Secretaría</h1>
      <p className="dashboard__intro">
        Turnos de todos los médicos. Al cancelar uno se abre WhatsApp con un mensaje ya armado para
        avisarle al paciente — solo hay que revisarlo y enviarlo.
      </p>

      <PatientHistory />

      <DoctorDayAgenda doctors={doctors} turnos={turnos} />

      <NewTurnoForm doctors={doctors} existingTurnos={turnos} onCreated={load} />

      <div className="turnos__filters">
        <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
          <option value="">Todos los médicos</option>
          {doctorNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        {(doctorFilter || dateFilter) && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setDoctorFilter('')
              setDateFilter('')
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {loading && <p>Cargando turnos…</p>}
      {error && <p className="login-card__error">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p>No hay turnos para mostrar.</p>}

      <div className="turnos__list">
        {filtered.map((t) => (
          <div className="turnos__item" key={t.id}>
            <div className="turnos__item-main">
              <span className={`turnos__status turnos__status--${t.status}`}>{STATUS_LABEL[t.status]}</span>
              {t.isOverbooking && <span className="turnos__overbooking">Sobreturno</span>}
              <strong>
                {formatDateDisplay(t.date)} — {t.time} hs
              </strong>
              <span>{t.doctorName}</span>
            </div>

            <div className="turnos__item-patient">
              <span>
                {t.patientName} · {t.patientPhone}
              </span>
              {t.patientDni && <span>DNI {t.patientDni}</span>}
              {t.motivo && <span>Motivo: {t.motivo}</span>}
              {t.seniaInformada && <span className="turnos__senia">Seña informada ✓</span>}
            </div>

            {t.status !== 'cancelado' && (
              <div className="turnos__item-actions">
                {t.status === 'pendiente' && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={updatingId === t.id}
                    onClick={() => handleConfirm(t)}
                  >
                    Confirmar
                  </button>
                )}
                <button
                  type="button"
                  className="turnos__cancel-btn"
                  disabled={updatingId === t.id}
                  onClick={() => handleCancel(t)}
                >
                  Cancelar
                </button>
              </div>
            )}

            <PatientFichaToggle
              background={
                backgrounds.find((b) => b.patientKey === buildPatientKey(t.patientDni, t.patientPhone)) ?? null
              }
              onSave={(input) => handleSaveBackground(t, input)}
            />
          </div>
        ))}
      </div>
    </PortalShell>
  )
}
