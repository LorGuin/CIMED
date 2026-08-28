// Numero de WhatsApp del centro (formato internacional para wa.me), usado como valor por
// defecto de `buildWhatsAppLink` — el real (editable desde "Contenido del sitio" en el panel de
// administrador) vive en `firebase/settings.ts` (`SiteSettings.whatsappNumber`), igual que el
// teléfono fijo, la dirección y los datos de Instagram, que también se mudaron para allá.
// Para wa.me los numeros moviles argentinos llevan el "9" despues del 54: 54 9 261 4195388.
export const CIMED_WHATSAPP_PHONE = '5492614195388'

export function buildWhatsAppLink(message: string, phone: string = CIMED_WHATSAPP_PHONE): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}
// Best-effort: convierte un teléfono cargado por un paciente (en cualquier formato local
// argentino) al formato internacional que necesita wa.me. No es infalible — si el link no abre
// el chat correcto, el número se puede ajustar a mano en WhatsApp antes de enviar.
export function normalizeArgPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("54")) return digits
  const withoutLeadingZero = digits.replace(/^0/, "")
  const withoutFifteen = withoutLeadingZero.replace(/^(\d{2,4})15/, "$1")
  return `549${withoutFifteen}`
}
