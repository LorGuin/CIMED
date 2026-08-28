import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './config'

export interface PatientBackground {
  patientKey: string
  patientName: string
  // Quien cargo o actualizo la ficha por ultima vez (nombre del medico o "Secretaria") - es solo
  // informativo: la ficha es UNA sola por paciente, compartida por todo el staff de CIMED.
  updatedBy: string
  // Datos filiatorios y administrativos
  fechaNacimiento: string
  edad: string
  sexo: string
  ocupacion: string
  domicilio: string
  telefono: string
  tipoCobertura: string
  coberturaNombre: string
  // Antecedentes clinicos
  antecedentes: string
  alergias: string
  medicacionHabitual: string
  updatedAt: number
}

export interface SavePatientBackgroundInput {
  patientKey: string
  patientName: string
  updatedBy: string
  fechaNacimiento: string
  edad: string
  sexo: string
  ocupacion: string
  domicilio: string
  telefono: string
  tipoCobertura: string
  coberturaNombre: string
  antecedentes: string
  alergias: string
  medicacionHabitual: string
}

// Ficha del paciente (datos filiatorios/administrativos + antecedentes clinicos). Los pacientes
// son de CIMED, no de un medico en particular: si alguien pide turno con el cardiologo y despues
// con el clinico, es LA MISMA ficha para los dos - por eso el id del documento es el `patientKey`
// solo (ya no se mezcla con el medico), y la puede cargar o editar cualquiera del staff logueado
// (medico o secretaria, para ahorrar tiempo en la consulta). Es una sola ficha por paciente que se
// va actualizando con el tiempo - se sobreescribe, no se acumula como las consultas.
export async function savePatientBackground(input: SavePatientBackgroundInput): Promise<void> {
  await setDoc(doc(db, 'patientBackground', input.patientKey), { ...input, updatedAt: Date.now() })
}

// Todas las fichas de pacientes de CIMED, para completar la ficha rapida de cada turno sin pedidos
// extra por paciente. Sin filtro (coleccion completa, igual que `listAllTurnos()`) porque ahora es
// compartida entre todos los medicos, ya no depende de un `where` por doctorId.
export async function listAllPatientBackgrounds(): Promise<PatientBackground[]> {
  const snap = await getDocs(collection(db, 'patientBackground'))
  return snap.docs.map((d) => d.data() as PatientBackground)
}
