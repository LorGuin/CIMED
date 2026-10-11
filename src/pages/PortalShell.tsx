import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../firebase/AuthContext'
import { ROLE_LABEL } from '../firebase/roles'
import BrandLogo from '../components/BrandLogo'
import './PortalShell.scss'

export default function PortalShell({ children }: { children: ReactNode }) {
  const { staff, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="portal">
      <header className="portal__header">
        <BrandLogo className="portal__logo" />
        <div className="portal__who">
          {staff && (
            <>
              <strong>{staff.name}</strong>
              <span>{ROLE_LABEL[staff.role]}</span>
            </>
          )}
        </div>
        <button className="btn-outline portal__logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <main className="portal__content">{children}</main>
    </div>
  )
}
