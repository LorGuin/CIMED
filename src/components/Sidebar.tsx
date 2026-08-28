import { useState } from 'react'
import { NAV_LINKS } from '../data/nav'
import './Sidebar.scss'

export default function Sidebar() {
  const [active, setActive] = useState('#inicio')

  return (
    <aside className="sidebar">
      <a href="#inicio" className="sidebar__brand" onClick={() => setActive('#inicio')}>
        <img src="/logo-cimed.png" alt="CIMED" />
        <span>CIMED</span>
      </a>

      <nav className="sidebar__nav">
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
    </aside>
  )
}
