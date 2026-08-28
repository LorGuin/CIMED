import { useMemo } from 'react'
import type { Turno } from '../firebase/turnos'
import './WeeklyActivityChart.scss'

interface Props {
  turnos: Turno[]
  loading?: boolean
  weekLabel?: string
  monthLabel?: string
  chartTitle?: string
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Mini panel de actividad reutilizable: dos tarjetas con color de marca (turnos de la semana y del
// mes) más un gráfico de barras simple (CSS puro, sin librerías) con los turnos por día de la
// semana actual. Se usa tanto en la Ficha médico (turnos de un solo médico) como en el Panel de
// Secretaría (turnos de todos los médicos) — quien lo usa decide qué lista de turnos pasarle.
export default function WeeklyActivityChart({
  turnos,
  loading = false,
  weekLabel = 'Turnos esta semana',
  monthLabel = 'Total del mes',
  chartTitle = 'Turnos por día — esta semana',
}: Props) {
  // Los cancelados no cuentan como turnos "otorgados".
  const activeTurnos = useMemo(() => turnos.filter((t) => t.status !== 'cancelado'), [turnos])

  // Lunes a domingo de la semana actual.
  const weekDays = useMemo(() => {
    const now = new Date()
    now.setHours(12, 0, 0, 0)
    const dow = now.getDay()
    const diffToMonday = dow === 0 ? -6 : 1 - dow
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return { date: `${y}-${m}-${day}`, label: DAY_LABELS[i] }
    })
  }, [])

  const weekCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of weekDays) map[d.date] = 0
    for (const t of activeTurnos) {
      if (map[t.date] !== undefined) map[t.date] += 1
    }
    return map
  }, [activeTurnos, weekDays])

  const weekTotal = useMemo(
    () => Object.values(weekCounts).reduce((sum, n) => sum + n, 0),
    [weekCounts]
  )

  const monthTotal = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return activeTurnos.filter((t) => t.date.startsWith(ym)).length
  }, [activeTurnos])

  const maxWeekCount = useMemo(() => Math.max(1, ...Object.values(weekCounts)), [weekCounts])

  return (
    <div className="weekly-activity">
      <div className="weekly-activity__stats">
        <div className="weekly-activity__stat-card weekly-activity__stat-card--week">
          <span className="weekly-activity__stat-label">{weekLabel}</span>
          <strong className="weekly-activity__stat-value">{loading ? '—' : weekTotal}</strong>
        </div>
        <div className="weekly-activity__stat-card weekly-activity__stat-card--month">
          <span className="weekly-activity__stat-label">{monthLabel}</span>
          <strong className="weekly-activity__stat-value">{loading ? '—' : monthTotal}</strong>
        </div>
      </div>

      <div className="weekly-activity__chart">
        <h3>{chartTitle}</h3>
        {loading ? (
          <p className="weekly-activity__hint">Cargando actividad…</p>
        ) : (
          <div className="weekly-activity__bars">
            {weekDays.map((d) => {
              const count = weekCounts[d.date] ?? 0
              const heightPct = Math.max(Math.round((count / maxWeekCount) * 100), count > 0 ? 10 : 3)
              return (
                <div
                  className="weekly-activity__bar-col"
                  key={d.date}
                  title={`${d.label}: ${count} turno${count === 1 ? '' : 's'}`}
                >
                  <span className="weekly-activity__bar-value">{count > 0 ? count : ''}</span>
                  <div className="weekly-activity__bar-track">
                    <div className="weekly-activity__bar" style={{ height: `${heightPct}%` }} />
                  </div>
                  <span className="weekly-activity__bar-label">{d.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
