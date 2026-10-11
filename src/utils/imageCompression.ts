// Comprime imágenes en el navegador (canvas) antes de guardarlas directo en Firestore como base64,
// en vez de usar Firebase Storage — así el proyecto queda 100% en el plan gratuito, sin depender
// del plan de pago Blaze. La usan tanto las fotos/QR de médicos (`firebase/doctors.ts`) como las
// fotos de estudios adjuntas a la historia clínica (`firebase/patientStudies.ts`).
export async function resizeToDataUrl(
  file: File,
  maxDimension: number,
  format: 'image/jpeg' | 'image/png',
  quality: number | undefined,
  maxBytes: number,
  errorLabel: string
): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Pasa sobre todo con fotos HEIC del iPhone, que la mayoría de los navegadores no puede leer.
    throw new Error(
      `${errorLabel} no se pudo abrir (formato no compatible). Usá una imagen JPG o PNG — si es una foto del iPhone, exportala o mandátela como JPG.`
    )
  }

  let { width, height } = bitmap
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width)
      width = maxDimension
    } else {
      width = Math.round((width * maxDimension) / height)
      height = maxDimension
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen en este navegador.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const dataUrl = canvas.toDataURL(format, quality)

  if (dataUrl.length > maxBytes) {
    throw new Error(`${errorLabel} es muy pesada incluso comprimida. Probá con otra imagen más simple.`)
  }

  return dataUrl
}
