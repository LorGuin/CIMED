import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './config'
import type { AvailabilityBlock } from '../utils/availability'
import { resizeToDataUrl } from '../utils/imageCompression'

export interface DoctorProfile {
  id: string
  name: string
  specialty: string
  shortSpecialty: string
  matricula: string
  photoUrl: string
  services: string[]
  note: string
  whatsappMessage: string
  active: boolean
  alias: string
  qrUrl: string
  availability: AvailabilityBlock[]
  slotMinutes: number
  consultationFee: string
  seniaAmount: string
  // Obras sociales que atiende ESTE médico en particular (puede diferir de la lista general del
  // centro). Editable desde la Ficha médico / "Mis datos profesionales", y es el dato que usa
  // Mario (el chatbot) para contestar "¿el Dr. X atiende tal obra social?" — ver
  // especificacion-mario-chatbot.md.
  obrasSociales: string[]
}

export interface NewDoctorInput {
  name: string
  specialty: string
  shortSpecialty: string
  matricula: string
  services: string[]
  note: string
  whatsappMessage: string
  consultationFee: string
  photoFile: File
}

// Se comprimen las imágenes en el navegador antes de guardarlas directo en Firestore (base64), en
// vez de usar Firebase Storage — así el proyecto queda 100% en el plan gratuito, sin depender de
// activar el plan de pago Blaze. Un documento de Firestore tiene un límite de 1 MiB, así que entre
// la foto y el QR se deja bastante margen (400 KB para la foto, 350 KB para el QR).
const PHOTO_MAX_DIMENSION = 480
const PHOTO_JPEG_QUALITY = 0.72
const PHOTO_MAX_BYTES = 400_000

// El QR se guarda como PNG (sin compresión con pérdida) para que los módulos del código no se
// distorsionen y deje de poder escanearse. Solo se redimensiona si hace falta.
const QR_MAX_DIMENSION = 480
const QR_MAX_BYTES = 350_000

function compressPhoto(file: File): Promise<string> {
  return resizeToDataUrl(file, PHOTO_MAX_DIMENSION, 'image/jpeg', PHOTO_JPEG_QUALITY, PHOTO_MAX_BYTES, 'La foto')
}

function compressQr(file: File): Promise<string> {
  return resizeToDataUrl(file, QR_MAX_DIMENSION, 'image/png', undefined, QR_MAX_BYTES, 'La imagen del QR')
}

export async function listDoctors(): Promise<DoctorProfile[]> {
  const snap = await getDocs(query(collection(db, 'doctors'), orderBy('name')))
  return snap.docs.map((d) => normalizeDoctor(d.id, d.data()))
}

export async function getDoctor(id: string): Promise<DoctorProfile | null> {
  const snap = await getDoc(doc(db, 'doctors', id))
  if (!snap.exists()) return null
  return normalizeDoctor(snap.id, snap.data())
}

// Los médicos creados antes de agregar alias/QR/horarios/valor de consulta no tienen esos campos
// en Firestore — se completan acá con valores por defecto para que el resto del código no tenga
// que estar revisando `undefined` en todos lados.
function normalizeDoctor(id: string, data: Record<string, unknown>): DoctorProfile {
  return {
    id,
    name: (data.name as string) ?? '',
    specialty: (data.specialty as string) ?? '',
    shortSpecialty: (data.shortSpecialty as string) ?? '',
    matricula: (data.matricula as string) ?? '',
    photoUrl: (data.photoUrl as string) ?? '',
    services: (data.services as string[]) ?? [],
    note: (data.note as string) ?? '',
    whatsappMessage: (data.whatsappMessage as string) ?? '',
    active: (data.active as boolean) ?? true,
    alias: (data.alias as string) ?? '',
    qrUrl: (data.qrUrl as string) ?? '',
    availability: (data.availability as AvailabilityBlock[]) ?? [],
    slotMinutes: (data.slotMinutes as number) ?? 30,
    consultationFee: (data.consultationFee as string) ?? '',
    seniaAmount: (data.seniaAmount as string) ?? '',
    obrasSociales: (data.obrasSociales as string[]) ?? [],
  }
}

export async function createDoctor(input: NewDoctorInput): Promise<DoctorProfile> {
  const photoUrl = await compressPhoto(input.photoFile)

  const doctorRef = doc(collection(db, 'doctors'))
  const profile: Omit<DoctorProfile, 'id'> = {
    name: input.name.trim(),
    specialty: input.specialty.trim(),
    shortSpecialty: input.shortSpecialty.trim(),
    matricula: input.matricula.trim(),
    services: input.services,
    note: input.note.trim(),
    whatsappMessage: input.whatsappMessage.trim(),
    consultationFee: input.consultationFee.trim(),
    photoUrl,
    active: true,
    alias: '',
    qrUrl: '',
    availability: [],
    slotMinutes: 30,
    seniaAmount: '',
    obrasSociales: [],
  }

  await setDoc(doctorRef, profile)
  return { id: doctorRef.id, ...profile }
}

export interface UpdateDoctorInput {
  name: string
  specialty: string
  shortSpecialty: string
  matricula: string
  services: string[]
  note: string
  whatsappMessage: string
  alias: string
  availability: AvailabilityBlock[]
  slotMinutes: number
  consultationFee: string
  seniaAmount: string
  obrasSociales: string[]
  photoFile?: File | null
  qrFile?: File | null
}

export async function updateDoctor(id: string, input: UpdateDoctorInput): Promise<void> {
  const patch: Record<string, unknown> = {
    name: input.name.trim(),
    specialty: input.specialty.trim(),
    shortSpecialty: input.shortSpecialty.trim(),
    matricula: input.matricula.trim(),
    services: input.services,
    note: input.note.trim(),
    whatsappMessage: input.whatsappMessage.trim(),
    alias: input.alias.trim(),
    availability: input.availability,
    slotMinutes: input.slotMinutes,
    consultationFee: input.consultationFee.trim(),
    seniaAmount: input.seniaAmount.trim(),
    obrasSociales: input.obrasSociales,
  }

  if (input.photoFile) {
    patch.photoUrl = await compressPhoto(input.photoFile)
  }
  if (input.qrFile) {
    patch.qrUrl = await compressQr(input.qrFile)
  }

  await updateDoc(doc(db, 'doctors', id), patch)
}

export async function deleteDoctor(id: string): Promise<void> {
  await deleteDoc(doc(db, 'doctors', id))
}
