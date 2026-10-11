import { useState } from 'react'
import { useAuth } from '../firebase/AuthContext'
import { listAllPatientVisits, type PatientVisit } from '../firebase/patientVisits'
import { listAllClinicalNotes, vitalsLine, type ClinicalNote } from '../firebase/clinicalNotes'
import {
  listAllPatientBackgrounds,
  savePatientBackground,
  type PatientBackground,
} from '../firebase/patientBackground'
import { listAllStudyPhotos, type StudyPhoto } from '../firebase/patientStudies'
import { formatDateDisplay } from '../utils/availability'
import PatientBackgroundCard, { type BackgroundDraft } from './PatientBackgroundCard'
import StudyPhotoGrid from './StudyPhotoGrid'
import './PatientHistory.scss'

interface PatientGroup {
  key: string
  name: string
  phone: string
  dni: string
  visits: PatientVisit[]
}

// Historial general de pacientes de Clínica Aurora — ya no es "mis pacientes" de un médico puntual: el
// paciente es de Clínica Aurora, así que si pidió turno con el cardiólogo y después con el clínico, acá
// aparece con la MISMA ficha y las consultas de los dos. Se puede buscar por DNI (o nombre o
// teléfono), y lo puede abrir tanto un médico como Secretaría. Se arma juntando las cuatro fuentes
// (visitas archivadas, consultas, ficha y estudios) por `patientKey`, sin ningún `where` — trae
// toda la colección, igual que `listAllTurnos()` — y se agrupa/filtra en el navegador.
export default function PatientHistory() {
  const { staff } = useAuth()
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<PatientGroup[]>([])
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [backgrounds, setBackgrounds] = useState<PatientBackground[]>([])
  const [studies, setStudies] = useState<StudyPhoto[]>([])
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [visits, allNotes, allBackgrounds, allStudies] = await Promise.all([
        listAllPatientVisits(),
        listAllClinicalNotes(),
        listAllPatientBackgrounds(),
        listAllStudyPhotos(),
      ])

      const map = new Map<string, PatientGroup>()
      for (const v of visits) {
        const existing = map.get(v.patientKey)
        if (existing) {
          existing.visits.push(v)
        } else {
          map.set(v.patientKey, {
            key: v.patientKey,
            name: v.patientName,
            phone: v.patientPhone,
            dni: v.patientDni,
            visits: [v],
          })
        }
      }
      // Un paciente puede tener ficha o consultas cargadas sin tener todavía ninguna visita
      // archivada (por ejemplo, si la consulta se registra el mismo día del turno, antes de que
      // pase de fecha y se archive) — así que también se suman a partir de esas otras fuentes.
      for (const n of allNotes) {
        if (!map.has(n.patientKey)) {
          map.set(n.patientKey, {
            key: n.patientKey,
            name: n.patientName,
            phone: n.patientPhone,
            dni: n.patientDni,
            visits: [],
          })
        }
      }
      for (const b of allBackgrounds) {
        if (!map.has(b.patientKey)) {
          map.set(b.patientKey, { key: b.patientKey, name: b.patientName, phone: '', dni: '', visits: [] })
        }
      }

      setGroups(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
      setNotes(allNotes)
      setBackgrounds(allBackgrounds)
      setStudies(allStudies)
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && !loaded) load()
    if (!next) {
      // Al cerrar el panel se limpia la búsqueda — la próxima vez que se abra, arranca en blanco
      // en vez de mostrar de entrada al último paciente que se buscó.
      setSearch('')
      setExpandedKey(null)
    }
  }

  const handleSaveBackground = async (key: string, name: string, input: BackgroundDraft) => {
    await savePatientBackground({
      patientKey: key,
      patientName: name,
      updatedBy: staff?.name ?? 'Staff',
      ...input,
    })
    await load()
  }

  // No se muestra la lista completa de pacientes al abrir el panel — solo aparece el que se busca,
  // así no queda expuesto de entrada todo el que se buscó la última vez.
  const term = search.trim().toLowerCase()
  const filteredGroups = term
    ? groups.filter(
        (g) =>
          g.dni.toLowerCase().includes(term) ||
          g.name.toLowerCase().includes(term) ||
          g.phone.toLowerCase().includes(term)
      )
    : []

  return (
    <div className="patient-history">
      <button type="button" className="btn-outline patient-history__toggle" onClick={handleToggle}>
        {open ? 'Ocultar historial de pacientes' : 'Ver historial de pacientes'}
      </button>

      {open && (
        <div className="patient-history__panel">
          <p className="patient-history__hint">
            Historial general de Clínica Aurora: la ficha, las consultas y los estudios de cada paciente son
            los mismos sin importar con qué médico haya sido el turno. Buscá por DNI, nombre o
            teléfono.
          </p>

          <input
            type="text"
            className="patient-history__search"
            placeholder="Buscar por DNI, nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p>Cargando…</p>}
          {error && <p className="login-card__error">{error}</p>}
          {!loading && !error && !term && (
            <p className="patient-history__hint">Escribí un DNI, nombre o teléfono para buscar.</p>
          )}
          {!loading && !error && term && filteredGroups.length === 0 && <p>No se encontraron pacientes.</p>}

          <div className="patient-history__list">
            {filteredGroups.map((g) => {
              const groupNotes = notes.filter((n) => n.patientKey === g.key)
              const groupStudies = studies.filter((s) => s.patientKey === g.key)
              const background = backgrounds.find((b) => b.patientKey === g.key) ?? null
              return (
                <div className="patient-history__patient" key={g.key}>
                  <button
                    type="button"
                    className="patient-history__patient-header"
                    onClick={() => setExpandedKey(expandedKey === g.key ? null : g.key)}
                  >
                    <strong>{g.name || 'Paciente sin nombre'}</strong>
                    <span>
                      {g.phone}
                      {g.dni ? ` · DNI ${g.dni}` : ''} · {g.visits.length} visita
                      {g.visits.length === 1 ? '' : 's'}
                      {groupNotes.length > 0
                        ? ` · ${groupNotes.length} consulta${groupNotes.length === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </button>

                  {expandedKey === g.key && (
                    <div className="patient-history__detail">
                      <PatientBackgroundCard
                        background={background}
                        onSave={(input) => handleSaveBackground(g.key, g.name, input)}
                      />

                      {groupNotes.length > 0 && (
                        <div className="patient-history__section">
                          <h4>Consultas</h4>
                          {groupNotes.map((n) => (
                            <div className="patient-history__record" key={n.id}>
                              <span className="patient-history__record-date">
                                {formatDateDisplay(n.date)} — {n.doctorName}
                              </span>
                              {n.diagnostico && (
                                <p>
                                  <strong>Diagnóstico:</strong> {n.diagnostico}
                                </p>
                              )}
                              {n.tratamiento && (
                                <p>
                                  <strong>Tratamiento:</strong> {n.tratamiento}
                                </p>
                              )}
                              {vitalsLine(n.vitals) && (
                                <p className="patient-history__vitals">{vitalsLine(n.vitals)}</p>
                              )}
                              {n.estudios && (
                                <p>
                                  <strong>Estudios:</strong> {n.estudios}
                                </p>
                              )}
                              {n.observaciones && (
                                <p>
                                  <strong>Observaciones:</strong> {n.observaciones}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="patient-history__section">
                        <h4>Estudios (fotos)</h4>
                        <StudyPhotoGrid studies={groupStudies} />
                      </div>

                      {g.visits.length > 0 && (
                        <div className="patient-history__section">
                          <h4>Asistencia</h4>
                          <div className="patient-history__visits">
                            {g.visits.map((v) => (
                              <div className="patient-history__visit" key={v.id}>
                                <span
                                  className={`patient-history__visit-status patient-history__visit-status--${v.status}`}
                                >
                                  {v.status === 'atendido' ? 'Atendido' : 'Cancelado'}
                                </span>
                                <strong>
                                  {formatDateDisplay(v.date)} — {v.time} hs
                                </strong>
                                <span>{v.doctorName}</span>
                                {v.isOverbooking && (
                                  <span className="patient-history__overbooking">Sobreturno</span>
                                )}
                                {v.motivo && (
                                  <span className="patient-history__visit-motivo">Motivo: {v.motivo}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
