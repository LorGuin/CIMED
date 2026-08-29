import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listDoctors, type DoctorProfile } from '../firebase/doctors'
import { listLabStudies, type LabStudy } from '../firebase/labStudies'
import { useSettings } from '../firebase/SettingsContext'
import { buildWhatsAppLink } from '../utils/whatsapp'
import { WEEKDAY_LABELS, type AvailabilityBlock } from '../utils/availability'
import './MarioChat.scss'

// Mario: el asistente virtual de CIMED. Ver especificacion-mario-chatbot.md (proyecto de Claude)
// para el diseño completo — acá va solo el widget de chat. Toda la lógica de IA y los guardrails
// (nunca dar consejo médico) viven del lado del servidor, en netlify/functions/mario.ts, para que
// la API key de Groq nunca viaje al navegador. Este componente resuelve los datos de Firestore que
// Mario puede usar (médicos + estudios de laboratorio, ambas colecciones de lectura pública) y se
// los manda a la función ya armados — el modelo nunca toca Firestore directamente.
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_REPLIES = [
  '¿Qué obra social atiende cada médico?',
  '¿Qué horarios manejan los médicos?',
  '¿Cuánto ayuno necesito para un estudio de laboratorio?',
]

const WELCOME =
  '¡Hola! Soy Mario, el asistente de CIMED. Contame en qué te puedo ayudar: turnos, obra ' +
  'social por médico, horarios, o preparación para estudios de laboratorio.'

function summarizeAvailability(blocks: AvailabilityBlock[]): string {
  if (blocks.length === 0) return 'sin horarios cargados todavía — consultar por WhatsApp'
  return blocks
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
    .map((b) => `${WEEKDAY_LABELS[b.weekday]} ${b.start}–${b.end}`)
    .join(', ')
}

// Ícono de robot (SVG propio, sin librerías ni imágenes externas — mismo criterio que el ícono de
// WhatsApp del sitio) para que quede claro a simple vista que Mario es un asistente de IA y no una
// persona del centro atendiendo en vivo.
function RobotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <line x1="12" y1="8" x2="12" y2="4" />
      <circle cx="12" cy="3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <line x1="8.5" y1="18" x2="15.5" y2="18" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export default function MarioChat() {
  const { whatsappNumber } = useSettings()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [labStudies, setLabStudies] = useState<LabStudy[]>([])
  const [dataReady, setDataReady] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Carga médicos + catálogo de laboratorio recién cuando el paciente abre el chat por primera
  // vez (no en cada render de la landing), y solo una vez por sesión de chat.
  useEffect(() => {
    if (!open || dataReady) return
    Promise.all([listDoctors(), listLabStudies()])
      .then(([d, l]) => {
        setDoctors(d.filter((doc) => doc.active))
        setLabStudies(l.filter((s) => s.activo))
      })
      .catch(() => {
        setDoctors([])
        setLabStudies([])
      })
      .finally(() => setDataReady(true))
  }, [open, dataReady])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setError(null)
    const outgoingHistory = messages.slice(-6)
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/mario', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: outgoingHistory,
          doctors: doctors.map((d) => ({
            name: d.name,
            specialty: d.specialty,
            obrasSociales: d.obrasSociales,
            availabilitySummary: summarizeAvailability(d.availability),
          })),
          labStudies: labStudies.map((s) => ({
            name: s.name,
            ayunoHoras: s.ayunoHoras,
            indicaciones: s.indicaciones,
          })),
        }),
      })
      if (!res.ok) throw new Error('bad-response')
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'No pude generar una respuesta. Probá de nuevo.' },
      ])
    } catch {
      setError('No me pude conectar. Probá de nuevo en un rato, o escribinos por WhatsApp.')
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="mario">
      {open && (
        <div className="mario__panel">
          <header className="mario__header">
            <div className="mario__header-info">
              <div className="mario__avatar">
                <RobotIcon />
              </div>
              <div>
                <strong>Mario</strong>
                <span>Asistente virtual (IA) de CIMED</span>
              </div>
            </div>
            <button type="button" className="mario__close" onClick={() => setOpen(false)} aria-label="Cerrar chat">
              ✕
            </button>
          </header>

          <p className="mario__disclaimer">
            Mario no reemplaza una consulta médica. No compartas datos de salud personales acá.
          </p>

          <div className="mario__thread" ref={scrollRef}>
            <div className="mario__bubble mario__bubble--assistant">{WELCOME}</div>
            {messages.map((m, i) => (
              <div key={i} className={`mario__bubble mario__bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mario__bubble mario__bubble--assistant mario__bubble--typing">Escribiendo…</div>
            )}
            {error && <p className="mario__error">{error}</p>}
          </div>

          {messages.length === 0 && (
            <div className="mario__quick-replies">
              {QUICK_REPLIES.map((q) => (
                <button type="button" key={q} onClick={() => send(q)} disabled={sending}>
                  {q}
                </button>
              ))}
              <Link to="/turno" className="mario__quick-link">
                Pedir un turno →
              </Link>
              <a
                className="mario__quick-link"
                href={buildWhatsAppLink('Hola CIMED! Tengo una consulta.', whatsappNumber)}
                target="_blank"
                rel="noreferrer"
              >
                Hablar con una persona →
              </a>
            </div>
          )}

          <form className="mario__composer" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta…"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="mario__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar el chat de Mario' : 'Abrir el chat de Mario'}
      >
        {open ? (
          '✕ Cerrar'
        ) : (
          <>
            <RobotIcon />
            Mario
          </>
        )}
      </button>
    </div>
  )
}
