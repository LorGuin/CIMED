import { doc, setDoc } from 'firebase/firestore'
import { db } from './config'
import { DEMO_DOCTORS } from '../data/doctors'
import { DEFAULT_SETTINGS } from './settings'
import type { DoctorProfile } from './doctors'

export const DEMO_DOCTOR_IDS = new Set(DEMO_DOCTORS.map((d) => d.id))

// Carga (o vuelve a dejar como nuevos) los 5 médicos ficticios de Clínica Aurora. Usa ids fijos,
// así que correrlo dos veces no duplica nada: simplemente los pisa con los datos de fábrica.
export async function seedDemoDoctors(): Promise<number> {
  for (const d of DEMO_DOCTORS) {
    const profile: Omit<DoctorProfile, 'id'> = {
      name: d.name,
      specialty: d.specialty,
      shortSpecialty: d.shortSpecialty,
      matricula: '',
      photoUrl: d.photoUrl,
      services: d.services,
      note: d.note,
      whatsappMessage: d.whatsappMessage,
      active: true,
      alias: '',
      qrUrl: '',
      availability: d.availability,
      slotMinutes: d.slotMinutes,
      consultationFee: d.consultationFee,
      seniaAmount: '',
      obrasSociales: d.obrasSociales,
    }
    await setDoc(doc(db, 'doctors', d.id), profile)
  }
  return DEMO_DOCTORS.length
}

// Reemplaza TODO el documento `settings/general` por los valores de Clínica Aurora (sin `merge`, a
// propósito: así se borran la foto de fachada, el Instagram y los teléfonos que hubieran quedado
// guardados de antes).
export async function resetSiteSettings(): Promise<void> {
  await setDoc(doc(db, 'settings', 'general'), { ...DEFAULT_SETTINGS })
}
