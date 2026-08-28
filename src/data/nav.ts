export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
]

// Accesos a los portales internos (turnero de médicos / secretaría / panel de administrador).
export const ROLE_LINKS: NavLink[] = [
  { href: '/login/administrador', label: 'Administrador' },
  { href: '/login/medicos', label: 'Médicos' },
  { href: '/login/secretarias', label: 'Secretarias' },
]
