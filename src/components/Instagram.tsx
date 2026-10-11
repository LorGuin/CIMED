import { useSettings } from '../firebase/SettingsContext'
import './Instagram.scss'

export default function Instagram() {
  const { instagramUrl, instagramHandle, instagramFollowers } = useSettings()

  // Sin link cargado no mostramos la sección (antes quedaba un botón que no llevaba a ningún lado).
  if (!instagramUrl) return null

  return (
    <section id="instagram" className="instagram">
      <div className="instagram__inner">
        <div className="instagram__header">
          <span className="section-eyebrow">Seguinos</span>
          <h2>{instagramHandle} en Instagram</h2>
          {instagramFollowers && <p className="instagram__followers">{instagramFollowers}</p>}
          <p>Novedades, consejos de salud y presentación de nuestros especialistas.</p>
          <a className="btn-primary" href={instagramUrl} target="_blank" rel="noreferrer">
            Ver perfil de Instagram
          </a>
        </div>
      </div>
    </section>
  )
}
