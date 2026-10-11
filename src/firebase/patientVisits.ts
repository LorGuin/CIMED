import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from './config'
import { todayStr } from '../utils/availability'
import type { Turno } from './turnos'

export type PatientVisitStatus = 'atendido' | 'cancelado'

export interface PatientVisit {
  id: string
  patientKey: string
  patientName: string
  patientPhone: string
  patientDni: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  motivo: string
  status: PatientVisitStatus
  isOverbooking: boolean
  archivedAt: number
}

// Identifica al paciente sin que tenga cuenta propia: por DNI si lo cargó, o si no por el
// teléfono (solo dígitos, para que "261 4123456" y "2614123456" caigan en la misma ficha).
export function buildPatientKey(patientDni: string, patientPhone: string): string {
  const dni = patientDni.trim()
  if (dni) return `dni:${dni}`
  const digits = patientPhone.replace(/\D/g, '')
  return `phone:${digits || 'sin-datos'}`
}

function toVisit(turno: Turno): Omit<PatientVisit, 'id'> {
  return {
    patientKey: buildPatientKey(turno.patientDni, turno.patientPhone),
    patientName: turno.patientName,
    patientPhone: turno.patientPhone,
    patientDni: turno.patientDni,
    doctorId: turno.doctorId,
    doctorName: turno.doctorName,
    date: turno.date,
    time: turno.time,
    motivo: turno.motivo,
    // No hay forma de registrar "no vino" todavía — cualquier turno no cancelado que ya pasó de
    // fecha se asume atendido.
    status: turno.status === 'cancelado' ? 'cancelado' : 'atendido',
    isOverbooking: turno.isOverbooking,
    archivedAt: Date.now(),
  }
}

// El proyecto no tiene Cloud Functions (para no depender del plan pago Blaze), así que no hay un
// cron real que corra a las 00hs. Esto lo reemplaza: se llama al abrir los paneles de Secretaría
// y Médico, y en la práctica corre sola la primera vez que alguien del staff entra después de que
// un turno ya pasó de fecha. Mueve cada turno vencido (cancelado o ya transcurrido, sin importar
// el médico) a `patientVisits` y lo borra de `turnos`, para no ir acumulando historial ahí — el
// registro clínico queda solo en la ficha del paciente.
export async function archivePastTurnos(): Promise<number> {
  const today = todayStr()
  const snap = await getDocs(query(collection(db, 'turnos'), where('date', '<', today)))
  let archived = 0
  for (const docSnap of snap.docs) {
    const turno = { id: docSnap.id, ...(docSnap.data() as Omit<Turno, 'id'>) }
    try {
      await addDoc(collection(db, 'patientVisits'), toVisit(turno))
      await deleteDoc(doc(db, 'turnos', docSnap.id))
      archived += 1
    } catch {
      // Si un turno puntual falla al archivar (por ejemplo, un problema de red), se deja como
      // está para el próximo intento — no se corta el resto del lote por uno solo.
    }
  }
  return archived
}

// Historial de asistencia de todos los pacientes de Clínica Aurora (no de un medico en particular: los
// pacientes son del centro, y su historial tiene que verse completo sin importar con que medico
// pidieron turno cada vez). Sin filtro (coleccion completa, igual que `listAllTurnos()`); se
// agrupa y ordena en el navegador.
export async function listAllPatientVisits(): Promise<PatientVisit[]> {
  const snap = await getDocs(collection(db, 'patientVisits'))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PatientVisit, 'id'>) }))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
}
