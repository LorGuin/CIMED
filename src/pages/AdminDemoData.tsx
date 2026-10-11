import { useEffect, useState } from 'react'
import { deleteDoctor, listDoctors, type DoctorProfile } from '../firebase/doctors'
import { DEMO_DOCTOR_IDS, resetSiteSettings, seedDemoDoctors } from '../firebase/demoData'
import { countPatientData, fillDemoAgenda, seedDemoPatients, wipePatientData, type PatientCounts } from '../firebase/demoPatients'
import PortalShell from './PortalShell'
import './AdminUsers.scss'
import './AdminDemoData.scss'

// Herramienta de una sola vez para dejar la base de datos alineada con la marca Clínica Aurora:
// el sitio lee médicos y contenido desde Firestore, así que cambiar el código no alcanza — lo que
// quedó guardado de antes (fotos, nombres, teléfonos, Instagram) se sigue mostrando hasta que se
// reemplaza desde acá.
export default function AdminDemoData() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<PatientCounts | null>(null)
  const [countsError, setCountsError] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setDoctors(await listDoctors())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la lista de médicos.')
    } finally {
      setLoading(false)
    }
    try {
      setCounts(await countPatientData())
      setCountsError(false)
    } catch {
      setCountsError(true)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const others = doctors.filter((d) => !DEMO_DOCTOR_IDS.has(d.id))
  const demoLoaded = doctors.filter((d) => DEMO_DOCTOR_IDS.has(d.id)).length

  const run = async (key: string, action: () => Promise<string>) => {
    setBusy(key)
    setMessage(null)
    setError(null)
    try {
      setMessage(await action())
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Probá de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  const handleSeed = () =>
    run('seed', async () => {
      const n = await seedDemoDoctors()
      return `Listo: ${n} médicos de demostración cargados. Ya aparecen en la página y en el turnero.`
    })

  const handleSettings = () => {
    if (!confirm('Se reemplazan dirección, teléfonos, horarios, foto de fachada y redes por los valores de Clínica Aurora. ¿Seguimos?')) return
    run('settings', async () => {
      await resetSiteSettings()
      return 'Contenido del sitio restablecido. Acordate de cargar el WhatsApp y el teléfono reales en Configuración y Contenido del sitio.'
    })
  }

  const handleDeleteOthers = () => {
    if (!confirm(`Se borran ${others.length} médico(s) que no son del equipo de demostración. No se puede deshacer. ¿Seguimos?`)) return
    run('delete', async () => {
      for (const d of others) await deleteDoctor(d.id)
      return `Se borraron ${others.length} médico(s) anteriores.`
    })
  }

  const handleResetPatients = () => {
    const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null
    const detail = total === null ? 'todos los turnos e historias clínicas' : `${total} registro(s) de turnos e historias clínicas`
    if (!confirm(`Se borran ${detail} y se cargan pacientes de ejemplo. No se puede deshacer. ¿Seguimos?`)) return
    run('patients', async () => {
      const removed = await wipePatientData()
      const r = await seedDemoPatients()
      const extra = await fillDemoAgenda()
      return `Listo: se borraron ${removed} registro(s) anteriores y se cargaron ${r.patients} pacientes de ejemplo, ${r.turnos + extra} turnos en las próximas dos semanas y ${r.visits} visitas en el historial (${r.notes} con consulta cargada).`
    })
  }

  const handleFillAgenda = () =>
    run('fill', async () => {
      const n = await fillDemoAgenda()
      return n === 0
        ? 'La agenda de las próximas dos semanas ya está bastante llena: no hizo falta sumar turnos.'
        : `Listo: se sumaron ${n} turnos de ejemplo en las próximas dos semanas.`
    })

  const isPermissionError = (msg: string | null) => !!msg && /permission|insufficient/i.test(msg)

  return (
    <PortalShell>
      <h1>Datos de demostración</h1>
      <p className="dashboard__intro">
        La página toma los médicos y el contenido desde la base de datos. Estos pasos dejan
        todo con la marca <strong>Clínica Aurora</strong>: equipo ficticio con retratos ilustrados,
        datos de contacto de ejemplo y sin rastros de la versión anterior.
      </p>

      {message && <p className="admin-users__success demo-data__msg">{message}</p>}
      {error && <p className="login-card__error demo-data__msg">{error}</p>}
      {isPermissionError(error) && busy === null && (
        <p className="demo-data__hint demo-data__msg">
          Si falló el paso 4 por permisos: copiá el <code>firestore.rules</code> actualizado del
          proyecto y publicalo en la consola de Firebase (Firestore → Reglas). Después probá de nuevo.
        </p>
      )}

      <div className="demo-data">
        <section className="demo-data__step">
          <span className="demo-data__num">1</span>
          <div>
            <h3>Cargar el equipo de demostración</h3>
            <p>
              Cinco profesionales ficticios (Cardiología, Neurología, Clínica Médica y Diabetología,
              Anatomía Patológica y Laboratorio), con horarios y obras sociales de ejemplo.
            </p>
            <div className="demo-data__avatars" aria-hidden="true">
              {['lucia-ferrero', 'martin-quiroga', 'esteban-rios', 'valeria-dominguez', 'paula-benitez'].map((id) => (
                <img key={id} src={`/doctors/${id}.svg`} alt="" />
              ))}
            </div>
            <button className="btn-primary" onClick={handleSeed} disabled={busy !== null}>
              {busy === 'seed' ? 'Cargando…' : demoLoaded > 0 ? 'Volver a cargarlos' : 'Cargar equipo'}
            </button>
            {!loading && <span className="demo-data__status">{demoLoaded} de 5 cargados</span>}
          </div>
        </section>

        <section className="demo-data__step">
          <span className="demo-data__num">2</span>
          <div>
            <h3>Restablecer el contenido del sitio</h3>
            <p>
              Dirección, teléfono, WhatsApp, horarios, foto de fachada y redes vuelven a los valores
              de ejemplo de Clínica Aurora.
            </p>
            <button className="btn-outline" onClick={handleSettings} disabled={busy !== null}>
              {busy === 'settings' ? 'Guardando…' : 'Restablecer contenido'}
            </button>
          </div>
        </section>

        <section className="demo-data__step">
          <span className="demo-data__num">3</span>
          <div>
            <h3>Borrar los médicos anteriores</h3>
            {loading ? (
              <p>Revisando…</p>
            ) : others.length === 0 ? (
              <p>No quedan médicos de la versión anterior. 👌</p>
            ) : (
              <>
                <p>Estos médicos no forman parte del equipo de demostración:</p>
                <ul className="demo-data__list">
                  {others.map((d) => (
                    <li key={d.id}>
                      {d.name} <span>· {d.shortSpecialty || d.specialty}</span>
                    </li>
                  ))}
                </ul>
                <button className="admin-users__delete-btn" onClick={handleDeleteOthers} disabled={busy !== null}>
                  {busy === 'delete' ? 'Borrando…' : `Borrar ${others.length} médico(s)`}
                </button>
                <p className="demo-data__hint">
                  Si alguno tenía usuario para entrar al panel, desactivalo después desde “Accesos”.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="demo-data__step">
          <span className="demo-data__num">4</span>
          <div>
            <h3>Reemplazar turnos e historias clínicas</h3>
            <p>
              Borra los turnos, el historial, las consultas, las fichas y las fotos de estudios que
              quedaron de la versión anterior, y carga cinco pacientes ficticios con turnos próximos
              (uno pendiente con seña, un sobreturno y uno cancelado) e historial de consultas.
              Conviene hacerlo después del paso 1, porque los turnos de ejemplo usan ese equipo.
            </p>
            {counts ? (
              <ul className="demo-data__list">
                <li>{counts.turnos} <span>turnos</span></li>
                <li>{counts.patientVisits} <span>visitas en el historial</span></li>
                <li>{counts.clinicalNotes} <span>consultas cargadas</span></li>
                <li>{counts.patientBackground} <span>fichas de pacientes</span></li>
                <li>{counts.patientStudies} <span>fotos de estudios</span></li>
              </ul>
            ) : countsError ? (
              <p>No se pudo contar lo que hay guardado ahora.</p>
            ) : (
              <p>Revisando…</p>
            )}
            <button className="admin-users__delete-btn" onClick={handleResetPatients} disabled={busy !== null}>
              {busy === 'patients' ? 'Reemplazando…' : 'Borrar y cargar ejemplos'}
            </button>
            <p className="demo-data__hint">
              Necesita las reglas de Firestore actualizadas (el administrador tiene permiso para
              borrar historia clínica). Si todavía no las publicaste, hacelo antes.
            </p>
          </div>
        </section>

        <section className="demo-data__step">
          <span className="demo-data__num">5</span>
          <div>
            <h3>Llenar la agenda con turnos de ejemplo</h3>
            <p>
              Ocupa más o menos la mitad de los horarios libres de los próximos 14 días de cada
              médico con turnos inventados (confirmados, pendientes, algún cancelado y algún
              sobreturno). No borra nada, así que podés volver a usarlo cuando la agenda se vaya
              vaciando con el paso de los días.
            </p>
            <button className="btn-primary" onClick={handleFillAgenda} disabled={busy !== null}>
              {busy === 'fill' ? 'Cargando turnos…' : 'Llenar agenda'}
            </button>
          </div>
        </section>
      </div>
    </PortalShell>
  )
}
