import { useState, type FormEvent } from 'react'
import { buildWhatsAppLink } from '../utils/whatsapp'
import { useSettings } from '../firebase/SettingsContext'
import './Contact.scss'

export default function Contact() {
  const { whatsappNumber, phoneFijo, consultasHours } = useSettings()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: por ahora el formulario arma un mensaje de WhatsApp con los datos cargados.
    // Cuando conectemos Firebase, esto puede guardar la consulta en la base y/o enviar un email.
    const text = `Hola CIMED! Soy ${name || '(sin nombre)'}.\nEmail: ${email || '(sin email)'}\nMensaje: ${message || '(sin mensaje)'}`
    window.open(buildWhatsAppLink(text, whatsappNumber), '_blank', 'noreferrer')
  }

  return (
    <div id="contacto" className="contact">
      <h2>Contacto</h2>

      <form className="contact__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <textarea
          placeholder="Mensaje"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary contact__submit">
          Enviar
        </button>
      </form>

      <div className="contact__info">
        <div>
          <strong>Llámanos</strong>
          <span>{phoneFijo}</span>
        </div>
        <div>
          <strong>WhatsApp</strong>
          <a
            href={buildWhatsAppLink('Hola CIMED! Quiero pedir un turno.', whatsappNumber)}
            target="_blank"
            rel="noreferrer"
          >
            +{whatsappNumber}
          </a>
        </div>
        <div>
          <strong>Horarios</strong>
          <span>{consultasHours}</span>
        </div>
      </div>
    </div>
  )
}
