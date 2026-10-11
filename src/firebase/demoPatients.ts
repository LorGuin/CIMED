import { collection, doc, getCountFromServer, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './config'
import { DEMO_DOCTORS, type DemoDoctor } from '../data/doctors'
import { buildPatientKey } from './patientVisits'
import { getAllSlots } from '../utils/availability'
import { listDoctors } from './doctors'
import { listAllTurnos } from './turnos'

// Paso 4 de "Datos de demostración": borra los turnos y la historia clínica que quedaron de la
// versión anterior (pacientes reales) y carga un set chico de pacientes FICTICIOS para que los
// paneles de Secretaría y Médico se vean con datos al mostrar la demo. Nombres, DNI y teléfonos
// son inventados (teléfonos con prefijo 555, que no se asigna a líneas reales).

export const PATIENT_COLLECTIONS = [
  'turnos',
  'patientVisits',
  'clinicalNotes',
  'patientBackground',
  'patientStudies',
] as const

export type PatientCounts = Record<(typeof PATIENT_COLLECTIONS)[number], number>

// Cuenta sin descargar los documentos (las fotos de estudios pesan bastante).
export async function countPatientData(): Promise<PatientCounts> {
  const entries = await Promise.all(
    PATIENT_COLLECTIONS.map(async (name) => {
      const snap = await getCountFromServer(collection(db, name))
      return [name, snap.data().count] as const
    })
  )
  return Object.fromEntries(entries) as PatientCounts
}

// Borra TODO lo de las cinco colecciones de pacientes. Requiere que `firestore.rules` permita
// `delete` al administrador en patientVisits / clinicalNotes / patientBackground / patientStudies.
export async function wipePatientData(): Promise<number> {
  let total = 0
  for (const name of PATIENT_COLLECTIONS) {
    const snap = await getDocs(collection(db, name))
    // Un batch de Firestore admite hasta 500 operaciones; 400 deja margen.
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    total += snap.size
  }
  return total
}

// ---------------------------------------------------------------------------------------------
// Pacientes de ejemplo
// ---------------------------------------------------------------------------------------------

interface DemoPatient {
  name: string
  dni: string
  phone: string
  fechaNacimiento: string
  edad: string
  sexo: string
  ocupacion: string
  domicilio: string
  tipoCobertura: string
  coberturaNombre: string
  antecedentes: string
  alergias: string
  medicacionHabitual: string
}

const PATIENTS: Record<'sofia' | 'julian' | 'marta' | 'tomas' | 'carla', DemoPatient> = {
  sofia: {
    name: 'Sofía Herrera',
    dni: '35000101',
    phone: '261 555-0101',
    fechaNacimiento: '1992-04-18',
    edad: '34',
    sexo: 'Femenino',
    ocupacion: 'Docente',
    domicilio: 'Calle Ejemplo 120, Godoy Cruz',
    tipoCobertura: 'Prepaga',
    coberturaNombre: 'OSDE',
    antecedentes: 'Sin antecedentes relevantes.',
    alergias: 'Penicilina',
    medicacionHabitual: 'Ninguna',
  },
  julian: {
    name: 'Julián Castro',
    dni: '22000202',
    phone: '261 555-0202',
    fechaNacimiento: '1968-09-02',
    edad: '58',
    sexo: 'Masculino',
    ocupacion: 'Comerciante',
    domicilio: 'Av. Demo 845, Ciudad de Mendoza',
    tipoCobertura: 'Prepaga',
    coberturaNombre: 'Sancor Salud',
    antecedentes: 'Hipertensión arterial en control. Ex fumador.',
    alergias: 'No refiere',
    medicacionHabitual: 'Enalapril 10 mg por día',
  },
  marta: {
    name: 'Marta Giménez',
    dni: '10000303',
    phone: '261 555-0303',
    fechaNacimiento: '1955-01-27',
    edad: '71',
    sexo: 'Femenino',
    ocupacion: 'Jubilada',
    domicilio: 'Barrio Modelo, casa 14, Guaymallén',
    tipoCobertura: 'Obra social',
    coberturaNombre: 'PAMI',
    antecedentes: 'Diabetes tipo 2 diagnosticada en 2015. Colesterol elevado.',
    alergias: 'No refiere',
    medicacionHabitual: 'Metformina 850 mg dos veces por día',
  },
  tomas: {
    name: 'Tomás Aguirre',
    dni: '44000404',
    phone: '261 555-0404',
    fechaNacimiento: '1999-11-05',
    edad: '26',
    sexo: 'Masculino',
    ocupacion: 'Estudiante',
    domicilio: 'Pasaje Prueba 33, Las Heras',
    tipoCobertura: 'Particular',
    coberturaNombre: '',
    antecedentes: 'Cefaleas frecuentes desde la adolescencia.',
    alergias: 'No refiere',
    medicacionHabitual: 'Ninguna',
  },
  carla: {
    name: 'Carla Moyano',
    dni: '28000505',
    phone: '261 555-0505',
    fechaNacimiento: '1981-06-30',
    edad: '45',
    sexo: 'Femenino',
    ocupacion: 'Contadora',
    domicilio: 'Calle Muestra 77, Luján de Cuyo',
    tipoCobertura: 'Prepaga',
    coberturaNombre: 'Galeno',
    antecedentes: 'Hipotiroidismo.',
    alergias: 'Ibuprofeno',
    medicacionHabitual: 'Levotiroxina 50 mcg en ayunas',
  },
}

const DOC = Object.fromEntries(DEMO_DOCTORS.map((d) => [d.id.replace('aurora-', ''), d])) as Record<
  'lucia-ferrero' | 'martin-quiroga' | 'esteban-rios' | 'valeria-dominguez' | 'paula-benitez',
  DemoDoctor
>

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// N-ésimo día (1 = el primero) en que atiende el médico, hacia adelante desde mañana (dir = 1) o
// hacia atrás desde ayer (dir = -1). Así los turnos caen siempre en días reales de su agenda.
function nthWorkday(doctor: DemoDoctor, n: number, dir: 1 | -1): string {
  const days = new Set(doctor.availability.map((b) => b.weekday))
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  let found = 0
  for (let guard = 0; guard < 120; guard++) {
    cursor.setDate(cursor.getDate() + dir)
    if (days.has(cursor.getDay()) && ++found === n) return fmt(cursor)
  }
  return fmt(cursor)
}

function slot(doctor: DemoDoctor, date: string, index: number): string {
  const slots = getAllSlots(doctor.availability, date, doctor.slotMinutes)
  return slots[Math.min(index, slots.length - 1)] ?? '09:00'
}

const key = (p: DemoPatient) => buildPatientKey(p.dni, p.phone)

// Las reglas de Firestore solo dejan CREAR turnos "pendiente" o "confirmado" (cancelar es una
// modificación posterior, como hace Secretaría). Por eso los cancelados de ejemplo se crean como
// confirmados y se cancelan en un segundo paso.
async function cancelAfterCreate(refs: ReturnType<typeof doc>[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    refs.slice(i, i + 400).forEach((ref) => batch.update(ref, { status: 'cancelado' }))
    await batch.commit()
  }
}

export async function seedDemoPatients(): Promise<{ turnos: number; visits: number; notes: number; patients: number }> {
  const batch = writeBatch(db)
  const now = Date.now()

  // --- Fichas de pacientes ---
  for (const p of Object.values(PATIENTS)) {
    const { name, dni: _dni, phone, ...rest } = p
    batch.set(doc(db, 'patientBackground', key(p)), {
      patientKey: key(p),
      patientName: name,
      updatedBy: 'Secretaría',
      telefono: phone,
      ...rest,
      updatedAt: now,
    })
  }

  // --- Próximos turnos (se ven en Secretaría, Médico y en la agenda del turnero) ---
  const upcoming: Array<{
    p: DemoPatient
    d: DemoDoctor
    nth: number
    slotIdx: number
    motivo: string
    status: 'pendiente' | 'confirmado' | 'cancelado'
    senia?: boolean
    overbooking?: boolean
  }> = [
    { p: PATIENTS.julian, d: DOC['esteban-rios'], nth: 1, slotIdx: 1, motivo: 'Control de presión', status: 'confirmado' },
    { p: PATIENTS.marta, d: DOC['valeria-dominguez'], nth: 1, slotIdx: 2, motivo: 'Control de diabetes', status: 'pendiente', senia: true },
    // Sobreturno: mismo médico, día y horario que el turno de Marta.
    { p: PATIENTS.sofia, d: DOC['valeria-dominguez'], nth: 1, slotIdx: 2, motivo: 'Resultados de laboratorio', status: 'confirmado', overbooking: true },
    { p: PATIENTS.tomas, d: DOC['martin-quiroga'], nth: 1, slotIdx: 3, motivo: 'Dolor de cabeza recurrente', status: 'pendiente' },
    { p: PATIENTS.carla, d: DOC['paula-benitez'], nth: 1, slotIdx: 0, motivo: 'Análisis de rutina (TSH, hemograma)', status: 'confirmado' },
    { p: PATIENTS.julian, d: DOC['valeria-dominguez'], nth: 2, slotIdx: 4, motivo: 'Chequeo general', status: 'cancelado' },
  ]

  const toCancel: ReturnType<typeof doc>[] = []
  for (const t of upcoming) {
    const date = nthWorkday(t.d, t.nth, 1)
    const ref = doc(collection(db, 'turnos'))
    if (t.status === 'cancelado') toCancel.push(ref)
    batch.set(ref, {
      doctorId: t.d.id,
      doctorName: t.d.name,
      patientName: t.p.name,
      patientPhone: t.p.phone,
      patientDni: t.p.dni,
      motivo: t.motivo,
      date,
      time: slot(t.d, date, t.slotIdx),
      status: t.status === 'cancelado' ? 'confirmado' : t.status,
      seniaInformada: t.senia ?? false,
      isOverbooking: t.overbooking ?? false,
      createdAt: now,
    })
  }

  // --- Historial: turnos ya pasados + la consulta que cargó el médico ---
  const past: Array<{
    p: DemoPatient
    d: DemoDoctor
    nth: number
    motivo: string
    status: 'atendido' | 'cancelado'
    note?: { diagnostico: string; tratamiento: string; vitals: [string, string, string, string]; estudios: string; observaciones: string }
  }> = [
    {
      p: PATIENTS.julian, d: DOC['esteban-rios'], nth: 2, motivo: 'Control cardiológico', status: 'atendido',
      note: { diagnostico: 'Hipertensión arterial controlada.', tratamiento: 'Continúa con la medicación habitual. Dieta hiposódica.', vitals: ['84 kg', '1,74 m', '130/85', '36,5 °C'], estudios: 'Electrocardiograma: ritmo sinusal, sin alteraciones.', observaciones: 'Control en 3 meses.' },
    },
    {
      p: PATIENTS.julian, d: DOC['valeria-dominguez'], nth: 4, motivo: 'Chequeo anual', status: 'atendido',
      note: { diagnostico: 'Chequeo anual sin hallazgos nuevos.', tratamiento: 'Se indican análisis de rutina.', vitals: ['85 kg', '1,74 m', '135/85', '36,4 °C'], estudios: 'Pedido: hemograma, perfil lipídico, glucemia.', observaciones: '' },
    },
    {
      p: PATIENTS.marta, d: DOC['valeria-dominguez'], nth: 2, motivo: 'Control de diabetes', status: 'atendido',
      note: { diagnostico: 'Diabetes tipo 2 con buen control metabólico.', tratamiento: 'Sin cambios en la medicación. Caminatas diarias.', vitals: ['68 kg', '1,58 m', '125/80', '36,6 °C'], estudios: 'HbA1c 6,8 %.', observaciones: 'Próximo control con análisis.' },
    },
    { p: PATIENTS.marta, d: DOC['paula-benitez'], nth: 3, motivo: 'Extracción de sangre', status: 'atendido' },
    { p: PATIENTS.marta, d: DOC['valeria-dominguez'], nth: 5, motivo: 'Control', status: 'cancelado' },
    {
      p: PATIENTS.tomas, d: DOC['martin-quiroga'], nth: 2, motivo: 'Cefalea', status: 'atendido',
      note: { diagnostico: 'Cefalea tensional.', tratamiento: 'Pautas de higiene del sueño y pausas activas. Diario de cefaleas.', vitals: ['72 kg', '1,80 m', '120/75', '36,5 °C'], estudios: 'Examen neurológico normal.', observaciones: 'Volver con el diario completo en un mes.' },
    },
    {
      p: PATIENTS.sofia, d: DOC['valeria-dominguez'], nth: 3, motivo: 'Consulta clínica', status: 'atendido',
      note: { diagnostico: 'Control de salud.', tratamiento: 'Se solicita laboratorio general.', vitals: ['61 kg', '1,65 m', '110/70', '36,3 °C'], estudios: 'Pedido: hemograma, glucemia, TSH.', observaciones: 'Alergia a penicilina registrada.' },
    },
    { p: PATIENTS.carla, d: DOC['paula-benitez'], nth: 2, motivo: 'Análisis de tiroides', status: 'atendido' },
  ]

  let notes = 0
  for (const v of past) {
    const date = nthWorkday(v.d, v.nth, -1)
    const time = slot(v.d, date, v.nth)
    const createdAt = new Date(`${date}T${time}:00`).getTime()
    batch.set(doc(collection(db, 'patientVisits')), {
      patientKey: key(v.p),
      patientName: v.p.name,
      patientPhone: v.p.phone,
      patientDni: v.p.dni,
      doctorId: v.d.id,
      doctorName: v.d.name,
      date,
      time,
      motivo: v.motivo,
      status: v.status,
      isOverbooking: false,
      archivedAt: createdAt + 86_400_000,
    })
    if (v.note) {
      const [peso, altura, presion, temperatura] = v.note.vitals
      batch.set(doc(collection(db, 'clinicalNotes')), {
        patientKey: key(v.p),
        patientName: v.p.name,
        patientPhone: v.p.phone,
        patientDni: v.p.dni,
        doctorId: v.d.id,
        doctorName: v.d.name,
        diagnostico: v.note.diagnostico,
        tratamiento: v.note.tratamiento,
        vitals: { peso, altura, presion, temperatura },
        estudios: v.note.estudios,
        observaciones: v.note.observaciones,
        date,
        createdAt,
      })
      notes++
    }
  }

  await batch.commit()
  await cancelAfterCreate(toCancel)
  return { turnos: upcoming.length, visits: past.length, notes, patients: Object.keys(PATIENTS).length }
}

// ---------------------------------------------------------------------------------------------
// Llenar la agenda con turnos "fantasma"
// ---------------------------------------------------------------------------------------------

const FIRST_NAMES = [
  'Lucía', 'Mateo', 'Valentina', 'Benjamín', 'Martina', 'Joaquín', 'Camila', 'Santiago', 'Florencia',
  'Facundo', 'Agustina', 'Nicolás', 'Rocío', 'Gonzalo', 'Micaela', 'Federico', 'Paula', 'Ramiro',
  'Belén', 'Ezequiel', 'Silvia', 'Héctor', 'Graciela', 'Raúl',
]
const LAST_NAMES = [
  'Fernández', 'Pereyra', 'Sosa', 'Romero', 'Ortiz', 'Molina', 'Videla', 'Funes', 'Lucero', 'Ponce',
  'Arias', 'Quiroga', 'Correa', 'Godoy', 'Montenegro', 'Navarro', 'Ojeda', 'Vera', 'Bustos', 'Sáez',
]
const MOTIVOS: Record<string, string[]> = {
  default: ['Consulta', 'Control', 'Primera consulta', 'Seguimiento', 'Resultados de estudios'],
  'Cardiología': ['Control de presión', 'Electrocardiograma', 'Chequeo preoperatorio', 'Control cardiológico', 'Palpitaciones'],
  'Neurología': ['Dolor de cabeza', 'Control', 'Mareos', 'Primera consulta', 'Resultados de resonancia'],
  'Diabetología': ['Control de diabetes', 'Chequeo general', 'Resultados de laboratorio', 'Control de peso', 'Certificado de aptitud física'],
  'Análisis Clínicos': ['Extracción de sangre', 'Análisis de rutina', 'Hemograma completo', 'Perfil lipídico', 'Glucemia'],
  'Anatomía Patológica': ['Entrega de muestra', 'Retiro de resultados', 'Consulta por biopsia', 'PAP'],
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function ghostPatients(count: number) {
  const used = new Set<string>()
  const out: { name: string; dni: string; phone: string }[] = []
  let i = 0
  while (out.length < count && i < count * 10) {
    i++
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    if (used.has(name)) continue
    used.add(name)
    const n = out.length + 10
    out.push({
      name,
      dni: `3${String(9000000 + n * 1373).padStart(7, '0')}`,
      phone: `261 555-${String(1000 + n).slice(-4)}`,
    })
  }
  return out
}

// Llena los horarios libres de los próximos `days` días (desde hoy) de todos los médicos activos
// con agenda cargada. Ocupa más o menos la mitad de cada día (más los días cercanos, menos los
// lejanos, como una agenda real), deja algunos pendientes con seña y algún cancelado o sobreturno.
// Respeta los turnos que ya existan, así que se puede volver a correr para "rellenar".
export async function fillDemoAgenda(days = 14): Promise<number> {
  const [doctors, existing] = await Promise.all([listDoctors(), listAllTurnos()])
  const taken = new Set(existing.filter((t) => t.status !== 'cancelado').map((t) => `${t.doctorId}|${t.date}|${t.time}`))
  const pool = ghostPatients(22)

  const now = new Date()
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const writes: { data: Record<string, unknown>; cancel: boolean }[] = []

  for (const d of doctors.filter((x) => x.active && x.availability.length > 0)) {
    const motivos = MOTIVOS[d.shortSpecialty] ?? MOTIVOS.default
    for (let offset = 0; offset < days; offset++) {
      const day = new Date()
      day.setHours(12, 0, 0, 0)
      day.setDate(day.getDate() + offset)
      const date = fmt(day)
      const slots = getAllSlots(d.availability, date, d.slotMinutes)
      if (slots.length === 0) continue
      // Más lleno al principio (80%) y bajando hacia el final (~35%).
      const density = 0.8 - (offset / days) * 0.45
      let overbookingDone = false
      for (const time of slots) {
        if (offset === 0 && time <= nowTime) continue
        const k = `${d.id}|${date}|${time}`
        if (taken.has(k) || Math.random() > density) continue
        taken.add(k)
        const p = pick(pool)
        const r = Math.random()
        const status = r < 0.06 ? 'cancelado' : r < 0.3 ? 'pendiente' : 'confirmado'
        writes.push({ cancel: status === 'cancelado', data: {
          doctorId: d.id,
          doctorName: d.name,
          patientName: p.name,
          patientPhone: p.phone,
          patientDni: Math.random() < 0.85 ? p.dni : '',
          motivo: pick(motivos),
          date,
          time,
          status: status === 'cancelado' ? 'confirmado' : status,
          seniaInformada: status === 'pendiente' && Math.random() < 0.5,
          isOverbooking: false,
          createdAt: Date.now() - Math.floor(Math.random() * 7 * 86_400_000),
        } })
        // De vez en cuando, un sobreturno encima de un turno ya dado.
        if (!overbookingDone && status === 'confirmado' && Math.random() < 0.12) {
          overbookingDone = true
          const q = pick(pool)
          writes.push({ cancel: false, data: {
            doctorId: d.id,
            doctorName: d.name,
            patientName: q.name,
            patientPhone: q.phone,
            patientDni: q.dni,
            motivo: 'Urgencia — sobreturno autorizado',
            date,
            time,
            status: 'confirmado',
            seniaInformada: false,
            isOverbooking: true,
            createdAt: Date.now(),
          } })
        }
      }
    }
  }

  const toCancel: ReturnType<typeof doc>[] = []
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(db)
    writes.slice(i, i + 400).forEach((w) => {
      const ref = doc(collection(db, 'turnos'))
      if (w.cancel) toCancel.push(ref)
      batch.set(ref, w.data)
    })
    await batch.commit()
  }
  await cancelAfterCreate(toCancel)
  return writes.length
}
