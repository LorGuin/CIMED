import { useEffect, type ReactNode } from 'react'
import { OPEN_ACCESS } from '../config/access'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { ROLE_DASHBOARD_PATH, ROLE_LOGIN_PATH, type StaffRole } from '../firebase/roles'
import './ProtectedRoute.scss'

export default function ProtectedRoute({
  role,
  children,
}: {
  role: StaffRole
  children: ReactNode
}) {
  const { staff, loading, enterOpen } = useAuth()

  // Acceso libre: Administrador y Secretaría entran directo; Médicos pasan por la lista para
  // elegir con qué médico entrar (necesita un doctorId).
  const autoEnter = OPEN_ACCESS && !loading && role !== 'medico' && staff?.role !== role
  useEffect(() => {
    if (autoEnter) enterOpen(role)
  }, [autoEnter, role, enterOpen])

  if (loading || autoEnter) {
    return (
      <div className="protected-loading">
        <span className="protected-loading__spinner" />
        <p>Cargando…</p>
      </div>
    )
  }

  if (!staff) {
    return <Navigate to={ROLE_LOGIN_PATH[role]} replace />
  }

  if (staff.role !== role) {
    if (OPEN_ACCESS) return <Navigate to={ROLE_LOGIN_PATH[role]} replace />
    // Esta logueado pero con otro rol: lo mandamos a SU panel, no al que intento abrir.
    return <Navigate to={ROLE_DASHBOARD_PATH[staff.role]} replace />
  }

  return <>{children}</>
}
