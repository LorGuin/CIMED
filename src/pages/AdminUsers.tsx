import { useEffect, useState, type FormEvent } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { changeStaffPassword, createStaffUser } from '../firebase/createStaffUser'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import { ROLE_LABEL, type StaffProfile, type StaffRole } from '../firebase/roles'
import PortalShell from './PortalShell'
import './AdminUsers.scss'

type CreatableRole = Extract<StaffRole, 'medico' | 'secretaria'>

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function AdminUsers() {
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [staffListError, setStaffListError] = useState<string | null>(null)
  const [doctorsListError, setDoctorsListError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<CreatableRole>('medico')
  const [doctorId, setDoctorId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [passwordEditingUid, setPasswordEditingUid] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const loadStaff = async () => {
    setLoadingList(true)
    setStaffListError(null)
    try {
      const snap = await getDocs(collection(db, 'staff'))
      setStaffList(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<StaffProfile, 'uid'>) })))
    } catch (err) {
      setStaffListError(err instanceof Error ? err.message : 'No se pudo cargar la lista de usuarios.')
    } finally {
      setLoadingList(false)
    }
  }

  const loadDoctors = async () => {
    setLoadingDoctors(true)
    setDoctorsListError(null)
    try {
      const list = await listDoctors()
      setDoctorsList(list)
      setDoctorId((current) => current || list[0]?.id || '')
    } catch (err) {
      setDoctorsListError(err instanceof Error ? err.message : 'No se pudo cargar la lista de médicos.')
    } finally {
      setLoadingDoctors(false)
    }
  }

  useEffect(() => {
    loadStaff()
    loadDoctors()
  }, [])

  const doctorName = (id?: string) => doctorsList.find((d) => d.id === id)?.name ?? id

  const startPasswordChange = (s: StaffProfile) => {
    setSuccess(null)
    setPasswordError(null)
    setNewPassword('')
    setPasswordEditingUid(s.uid)
  }

  const cancelPasswordChange = () => {
    setPasswordEditingUid(null)
    setNewPassword('')
    setPasswordError(null)
  }

  const handleChangePassword = async (s: StaffProfile) => {
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('La contraseña tiene que tener al menos 8 caracteres.')
      return
    }
    setPasswordSaving(true)
    try {
      await changeStaffPassword(s, newPassword)
      setSuccess(
        `Contraseña de "${s.name}" actualizada. Nueva contraseña: ${newPassword} — pasásela a la persona, no queda guardada en ningún otro lado.`
      )
      setPasswordEditingUid(null)
      setNewPassword('')
      await loadStaff()
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (role === 'medico' && !doctorId) {
      setError('Todavía no hay médicos cargados — primero agregá uno en la sección "Médicos".')
      return
    }

    setSubmitting(true)
    try {
      await createStaffUser({
        username,
        password,
        name,
        role,
        doctorId: role === 'medico' ? doctorId : undefined,
      })
      setSuccess(`Usuario "${username}" creado con éxito. Contraseña: ${password} — pasásela a la persona, no queda guardada en ningún otro lado.`)
      setName('')
      setUsername('')
      setPassword('')
      await loadStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PortalShell>
      <h1>Médicos y Secretarias</h1>
      <p className="dashboard__intro">
        Creá acá los accesos: vos elegís el usuario y la contraseña, y se los pasás a la persona.
      </p>

      <div className="admin-users">
        <form className="admin-users__form" onSubmit={handleSubmit}>
          <h3>Nuevo usuario</h3>

          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Rol
            <select value={role} onChange={(e) => setRole(e.target.value as CreatableRole)}>
              <option value="medico">Médico</option>
              <option value="secretaria">Secretaria</option>
            </select>
          </label>

          {role === 'medico' && (
            <label>
              Médico vinculado
              {loadingDoctors ? (
                <span className="admin-users__hint">Cargando médicos…</span>
              ) : doctorsListError ? (
                <span className="login-card__error">{doctorsListError}</span>
              ) : doctorsList.length === 0 ? (
                <span className="admin-users__hint">
                  No hay médicos cargados todavía — agregá uno primero en "Médicos".
                </span>
              ) : (
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          <label>
            Usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="ej: aperez"
              required
            />
          </label>

          <label>
            Contraseña
            <div className="admin-users__password-row">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button type="button" className="btn-outline" onClick={() => setPassword(randomPassword())}>
                Generar
              </button>
            </div>
          </label>

          {error && <p className="login-card__error">{error}</p>}
          {success && <p className="admin-users__success">{success}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>

        <div className="admin-users__list">
          <h3>Usuarios existentes</h3>
          {loadingList && <p>Cargando…</p>}
          {!loadingList && staffListError && <p className="login-card__error">{staffListError}</p>}
          {!loadingList && !staffListError && staffList.length === 0 && (
            <p>Todavía no hay usuarios cargados.</p>
          )}
          <ul>
            {staffList.map((s) => (
              <li key={s.uid} className="admin-users__list-item">
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {ROLE_LABEL[s.role]} · usuario: {s.username}
                    {s.doctorId ? ` · ${doctorName(s.doctorId)}` : ''}
                  </span>

                  {passwordEditingUid === s.uid && (
                    <div className="admin-users__password-edit">
                      <div className="admin-users__password-row">
                        <input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Contraseña nueva"
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => setNewPassword(randomPassword())}
                        >
                          Generar
                        </button>
                      </div>
                      {passwordError && <p className="login-card__error">{passwordError}</p>}
                      <div className="admin-users__password-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={passwordSaving}
                          onClick={() => handleChangePassword(s)}
                        >
                          {passwordSaving ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button type="button" className="btn-outline" onClick={cancelPasswordChange}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {s.role !== 'admin' && passwordEditingUid !== s.uid && (
                  <button
                    type="button"
                    className="admin-users__secondary-btn"
                    onClick={() => startPasswordChange(s)}
                  >
                    Cambiar contraseña
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PortalShell>
  )
}
