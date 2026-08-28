export interface Specialty {
  icon: string
  label: string
}

// Lista base: lo que se muestra en "Nuestras Especialidades" antes de cargar el primer médico
// (o si por algún motivo no hay ninguno todavía), para que la sección no se vea vacía.
export const specialties: Specialty[] = [
  { icon: '\u{1F9E0}', label: 'Neurología' },
  { icon: '\u{2764}\u{FE0F}', label: 'Cardiología' },
  { icon: '\u{1F52C}', label: 'Anatomía Patológica' },
  { icon: '\u{1FA78}', label: 'Diabetología' },
  { icon: '\u{1F9EA}', label: 'Análisis Clínicos' },
]

const DEFAULT_SPECIALTY_ICON = '\u{1FA7A}'

// Palabra clave (sin tildes, en minúsculas) -> ícono. Se usa para asignarle un ícono lindo a
// cualquier especialidad que se cargue desde el Panel de Administrador, aunque no sea una de las
// 5 de la lista base de arriba — así, al agregar un médico con una especialidad nueva, la sección
// "Nuestras Especialidades" le pone un ícono acorde de forma automática, sin tener que tocar código.
const SPECIALTY_ICON_KEYWORDS: Array<[string, string]> = [
  ['cardio', '\u{2764}\u{FE0F}'],
  ['neuro', '\u{1F9E0}'],
  ['patolog', '\u{1F52C}'],
  ['diabet', '\u{1FA78}'],
  ['endocrin', '\u{1FA78}'],
  ['analisis clinic', '\u{1F9EA}'],
  ['laborator', '\u{1F9EA}'],
  ['dermatolog', '\u{1F9F4}'],
  ['pediatr', '\u{1F476}'],
  ['ginecolog', '\u{1F930}'],
  ['obstetric', '\u{1F930}'],
  ['traumatolog', '\u{1F9B4}'],
  ['ortoped', '\u{1F9B4}'],
  ['reumatolog', '\u{1F9B4}'],
  ['oftalmolog', '\u{1F441}\u{FE0F}'],
  ['otorrino', '\u{1F442}'],
  ['psiquiatr', '\u{1F9E9}'],
  ['psicolog', '\u{1F4AD}'],
  ['nutric', '\u{1F957}'],
  ['kinesiolog', '\u{1F3C3}'],
  ['fisioterap', '\u{1F3C3}'],
  ['urolog', '\u{1F4A7}'],
  ['nefrolog', '\u{1F4A7}'],
  ['gastroenterolog', '\u{1F37D}\u{FE0F}'],
  ['neumolog', '\u{1FAC1}'],
  ['odontolog', '\u{1F9B7}'],
  ['dental', '\u{1F9B7}'],
  ['oncolog', '\u{1F397}\u{FE0F}'],
  ['radiolog', '\u{1FA7B}'],
  ['imagen', '\u{1FA7B}'],
  ['alergi', '\u{1F927}'],
  ['infectolog', '\u{1F9A0}'],
  ['flebolog', '\u{1F9B5}'],
  ['vascular', '\u{1F9B5}'],
  ['cirugia', '\u{2702}\u{FE0F}'],
  ['cirujano', '\u{2702}\u{FE0F}'],
  ['clinic', '\u{1FA7A}'],
  ['general', '\u{1FA7A}'],
]

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Busca un ícono acorde para el texto de especialidad que haya escrito el médico/admin en el
// formulario (texto libre, no un select). Si no matchea ninguna palabra clave conocida, devuelve
// un ícono genérico para que la especialidad igual aparezca en la sección.
export function getSpecialtyIcon(label: string): string {
  const normalized = stripAccents(label.trim().toLowerCase())
  const match = SPECIALTY_ICON_KEYWORDS.find(([keyword]) => normalized.includes(keyword))
  return match ? match[1] : DEFAULT_SPECIALTY_ICON
}
