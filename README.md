# CIMED — Web App

Sitio web de CIMED (Centro Integral de Medicina y Diagnóstico).

## Stack

- React + TypeScript + Vite
- Sass (estilos en `src/styles` y por componente)
- React Router (landing pública + logins + paneles internos)
- Firebase: Authentication + Firestore (acceso de Administrador / Médicos / Secretarias)
- Deploy pensado para Vercel

## Cómo correrlo

Este proyecto se armó desde un entorno en la nube sin acceso a internet completo, así que **las
dependencias no están instaladas todavía**. Para arrancar:

```bash
npm install
npm run dev
```

Abrí la URL que te muestre la terminal (por defecto `http://localhost:5173`).

Para generar el build de producción:

```bash
npm run build
npm run preview
```

## Configurar Firebase (necesario para los logins)

1. Copiá `.env.example` a `.env` (o `.env.local`).
2. Completá los valores con la configuración web de tu proyecto de Firebase: consola de Firebase →
   ⚙️ Configuración del proyecto → "Tus apps" → app web → "SDK setup and configuration".
3. En la consola de Firebase, activá **Authentication → Sign-in method → Email/Password**.
4. Creá la base de **Firestore Database** (modo producción) si todavía no existe.
5. Pegá el contenido de `firestore.rules` en Firestore Database → Reglas, y publicá.
6. Seguí `ACCESOS.md` para dar de alta el primer usuario Administrador.

Sin este paso la landing pública funciona igual; solo los logins (`/login/administrador`,
`/login/medicos`, `/login/secretarias`) no van a poder autenticar.

## Estructura

```
src/
  components/       Sidebar, TopBar, Hero, About, Specialties, Location, LocationContact,
                     Contact, Instagram, Footer, ProtectedRoute
  pages/            LoginForm + AdminLogin/MedicoLogin/SecretariaLogin,
                     PortalShell + AdminDashboard/MedicoDashboard/SecretariaDashboard
  firebase/         config.ts (init de Firebase), AuthContext.tsx (login por usuario/contraseña), roles.ts
  data/             doctors.ts, specialties.ts, nav.ts
  utils/whatsapp.ts Teléfono de WhatsApp y helper para armar los links wa.me
  styles/           variables, mixins y estilos globales (Sass)
public/doctors/     Fotos de los médicos (completas y recortadas tipo avatar)
firestore.rules     Reglas de seguridad de Firestore (pegar en la consola de Firebase)
ACCESOS.md          Cómo dar de alta un usuario (Administrador/Médico/Secretaria) hoy, a mano
```

> Nota: quedaron sin usar `Header.tsx`, `Doctors.tsx`, `DoctorCard.tsx` y `WhatsAppFloatButton.tsx`
> (componentes de una versión anterior de la landing). No rompen nada, pero se pueden borrar cuando
> quieras — no se hizo automático porque el sistema bloqueó el permiso de borrado.

## Contenido pendiente de revisar con el cliente

- Confirmar que el número de WhatsApp para los links `wa.me` (`549 261 4195388`) sea el formato correcto.
- Foto real de la Dra. Vicente Alicia Nieves (Laboratorio de Análisis Clínicos) — hoy tiene un avatar con sus iniciales.
- URLs reales de Facebook y LinkedIn para el footer (hoy son placeholder `#`).
- Credenciales de Firebase (ver sección de arriba).

## Próximos pasos (roadmap acordado)

1. ~~Landing pública (presentación, pedir turno, ubicación, Instagram)~~
2. ~~Acceso con login (Administrador / Médicos / Secretarias) — Firebase Auth + Firestore~~ ← estamos acá (paneles con contenido placeholder, falta conectar el turnero real)
3. Turnero: alta/edición/cancelación de turnos con aviso automático al paciente por WhatsApp
4. Pago anticipado por QR + alias (uno por médico, sin datos de tarjeta)
5. Panel de administrador completo: alta de médicos y secretarias desde la propia web (sin pasar por la consola de Firebase), gestión de contenido del sitio
