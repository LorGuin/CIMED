import type { ReactNode } from 'react'
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
  const { staff, loading } = useAuth()

  if (loading) {
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
    // Esta logueado pero con otro rol: lo mandamos a SU panel, no al que intento abrir.
    return <Navigate to={ROLE_DASHBOARD_PATH[staff.role]} replace />
  }

  return <>{children}</>
}
