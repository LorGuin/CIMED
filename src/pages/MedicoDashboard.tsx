import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { getDoctor, type DoctorProfile } from '../firebase/doctors'
import { listTurnosByDoctor, type Turno, type TurnoStatus } from '../firebase/turnos'
import { archivePastTurnos, buildPatientKey, listAllPatientVisits, type PatientVisit } from '../firebase/patientVisits'
import { addClinicalNote, listAllClinicalNotes, type ClinicalNote, type VitalSigns } from '../firebase/clinicalNotes'
import {
  listAllPatientBackgrounds,
  savePatientBackground,
  type PatientBackground,
  type SavePatientBackgroundInput,
} from '../firebase/patientBackground'
import { addStudyPhoto, listAllStudyPhotos, type StudyPhoto } from '../firebase/patientStudies'
import { formatDateDisplay } from '../utils/availability'
import NewTurnoForm from '../components/NewTurnoForm'
import PatientHistory from '../components/PatientHistory'
import PatientQuickRecord from '../components/PatientQuickRecord'
import PortalShell from './PortalShell'
import './Dashboard.scss'
import './Turnos.scss'

const STATUS_LABEL: Record<TurnoStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

export default function MedicoDashboard() {
  const { staff } = useAuth()
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(true)
  const [visits, setVisits] = useState<PatientVisit[]>([])
  const [records, setRecords] = useState<ClinicalNote[]>([])
  const [backgrounds, setBackgrounds] = useState<PatientBackground[]>([])
  const [studies, setStudies] = useState<StudyPhoto[]>([])

  const loadTurnos = () => {
    if (!staff?.doctorId) return
    setLoadingTurnos(true)
    listTurnosByDoctor(staff.doctorId)
      .then((list) => setTurnos(list.filter((t) => t.status !== 'cancelado')))
      .finally(() => setLoadingTurnos(false))
  }

  // Ficha rápida por paciente: se trae UNA sola vez el historial completo de Clínica Aurora (todos los
  // médicos, no solo este), así cada turno de la agenda ya tiene su historial a mano (filtrado por
  // paciente en el navegador) sin que el médico tenga que buscar nada ni se dispare un pedido a
  // Firestore por turno. Los pacientes son de Clínica Aurora, no de un médico en particular — si este mismo
  // paciente ya fue atendido por otro colega, ese historial aparece igual acá.
  const loadRecords = () => {
    listAllPatientVisits().then(setVisits)
    listAllClinicalNotes().then(setRecords)
    listAllPatientBackgrounds().then(setBackgrounds)
    listAllStudyPhotos().then(setStudies)
  }

  const handleAddRecord = async (
    t: Turno,
    input: { diagnostico: string; tratamiento: string; vitals: VitalSigns; estudios: string; observaciones: string }
  ) => {
    if (!doctor) return
    await addClinicalNote({
      patientKey: buildPatientKey(t.patientDni, t.patientPhone),
      patientName: t.patientName,
      patientPhone: t.patientPhone,
      patientDni: t.patientDni,
      doctorId: doctor.id,
      doctorName: doctor.name,
      ...input,
    })
    loadRecords()
  }

  const handleSaveBackground = async (
    t: Turno,
    input: Omit<SavePatientBackgroundInput, 'patientKey' | 'patientName' | 'updatedBy'>
  ) => {
    if (!doctor) return
    await savePatientBackground({
      patientKey: buildPatientKey(t.patientDni, t.patientPhone),
      patientName: t.patientName,
      updatedBy: doctor.name,
      ...input,
    })
    loadRecords()
  }

  const handleAddStudy = async (t: Turno, file: File, label: string) => {
    if (!doctor) return
    await addStudyPhoto({
      patientKey: buildPatientKey(t.patientDni, t.patientPhone),
      patientName: t.patientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      label,
      file,
    })
    loadRecords()
  }

  useEffect(() => {
    if (!staff?.doctorId) {
      setLoadingDoctor(false)
      setLoadingTurnos(false)
      return
    }
    getDoctor(staff.doctorId)
      .then(setDoctor)
      .finally(() => setLoadingDoctor(false))
    // Antes de traer la agenda, se archivan los turnos ya vencidos (cancelados o atendidos) a la
    // ficha del paciente — así la lista de acá abajo no va acumulando historial viejo.
    archivePastTurnos()
      .catch(() => {})
      .finally(loadTurnos)
    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff?.doctorId])

  return (
    <PortalShell>
      <div className="dashboard__doctor-header">
        {doctor?.photoUrl && (
          <img src={doctor.photoUrl} alt={doctor.name} className="dashboard__doctor-photo" />
        )}
        <div className="dashboard__doctor-header-text">
          <div className="dashboard__title-row">
            <h1>Mi agenda</h1>
            {doctor && (
              <Link className="btn-outline" to="/medico/perfil">
                Mis datos profesionales
              </Link>
            )}
          </div>
          <p className="dashboard__intro">
            {loadingDoctor
              ? 'Cargando…'
              : doctor
                ? `Agenda de ${doctor.name} — ${doctor.specialty}. Podés cargar turnos nuevos; confirmarlos o cancelarlos lo hace Secretaría.`
                : 'Todavía no tenés un médico vinculado a tu usuario. Pedile al administrador que lo configure.'}
          </p>
        </div>
      </div>

      <PatientHistory />

      {doctor && (
        <NewTurnoForm
          doctors={[doctor]}
          lockDoctorId={doctor.id}
          existingTurnos={turnos}
          onCreated={loadTurnos}
        />
      )}

      {loadingTurnos && <p>Cargando turnos…</p>}
      {!loadingTurnos && staff?.doctorId && turnos.length === 0 && <p>No tenés turnos cargados.</p>}

      <div className="turnos__list">
        {turnos.map((t) => (
          <div className="turnos__item" key={t.id}>
            <div className="turnos__item-main">
              <span className={`turnos__status turnos__status--${t.status}`}>{STATUS_LABEL[t.status]}</span>
              {t.isOverbooking && <span className="turnos__overbooking">Sobreturno</span>}
              <strong>
                {formatDateDisplay(t.date)} — {t.time} hs
              </strong>
            </div>
            <div className="turnos__item-patient">
              <span>
                {t.patientName} · {t.patientPhone}
              </span>
              {t.motivo && <span>Motivo: {t.motivo}</span>}
            </div>
            <PatientQuickRecord
              patientName={t.patientName}
              visits={visits.filter((v) => v.patientKey === buildPatientKey(t.patientDni, t.patientPhone))}
              records={records.filter((r) => r.patientKey === buildPatientKey(t.patientDni, t.patientPhone))}
              background={
                backgrounds.find((b) => b.patientKey === buildPatientKey(t.patientDni, t.patientPhone)) ?? null
              }
              studies={studies.filter((s) => s.patientKey === buildPatientKey(t.patientDni, t.patientPhone))}
              onAddRecord={(input) => handleAddRecord(t, input)}
              onSaveBackground={(input) => handleSaveBackground(t, input)}
              onAddStudy={(file, label) => handleAddStudy(t, file, label)}
            />
          </div>
        ))}
      </div>

    </PortalShell>
  )
}
