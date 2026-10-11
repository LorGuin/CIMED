import { useSettings } from '../firebase/SettingsContext'
import BrandLogo from './BrandLogo'
import './Footer.scss'


function SocialIcon({ icon }: { icon: string }) {
  if (icon === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.7h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.24c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.42-3.9 4V10.3H7.7v3h2.66V21h3.14Z" />
      </svg>
    )
  }
  if (icon === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 3c-2.44 0-2.75.01-3.71.06-.96.05-1.62.2-2.19.42-.6.23-1.1.55-1.6 1.05-.5.5-.82 1-1.05 1.6-.22.57-.37 1.23-.42 2.19C3.01 9.25 3 9.56 3 12s.01 2.75.06 3.71c.05.96.2 1.62.42 2.19.23.6.55 1.1 1.05 1.6.5.5 1 .82 1.6 1.05.57.22 1.23.37 2.19.42.96.05 1.27.06 3.71.06s2.75-.01 3.71-.06c.96-.05 1.62-.2 2.19-.42.6-.23 1.1-.55 1.6-1.05.5-.5.82-1 1.05-1.6.22-.57.37-1.23.42-2.19.05-.96.06-1.27.06-3.71s-.01-2.75-.06-3.71c-.05-.96-.2-1.62-.42-2.19a4.15 4.15 0 0 0-1.05-1.6 4.15 4.15 0 0 0-1.6-1.05c-.57-.22-1.23-.37-2.19-.42C14.75 3.01 14.44 3 12 3Zm0 1.8c2.4 0 2.69.01 3.63.06.88.04 1.36.18 1.68.31.42.16.72.36 1.04.68.32.32.52.62.68 1.04.13.32.27.8.31 1.68.05.94.06 1.23.06 3.63s-.01 2.69-.06 3.63c-.04.88-.18 1.36-.31 1.68-.16.42-.36.72-.68 1.04-.32.32-.62.52-1.04.68-.32.13-.8.27-1.68.31-.94.05-1.23.06-3.63.06s-2.69-.01-3.63-.06c-.88-.04-1.36-.18-1.68-.31a2.8 2.8 0 0 1-1.04-.68 2.8 2.8 0 0 1-.68-1.04c-.13-.32-.27-.8-.31-1.68-.05-.94-.06-1.23-.06-3.63s.01-2.69.06-3.63c.04-.88.18-1.36.31-1.68.16-.42.36-.72.68-1.04.32-.32.62-.52 1.04-.68.32-.13.8-.27 1.68-.31.94-.05 1.23-.06 3.63-.06Zm0 3.06a4.14 4.14 0 1 0 0 8.28 4.14 4.14 0 0 0 0-8.28Zm0 6.83a2.69 2.69 0 1 1 0-5.38 2.69 2.69 0 0 1 0 5.38Zm4.31-6.99a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.5H4.06V20h2.88V8.5Zm.19-3.5a1.68 1.68 0 1 1-3.37 0 1.68 1.68 0 0 1 3.37 0ZM20 13.3c0-3.5-1.87-5.13-4.36-5.13-2.01 0-2.91 1.1-3.41 1.88V8.5H9.35C9.39 9.4 9.35 20 9.35 20h2.88v-6.42c0-.34.02-.68.12-.93.27-.68.9-1.39 1.94-1.39 1.37 0 1.92 1.05 1.92 2.58V20H20v-6.7Z" />
    </svg>
  )
}

export default function Footer() {
  const { instagramUrl, facebookUrl, linkedinUrl } = useSettings()

  // Facebook y LinkedIn solo se muestran si el admin cargó el link desde "Contenido del sitio" —
  // antes eran links muertos ('#'), ahora directamente no aparece el ícono hasta que haya un link real.
  const socialLinks = [
    facebookUrl && { name: 'Facebook', href: facebookUrl, icon: 'facebook' },
    instagramUrl && { name: 'Instagram', href: instagramUrl, icon: 'instagram' },
    linkedinUrl && { name: 'LinkedIn', href: linkedinUrl, icon: 'linkedin' },
  ].filter((s): s is { name: string; href: string; icon: string } => Boolean(s))

  return (
    <footer className="footer">
      <div className="footer__inner">
        <BrandLogo tone="light" />

        <span className="footer__copy">© {new Date().getFullYear()} Clínica Aurora · Atención médica integral.</span>

        <div className="footer__social">
          {socialLinks.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}>
              <SocialIcon icon={s.icon} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
