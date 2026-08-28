// Lógica de horarios disponibles para el turnero. Cada médico define franjas horarias semanales
// recurrentes (ej: "Lunes de 9 a 13") desde el panel de administrador, y acá se calculan los
// horarios puntuales disponibles para una fecha concreta, descontando los que ya están ocupados.

export interface AvailabilityBlock {
  weekday: number // 0 = domingo, 1 = lunes, ... 6 = sábado (igual que Date.getDay())
  start: string // "09:00"
  end: string // "13:00"
}

export const WEEKDAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export function weekdayOf(dateStr: string): number {
  // Ojo: new Date("YYYY-MM-DD") sin hora se interpreta en UTC en algunos navegadores y puede dar
  // el día anterior según la zona horaria. Por eso se arma la fecha con hora del mediodía local.
  return new Date(`${dateStr}T12:00:00`).getDay()
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// Todos los horarios posibles según las franjas semanales del médico para el día de semana que
// corresponda a `dateStr`, sin descontar ocupados — sirve para poder mostrar la agenda completa
// (libres + ocupados) en vez de solo los horarios que quedan libres.
export function getAllSlots(blocks: AvailabilityBlock[], dateStr: string, slotMinutes: number): string[] {
  const weekday = weekdayOf(dateStr)
  const dayBlocks = blocks.filter((b) => b.weekday === weekday)

  const slots: string[] = []
  for (const block of dayBlocks) {
    let cursor = timeToMinutes(block.start)
    const end = timeToMinutes(block.end)
    while (cursor + slotMinutes <= end) {
      slots.push(minutesToTime(cursor))
      cursor += slotMinutes
    }
  }

  return Array.from(new Set(slots)).sort()
}

// Genera los horarios posibles según las franjas semanales del médico para el día de semana que
// corresponda a `dateStr`, y saca los que ya figuran ocupados (turnos existentes no cancelados).
export function getAvailableSlots(
  blocks: AvailabilityBlock[],
  dateStr: string,
  slotMinutes: number,
  takenTimes: string[]
): string[] {
  return getAllSlots(blocks, dateStr, slotMinutes).filter((t) => !takenTimes.includes(t))
}

// Próximos N días que tengan al menos una franja cargada (para no mostrarle al paciente días en
// los que el médico directamente no atiende).
export function nextAvailableDates(blocks: AvailabilityBlock[], count: number): string[] {
  const activeWeekdays = new Set(blocks.map((b) => b.weekday))
  const dates: string[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  let guard = 0
  while (dates.length < count && guard < 120) {
    guard += 1
    if (activeWeekdays.has(cursor.getDay())) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}
