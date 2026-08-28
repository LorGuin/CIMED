import { useState } from 'react'
import type { PatientBackground } from '../firebase/patientBackground'
import PatientBackgroundCard, { type BackgroundDraft } from './PatientBackgroundCard'
import './PatientFichaToggle.scss'

interface Props {
  background: PatientBackground | null
  onSave: (input: BackgroundDraft) => Promise<void>
}

// Versión "liviana" de la ficha del paciente, pegada a cada turno de la agenda de Secretaría — a
// diferencia de `PatientQuickRecord` (que usa el médico), acá no hay consultas, estudios ni
// asistencia: solo los datos personales/cobertura y los antecedentes, para que Secretaría los
// pueda completar antes de que el paciente entre al consultorio y así ahorrar tiempo en la
// consulta.
export default function PatientFichaToggle({ background, onSave }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="patient-ficha-toggle">
      <button type="button" className="patient-ficha-toggle__toggle" onClick={() => setOpen((v) => !v)}>
        📋 Ficha del paciente{background ? ' (cargada)' : ' — sin cargar'}
        {open ? ' ▲' : ' ▼'}
      </button>

      {open && (
        <div className="patient-ficha-toggle__panel">
          <PatientBackgroundCard background={background} onSave={onSave} />
        </div>
      )}
    </div>
  )
}
