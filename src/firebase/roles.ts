export type StaffRole = 'admin' | 'medico' | 'secretaria'

export interface StaffProfile {
  uid: string
  username: string
  name: string
  role: StaffRole
  doctorId?: string // solo para role === 'medico': id del documento en la coleccion Firestore "doctors"
  active: boolean
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  secretaria: 'Secretaria',
}

export const ROLE_DASHBOARD_PATH: Record<StaffRole, string> = {
  admin: '/admin',
  medico: '/medico',
  secretaria: '/secretaria',
}

export const ROLE_LOGIN_PATH: Record<StaffRole, string> = {
  admin: '/login/administrador',
  medico: '/login/medicos',
  secretaria: '/login/secretarias',
}
