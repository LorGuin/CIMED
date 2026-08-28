import { useEffect, useState, type FormEvent } from 'react'
import { getSettings, updateSettings } from '../firebase/settings'
import PortalShell from './PortalShell'
import './AdminUsers.scss'

export default function AdminSettings() {
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getSettings()
      .then((s) => setWhatsappNumber(s.whatsappNumber))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const digits = whatsappNumber.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('Revisá el número — tiene que incluir código de país y de área, solo números.')
      return
    }

    setSaving(true)
    try {
      await updateSettings({ whatsappNumber: digits })
      setWhatsappNumber(digits)
      setSuccess('Número actualizado. Ya se usa en toda la página y en la confirmación de turnos.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalShell>
      <h1>Configuración</h1>
      <p className="dashboard__intro">
        Número de WhatsApp que reciben las confirmaciones de turno y que se usa en los botones de
        "Pedir turno" y contacto de la página. Podés cambiarlo cuando quieras.
      </p>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <form className="admin-users__form" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
          <label>
            Número de WhatsApp (con código de país y área, solo números)
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="5492614195388"
              required
            />
          </label>
          <p className="admin-users__hint">
            Ejemplo: para un celular de Mendoza 261 419-5388, se escribe 5492614195388 (54 = país,
            9 = celular, 261 = área, el resto el número).
          </p>

          {error && <p className="login-card__error">{error}</p>}
          {success && <p className="admin-users__success">{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </PortalShell>
  )
}
