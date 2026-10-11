import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV_LINKS } from '../data/nav'
import { useSettings } from '../firebase/SettingsContext'
import BrandLogo from './BrandLogo'
import './Sidebar.scss'

export default function Sidebar() {
  const [active, setActive] = useState('#inicio')
  const { consultasHours } = useSettings()

  // Marca como activa la sección que se está viendo al scrollear (antes solo cambiaba al hacer
  // clic, y quedaba "Inicio" marcado aunque estuvieras en Contacto).
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(
      (el): el is Element => Boolean(el)
    )
    if (!('IntersectionObserver' in window) || sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActive(`#${visible[0].target.id}`)
      },
      { rootMargin: '-35% 0px -55% 0px' }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <aside className="sidebar">
      <a href="#inicio" className="sidebar__brand" onClick={() => setActive('#inicio')}>
        <BrandLogo />
      </a>

      <nav className="sidebar__nav" aria-label="Secciones">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`sidebar__link ${active === link.href ? 'sidebar__link--active' : ''}`}
            onClick={() => setActive(link.href)}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="sidebar__cta">
        <strong>¿Necesitás un turno?</strong>
        <span>{consultasHours}</span>
        <Link className="btn-accent sidebar__cta-btn" to="/turno">
          Reservar online
        </Link>
      </div>
    </aside>
  )
}
