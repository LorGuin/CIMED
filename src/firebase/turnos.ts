import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './config'

export type TurnoStatus = 'pendiente' | 'confirmado' | 'cancelado'

export interface Turno {
  id: string
  doctorId: string
  doctorName: string
  patientName: string
  patientPhone: string
  patientDni: string
  motivo: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm"
  status: TurnoStatus
  seniaInformada: boolean
  // true cuando lo cargó Secretaria/Médico a mano en un horario ya ocupado o fuera de la agenda
  // habitual del médico (un "sobreturno"). Los turnos pedidos por el paciente desde /turno nunca
  // lo tienen en true, porque ahí solo se puede elegir entre horarios realmente libres.
  isOverbooking: boolean
  createdAt: number
}

export interface NewTurnoInput {
  doctorId: string
  doctorName: string
  patientName: string
  patientPhone: string
  patientDni: string
  motivo: string
  date: string
  time: string
  seniaInformada: boolean
}

// Turno pedido por el paciente desde la web pública (/turno). Siempre arranca "pendiente" —
// se termina de confirmar cuando el centro recibe el WhatsApp de confirmación.
export async function createTurno(input: NewTurnoInput): Promise<Turno> {
  const ref = doc(collection(db, 'turnos'))
  const turno: Omit<Turno, 'id'> = {
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    patientName: input.patientName.trim(),
    patientPhone: input.patientPhone.trim(),
    patientDni: input.patientDni.trim(),
    motivo: input.motivo.trim(),
    date: input.date,
    time: input.time,
    status: 'pendiente',
    seniaInformada: input.seniaInformada,
    isOverbooking: false,
    createdAt: Date.now(),
  }
  await setDoc(ref, turno)
  return { id: ref.id, ...turno }
}

export interface NewStaffTurnoInput {
  doctorId: string
  doctorName: string
  patientName: string
  patientPhone: string
  patientDni: string
  motivo: string
  date: string
  time: string
  isOverbooking: boolean
}

// Turno cargado a mano por Secretaria (cualquier médico) o por el propio Médico (su agenda). Se
// guarda directo como "confirmado" porque ya lo coordinó el staff (por teléfono, en el mostrador,
// etc.) — no necesita el paso de confirmación por WhatsApp del flujo público.
export async function createTurnoByStaff(input: NewStaffTurnoInput): Promise<Turno> {
  const ref = doc(collection(db, 'turnos'))
  const turno: Omit<Turno, 'id'> = {
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    patientName: input.patientName.trim(),
    patientPhone: input.patientPhone.trim(),
    patientDni: input.patientDni.trim(),
    motivo: input.motivo.trim(),
    date: input.date,
    time: input.time,
    status: 'confirmado',
    seniaInformada: false,
    isOverbooking: input.isOverbooking,
    createdAt: Date.now(),
  }
  await setDoc(ref, turno)
  return { id: ref.id, ...turno }
}

// Trae todos los turnos de un médico (se usa tanto para calcular qué horarios ya están ocupados
// como para la agenda de solo lectura del médico). Se filtra por un único campo (doctorId) para no
// depender de índices compuestos de Firestore, y se ordena/filtra el resto en el navegador — el
// volumen de turnos de un centro médico chico no lo justifica.
export async function listTurnosByDoctor(doctorId: string): Promise<Turno[]> {
  const snap = await getDocs(query(collection(db, 'turnos'), where('doctorId', '==', doctorId)))
  return snap.docs
    .map((d) => normalizeTurno(d.id, d.data()))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

// Para la pantalla de Secretaria, que ve los turnos de todos los médicos.
export async function listAllTurnos(): Promise<Turno[]> {
  const snap = await getDocs(collection(db, 'turnos'))
  return snap.docs
    .map((d) => normalizeTurno(d.id, d.data()))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

// Turnos creados antes de sumar "isOverbooking" no tienen ese campo en Firestore — se completa acá.
function normalizeTurno(id: string, data: Record<string, unknown>): Turno {
  return {
    id,
    doctorId: (data.doctorId as string) ?? '',
    doctorName: (data.doctorName as string) ?? '',
    patientName: (data.patientName as string) ?? '',
    patientPhone: (data.patientPhone as string) ?? '',
    patientDni: (data.patientDni as string) ?? '',
    motivo: (data.motivo as string) ?? '',
    date: (data.date as string) ?? '',
    time: (data.time as string) ?? '',
    status: (data.status as TurnoStatus) ?? 'pendiente',
    seniaInformada: (data.seniaInformada as boolean) ?? false,
    isOverbooking: (data.isOverbooking as boolean) ?? false,
    createdAt: (data.createdAt as number) ?? 0,
  }
}

export async function updateTurnoStatus(id: string, status: TurnoStatus): Promise<void> {
  await updateDoc(doc(db, 'turnos', id), { status })
}
