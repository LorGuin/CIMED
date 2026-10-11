import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { ROLE_DASHBOARD_PATH, type StaffRole } from '../firebase/roles'
import BrandLogo from '../components/BrandLogo'
import './LoginForm.scss'

interface LoginFormProps {
  role: StaffRole
  title: string
  subtitle: string
}

export default function LoginForm({ role, title, subtitle }: LoginFormProps) {
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
