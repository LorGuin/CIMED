import { useEffect, useState, type FormEvent } from 'react'
import {
  createLabStudy,
  deleteLabStudy,
  listLabStudies,
  updateLabStudy,
  type LabStudy,
} from '../firebase/labStudies'
import PortalShell from './PortalShell'
import './AdminUsers.scss'
import './AdminDoctors.scss'

// Catálogo de estudios de laboratorio y horas de ayuno — es el dato que usa Mario (el chatbot) para
// contestar "¿cuánto ayuno tengo que hacer?" SIN inventar nada. Por eso conviene que lo cargue
// alguien del laboratorio (Dra. Vicente Alicia Nieves) o administración, con el dato confirmado.
export default function AdminLaboratorio() {
  const [list, setList] = useState<LabStudy[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [ayunoHoras, setAyunoHoras] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [activo, setActivo] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    setLoadingList(true)
    setListError(null)
    try {
      setList(await listLabStudies())
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setAyunoHoras('')
    setIndicaciones('')
    setActivo(true)
  }

  const handleEdit = (s: LabStudy) => {
    setEditingId(s.id)
    setName(s.name)
    setAyunoHoras(String(s.ayunoHoras))
    setIndicaciones(s.indicaciones)
    setActivo(s.activo)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (s: LabStudy) => {
    if (!confirm(`¿Borrar "${s.name}" del catálogo?`)) return
    setDeletingId(s.id)
    setListError(null)
    try {
      await deleteLabStudy(s.id)
      if (editingId === s.id) resetForm()
      await load()
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo borrar el estudio.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const hours = Number(ayunoHoras)
    if (!name.trim()) {
      setError('Ponele un nombre al estudio.')
      return
    }
    if (Number.isNaN(hours) || hours < 0) {
      setError('Las horas de ayuno tienen que ser un número (podés poner 0 si no requiere ayuno).')
      return
    }

    setSubmitting(true)
    try {
      const input = { name, ayunoHoras: hours, indicaciones, activo }
      if (editingId) {
        await updateLabStudy(editingId, input)
        setSuccess(`"${name}" se actualizó correctamente.`)
      } else {
        await createLabStudy(input)
        setSuccess(`"${name}" se agregó correctamente.`)
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el estudio.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalShell>
      <h1>Laboratorio — estudios y ayuno</h1>
      <p className="dashboard__intro">
        Este catálogo es la única fuente que usa Mario (el asistente virtual) para contestar cuánto
        tiempo de ayuno necesita cada estudio — si un estudio no está acá, Mario avisa que no tiene
        el dato confirmado en vez de inventar un número. Cargalo con datos confirmados por el
        laboratorio.
      </p>

      <div className="admin-users admin-doctors">
        <form className="admin-users__form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar estudio' : 'Nuevo estudio'}</h3>

          <label className="admin-users__field--full">
            Nombre del estudio
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Glucemia" required />
          </label>

          <label>
            Horas de ayuno
            <input
              type="number"
              min={0}
              value={ayunoHoras}
              onChange={(e) => setAyunoHoras(e.target.value)}
              placeholder="8"
              required
            />
          </label>

          <label>
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />{' '}
            Activo (visible para Mario)
          </label>

          <label className="admin-users__field--full">
            Indicaciones (opcional)
            <textarea
              rows={2}
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Se puede tomar agua durante el ayuno"
            />
          </label>

          {error && <p className="login-card__error admin-users__field--full">{error}</p>}
          {success && <p className="admin-users__success admin-users__field--full">{success}</p>}

          <div className="admin-users__field--full admin-users__row-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar estudio'}
            </button>
            {editingId && (
              <button type="button" className="admin-users__secondary-btn" onClick={resetForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <div className="admin-users__list">
          <h3>Estudios cargados</h3>
          {loadingList && <p>Cargando…</p>}
          {!loadingList && listError && <p className="login-card__error">{listError}</p>}
          {!loadingList && !listError && list.length === 0 && <p>Todavía no hay estudios cargados.</p>}
          <ul>
            {list.map((s) => (
              <li key={s.id} className="admin-users__list-item">
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {s.ayunoHoras} hs de ayuno
                    {s.indicaciones && ` · ${s.indicaciones}`}
                    {!s.activo && ' · inactivo (Mario no lo usa)'}
                  </span>
                </div>
                <div className="admin-users__row-actions">
                  <button type="button" className="admin-users__secondary-btn" onClick={() => handleEdit(s)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-users__delete-btn"
                    onClick={() => handleDelete(s)}
                    disabled={deletingId === s.id}
                  >
                    {deletingId === s.id ? 'Borrando…' : 'Borrar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PortalShell>
  )
}
