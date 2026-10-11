import { initializeApp, deleteApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { db, firebaseApp } from './config'
import type { StaffProfile, StaffRole } from './roles'

export interface NewStaffInput {
  username: string
  password: string
  name: string
  role: StaffRole
  doctorId?: string
}

// Email interno inventado a partir del usuario, no hace falta que exista de verdad:
// solo lo usa Firebase Authentication por dentro. El usuario nunca lo ve.
function internalEmailFor(username: string) {
  return `${username}@clinica-aurora.local`
}

// Crear un usuario nuevo con el SDK de cliente normalmente te desloguea a vos (el admin) y te
// deja logueado como el usuario recien creado. Para evitar eso, se crea una segunda instancia de
// Firebase (misma configuracion, otro "nombre" interno), se crea el usuario ahi, y se descarta esa
// instancia apenas termina. Tu sesion como admin (en la instancia principal de la app) no se toca.
export async function createStaffUser(input: NewStaffInput): Promise<void> {
  const username = input.username.trim().toLowerCase()
  const name = input.name.trim()

  if (!username) throw new Error('El usuario no puede estar vacío.')
  if (!name) throw new Error('El nombre no puede estar vacío.')
  if (input.password.length < 8) {
    throw new Error('La contraseña tiene que tener al menos 8 caracteres.')
  }

  const existing = await getDoc(doc(db, 'usernameIndex', username))
  if (existing.exists()) {
    throw new Error(`El usuario "${username}" ya existe. Elegí otro.`)
  }

  const email = internalEmailFor(username)
  const secondaryApp = initializeApp(firebaseApp.options, `staff-creation-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  let newUid: string
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, input.password)
    newUid = credential.user.uid
    await signOut(secondaryAuth)
  } finally {
    await deleteApp(secondaryApp)
  }

  await setDoc(doc(db, 'usernameIndex', username), { email })

  await setDoc(doc(db, 'staff', newUid), {
    username,
    name,
    role: input.role,
    active: true,
    ...(input.role === 'medico' && input.doctorId ? { doctorId: input.doctorId } : {}),
  })
}
// Firebase no deja que una cuenta (el admin) le cambie la contraseña a otra cuenta (un médico o
// secretaria) sin un backend con permisos especiales (Admin SDK), y no usamos backend a propósito.
// Se resuelve igual que la creación: se da de alta una cuenta de Authentication NUEVA con la
// contraseña nueva (con la instancia secundaria de siempre, para no desloguear al admin), se hace
// que el usuario (el nombre simple) pase a apuntar a esa cuenta nueva, y se borra la ficha vieja de
// `staff`. La cuenta vieja de Authentication queda huérfana (nadie la puede usar para loguearse
// porque ya ningún usuario apunta a ella) — es un poco de resaca pero no rompe nada ni es visible
// para nadie.
export async function changeStaffPassword(staff: StaffProfile, newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('La contraseña tiene que tener al menos 8 caracteres.')
  }

  const email = `${staff.username}-${Date.now()}@clinica-aurora.local`
  const secondaryApp = initializeApp(firebaseApp.options, `staff-password-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  let newUid: string
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword)
    newUid = credential.user.uid
    await signOut(secondaryAuth)
  } finally {
    await deleteApp(secondaryApp)
  }

  await setDoc(doc(db, 'usernameIndex', staff.username), { email })

  await setDoc(doc(db, 'staff', newUid), {
    username: staff.username,
    name: staff.name,
    role: staff.role,
    active: staff.active,
    ...(staff.role === 'medico' && staff.doctorId ? { doctorId: staff.doctorId } : {}),
  })

  await deleteDoc(doc(db, 'staff', staff.uid))
}
