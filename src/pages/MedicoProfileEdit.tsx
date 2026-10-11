import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { getDoctor, updateDoctor } from '../firebase/doctors'
import type { AvailabilityBlock } from '../utils/availability'
import WeeklyAvailabilityEditor from '../components/WeeklyAvailabilityEditor'
import PortalShell from './PortalShell'
import './AdminUsers.scss'
import './AdminDoctorEdit.scss'

// El médico puede cargar sus propios datos (igual que hace el admin desde "Ficha médico"), con UNA
// excepción: la foto. La foto la sigue administrando el admin, para que quede coordinada con el
// resto de la web (landing, "Especialidades", etc.) — acá solo se ve como referencia, sin poder
// cambiarla.
export default function MedicoProfileEdit() {
  const { staff } = useAuth()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [shortSpecialty, setShortSpecialty] = useState('')
  const [matricula, setMatricula] = useState('')
  const [services, setServices] = useState('')
  const [obrasSociales, setObrasSociales] = useState('')
  const [note, setNote] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const [seniaAmount, setSeniaAmount] = useState('')
  const [alias, setAlias] = useState('')
  const [slotMinutes, setSlotMinutes] = useState(30)
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([])

  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('')
  const [currentQrUrl, setCurrentQrUrl] = useState('')
  const [qrFile, setQrFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!staff?.doctorId) {
      setLoading(false)
      return
    }
    getDoctor(staff.doctorId)
      .then((d) => {
        if (!d) {
          setNotFound(true)
          return
        }
        setName(d.name)
        setSpecialty(d.specialty)
        setShortSpecialty(d.shortSpecialty)
        setMatricula(d.matricula)
        setServices(d.services.join('\n'))
        setObrasSociales(d.obrasSociales.join('\n'))
        setNote(d.note)
        setWhatsappMessage(d.whatsappMessage)
        setConsultationFee(d.consultationFee)
        setSeniaAmount(d.seniaAmount)
        setAlias(d.alias)
        setSlotMinutes(d.slotMinutes)
        setAvailability(d.availability)
        setCurrentPhotoUrl(d.photoUrl)
        setCurrentQrUrl(d.qrUrl)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [staff?.doctorId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!staff?.doctorId) return
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await updateDoctor(staff.doctorId, {
        name,
        specialty,
        shortSpecialty,
        matricula,
        services: services
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        obrasSociales: obrasSociales
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        note,
        whatsappMessage,
        consultationFee,
        seniaAmount,
        alias,
        availability,
        slotMinutes,
        // La foto queda afuera a propósito: no se manda `photoFile`, así `updateDoctor` no la toca.
        qrFile,
      })
      setSuccess('Cambios guardados correctamente.')
      if (qrFile) {
        setCurrentQrUrl(URL.createObjectURL(qrFile))
        setQrFile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PortalShell>
        <p>Cargando…</p>
      </PortalShell>
    )
  }

  if (!staff?.doctorId || notFound) {
    return (
      <PortalShell>
        <p>Todavía no tenés un médico vinculado a tu usuario. Pedile al administrador que lo configure.</p>
        <Link className="btn-outline" to="/medico">
          ← Volver a mi agenda
        </Link>
      </PortalShell>
    )
  }

  return (
    <PortalShell>
      <Link className="admin-doctor-edit__back" to="/medico">
        ← Volver a mi agenda
      </Link>
      <h1>Mis datos profesionales</h1>
      <p className="dashboard__intro">
        Actualizá tus datos, el alias y el QR para la seña, y tus horarios de atención. La foto de
        perfil la administra el administrador, para mantenerla coordinada con el resto de la web.
      </p>

      <form className="admin-doctor-edit" onSubmit={handleSubmit}>
        <section className="admin-doctor-edit__section">
          <h3>Datos generales</h3>
          <div className="admin-doctor-edit__grid">
            <label>
              Nombre completo
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Matrícula
              <input value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
            </label>
            <label>
              Especialidad (completa)
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
            </label>
            <label>
              Especialidad corta
              <input value={shortSpecialty} onChange={(e) => setShortSpecialty(e.target.value)} required />
            </label>
            <label>
              Valor de la consulta (opcional)
              <input
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                placeholder="Ej: $15.000"
              />
            </label>
            <label className="admin-doctor-edit__full">
              Servicios (uno por línea)
              <textarea rows={3} value={services} onChange={(e) => setServices(e.target.value)} />
            </label>
            <label className="admin-doctor-edit__full">
              Obras sociales que atendés (una por línea — es el dato que usa Mario, el asistente
              virtual, para contestar consultas de pacientes)
              <textarea
                rows={3}
                value={obrasSociales}
                onChange={(e) => setObrasSociales(e.target.value)}
                placeholder={'OSDE\nSwiss Medical\nPAMI'}
              />
            </label>
            <label>
              Nota (opcional)
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <label>
              Mensaje de WhatsApp (opcional)
              <input value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="admin-doctor-edit__section">
          <h3>Foto</h3>
          <p className="admin-doctor-edit__hint">
            La foto de perfil la carga y actualiza el administrador — no se puede cambiar desde acá.
          </p>
          <div className="admin-doctor-edit__media-row">
            {currentPhotoUrl ? (
              <img src={currentPhotoUrl} alt="Foto actual" className="admin-doctor-edit__preview" />
            ) : (
              <p className="admin-doctor-edit__hint">Todavía no tenés foto cargada — pedísela al administrador.</p>
            )}
          </div>
        </section>

        <section className="admin-doctor-edit__section">
          <h3>Seña — QR y alias</h3>
          <p className="admin-doctor-edit__hint">
            Se muestran al paciente cuando pide un turno con vos, para que pueda hacer la
            transferencia. Podés cambiarlos cuando quieras.
          </p>
          <label>
            Alias
            <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="aurora.perez.mp" />
          </label>
          <label>
            Valor de la seña (opcional)
            <input
              value={seniaAmount}
              onChange={(e) => setSeniaAmount(e.target.value)}
              placeholder="Ej: $5.000"
            />
          </label>
          <div className="admin-doctor-edit__media-row">
            {currentQrUrl && (
              <img
                src={currentQrUrl}
                alt="QR actual"
                className="admin-doctor-edit__preview admin-doctor-edit__preview--qr"
              />
            )}
            <label className="admin-doctor-edit__file-label">
              {currentQrUrl ? 'Cambiar QR' : 'Subir imagen del QR'}
              <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </section>

        <section className="admin-doctor-edit__section">
          <h3>Horarios de atención</h3>
          <p className="admin-doctor-edit__hint">
            Estas franjas se repiten todas las semanas — son las que va a ver el paciente para
            elegir horario al pedir un turno.
          </p>

          <WeeklyAvailabilityEditor
            availability={availability}
            onChange={setAvailability}
            slotMinutes={slotMinutes}
            onSlotMinutesChange={setSlotMinutes}
          />
        </section>

        {error && <p className="login-card__error">{error}</p>}
        {success && <p className="admin-users__success">{success}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </PortalShell>
  )
}
