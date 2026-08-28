import { useSettings } from '../firebase/SettingsContext'
import './Location.scss'

export default function Location() {
  const { address } = useSettings()

  const mapsQuery = encodeURIComponent(`CIMED Centro Médico, ${address}, Argentina`)
  const mapsEmbedSrc = `https://www.google.com/maps?q=${mapsQuery}&output=embed`
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <div id="ubicacion" className="location">
      <h2>Ubicación</h2>

      <div className="location__map">
        <iframe
          title="Ubicación de CIMED en Google Maps"
          src={mapsEmbedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="location__address">
        Visitános en: {address}.{' '}
        <a href={mapsLink} target="_blank" rel="noreferrer">
          Ver en Google Maps
        </a>
      </p>
    </div>
  )
}
