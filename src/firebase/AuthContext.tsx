import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import { ROLE_LABEL, type StaffProfile, type StaffRole } from './roles'
import { OPEN_ACCESS } from '../config/access'

interface AuthContextValue {
  user: User | null
  staff: StaffProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<StaffProfile>
  logout: () => Promise<void>
  // Solo en acceso libre (ver config/access.ts): entra a un panel sin usuario ni contraseña.
  enterOpen: (role: StaffRole, doctor?: { id: string; name: string }) => void
}

const OPEN_KEY = 'aurora-open-access'

function readOpenStaff(): StaffProfile | null {
  if (!OPEN_ACCESS) return null
  try {
    const raw = sessionStorage.getItem(OPEN_KEY)
    return raw ? (JSON.parse(raw) as StaffProfile) : null
  } catch {
    return null
  }
}

function writeOpenStaff(profile: StaffProfile | null) {
  try {
    if (profile) sessionStorage.setItem(OPEN_KEY, JSON.stringify(profile))
    else sessionStorage.removeItem(OPEN_KEY)
  } catch {
    // Sin sessionStorage (navegación privada estricta): se pierde al recargar, nada más.
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Firebase Authentication funciona nativamente con email, no con "usuario".
// Para loguear por usuario simple, guardamos en Firestore un mapeo de usuario -> email interno
// (coleccion "usernameIndex", de solo lectura publica) y por dentro usamos ese email con
// signInWithEmailAndPassword. El usuario nunca ve ni necesita saber ese email.
async function resolveEmailFromUsername(username: string): Promise<string | null> {
  const cleanUsername = username.trim().toLowerCase()
  if (!cleanUsername) return null
  const snap = await getDoc(doc(db, 'usernameIndex', cleanUsername))
  if (!snap.exists()) return null
  const data = snap.data() as { email?: string }
  return data.email ?? null
}

async function fetchStaffProfile(uid: string): Promise<StaffProfile | null> {
  const snap = await getDoc(doc(db, 'staff', uid))
  if (!snap.exists()) return null
  return { uid, ...(snap.data() as Omit<StaffProfile, 'uid'>) }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(() => readOpenStaff())
  const [loading, setLoading] = useState(!OPEN_ACCESS)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (OPEN_ACCESS) {
        // En acceso libre manda la elección hecha en la pantalla de entrada, no la cuenta.
        setLoading(false)
        return
      }
      if (firebaseUser) {
        const profile = await fetchStaffProfile(firebaseUser.uid)
        setStaff(profile)
      } else {
        setStaff(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (username: string, password: string): Promise<StaffProfile> => {
    const email = await resolveEmailFromUsername(username)
    if (!email) {
      throw new Error('Usuario o contraseña incorrectos.')
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchStaffProfile(credential.user.uid)
      if (!profile || !profile.active) {
        await signOut(auth)
        throw new Error('Este usuario no tiene acceso habilitado. Consultá con el administrador.')
      }
      setStaff(profile)
      return profile
    } catch (err) {
      // Mensaje generico: no revelamos si el usuario existe o si fallo la contraseña.
      if (err instanceof Error && err.message.startsWith('Este usuario')) throw err
      throw new Error('Usuario o contraseña incorrectos.')
    }
  }

  const logout = async () => {
    writeOpenStaff(null)
    setStaff(null)
    if (auth.currentUser) await signOut(auth)
  }

  const enterOpen = (role: StaffRole, doctor?: { id: string; name: string }) => {
    if (!OPEN_ACCESS) return
    const profile: StaffProfile = {
      uid: `open-${role}`,
      username: role,
      name: role === 'medico' && doctor ? doctor.name : ROLE_LABEL[role],
      role,
      doctorId: role === 'medico' ? doctor?.id : undefined,
      active: true,
    }
    writeOpenStaff(profile)
    setStaff(profile)
  }

  return (
    <AuthContext.Provider value={{ user, staff, loading, login, logout, enterOpen }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
