import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import type { StaffProfile } from './roles'

interface AuthContextValue {
  user: User | null
  staff: StaffProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<StaffProfile>
  logout: () => Promise<void>
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
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
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
    await signOut(auth)
    setStaff(null)
  }

  return (
    <AuthContext.Provider value={{ user, staff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
