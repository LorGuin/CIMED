import { Link } from 'react-router-dom'
import PortalShell from './PortalShell'
import './Dashboard.scss'

const CARDS = [
  {
    title: 'Médicos',
    desc: 'Alta de médicos: foto, matrícula, especialidad y servicios. Aparecen solos en la landing.',
    href: '/admin/medicos',
  },
  {
    title: 'Accesos (Médicos y Secretarias)',
    desc: 'Crear usuario y contraseña para que médicos y secretarias entren a su panel.',
    href: '/admin/usuarios',
  },
  {
    title: 'Configuración',
    desc: 'Número de WhatsApp del centro, usado en toda la página y en la confirmación de turnos.',
    href: '/admin/configuracion',
  },
  {
    title: 'Contenido del sitio',
    desc: 'Horarios, foto de la fachada, Instagram, teléfono y dirección — sin tocar código.',
    href: '/admin/contenido',
  },
]

export default function AdminDashboard() {
  return (
    <PortalShell>
      <h1>Panel de Administrador</h1>
      <p className="dashboard__intro">
        Esta es la base del panel. Cada una de estas secciones se conecta en los próximos pasos.
      </p>

      <div className="dashboard__grid">
        {CARDS.map((c) =>
          c.href ? (
            <Link className="dashboard__card dashboard__card--link" to={c.href} key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="dashboard__badge dashboard__badge--active">Abrir →</span>
            </Link>
          ) : (
            <div className="dashboard__card" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span className="dashboard__badge">Próximamente</span>
            </div>
          )
        )}
      </div>
    </PortalShell>
  )
}
