import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './config'

// Catálogo de estudios de laboratorio y sus horas de ayuno — lo usa el panel de administración
// (/admin/laboratorio) y el chatbot Mario. Es la ÚNICA fuente de verdad para tiempos de ayuno:
// Mario nunca debe inventar un número que no esté acá (ver especificacion-mario-chatbot.md, en el
// proyecto de Claude). Tiene que cargarlo alguien del laboratorio (Dra. Vicente Alicia Nieves) o
// administración — no es un dato que se pueda adivinar, un ayuno mal indicado puede invalidar un
// análisis o, en pacientes con ciertas condiciones, ser directamente un riesgo.
export interface LabStudy {
  id: string
  name: string
  ayunoHoras: number
  indicaciones: string
  activo: boolean
}

export interface LabStudyInput {
  name: string
  ayunoHoras: number
  indicaciones: string
  activo: boolean
}

function normalizeLabStudy(id: string, data: Record<string, unknown>): LabStudy {
  return {
    id,
    name: (data.name as string) ?? '',
    ayunoHoras: (data.ayunoHoras as number) ?? 0,
    indicaciones: (data.indicaciones as string) ?? '',
    activo: (data.activo as boolean) ?? true,
  }
}

export async function listLabStudies(): Promise<LabStudy[]> {
  const snap = await getDocs(query(collection(db, 'labStudies'), orderBy('name')))
  return snap.docs.map((d) => normalizeLabStudy(d.id, d.data()))
}

export async function createLabStudy(input: LabStudyInput): Promise<LabStudy> {
  const ref = doc(collection(db, 'labStudies'))
  const profile: Omit<LabStudy, 'id'> = {
    name: input.name.trim(),
    ayunoHoras: input.ayunoHoras,
    indicaciones: input.indicaciones.trim(),
    activo: input.activo,
  }
  await setDoc(ref, profile)
  return { id: ref.id, ...profile }
}

export async function updateLabStudy(id: string, input: LabStudyInput): Promise<void> {
  await updateDoc(doc(db, 'labStudies', id), {
    name: input.name.trim(),
    ayunoHoras: input.ayunoHoras,
    indicaciones: input.indicaciones.trim(),
    activo: input.activo,
  })
}

export async function deleteLabStudy(id: string): Promise<void> {
  await deleteDoc(doc(db, 'labStudies', id))
}
