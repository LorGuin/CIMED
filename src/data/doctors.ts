export interface Doctor {
  id: string
  name: string
  specialty: string
  shortSpecialty: string
  photo: string
  avatar: string
  services?: string[]
  note?: string
  whatsappMessage: string
}

export const doctors: Doctor[] = [
  {
    id: 'marisa-olivares',
    name: 'Dra. Marisa Olivares',
    specialty: 'Anatomía Patológica y Citología',
    shortSpecialty: 'Anatomía Patológica',
    photo: '/doctors/marisa-olivares.jpg',
    avatar: '/doctors/avatar-marisa-olivares.jpg',
    services: [
      'Biopsias',
      'Papanicolaou',
      'Citología de líquidos',
      'Estudios intraoperatorios',
      'Control de punciones',
      'Piezas quirúrgicas',
    ],
    note: 'Recepción de muestras: Lunes a viernes de 8 a 18 hs',
    whatsappMessage: 'Hola CIMED! Quiero consultar por un turno / estudio con la Dra. Marisa Olivares (Anatomía Patológica).',
  },
  {
    id: 'carlos-sanchez-herrera',
    name: 'Dr. Carlos Sánchez Herrera',
    specialty: 'Neurología',
    shortSpecialty: 'Neurología',
    photo: '/doctors/carlos-sanchez-herrera.jpg',
    avatar: '/doctors/avatar-carlos-sanchez-herrera.jpg',
    services: [
      'Consulta neurológica',
      'Diagnóstico y seguimiento de trastornos del sistema nervioso',
    ],
    whatsappMessage: 'Hola CIMED! Quiero pedir un turno con el Dr. Carlos Sánchez Herrera (Neurología).',
  },
  {
    id: 'mauricio-ahumada',
    name: 'Dr. Mauricio Ahumada',
    specialty: 'Cardiólogo — Especialista en ecocardiografía',
    shortSpecialty: 'Cardiología',
    photo: '/doctors/mauricio-ahumada.jpg',
    avatar: '/doctors/avatar-mauricio-ahumada.jpg',
    services: [
      'Consulta cardiológica',
      'Electrocardiograma',
      'Ergometría (prueba de esfuerzo)',
      'Ecocardiograma Doppler color',
      'Holter 24 hs',
      'MAPA (monitoreo de presión arterial)',
      'Aptos físicos',
      'Chequeo cardiológico completo',
      'Chequeo deportivo',
      'Evaluación de riesgo quirúrgico',
      'Cardiopatía en la mujer',
    ],
    whatsappMessage: 'Hola CIMED! Quiero pedir un turno con el Dr. Mauricio Ahumada (Cardiología).',
  },
  {
    id: 'carlos-matile',
    name: 'Dr. Carlos Matile',
    specialty: 'Clínica Médica y Diabetología',
    shortSpecialty: 'Diabetología',
    photo: '/doctors/carlos-matile.jpg',
    avatar: '/doctors/avatar-carlos-matile.jpg',
    services: [
      'Consultas personalizadas',
      'Prevención, diagnóstico y tratamiento',
      'Seguimiento integral de la diabetes',
    ],
    whatsappMessage: 'Hola CIMED! Quiero pedir un turno con el Dr. Carlos Matile (Clínica Médica y Diabetología).',
  },
  {
    id: 'vicente-nieves',
    name: 'Dra. Vicente Alicia Nieves',
    specialty: 'Laboratorio de Análisis Clínicos',
    shortSpecialty: 'Análisis Clínicos',
    photo: '/doctors/avatar-vicente-nieves.jpg',
    avatar: '/doctors/avatar-vicente-nieves.jpg',
    whatsappMessage: 'Hola CIMED! Quiero consultar por el laboratorio de Análisis Clínicos de la Dra. Vicente Alicia Nieves.',
  },
]

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
