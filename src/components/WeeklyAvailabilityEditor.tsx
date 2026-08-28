import { useState } from 'react'
import { WEEKDAY_LABELS, type AvailabilityBlock } from '../utils/availability'
import './WeeklyAvailabilityEditor.scss'

const DAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

interface ScheduleRow {
  id: number
  start: string
  end: string
  days: boolean[] // 7 posiciones, misma convención que AvailabilityBlock.weekday (0 = domingo)
}

let nextRowId = 0

// Agrupa las franjas planas (una por día) en filas por horario compartido, para poder mostrar
// "Lunes a viernes de 8 a 19:30" como UNA sola fila con 5 días tildados, en vez de 5 franjas
// sueltas idénticas salvo por el día.
function blocksToRows(blocks: AvailabilityBlock[]): ScheduleRow[] {
  const map = new Map<string, ScheduleRow>()
  for (const b of blocks) {
    const key = `${b.start}|${b.end}`
    let row = map.get(key)
    if (!row) {
      row = { id: nextRowId++, start: b.start, end: b.end, days: Array(7).fill(false) }
      map.set(key, row)
    }
    row.days[b.weekday] = true
  }
  return Array.from(map.values())
}

// Inversa: expande cada fila a una franja por día tildado — es el mismo `AvailabilityBlock[]`
// que ya usa el resto de la app (cálculo de turnos disponibles, etc.), no hubo que tocar ese
// modelo, solo la forma de cargarlo.
function rowsToBlocks(rows: ScheduleRow[]): AvailabilityBlock[] {
  const blocks: AvailabilityBlock[] = []
  for (const row of rows) {
    row.days.forEach((on, weekday) => {
      if (on) blocks.push({ weekday, start: row.start, end: row.end })
    })
  }
  return blocks
}

interface Props {
  availability: AvailabilityBlock[]
  onChange: (next: AvailabilityBlock[]) => void
  slotMinutes: number
  onSlotMinutesChange: (minutes: number) => void
}

// Editor de horarios semanales — reemplaza la carga franja por franja (antes había que agregar y
// editar una fila por cada día, con su propio selector de día + horario, algo muy tedioso para
// cargar por ejemplo "lunes a viernes de 8 a 19:30"). Ahora cada fila es un horario con chips de
// día (D L M X J V S) para tildar a qué días aplica, más atajos "Lun a Vie" / "Todos" para el caso
// más común. Se usa igual desde el Panel de Administrador (`AdminDoctorEdit.tsx`) y desde "Mis
// datos profesionales" del propio médico (`MedicoProfileEdit.tsx`).
export default function WeeklyAvailabilityEditor({
  availability,
  onChange,
  slotMinutes,
  onSlotMinutesChange,
}: Props) {
  const [rows, setRows] = useState<ScheduleRow[]>(() => blocksToRows(availability))

  const commit = (next: ScheduleRow[]) => {
    setRows(next)
    onChange(rowsToBlocks(next))
  }

  const addRow = () => {
    commit([...rows, { id: nextRowId++, start: '09:00', end: '13:00', days: Array(7).fill(false) }])
  }

  const removeRow = (id: number) => {
    commit(rows.filter((r) => r.id !== id))
  }

  const updateRow = (id: number, patch: Partial<ScheduleRow>) => {
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const toggleDay = (id: number, dayIndex: number) => {
    commit(
      rows.map((r) =>
        r.id === id ? { ...r, days: r.days.map((on, i) => (i === dayIndex ? !on : on)) } : r
      )
    )
  }

  const applyPreset = (id: number, preset: 'weekdays' | 'all') => {
    const days = Array(7).fill(false)
    if (preset === 'weekdays') {
      for (let i = 1; i <= 5; i++) days[i] = true
    } else {
      for (let i = 0; i < 7; i++) days[i] = true
    }
    updateRow(id, { days })
  }

  return (
    <div className="weekly-availability">
      <label className="weekly-availability__slot-minutes">
        Duración de cada turno (minutos)
        <select value={slotMinutes} onChange={(e) => onSlotMinutesChange(Number(e.target.value))}>
          <option value={15}>15</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={45}>45</option>
          <option value={60}>60</option>
        </select>
      </label>

      {rows.length === 0 && (
        <p className="weekly-availability__hint">Todavía no cargaste ningún horario.</p>
      )}

      {rows.map((row) => (
        <div className="weekly-availability__row" key={row.id}>
          <div className="weekly-availability__days">
            {DAY_SHORT.map((label, i) => (
              <button
                key={i}
                type="button"
                className={`weekly-availability__day${
                  row.days[i] ? ' weekly-availability__day--active' : ''
                }`}
                aria-label={WEEKDAY_LABELS[i]}
                aria-pressed={row.days[i]}
                onClick={() => toggleDay(row.id, i)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="weekly-availability__preset"
              onClick={() => applyPreset(row.id, 'weekdays')}
            >
              Lun a Vie
            </button>
            <button
              type="button"
              className="weekly-availability__preset"
              onClick={() => applyPreset(row.id, 'all')}
            >
              Todos
            </button>
          </div>

          <div className="weekly-availability__time">
            <span>de</span>
            <input type="time" value={row.start} onChange={(e) => updateRow(row.id, { start: e.target.value })} />
            <span>a</span>
            <input type="time" value={row.end} onChange={(e) => updateRow(row.id, { end: e.target.value })} />
            <button type="button" className="weekly-availability__remove" onClick={() => removeRow(row.id)}>
              Quitar
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="btn-outline" onClick={addRow}>
        + Agregar franja horaria
      </button>
    </div>
  )
}
