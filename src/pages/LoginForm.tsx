import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { ROLE_DASHBOARD_PATH, type StaffRole } from '../firebase/roles'
import BrandLogo from '../components/BrandLogo'
import { OPEN_ACCESS } from '../config/access'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import './LoginForm.scss'

interface LoginFormProps {
  role: StaffRole
  title: string
  subtitle: string
}

export default function LoginForm(props: LoginFormProps) {
  return OPEN_ACCESS ? <OpenEntry {...props} /> : <PasswordLogin {...props} />
}

// Acceso libre (config/access.ts): sin usuario ni contraseña.
function OpenEntry({ role, title, subtitle }: LoginFormProps) {
  const { enterOpen } = useAuth()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState<DoctorProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (role !== 'medico') return
    listDoctors()
      .then((list) => setDoctors(list.filter((d) => d.active)))
      .catch(() => setError('No se pudo cargar la lista de médicos.'))
  }, [role])

  const go = (doctor?: DoctorProfile) => {
    enterOpen(role, doctor ? { id: doctor.id, name: doctor.name } : undefined)
    navigate(ROLE_DASHBOARD_PATH[role], { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-card__brand">
          <BrandLogo size="lg" />
        </Link>

        <h1>{title}</h1>
        <p className="login-card__subtitle">{subtitle}</p>
        <p className="login-card__open-note">Modo demostración: acceso libre, sin contraseña.</p>

        {role !== 'medico' ? (
          <button type="button" className="btn-primary login-card__submit" onClick={() => go()}>
            Entrar al panel
          </button>
        ) : error ? (
          <p className="login-card__error">{error}</p>
        ) : !doctors ? (
          <p className="login-card__subtitle">Cargando médicos…</p>
        ) : doctors.length === 0 ? (
          <p className="login-card__subtitle">
            Todavía no hay médicos cargados. Cargalos desde el panel de Administrador.
          </p>
        ) : (
          <div className="login-card__doctors">
            <p className="login-card__pick">¿Con qué médico querés entrar?</p>
            {doctors.map((d) => (
              <button key={d.id} type="button" className="login-card__doctor" onClick={() => go(d)}>
                {d.photoUrl && <img src={d.photoUrl} alt="" />}
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.shortSpecialty || d.specialty}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        <Link to="/" className="login-card__back">
          ‹ Volver al sitio
        </Link>
      </div>
    </div>
  )
}

function PasswordLogin({ role, title, subtitle }: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const profile = await login(username, password)
      if (profile.role !== role) {
        setError(`Este usuario no tiene acceso de ${title}.`)
        setSubmitting(false)
        return
      }
      navigate(ROLE_DASHBOARD_PATH[role], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-card__brand">
          <BrandLogo size="lg" />
        </Link>

        <h1>{title}</h1>
        <p className="login-card__subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="login-card__form">
          <label>
            Usuario
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="login-card__error">{error}</p>}

          <button type="submit" className="btn-primary login-card__submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <Link to="/" className="login-card__back">
          ‹ Volver al sitio
        </Link>
      </div>
    </div>
  )
}
