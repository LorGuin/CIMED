import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db } from './config'
import { todayStr } from '../utils/availability'

export interface VitalSigns {
  peso: string
  altura: string
  presion: string
  temperatura: string
}

export interface ClinicalNote {
  id: string
  patientKey: string
  patientName: string
  patientPhone: string
  patientDni: string
  doctorId: string
  doctorName: string
  date: string
  diagnostico: string
  tratamiento: string
  vitals: VitalSigns
  estudios: string
  observaciones: string
  createdAt: number
}

export interface NewClinicalNoteInput {
  patientKey: string
  patientName: string
  patientPhone: string
  patientDni: string
  doctorId: string
  doctorName: string
  diagnostico: string
  tratamiento: string
  vitals: VitalSigns
  estudios: string
  observaciones: string
}

// Un registro nuevo por cada consulta atendida - la historia clinica propiamente dicha. No se
// edita ni se borra una vez guardado (para corregir algo se carga una consulta nueva), asi queda
// una linea de tiempo real. Los pacientes son de Clínica Aurora, no de un medico en particular: cualquier
// medico que despues atienda a este paciente ve TODAS sus consultas anteriores (con quien fueron,
// gracias a `doctorName`), no solo las propias.
export async function addClinicalNote(input: NewClinicalNoteInput): Promise<void> {
  await addDoc(collection(db, 'clinicalNotes'), {
    ...input,
    date: todayStr(),
    createdAt: Date.now(),
  })
}

// Todas las consultas cargadas en Clínica Aurora, para armar la ficha rapida de cada paciente en cualquier
// agenda. Sin filtro (coleccion completa, igual que `listAllTurnos()`); se ordena (mas reciente
// primero) y se filtra por paciente en el navegador.
export async function listAllClinicalNotes(): Promise<ClinicalNote[]> {
  const snap = await getDocs(collection(db, 'clinicalNotes'))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ClinicalNote, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

// Linea compacta de signos vitales para mostrar junto a una consulta (ej. "Peso: 78kg - TA:
// 120/80"), usada tanto en la ficha rapida por turno como en el historial general de pacientes.
export function vitalsLine(v: VitalSigns): string {
  return [
    v.peso && `Peso: ${v.peso}`,
    v.altura && `Altura: ${v.altura}`,
    v.presion && `TA: ${v.presion}`,
    v.temperatura && `Temp: ${v.temperatura}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
