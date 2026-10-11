// ACCESO LIBRE (modo demostración).
//
// En `true`, los paneles de Administrador, Médicos y Secretaría se abren SIN usuario ni
// contraseña: la pantalla de login se reemplaza por un botón "Entrar" (y, para Médicos, una lista
// para elegir con qué médico entrar). Pensado para mostrar la demo de Clínica Aurora.
//
// IMPORTANTE: esto solo cambia la app. Para que la base de datos acepte los cambios sin login,
// `firestore.rules` tiene que tener `demoOpen()` en `true` (y publicarse en la consola de
// Firebase). Para volver a exigir claves: poner esto en `false`, `demoOpen()` en `false`, y
// publicar las reglas de nuevo.
export const OPEN_ACCESS = true
