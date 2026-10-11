import type { AvailabilityBlock } from '../utils/availability'

// Equipo de demostración de Clínica Aurora. Son profesionales FICTICIOS, con retratos ilustrados
// (public/doctors/*.svg) — no corresponden a personas reales. Se cargan en Firestore desde el
// Panel de Administrador → "Datos de demostración", y desde ahí se pueden editar o borrar como
// cualquier otro médico.
export interface DemoDoctor {
  id: string
  name: string
  specialty: string
  shortSpecialty: string
  photoUrl: string
  services: string[]
  note: string
  whatsappMessage: string
  availability: AvailabilityBlock[]
  slotMinutes: number
  consultationFee: string
  obrasSociales: string[]
}

const weekdays = (days: number[], start: string, end: string): AvailabilityBlock[] =>
  days.map((weekday) => ({ weekday, start, end }))

export const obrasSociales: string[] = [
  'Sancor Salud',
  'Prevención Salud',
  'OSDE',
  'Galeno',
  'Medicus',
  'OSEP',
  'PAMI',
  'y muchas más',
]

const OBRAS_SOCIALES_BASE = obrasSociales.filter((os) => os !== 'y muchas más')

export const DEMO_DOCTORS: DemoDoctor[] = [
  {
    id: 'aurora-lucia-ferrero',
    name: 'Dra. Lucía Ferrero',
    specialty: 'Anatomía Patológica y Citología',
    shortSpecialty: 'Anatomía Patológica',
    photoUrl: '/doctors/lucia-ferrero.svg',
    services: [
      'Biopsias',
      'Papanicolaou',
      'Citología de líquidos',
      'Estudios intraoperatorios',
      'Control de punciones',
      'Piezas quirúrgicas',
    ],
    note: 'Recepción de muestras: lunes a viernes de 8 a 18 hs',
    whatsappMessage: 'Hola Clínica Aurora! Quiero consultar por un estudio con la Dra. Lucía Ferrero (Anatomía Patológica).',
    availability: weekdays([1, 3, 5], '09:00', '13:00'),
    slotMinutes: 30,
    consultationFee: '',
    obrasSociales: OBRAS_SOCIALES_BASE,
  },
  {
    id: 'aurora-martin-quiroga',
    name: 'Dr. Martín Quiroga',
    specialty: 'Neurología',
    shortSpecialty: 'Neurología',
    photoUrl: '/doctors/martin-quiroga.svg',
    services: ['Consulta neurológica', 'Diagnóstico y seguimiento de trastornos del sistema nervioso', 'Cefaleas y migrañas'],
    note: '',
    whatsappMessage: 'Hola Clínica Aurora! Quiero pedir un turno con el Dr. Martín Quiroga (Neurología).',
    availability: weekdays([2, 4], '14:00', '19:00'),
    slotMinutes: 30,
    consultationFee: '',
    obrasSociales: ['OSDE', 'Galeno', 'Medicus', 'Sancor Salud'],
  },
  {
    id: 'aurora-esteban-rios',
    name: 'Dr. Esteban Ríos',
    specialty: 'Cardiología — Especialista en ecocardiografía',
    shortSpecialty: 'Cardiología',
    photoUrl: '/doctors/esteban-rios.svg',
    services: [
      'Consulta cardiológica',
      'Electrocardiograma',
      'Ergometría (prueba de esfuerzo)',
      'Ecocardiograma Doppler color',
      'Holter 24 hs',
      'MAPA (monitoreo de presión arterial)',
      'Aptos físicos y chequeo deportivo',
      'Evaluación de riesgo quirúrgico',
    ],
    note: '',
    whatsappMessage: 'Hola Clínica Aurora! Quiero pedir un turno con el Dr. Esteban Ríos (Cardiología).',
    availability: [...weekdays([1, 3], '08:00', '12:00'), ...weekdays([5], '15:00', '19:00')],
    slotMinutes: 30,
    consultationFee: '',
    obrasSociales: OBRAS_SOCIALES_BASE,
  },
  {
    id: 'aurora-valeria-dominguez',
    name: 'Dra. Valeria Domínguez',
    specialty: 'Clínica Médica y Diabetología',
    shortSpecialty: 'Diabetología',
    photoUrl: '/doctors/valeria-dominguez.svg',
    services: ['Consultas de clínica médica', 'Prevención, diagnóstico y tratamiento', 'Seguimiento integral de la diabetes'],
    note: '',
    whatsappMessage: 'Hola Clínica Aurora! Quiero pedir un turno con la Dra. Valeria Domínguez (Clínica Médica y Diabetología).',
    availability: weekdays([1, 2, 3, 4], '15:00', '19:30'),
    slotMinutes: 20,
    consultationFee: '',
    obrasSociales: ['OSEP', 'PAMI', 'Sancor Salud', 'Prevención Salud', 'OSDE'],
  },
  {
    id: 'aurora-paula-benitez',
    name: 'Dra. Paula Benítez',
    specialty: 'Laboratorio de Análisis Clínicos',
    shortSpecialty: 'Análisis Clínicos',
    photoUrl: '/doctors/paula-benitez.svg',
    services: ['Análisis de sangre y orina', 'Perfil lipídico y glucemia', 'Estudios hormonales'],
    note: 'Extracciones: lunes a sábado de 7:30 a 11 hs, con turno',
    whatsappMessage: 'Hola Clínica Aurora! Quiero consultar por el laboratorio de análisis clínicos.',
    availability: weekdays([1, 2, 3, 4, 5, 6], '07:30', '11:00'),
    slotMinutes: 15,
    consultationFee: '',
    obrasSociales: OBRAS_SOCIALES_BASE,
  },
]
