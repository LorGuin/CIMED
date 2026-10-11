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
  {
    title: 'Datos de demostración',
    desc: 'Cargar el equipo ficticio de Clínica Aurora y limpiar los datos de la versión anterior.',
    href: '/admin/demo',
  },
  {
    title: 'Laboratorio (ayunos)',
    desc: 'Estudios de laboratorio y horas de ayuno — la fuente de datos que usa Mario, el asistente virtual.',
    href: '/admin/laboratorio',
  },
]

export default function AdminDashboard() {
  return (
    <PortalShell>
      <h1>Panel de Administrador</h1>
      <p className="dashboard__intro">
        Desde acá se administra todo el sitio de Clínica Aurora: médicos, accesos del equipo,
        contenido de la página y la información que usa Mario, el asistente virtual.
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
