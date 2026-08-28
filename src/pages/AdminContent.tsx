import { useEffect, useState, type FormEvent } from 'react'
import { getSettings, updateSettings } from '../firebase/settings'
import PortalShell from './PortalShell'
import './AdminUsers.scss'
import './AdminDoctorEdit.scss'

// Todo lo que antes estaba escrito fijo en el código (horarios, foto de la fachada, Instagram,
// dirección, teléfono) ahora se edita desde acá y se guarda en `settings/general` de Firestore —
// mismo documento que ya usaba el número de WhatsApp (`AdminSettings.tsx`). Los componentes de la
// landing (`About`, `Location`, `Contact`, `Instagram`, `Footer`) leen todo esto vía `useSettings()`.
export default function AdminContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [consultasHours, setConsultasHours] = useState('')
  const [laboratorioHours, setLaboratorioHours] = useState('')
  const [address, setAddress] = useState('')
  const [phoneFijo, setPhoneFijo] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [instagramFollowers, setInstagramFollowers] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')

  const [currentFacadeUrl, setCurrentFacadeUrl] = useState('')
  const [facadeFile, setFacadeFile] = useState<File | null>(null)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setConsultasHours(s.consultasHours)
        setLaboratorioHours(s.laboratorioHours)
        setAddress(s.address)
        setPhoneFijo(s.phoneFijo)
        setInstagramUrl(s.instagramUrl)
        setInstagramHandle(s.instagramHandle)
        setInstagramFollowers(s.instagramFollowers)
        setFacebookUrl(s.facebookUrl)
        setLinkedinUrl(s.linkedinUrl)
        setCurrentFacadeUrl(s.facadePhotoUrl)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await updateSettings({
        consultasHours: consultasHours.trim(),
        laboratorioHours: laboratorioHours.trim(),
        address: address.trim(),
        phoneFijo: phoneFijo.trim(),
        instagramUrl: instagramUrl.trim(),
        instagramHandle: instagramHandle.trim(),
        instagramFollowers: instagramFollowers.trim(),
        facebookUrl: facebookUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        facadePhotoFile: facadeFile,
      })
      if (facadeFile) {
        setCurrentFacadeUrl(URL.createObjectURL(facadeFile))
        setFacadeFile(null)
      }
      setSuccess('Cambios guardados — ya se ven en la página.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalShell>
      <h1>Contenido del sitio</h1>
      <p className="dashboard__intro">
        Horarios, foto de la fachada, Instagram, teléfono y dirección — todo lo que se muestra en
        la página principal. Los cambios se ven apenas guardás, sin tocar código.
      </p>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <form className="admin-users__form" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
          <h3>Horarios de atención</h3>
          <label>
            Consultas médicas
            <input
              value={consultasHours}
              onChange={(e) => setConsultasHours(e.target.value)}
              placeholder="Lunes a viernes · 8:00 a 19:30 hs"
              required
            />
          </label>
          <label>
            Laboratorio de Análisis Clínicos
            <input
              value={laboratorioHours}
              onChange={(e) => setLaboratorioHours(e.target.value)}
              placeholder="Lunes a sábado · 8:00 a 12:00 hs"
              required
            />
          </label>

          <h3>Foto de la fachada</h3>
          <p className="admin-users__hint">Se muestra en "Nosotros", debajo de Obras Sociales.</p>
          <div className="admin-doctor-edit__media-row">
            {currentFacadeUrl && (
              <img
                src={currentFacadeUrl}
                alt="Fachada actual"
                className="admin-doctor-edit__preview"
                style={{ width: 96, height: 72, objectFit: 'cover' }}
              />
            )}
            <label className="admin-doctor-edit__file-label">
              Cambiar foto
              <input type="file" accept="image/*" onChange={(e) => setFacadeFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <h3>Instagram</h3>
          <label>
            Link del perfil
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/cimedmza/"
              required
            />
          </label>
          <label>
            Usuario (como se muestra, con @)
            <input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@cimedmza"
              required
            />
          </label>
          <label>
            Seguidores (texto libre, opcional)
            <input
              value={instagramFollowers}
              onChange={(e) => setInstagramFollowers(e.target.value)}
              placeholder="+2.890 seguidores"
            />
          </label>

          <h3>Contacto y ubicación</h3>
          <label>
            Dirección
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jorge A. Calle 326, Ciudad de Mendoza"
              required
            />
          </label>
          <p className="admin-users__hint">Se usa también para armar el mapa de "Ubicación".</p>
          <label>
            Teléfono fijo
            <input
              value={phoneFijo}
              onChange={(e) => setPhoneFijo(e.target.value)}
              placeholder="4252220"
              required
            />
          </label>
          <label>
            Facebook (opcional — vacío no muestra el ícono)
            <input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/cimedmza"
            />
          </label>
          <label>
            LinkedIn (opcional — vacío no muestra el ícono)
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/company/cimedmza"
            />
          </label>

          {error && <p className="login-card__error">{error}</p>}
          {success && <p className="admin-users__success">{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </PortalShell>
  )
}
