import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { NAV_LINKS, ROLE_LINKS } from '../data/nav'
import BrandLogo from './BrandLogo'
import './TopBar.scss'

export default function TopBar() {
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  // El panel se renderiza en un portal, directo bajo <body> (ver más abajo), así que mientras
  // está abierto bloqueamos el scroll del body: si no, en el celular el dedo puede terminar
  // scrolleando la página de atrás (el Hero) en vez del panel, y ese contenido se ve "correrse"
  // detrás/alrededor del menú — exactamente lo que se venía reportando como letras superpuestas.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <header className="topbar">
      <a href="#inicio" className="topbar__brand-mobile">
        <BrandLogo size="sm" />
      </a>

      <p className="topbar__note">
        <span className="topbar__dot" aria-hidden="true" /> Turnos online las 24 hs · confirmación por WhatsApp
      </p>

      <div className="topbar__actions">
        <Link className="btn-primary topbar__reserve" to="/turno">
          Reservar turno
        </Link>

        <div className="topbar__menu">
          <button
            className={`topbar__toggle${open ? ' topbar__toggle--active' : ''}`}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          {open &&
            createPortal(
              <>
                {/* Fondo semitransparente que cubre el resto de la pantalla y cierra el menú al
                    tocarlo — así el panel puede ser chico y sigue quedando claro qué está activo. */}
                <div
                  className="topbar__backdrop"
                  onClick={closeMenu}
                  style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    background: 'rgba(8, 24, 34, 0.55)',
                    zIndex: 2147483646,
                  }}
                />

                {/* Panel flotante (ya no a pantalla completa): fondo y posición en línea, a
                    propósito, con la máxima prioridad posible y sin depender de la cascada. */}
                <div
                  className="topbar__panel"
                  style={{
                    position: 'fixed',
                    top: 80,
                    right: 16,
                    left: 16,
                    maxWidth: 320,
                    marginLeft: 'auto',
                    maxHeight: 'calc(100vh - 104px)',
                    backgroundColor: '#0e2a3b',
                    opacity: 1,
                    borderRadius: 20,
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                    zIndex: 2147483647,
                  }}
                >
                  <button
                    type="button"
                    className="topbar__panel-close"
                    aria-label="Cerrar menú"
                    onClick={closeMenu}
                  >
                    ✕
                  </button>

                  <div className="topbar__panel-nav">
                    {NAV_LINKS.map((link) => (
                      <a key={link.href} href={link.href} onClick={closeMenu}>
                        {link.label}
                      </a>
                    ))}
                  </div>

                  <div className="topbar__panel-roles">
                    <span className="topbar__panel-title">Acceso</span>
                    {ROLE_LINKS.map((link) =>
                      link.href.startsWith('/') ? (
                        <Link key={link.label} to={link.href} onClick={closeMenu}>
                          {link.label}
                        </Link>
                      ) : (
                        <a key={link.label} href={link.href} onClick={closeMenu}>
                          {link.label}
                        </a>
                      )
                    )}
                  </div>
                </div>
              </>,
              document.body
            )}
        </div>
      </div>
    </header>
  )
}
