# Clínica Aurora — Web App

Sitio web y turnero de **Clínica Aurora**, un centro médico de demostración: landing pública,
reserva de turnos online, paneles para Administrador, Médicos y Secretarias, y el asistente
virtual Mario.

> Todos los profesionales, retratos, datos de contacto y la dirección son **ficticios**. Los
> retratos son ilustraciones (`public/doctors/*.svg`), no fotos de personas reales.

## Identidad visual

- Logo: `public/logo-aurora.svg` (sol naciente con cruz médica) + nombre en texto, armado por el
  componente `BrandLogo`. Favicon: `public/favicon.svg` / `favicon.png`.
- Paleta (`src/styles/_variables.scss`): azul petróleo `#12546a` / `#0e2a3b` + coral aurora
  `#f2865e`, fondo crema `#faf7f3`.
- Tipografías: **Fraunces** (títulos) y **Plus Jakarta Sans** (texto e interfaz), desde Google Fonts.

## Stack

- React + TypeScript + Vite
- Sass (estilos en `src/styles` y por componente)
- React Router (landing pública + logins + paneles internos)
- Firebase: Authentication + Firestore (acceso de Administrador / Médicos / Secretarias)
- Deploy en Netlify (ver `netlify.toml`) — incluye una función serverless gratis
  (`netlify/functions/mario.ts`) para el chatbot Mario

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
  components/       BrandLogo, Sidebar, TopBar, Hero, About, Specialties, Location,
                     LocationContact, Contact, Instagram, Footer, MarioChat, ProtectedRoute, …
  pages/            LoginForm + AdminLogin/MedicoLogin/SecretariaLogin,
                     PortalShell + AdminDashboard/MedicoDashboard/SecretariaDashboard
  firebase/         config.ts (init de Firebase), AuthContext.tsx (login por usuario/contraseña), roles.ts
  data/             doctors.ts (equipo de demostración), specialties.ts, nav.ts
  utils/whatsapp.ts Teléfono de WhatsApp y helper para armar los links wa.me
  styles/           variables, mixins y estilos globales (Sass)
public/doctors/     Retratos ilustrados (SVG) de los médicos de demostración
firestore.rules     Reglas de seguridad de Firestore (pegar en la consola de Firebase)
ACCESOS.md          Cómo dar de alta un usuario (Administrador/Médico/Secretaria) hoy, a mano
```

## Datos de demostración

El sitio lee médicos y contenido desde Firestore. Para dejar la base alineada con la marca, entrá
como Administrador → **Datos de demostración** (`/admin/demo`): carga los 5 médicos ficticios,
restablece el contenido del sitio y borra los médicos de la versión anterior. Detalle en `ACCESOS.md`.

## Pendiente antes de mostrarlo

- Cargar el número de WhatsApp y el teléfono reales (hoy hay valores de relleno).
- URLs de Instagram, Facebook y LinkedIn si se quieren mostrar (sin link, no aparecen).
- Credenciales de Firebase (ver sección de arriba).

## Próximos pasos (roadmap acordado)

1. ~~Landing pública (presentación, pedir turno, ubicación, Instagram)~~
2. ~~Acceso con login (Administrador / Médicos / Secretarias) — Firebase Auth + Firestore~~ ← estamos acá (paneles con contenido placeholder, falta conectar el turnero real)
3. Turnero: alta/edición/cancelación de turnos con aviso automático al paciente por WhatsApp
4. Pago anticipado por QR + alias (uno por médico, sin datos de tarjeta)
5. Panel de administrador completo: alta de médicos y secretarias desde la propia web (sin pasar por la consola de Firebase), gestión de contenido del sitio

## Chatbot Mario (asistente virtual)

Mario es el botón de chat flotante de la landing y de `/turno` — contesta obra social por médico,
horarios y ayuno para estudios de laboratorio, y nunca da consejo médico ni recomienda medicación
(diseño completo en el proyecto de Claude, doc `especificacion-mario-chatbot.md`). Piezas nuevas:

- `src/firebase/labStudies.ts` + panel `/admin/laboratorio`: catálogo de estudios y horas de ayuno.
- Campo `obrasSociales` por médico, editable desde "Ficha médico" / "Mis datos profesionales".
- `src/components/MarioChat.tsx`: el widget de chat (botón flotante).
- `netlify/functions/mario.ts`: función serverless gratis de Netlify — la única pieza que llama a
  la IA (Groq), así la API key nunca viaja al navegador. Aplica un filtro de seguridad extra sobre
  cada respuesta antes de mostrarla, por si el modelo se desvía de las instrucciones.

### Para activarlo

1. Cargá, para cada médico, sus obras sociales (Ficha médico / Mis datos profesionales).
2. Cargá el catálogo de estudios de laboratorio y horas de ayuno desde `/admin/laboratorio` — con
   datos confirmados por el laboratorio, no a ojo (un ayuno mal indicado puede invalidar un
   análisis o ser un riesgo para el paciente).
3. Sacá una API key gratis, sin tarjeta, en https://console.groq.com.
4. Cargala como variable de entorno `GROQ_API_KEY` en Netlify → Site settings → Environment
   variables (y en tu `.env` local si querés probarlo en tu compu) — **sin** el prefijo `VITE_`,
   así Vite nunca la empaqueta en el código del navegador.
5. Volvé a publicar `firestore.rules` en la consola de Firebase (se agregó la colección
   `labStudies`).

### Importante: `npm run dev` NO alcanza para probar a Mario en local

`npm run dev` levanta solo Vite (el front-end) — no sabe nada de `netlify/functions/mario.ts`, así
que pedirle algo a Mario ahí da **404 en `/api/mario`**. Eso es esperado, no es un bug. Para
probarlo en tu compu hay que levantar el proyecto con el proxy de Netlify, que sirve el front-end
Y las funciones juntos:

```bash
npx netlify-cli dev
```

(la primera vez descarga el CLI, no hace falta instalarlo global). Te va a abrir el sitio en otro
puerto, típicamente `http://localhost:8888` — usá esa URL, no la de `5173` directo. Necesitás tener
`GROQ_API_KEY` en tu `.env` para que funcione ahí. Una vez deployado a Netlify (con `GROQ_API_KEY`
cargada en Site settings → Environment variables), `/api/mario` funciona solo en el sitio publicado,
sin necesidad de `netlify dev`.
