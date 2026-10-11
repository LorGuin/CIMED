import { addDoc, collection, getDocs } from 'firebase/firestore'
import { db } from './config'
import { resizeToDataUrl } from '../utils/imageCompression'
import { todayStr } from '../utils/availability'

export interface StudyPhoto {
  id: string
  patientKey: string
  patientName: string
  doctorId: string
  doctorName: string
  label: string
  imageData: string
  date: string
  createdAt: number
}

export interface NewStudyPhotoInput {
  patientKey: string
  patientName: string
  doctorId: string
  doctorName: string
  label: string
  file: File
}

// Foto de un estudio en papel (analisis, radiografia, etc.), comprimida en el navegador y guardada
// directo en Firestore como base64 - mismo mecanismo que las fotos/QR de medicos, para no depender
// de Firebase Storage (plan de pago Blaze). Se prioriza que el texto siga siendo legible (mas
// resolucion que una foto de perfil), pero comprimida para no acercarse al limite de 1 MiB por
// documento - cada foto es SU PROPIO documento en `patientStudies` (no comparte lugar con la
// consulta), asi hay margen de sobra.
const STUDY_MAX_DIMENSION = 1600
const STUDY_JPEG_QUALITY = 0.75
const STUDY_MAX_BYTES = 700_000

function compressStudyPhoto(file: File): Promise<string> {
  return resizeToDataUrl(
    file,
    STUDY_MAX_DIMENSION,
    'image/jpeg',
    STUDY_JPEG_QUALITY,
    STUDY_MAX_BYTES,
    'La foto del estudio'
  )
}

// Comprime la foto en el momento (queda liviana automaticamente, sin que el medico tenga que hacer
// nada extra) y la guarda como un registro permanente mas de la historia clinica - no se edita ni
// se borra una vez cargada. Es parte de la historia clinica general del paciente (Clínica Aurora), no solo
// del medico que la cargo.
export async function addStudyPhoto(input: NewStudyPhotoInput): Promise<void> {
  const imageData = await compressStudyPhoto(input.file)
  await addDoc(collection(db, 'patientStudies'), {
    patientKey: input.patientKey,
    patientName: input.patientName,
    doctorId: input.doctorId,
    doctorName: input.doctorName,
    label: input.label.trim(),
    imageData,
    date: todayStr(),
    createdAt: Date.now(),
  })
}

// Todas las fotos de estudios cargadas en Clínica Aurora, para completar la ficha rapida de cada paciente en
// cualquier agenda. Sin filtro (coleccion completa); se ordena (mas reciente primero) y se filtra
// por paciente en el navegador.
export async function listAllStudyPhotos(): Promise<StudyPhoto[]> {
  const snap = await getDocs(collection(db, 'patientStudies'))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<StudyPhoto, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt)
}
