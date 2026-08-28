import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { PatientVisit } from '../firebase/patientVisits'
import { vitalsLine, type ClinicalNote, type VitalSigns } from '../firebase/clinicalNotes'
import type { PatientBackground } from '../firebase/patientBackground'
import type { StudyPhoto } from '../firebase/patientStudies'
import { formatDateDisplay } from '../utils/availability'
import PatientBackgroundCard, { type BackgroundDraft } from './PatientBackgroundCard'
import StudyPhotoGrid from './StudyPhotoGrid'
import './PatientQuickRecord.scss'

interface ConsultDraft {
  diagnostico: string
  tratamiento: string
  peso: string
  altura: string
  presion: string
  temperatura: string
  estudios: string
  observaciones: string
}

const EMPTY_CONSULT: ConsultDraft = {
  diagnostico: '',
  tratamiento: '',
  peso: '',
  altura: '',
  presion: '',
  temperatura: '',
  estudios: '',
  observaciones: '',
}

interface NewRecordInput {
  diagnostico: string
  tratamiento: string
  vitals: VitalSigns
  estudios: string
  observaciones: string
}

interface Props {
  patientName: string
  visits: PatientVisit[]
  records: ClinicalNote[]
  background: PatientBackground | null
  studies: StudyPhoto[]
  onAddRecord: (input: NewRecordInput) => Promise<void>
  onSaveBackground: (input: BackgroundDraft) => Promise<void>
  onAddStudy: (file: File, label: string) => Promise<void>
}

// Historia clínica pegada a cada turno de la agenda del médico — no hay que ir a buscar al
// paciente a ningún lado: en cuanto termina un turno y entra el siguiente, ya tiene a mano sus
// antecedentes, la última consulta y el historial completo. Se arma con tres fuentes: la ficha de
// antecedentes (`patientBackground`, se actualiza y sobreescribe), las consultas (`clinicalNotes`,
// un registro nuevo por cada una, no se edita) y la asistencia archivada (`patientVisits`).
export default function PatientQuickRecord({
  patientName,
  visits,
  records,
  background,
  studies,
  onAddRecord,
  onSaveBackground,
  onAddStudy,
}: Props) {
  const [open, setOpen] = useState(false)

  const [consult, setConsult] = useState<ConsultDraft>(EMPTY_CONSULT)
  const [savingConsult, setSavingConsult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastRecord = records[0] ?? null
  const olderRecords = records.slice(1)

  const handleSaveConsult = async () => {
    const hasContent = Object.values(consult).some((v) => v.trim())
    if (!hasContent) return
    setSavingConsult(true)
    setError(null)
    try {
      await onAddRecord({
        diagnostico: consult.diagnostico.trim(),
        tratamiento: consult.tratamiento.trim(),
        vitals: {
          peso: consult.peso.trim(),
          altura: consult.altura.trim(),
          presion: consult.presion.trim(),
          temperatura: consult.temperatura.trim(),
        },
        estudios: consult.estudios.trim(),
        observaciones: consult.observaciones.trim(),
      })
      setConsult(EMPTY_CONSULT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la consulta.')
    } finally {
      setSavingConsult(false)
    }
  }

  const [studyLabel, setStudyLabel] = useState('')
  const [studyFile, setStudyFile] = useState<File | null>(null)
  const [savingStudy, setSavingStudy] = useState(false)

  const handleStudyFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStudyFile(e.target.files?.[0] ?? null)
  }

  const handleSaveStudy = async () => {
    if (!studyFile) return
    setSavingStudy(true)
    setError(null)
    try {
      await onAddStudy(studyFile, studyLabel.trim() || 'Estudio')
      setStudyLabel('')
      setStudyFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto del estudio.')
    } finally {
      setSavingStudy(false)
    }
  }

  return (
    <div className="patient-quick-record">
      <button type="button" className="patient-quick-record__toggle" onClick={() => setOpen((v) => !v)}>
        📋 Historia clínica
        {records.length > 0 ? ` (${records.length} consulta${records.length === 1 ? '' : 's'})` : ' — sin consultas cargadas'}
        {open ? ' ▲' : ' ▼'}
      </button>

      {open && (
        <div className="patient-quick-record__panel">
          <h3 className="patient-quick-record__patient-name">{patientName}</h3>

          <div className="patient-quick-record__section">
            <PatientBackgroundCard background={background} onSave={onSaveBackground} />
          </div>

          {lastRecord && (
            <div className="patient-quick-record__section">
              <h4>Última consulta — {formatDateDisplay(lastRecord.date)}</h4>
              <div className="patient-quick-record__record patient-quick-record__record--last">
                {lastRecord.diagnostico && (
                  <p>
                    <strong>Diagnóstico:</strong> {lastRecord.diagnostico}
                  </p>
                )}
                {lastRecord.tratamiento && (
                  <p>
                    <strong>Tratamiento:</strong> {lastRecord.tratamiento}
                  </p>
                )}
                {vitalsLine(lastRecord.vitals) && (
                  <p className="patient-quick-record__vitals">{vitalsLine(lastRecord.vitals)}</p>
                )}
                {lastRecord.estudios && (
                  <p>
                    <strong>Estudios:</strong> {lastRecord.estudios}
                  </p>
                )}
                {lastRecord.observaciones && (
                  <p>
                    <strong>Observaciones:</strong> {lastRecord.observaciones}
                  </p>
                )}
              </div>
            </div>
          )}

          {olderRecords.length > 0 && (
            <div className="patient-quick-record__section">
              <h4>Consultas anteriores</h4>
              {olderRecords.map((r) => (
                <div className="patient-quick-record__record" key={r.id}>
                  <span className="patient-quick-record__record-date">{formatDateDisplay(r.date)}</span>
                  {r.diagnostico && (
                    <p>
                      <strong>Diagnóstico:</strong> {r.diagnostico}
                    </p>
                  )}
                  {r.tratamiento && (
                    <p>
                      <strong>Tratamiento:</strong> {r.tratamiento}
                    </p>
                  )}
                  {vitalsLine(r.vitals) && <p className="patient-quick-record__vitals">{vitalsLine(r.vitals)}</p>}
                  {r.estudios && (
                    <p>
                      <strong>Estudios:</strong> {r.estudios}
                    </p>
                  )}
                  {r.observaciones && (
                    <p>
                      <strong>Observaciones:</strong> {r.observaciones}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="patient-quick-record__section">
            <h4>Estudios (fotos)</h4>
            <StudyPhotoGrid studies={studies} />
            <div className="patient-quick-record__study-form">
              <input
                type="text"
                placeholder="ej. Análisis de sangre 25/08"
                value={studyLabel}
                onChange={(e) => setStudyLabel(e.target.value)}
              />
              <label className="file-picker">
                <span className="file-picker__button">📎 Elegir foto</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleStudyFileChange} />
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveStudy}
                disabled={savingStudy || !studyFile}
              >
                {savingStudy ? 'Subiendo…' : 'Subir foto'}
              </button>
            </div>
            <p className="patient-quick-record__hint">
              Sacale una foto al papel del estudio (o elegí una de la galería) — se comprime sola
              antes de guardarse, así queda liviana.
            </p>
          </div>

          {visits.length > 0 && (
            <div className="patient-quick-record__section">
              <h4>Asistencia</h4>
              {visits.map((v) => (
                <div className="patient-quick-record__visit" key={v.id}>
                  <span
                    className={`patient-quick-record__visit-status patient-quick-record__visit-status--${v.status}`}
                  >
                    {v.status === 'atendido' ? 'Atendido' : 'Cancelado'}
                  </span>
                  <span>
                    {formatDateDisplay(v.date)} — {v.time} hs
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="patient-quick-record__section">
            <h4>Registrar esta consulta</h4>
            <div className="patient-quick-record__consult-form">
              <label>
                Diagnóstico
                <input
                  type="text"
                  value={consult.diagnostico}
                  onChange={(e) => setConsult({ ...consult, diagnostico: e.target.value })}
                />
              </label>
              <label>
                Tratamiento / medicación indicada
                <input
                  type="text"
                  value={consult.tratamiento}
                  onChange={(e) => setConsult({ ...consult, tratamiento: e.target.value })}
                />
              </label>
              <div className="patient-quick-record__vitals-row">
                <label>
                  Peso
                  <input
                    type="text"
                    placeholder="ej. 78kg"
                    value={consult.peso}
                    onChange={(e) => setConsult({ ...consult, peso: e.target.value })}
                  />
                </label>
                <label>
                  Altura
                  <input
                    type="text"
                    placeholder="ej. 1.75m"
                    value={consult.altura}
                    onChange={(e) => setConsult({ ...consult, altura: e.target.value })}
                  />
                </label>
                <label>
                  T.A.
                  <input
                    type="text"
                    placeholder="ej. 120/80"
                    value={consult.presion}
                    onChange={(e) => setConsult({ ...consult, presion: e.target.value })}
                  />
                </label>
                <label>
                  Temp.
                  <input
                    type="text"
                    placeholder="ej. 36.5°C"
                    value={consult.temperatura}
                    onChange={(e) => setConsult({ ...consult, temperatura: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Estudios solicitados / adjuntos
                <input
                  type="text"
                  placeholder="ej. Análisis de sangre, link a resultado…"
                  value={consult.estudios}
                  onChange={(e) => setConsult({ ...consult, estudios: e.target.value })}
                />
              </label>
              <label>
                Observaciones
                <textarea
                  rows={2}
                  value={consult.observaciones}
                  onChange={(e) => setConsult({ ...consult, observaciones: e.target.value })}
                />
              </label>

              {error && <p className="login-card__error">{error}</p>}
              <button type="button" className="btn-primary" onClick={handleSaveConsult} disabled={savingConsult}>
                {savingConsult ? 'Guardando…' : 'Guardar consulta'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
