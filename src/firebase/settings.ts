import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'
import { resizeToDataUrl } from '../utils/imageCompression'

export interface SiteSettings {
  // Número de WhatsApp del centro en formato internacional para wa.me (ej: "5492614195388"),
  // usado para la confirmación de turnos y los botones de "Pedir turno" / contacto de la landing.
  whatsappNumber: string
  // Teléfono fijo que se muestra en "Contacto".
  phoneFijo: string
  // Dirección que se muestra en "Ubicación", "Contacto" y se usa para armar el link de Google Maps.
  address: string
  // Franjas horarias que se muestran en "Nosotros" y "Contacto" — texto libre, tal cual se
  // escriben (ej: "Lunes a viernes · 8:00 a 19:30 hs").
  consultasHours: string
  laboratorioHours: string
  // Foto de la fachada del centro, debajo de "Obras sociales" en "Nosotros". Se guarda en base64
  // en Firestore, igual que las fotos de los médicos.
  facadePhotoUrl: string
  // Instagram
  instagramUrl: string
  instagramHandle: string
  instagramFollowers: string
  // Redes del pie de página — vacío = no se muestra el ícono.
  facebookUrl: string
  linkedinUrl: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappNumber: '5492614195388',
  phoneFijo: '4252220',
  address: 'Jorge A. Calle 326, Ciudad de Mendoza',
  consultasHours: 'Lunes a viernes · 8:00 a 19:30 hs',
  laboratorioHours: 'Lunes a sábado · 8:00 a 12:00 hs',
  facadePhotoUrl: '/cimed-fachada.jpg',
  instagramUrl: 'https://www.instagram.com/cimedmza/',
  instagramHandle: '@cimedmza',
  instagramFollowers: '+2.890 seguidores',
  facebookUrl: '',
  linkedinUrl: '',
}

// Mismo criterio que las fotos de médicos (ver `firebase/doctors.ts`): se comprime en el
// navegador y se guarda como base64 directo en el documento de Firestore, sin usar Firebase
// Storage, para quedarse en el plan gratuito. Es una sola foto ancha (no un avatar chico), así
// que se le da más margen de tamaño.
const FACADE_MAX_DIMENSION = 960
const FACADE_JPEG_QUALITY = 0.75
const FACADE_MAX_BYTES = 700_000

function compressFacadePhoto(file: File): Promise<string> {
  return resizeToDataUrl(file, FACADE_MAX_DIMENSION, 'image/jpeg', FACADE_JPEG_QUALITY, FACADE_MAX_BYTES, 'La foto')
}

export async function getSettings(): Promise<SiteSettings> {
  const snap = await getDoc(doc(db, 'settings', 'general'))
  if (!snap.exists()) return DEFAULT_SETTINGS
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<SiteSettings>) }
}

export interface UpdateSettingsInput extends Partial<Omit<SiteSettings, 'facadePhotoUrl'>> {
  facadePhotoFile?: File | null
}

export async function updateSettings(patch: UpdateSettingsInput): Promise<void> {
  const { facadePhotoFile, ...rest } = patch
  const data: Record<string, unknown> = { ...rest }
  if (facadePhotoFile) {
    data.facadePhotoUrl = await compressFacadePhoto(facadePhotoFile)
  }
  await setDoc(doc(db, 'settings', 'general'), data, { merge: true })
}
