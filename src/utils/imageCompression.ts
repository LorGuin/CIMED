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
  let bitmap: ImageBitmap | HTMLImageElement
  try {
    bitmap = await decodeImage(file)
  } catch {
    // Pasa sobre todo con fotos HEIC del iPhone, que la mayoría de los navegadores no puede leer.
    throw new Error(
      `${errorLabel} no se pudo abrir (formato no compatible). Usá una imagen JPG, PNG o SVG — si es una foto del iPhone, exportala o mandátela como JPG.`
    )
  }

  let width = bitmap.width || 400
  let height = bitmap.height || 500
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

// createImageBitmap no acepta SVG en la mayoría de los navegadores: en ese caso (o si falla por
// cualquier otro motivo) se decodifica con un <img>, que sí sabe dibujar SVG en el canvas.
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
  if (!isSvg) {
    try {
      return await createImageBitmap(file)
    } catch {
      // sigue con <img>
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}
