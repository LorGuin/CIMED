import { useEffect, useState } from 'react'
import { buildWhatsAppLink } from '../utils/whatsapp'
import './Header.scss'

const NAV_LINKS = [
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setOpen(false)

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        <a href="#inicio" className="header__brand" onClick={closeMenu}>
          <img src="/logo-cimed.png" alt="CIMED - Centro Integral de Medicina y Diagnóstico" />
        </a>

        <nav className={`header__nav ${open ? 'header__nav--open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <a
            className="btn-whatsapp header__nav-cta"
            href={buildWhatsAppLink('Hola CIMED! Quiero pedir un turno.')}
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
          >
            Pedir turno
          </a>
        </nav>

        <button
          className={`header__toggle ${open ? 'header__toggle--open' : ''}`}
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
