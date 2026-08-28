import { useState } from 'react'
import type { PatientBackground } from '../firebase/patientBackground'
import { formatDateDisplay } from '../utils/availability'
import './PatientBackgroundCard.scss'

export interface BackgroundDraft {
  fechaNacimiento: string
  edad: string
  sexo: string
  ocupacion: string
  domicilio: string
  telefono: string
  tipoCobertura: string
  coberturaNombre: string
  antecedentes: string
  alergias: string
  medicacionHabitual: string
}

function draftFromBackground(background: PatientBackground | null): BackgroundDraft {
  return {
    fechaNacimiento: background?.fechaNacimiento ?? '',
    edad: background?.edad ?? '',
    sexo: background?.sexo ?? '',
    ocupacion: background?.ocupacion ?? '',
    domicilio: background?.domicilio ?? '',
    telefono: background?.telefono ?? '',
    tipoCobertura: background?.tipoCobertura ?? '',
    coberturaNombre: background?.coberturaNombre ?? '',
    antecedentes: background?.antecedentes ?? '',
    alergias: background?.alergias ?? '',
    medicacionHabitual: background?.medicacionHabitual ?? '',
  }
}

interface Props {
  background: PatientBackground | null
  onSave: (input: BackgroundDraft) => Promise<void>
}

// "Ficha del paciente" — datos personales/administrativos + cobertura de salud, y antecedentes
// clínicos. Es UNA sola ficha por paciente que se va sobreescribiendo (no un registro por
// consulta). Extraído como componente propio para poder cargarla tanto desde el panel del Médico
// (dentro de la historia clínica completa) como desde el panel de Secretaría (para completarla
// antes de la consulta y no perder tiempo ahí adentro).
export default function PatientBackgroundCard({ background, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<BackgroundDraft>(draftFromBackground(background))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEditing = () => {
    setDraft(draftFromBackground(background))
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la ficha del paciente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="patient-background-card">
      <div className="patient-background-card__head">
        <h4>Ficha del paciente</h4>
        {!editing && (
          <button type="button" className="patient-background-card__link" onClick={startEditing}>
            {background ? 'Editar' : 'Cargar'}
          </button>
        )}
      </div>

      {!editing && background && (
        <div className="patient-background-card__display">
          <p className="patient-background-card__subhead">Datos personales y cobertura</p>
          {background.fechaNacimiento && (
            <p>
              <strong>Fecha de nacimiento:</strong> {formatDateDisplay(background.fechaNacimiento)}
            </p>
          )}
          {background.edad && (
            <p>
              <strong>Edad:</strong> {background.edad}
            </p>
          )}
          {background.sexo && (
            <p>
              <strong>Sexo:</strong> {background.sexo}
            </p>
          )}
          {background.ocupacion && (
            <p>
              <strong>Ocupación:</strong> {background.ocupacion}
            </p>
          )}
          {background.domicilio && (
            <p>
              <strong>Domicilio:</strong> {background.domicilio}
            </p>
          )}
          {background.telefono && (
            <p>
              <strong>Teléfono de contacto:</strong> {background.telefono}
            </p>
          )}
          {background.tipoCobertura && (
            <p>
              <strong>Cobertura:</strong> {background.tipoCobertura}
              {background.coberturaNombre && ` — ${background.coberturaNombre}`}
            </p>
          )}
          {!background.fechaNacimiento &&
            !background.edad &&
            !background.sexo &&
            !background.ocupacion &&
            !background.domicilio &&
            !background.telefono &&
            !background.tipoCobertura && (
              <p className="patient-background-card__hint">Sin datos personales cargados todavía.</p>
            )}

          <p className="patient-background-card__subhead">Antecedentes clínicos</p>
          {background.antecedentes && (
            <p>
              <strong>Antecedentes:</strong> {background.antecedentes}
            </p>
          )}
          {background.alergias && (
            <p>
              <strong>Alergias:</strong> {background.alergias}
            </p>
          )}
          {background.medicacionHabitual && (
            <p>
              <strong>Medicación habitual:</strong> {background.medicacionHabitual}
            </p>
          )}
          {!background.antecedentes && !background.alergias && !background.medicacionHabitual && (
            <p className="patient-background-card__hint">Sin antecedentes clínicos cargados todavía.</p>
          )}
        </div>
      )}
      {!editing && !background && (
        <p className="patient-background-card__hint">Todavía no hay ficha cargada para este paciente.</p>
      )}

      {editing && (
        <div className="patient-background-card__form">
          <p className="patient-background-card__subhead">Datos personales y cobertura</p>
          <div className="patient-background-card__grid">
            <label>
              Fecha de nacimiento
              <input
                type="date"
                value={draft.fechaNacimiento}
                onChange={(e) => setDraft({ ...draft, fechaNacimiento: e.target.value })}
              />
            </label>
            <label>
              Edad
              <input
                type="text"
                placeholder="ej. 45"
                value={draft.edad}
                onChange={(e) => setDraft({ ...draft, edad: e.target.value })}
              />
            </label>
            <label>
              Sexo
              <select value={draft.sexo} onChange={(e) => setDraft({ ...draft, sexo: e.target.value })}>
                <option value="">Sin especificar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <label>
              Ocupación
              <input
                type="text"
                value={draft.ocupacion}
                onChange={(e) => setDraft({ ...draft, ocupacion: e.target.value })}
              />
            </label>
          </div>
          <label>
            Domicilio
            <input
              type="text"
              value={draft.domicilio}
              onChange={(e) => setDraft({ ...draft, domicilio: e.target.value })}
            />
          </label>
          <label>
            Teléfono de contacto
            <input
              type="text"
              value={draft.telefono}
              onChange={(e) => setDraft({ ...draft, telefono: e.target.value })}
            />
          </label>
          <div className="patient-background-card__grid">
            <label>
              Cobertura
              <select
                value={draft.tipoCobertura}
                onChange={(e) => setDraft({ ...draft, tipoCobertura: e.target.value })}
              >
                <option value="">Sin especificar</option>
                <option value="Obra social">Obra social</option>
                <option value="Prepaga">Prepaga</option>
                <option value="Público">Atención pública</option>
              </select>
            </label>
            <label>
              Nombre de la obra social / prepaga
              <input
                type="text"
                placeholder="ej. OSDE, Swiss Medical…"
                value={draft.coberturaNombre}
                onChange={(e) => setDraft({ ...draft, coberturaNombre: e.target.value })}
              />
            </label>
          </div>

          <p className="patient-background-card__subhead">Antecedentes clínicos</p>
          <label>
            Antecedentes
            <textarea
              rows={2}
              value={draft.antecedentes}
              onChange={(e) => setDraft({ ...draft, antecedentes: e.target.value })}
            />
          </label>
          <label>
            Alergias
            <textarea
              rows={1}
              value={draft.alergias}
              onChange={(e) => setDraft({ ...draft, alergias: e.target.value })}
            />
          </label>
          <label>
            Medicación habitual
            <textarea
              rows={1}
              value={draft.medicacionHabitual}
              onChange={(e) => setDraft({ ...draft, medicacionHabitual: e.target.value })}
            />
          </label>

          {error && <p className="login-card__error">{error}</p>}
          <div className="patient-background-card__actions">
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar ficha'}
            </button>
            <button type="button" className="patient-background-card__link" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
