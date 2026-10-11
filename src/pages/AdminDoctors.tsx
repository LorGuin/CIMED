import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createDoctor, deleteDoctor, listDoctors, type DoctorProfile } from '../firebase/doctors'
import PortalShell from './PortalShell'
import './AdminUsers.scss'
import './AdminDoctors.scss'

export default function AdminDoctors() {
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [shortSpecialty, setShortSpecialty] = useState('')
  const [matricula, setMatricula] = useState('')
  const [services, setServices] = useState('')
  const [note, setNote] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadDoctors = async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const list = await listDoctors()
      setDoctorsList(list)
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo cargar la lista de médicos.')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  const handleDelete = async (d: DoctorProfile) => {
    if (!confirm(`¿Borrar a "${d.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(d.id)
    setListError(null)
    try {
      await deleteDoctor(d.id)
      await loadDoctors()
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'No se pudo borrar el médico.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!photoFile) {
      setError('Elegí una foto para el médico.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createDoctor({
        name,
        specialty,
        shortSpecialty,
        matricula,
        note,
        whatsappMessage: whatsappMessage || `Hola Clínica Aurora! Quiero pedir un turno con ${name}.`,
        consultationFee,
        services: services
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        photoFile,
      })
      setSuccess(`"${created.name}" se agregó correctamente.`)
      setName('')
      setSpecialty('')
      setShortSpecialty('')
      setMatricula('')
      setServices('')
      setNote('')
      setWhatsappMessage('')
      setConsultationFee('')
      setPhotoFile(null)
      await loadDoctors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el médico.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalShell>
      <h1>Médicos</h1>
      <p className="dashboard__intro">
        Cargá acá cada médico o profesional del centro. Aparecen automáticamente en la sección
        "Especialidades" de la página y quedan disponibles para vincularlos a un usuario en
        "Médicos y Secretarias".
      </p>

      <div className="admin-users admin-doctors">
        <form className="admin-users__form" onSubmit={handleSubmit}>
          <h3>Nuevo médico</h3>

          <label className="admin-users__field--full">
            Nombre completo
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dra. Ana Pérez"
              required
            />
          </label>

          <label>
            Especialidad (completa)
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Clínica Médica y Diabetología"
              required
            />
          </label>

          <label>
            Especialidad corta (ícono landing)
            <input
              value={shortSpecialty}
              onChange={(e) => setShortSpecialty(e.target.value)}
              placeholder="Diabetología"
              required
            />
          </label>

          <label>
            Matrícula
            <input
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ej: MP 12345"
              required
            />
          </label>

          <label>
            Valor de la consulta (opcional)
            <input
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              placeholder="Ej: $15.000"
            />
          </label>

          <label>
            Nota (opcional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. horario de recepción"
            />
          </label>

          <label className="admin-users__field--full">
            Servicios (uno por línea, opcional)
            <textarea
              rows={3}
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder={'Consulta clínica\nChequeo general'}
            />
          </label>

          <label className="admin-users__field--full">
            Mensaje de WhatsApp al pedir turno (opcional, se arma uno por defecto)
            <input
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder={`Hola Clínica Aurora! Quiero pedir un turno con ${name || '(nombre)'}.`}
            />
          </label>

          <label className="admin-users__field--full">
            Foto
            <span className="file-picker">
              <span className="file-picker__button">📎 Elegir archivo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                required
              />
            </span>
          </label>

          {error && <p className="login-card__error admin-users__field--full">{error}</p>}
          {success && <p className="admin-users__success admin-users__field--full">{success}</p>}

          <button
            type="submit"
            className="btn-primary admin-users__field--full"
            disabled={submitting}
          >
            {submitting ? 'Guardando…' : 'Agregar médico'}
          </button>
        </form>

        <div className="admin-users__list">
          <h3>Médicos cargados</h3>
          {loadingList && <p>Cargando…</p>}
          {!loadingList && listError && <p className="login-card__error">{listError}</p>}
          {!loadingList && !listError && doctorsList.length === 0 && (
            <p>Todavía no hay médicos cargados.</p>
          )}
          <ul>
            {doctorsList.map((d) => (
              <li key={d.id} className="admin-users__list-item">
                <div>
                  <strong>{d.name}</strong>
                  <span>
                    {d.specialty} · Matrícula {d.matricula || '—'}
                    {d.consultationFee && ` · Consulta ${d.consultationFee}`}
                    {!d.alias && ' · sin alias/QR cargado'}
                  </span>
                </div>
                <div className="admin-users__row-actions">
                  <Link className="admin-users__secondary-btn" to={`/admin/medicos/${d.id}`}>
                    Ficha médico
                  </Link>
                  <button
                    type="button"
                    className="admin-users__delete-btn"
                    onClick={() => handleDelete(d)}
                    disabled={deletingId === d.id}
                  >
                    {deletingId === d.id ? 'Borrando…' : 'Borrar'}
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
