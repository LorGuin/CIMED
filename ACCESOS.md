# Accesos internos (Administrador / Médicos / Secretarias)

## Crear un usuario nuevo (Médico o Secretaria)

Ya no hace falta pasar por la consola de Firebase: entrá a tu Panel de Administrador
(`/login/administrador`) → tarjeta **"Médicos y Secretarias"** → completá el formulario:

- Nombre
- Rol (Médico o Secretaria)
- Si es Médico: a qué médico de la lista corresponde (para que su panel muestre su propia agenda)
- Usuario (con el que va a loguearse) y Contraseña (se la asignás vos; hay un botón "Generar" si
  querés una al azar)

Al crear el usuario te muestra la contraseña una vez — copiala y pasásela a la persona, porque
no queda guardada en ningún lado accesible después (por seguridad, ni vos ni nadie puede "ver" la
contraseña de otro usuario más adelante, solo restablecerla).

En la misma pantalla ves la lista de todos los usuarios ya creados.

## Cómo funciona por dentro

- Cada persona entra con **usuario + contraseña** (no email), desde `/login/administrador`,
  `/login/medicos` o `/login/secretarias`.
- Firebase Authentication solo entiende email + contraseña. Por eso a cada usuario se le arma
  automáticamente un email interno invisible (`<usuario>@clinica-aurora.local`; los usuarios creados antes del cambio de marca conservan su email anterior y siguen entrando igual) que nunca ve nadie.
- Crear un usuario nuevo desde el navegador normalmente te desconecta a vos (el admin) y te deja
  logueado como el usuario nuevo. Para evitar eso, la creación usa una instancia "descartable" de
  Firebase que se cierra apenas termina — tu sesión de administrador no se toca.

## Primer usuario Administrador (ya hecho, queda documentado)

El primer admin se creó a mano en la consola de Firebase, porque hacía falta un admin ya
existente para poder usar el formulario de arriba. Si en algún momento necesitás otro
Administrador (no Médico/Secretaria), por ahora se sigue haciendo a mano:

1. Authentication → Users → Add user (email interno + contraseña).
2. Firestore → colección `usernameIndex` → documento con ID = usuario, campo `email` = el del paso 1.
3. Firestore → colección `staff` → documento con ID = el User UID del paso 1, campos `username`,
   `name`, `role: "admin"`, `active: true`.

## Reglas de Firestore

`firestore.rules` (en la raíz del proyecto) tiene que estar publicado en Firestore Database → Reglas
para que todo esto funcione, incluida la creación de usuarios desde el Panel de Administrador. Si
lo actualizás en el código, acordate de volver a copiarlo y publicarlo en la consola.

## Pendiente

- Editar o desactivar un usuario existente desde el panel (hoy solo se puede crear).

## Cargar los médicos (colección `doctors` en Firestore)

Los médicos ya NO están escritos en el código — se cargan desde el Panel de Administrador →
tarjeta **"Médicos"** (`/admin/medicos`), con foto, matrícula, especialidad y servicios. No hay
límite de cantidad.

**Antes de cargar el primero**, publicá las reglas actualizadas:
- Firestore Database → Reglas → pegar el `firestore.rules` actualizado del proyecto (incluye la
  colección `doctors`) → Publicar.

No hace falta activar Firebase Storage ni tocar el archivo `storage.rules` — las fotos de los
médicos se guardan comprimidas directo en Firestore, así todo el proyecto queda en el plan gratuito
Spark, sin necesidad de cargar una tarjeta.

### Equipo de demostración (Clínica Aurora)

Para no arrancar con la página vacía, el Panel de Administrador tiene la tarjeta
**"Datos de demostración"** (`/admin/demo`), con tres pasos:

1. **Cargar el equipo de demostración**: crea 5 médicos **ficticios** con retratos ilustrados
   (`public/doctors/*.svg`), horarios y obras sociales de ejemplo. Se puede repetir sin duplicar.
2. **Restablecer el contenido del sitio**: deja dirección, teléfonos, horarios, fachada y redes con
   los valores de ejemplo de Clínica Aurora.
3. **Borrar los médicos anteriores**: elimina cualquier médico que no sea del equipo de demostración.

| Médico (ficticio)       | Especialidad                         |
|-------------------------|--------------------------------------|
| Dra. Lucía Ferrero      | Anatomía Patológica y Citología      |
| Dr. Martín Quiroga      | Neurología                           |
| Dr. Esteban Ríos        | Cardiología (ecocardiografía)        |
| Dra. Valeria Domínguez  | Clínica Médica y Diabetología        |
| Dra. Paula Benítez      | Laboratorio de Análisis Clínicos     |

Los datos de contacto de ejemplo (WhatsApp `5492610000000`, teléfono `(0261) 400-0000`) son de
relleno: cargá los reales desde **Configuración** y **Contenido del sitio**.

Si alguno de los médicos tiene que tener acceso al sistema (usuario/contraseña para ver su agenda),
andá a "Médicos y Secretarias" y elegilo en el desplegable "Médico vinculado".
## Sistema de turnero (pedir turno, seña por QR/alias, agenda)

Ya está armado el flujo completo para que el paciente saque su turno desde la web:

1. El paciente entra a **"Pedir turno"** (desde el botón de la portada, o tocando directamente a
   un médico en "Especialidades") y llega a `/turno`.
2. Elige el médico, un día (según los horarios que ese médico tenga cargados) y un horario libre.
3. Completa sus datos (nombre, teléfono, DNI opcional, motivo opcional).
4. Si el médico tiene QR y alias cargados, se los muestra ahí mismo para que transfiera la seña
   (con un check opcional "ya transferí"), más un botón verde **"📎 Enviar comprobante por
   WhatsApp"** que le abre WhatsApp (la app en el celular, o WhatsApp Web si está desde la compu)
   con el chat del centro ya armado, listo para adjuntar la foto o captura del comprobante y
   enviarla — al número configurado en "Configuración".
5. Al confirmar, el turno queda guardado, y se le abre un link de WhatsApp con el resumen ya
   escrito para que lo envíe al número del centro y quede confirmado del lado de ustedes.

**Importante: antes de que un médico reciba turnos, hay que cargarle sus horarios.** Por diseño,
si un médico no tiene ningún horario cargado, el sistema NO le muestra días para elegir — en vez
de eso, le ofrece al paciente escribir directo por WhatsApp para coordinar a mano.

### Ficha médico (antes "Editar médico"): datos, alias, QR, horarios y estadísticas

Desde el Panel de Administrador → **"Médicos"** → botón **"Ficha médico"** en cualquiera de la
lista (no está en el formulario de alta, para no hacerlo gigante — se completa después de crear
el médico). Además de editar los datos, ahora esta pantalla muestra arriba de todo un mini panel
de actividad: dos tarjetas con color ("Turnos esta semana" y "Total del mes") y un gráfico de
barras simple con los turnos cargados día por día de la semana actual (lunes a domingo) — todo
calculado en el momento a partir de los turnos ya guardados de ese médico, sin nada que configurar.
Los turnos cancelados no se cuentan.

- **Alias y QR**: se muestran al paciente al pedir el turno con ese médico. Se pueden cambiar
  cuando quieran, no hay límite de veces.
- **Valor de la seña**: campo de texto libre y opcional (ej. `$5.000`), separado del "Valor de la
  consulta". Si se carga, aparece junto al alias/QR en el paso 4 de `/turno`, para que el paciente
  sepa cuánto tiene que transferir de seña (que puede ser menos que el valor total de la
  consulta).
- **Horarios de atención**: franjas semanales recurrentes (ej. "Lunes de 9 a 13"), se pueden
  cargar varias por día (para separar mañana/tarde, por ejemplo). Se define también la duración
  de cada turno en minutos (15/20/30/45/60), que es lo que usa el sistema para calcular los
  horarios exactos disponibles dentro de cada franja.
- Ahí mismo también se puede editar el resto de los datos del médico (nombre, especialidad,
  matrícula, foto, servicios, etc.) sin tener que borrarlo y crearlo de nuevo.
- **Valor de la consulta**: campo de texto libre (ej. `$15.000`, o "A confirmar") — se puede
  cargar tanto al crear el médico como después desde "Editar". Es opcional: si se deja vacío, no
  se muestra nada. Cuando está cargado, el paciente lo ve en la grilla de médicos del paso 1 de
  `/turno` y de nuevo, más grande, en el paso 4 ("Tus datos") antes de confirmar el turno — así
  sabe cuánto va a costar la consulta antes de reservar (además, y por separado, de la seña por
  QR/alias si el médico también la tiene configurada).

### Número de WhatsApp del centro

Panel de Administrador → **"Configuración"** (`/admin/configuracion`): ahí se cambia el número de
WhatsApp que reciben las confirmaciones de turno y que se usa en toda la página (antes estaba fijo
en el código). Se carga con código de país y área, todo junto y sin espacios (ej. `5492610000000`).

### Gestión de turnos (Secretaria) y agenda (Médico)

- **Panel de Secretaría** (`/secretaria`): arriba de todo, antes de la lista y sin tener que
  scrollear, hay una **"Agenda simplificada"**: se elige un médico y un día (hoy por defecto), y
  se ven todos los horarios de ese día como una fila de "chips" — en color turquesa los libres, en
  rojo y tachados los ocupados — más un resumen tipo "6 libres de 12". Así la secretaria ve de un
  vistazo qué le queda disponible a un médico sin tener que revisar toda la lista de turnos.
  Debajo, ve los turnos de todos los médicos, con filtro por médico y por fecha. Puede
  confirmar un turno pendiente, o cancelarlo — al cancelar, se abre
  automáticamente WhatsApp con un mensaje de aviso ya armado dirigido al teléfono que cargó el
  paciente, para que la secretaria lo revise y lo envíe (esto resuelve el aviso por WhatsApp al
  modificar/cancelar un turno, sin usar ninguna API). También puede **cargar un turno a mano**
  ("+ Nuevo turno") para cualquier médico — por ejemplo uno coordinado por teléfono.
- **Panel de Médico** (`/medico`): ve su propia agenda y también puede **cargar un turno nuevo**
  para sí mismo ("+ Nuevo turno"). Lo que sigue sin poder hacer es confirmar o cancelar un turno
  ya existente — eso lo hace la Secretaria.
- **Sobreturnos**: al cargar un turno a mano (Secretaria o Médico), si el horario elegido ya está
  ocupado o cae fuera de la agenda habitual del médico, el sistema lo detecta como sobreturno —
  queda marcado con la etiqueta "Sobreturno" en la lista. El paciente, en cambio, desde `/turno`
  solo puede elegir entre horarios realmente libres (no puede generar sobreturnos).
  - Un turno normal y un sobreturno son cosas distintas: el sobreturno **siempre necesita
    autorización previa del médico**. Cuando lo carga **Secretaria**, el formulario muestra un
    aviso y obliga a tildar un checkbox ("Ya lo consulté con el médico y confirmó el sobreturno")
    antes de dejar guardar — no se puede cargar sin haberlo hablado antes con el médico.
  - Cuando lo carga el **propio Médico** para sí mismo, alcanza con una confirmación simple (ya que
    se está autorizando a sí mismo), sin el checkbox de consulta previa.

### Agenda con colores en `/turno` (paso "Fecha" y "Horario")

Para que el paciente vea de un vistazo qué días y horarios están ocupados (no solo que
desaparezcan de la lista): en el paso 2 ("Elegí el día") cada fecha se marca en rojo con la
etiqueta "Completo" y queda deshabilitada si ya no le queda ningún horario libre ese día; en el
paso 3 ("Elegí el horario") se muestran TODOS los horarios de la franja del médico, no solo los
libres — los ocupados aparecen en rojo, tachados de poder tocarlos ("Ocupado"), y los libres en
el color normal, clickeables. Arriba de cada grilla hay una referencia de colores. Esto no cambia
ninguna regla de negocio (el paciente sigue sin poder reservar un horario ocupado), solo hace más
clara la disponibilidad real de un vistazo.

### Historial de pacientes ("ficha médica") y limpieza automática de turnos viejos

Para no ir juntando en `/secretaria` y `/medico` una lista cada vez más larga con turnos ya
cancelados o de fechas pasadas, el sistema ahora los archiva solo:

- Cada vez que se abre el **Panel de Secretaría** o el **Panel de Médico**, antes de mostrar la
  lista de turnos, el sistema revisa si hay turnos con fecha anterior a hoy (sin importar el
  médico) y los mueve automáticamente: el turno desaparece de la lista de turnos activos y pasa a
  quedar guardado en la **ficha del paciente** correspondiente (agrupado por DNI, o por teléfono
  si no cargó DNI). Esto aplica tanto a los que ya se atendieron como a los cancelados
  (por ejemplo por falta de pago de la seña) — ambos se archivan igual, solo que quedan marcados
  con su estado ("Atendido" o "Cancelado").
- **Importante — no es un proceso que corra solo a las 00hs**: como el proyecto no usa Cloud
  Functions (para no depender del plan pago de Firebase), no hay nada corriendo en un servidor a
  medianoche. En cambio, la limpieza se dispara sola la primera vez que alguien de Secretaría o el
  Médico abre su panel después de que un turno ya pasó de fecha — en la práctica, con el uso diario
  normal, esto pasa prácticamente enseguida (apenas empieza el día siguiente y alguien entra al
  sistema).
- **Panel de Médico** (`/medico`): abajo de la agenda hay un botón **"Ver historial de
  pacientes"** que despliega la ficha — la lista de sus pacientes, y al tocar uno se ve el
  historial de visitas pasadas de esa persona (fecha, hora, si fue atendido o cancelado, si fue
  sobreturno, motivo). Esta es la única pantalla donde queda ese registro clínico una vez que el
  turno se archiva — por eso lo ve el médico, no la secretaria.
- Los turnos vigentes (de hoy en adelante) siguen viéndose normalmente en ambos paneles; solo se
  archiva lo que ya quedó en el pasado.

### Historia clínica real, pegada a cada turno del médico (sin tener que buscar al paciente)

Además del historial general de arriba, cada turno de la lista de `/medico` tiene ahora su propia
**"Historia clínica"** pegada abajo, lista para abrir en el momento — el médico no tiene que ir a
buscar al paciente en ningún lado: termina con uno, entra el siguiente, y su ficha ya está ahí. Se
arma con tres partes:

- **Ficha del paciente** (arriba de todo): una ficha única que el médico carga y va actualizando
  con el tiempo (botón "Cargar" o "Editar") — no es un historial por consulta, es UNA ficha que se
  sobreescribe, como los datos de fondo del paciente. Tiene dos partes:
  - **Datos personales y cobertura**: fecha de nacimiento, edad, sexo, ocupación, domicilio,
    teléfono de contacto, y cobertura de salud (obra social, prepaga o atención pública — con
    campo para el nombre de la obra social/prepaga).
  - **Antecedentes clínicos**: antecedentes, alergias, medicación habitual (lo que ya había).
- **Última consulta**: se muestra destacada, con fecha, para que el médico vea de un vistazo qué
  se hizo la vez anterior sin tener que desplegar todo el historial.
- **Consultas anteriores**: el resto del historial, más abajo, con la misma información de cada
  visita pasada.
- **"Registrar esta consulta"**: al final, un formulario para cargar la consulta de hoy —
  diagnóstico, tratamiento/medicación indicada, signos vitales (peso, altura, presión, temperatura)
  y estudios solicitados (como campo de texto: nombre y/o link), más un campo de observaciones
  libre. Al guardar, esa consulta queda fija en el historial del paciente — **no se puede editar ni
  borrar una vez guardada**; para corregir algo se carga una consulta nueva, como en cualquier
  historia clínica real.
- **Estudios (fotos)**: para cargar el resultado de un análisis que viene en papel, hay una sección
  aparte con un botón para sacarle una foto (desde el celular, abre directo la cámara) o elegir una
  imagen de la galería, más un campo para ponerle un nombre (ej. "Análisis de sangre 25/08"). Al
  tocar "Subir foto", la imagen se comprime SOLA en el navegador antes de guardarse (queda liviana
  automáticamente, sin que el médico tenga que hacer nada) y se guarda pegada a la ficha del
  paciente para siempre. Se ve como una miniatura con su nombre y fecha; tocándola se abre en
  tamaño completo, en una ventana superpuesta dentro de la misma página (no en una pestaña
  nueva — los navegadores bloquean en silencio abrir así una imagen guardada, por eso se resolvió
  mostrándola arriba de la pantalla actual, con un botón "Cerrar"). Como el sistema no usa Firebase
  Storage, la foto se guarda comprimida
  directamente en la base de datos (Firestore) — por eso la compresión es automática y obligatoria,
  para que cada foto quede bien liviana.
- Debajo de todo eso también se ve la **asistencia archivada** (atendido/cancelado, del historial
  general).
- Esto es independiente del turno puntual: como se identifica al paciente por DNI (o teléfono si
  no cargó DNI), todo queda ligado a la PERSONA, no al turno — si el mismo paciente vuelve otro día
  con otro turno, va a seguir viendo ahí todos sus antecedentes y consultas anteriores.
- Todo esto se trae una sola vez al abrir el panel (no hace un pedido a Firestore por cada turno),
  así que abrir la ficha de un paciente es instantáneo.

### Reglas de Firestore — hay que volver a publicarlas (de nuevo)

`firestore.rules` cambió otra vez: ahora la colección `turnos` permite borrar (antes no se podía
borrar ningún turno) y se sumaron cuatro colecciones nuevas: `patientVisits` (historial
automático), `clinicalNotes` (consultas que el médico carga a mano), `patientBackground` (ficha de
antecedentes) y `patientStudies` (fotos de estudios). **Hay que volver a copiar el archivo
actualizado y publicarlo** en Firestore Database → Reglas → Publicar — si no se publica, tanto el
archivado automático de turnos viejos como el guardado de consultas, antecedentes y fotos de
estudios van a fallar.

### Limitaciones a tener en cuenta por ahora

- El teléfono del paciente se usa tal cual lo escribe para armar el link de WhatsApp de aviso —
  si no lo abre en el chat correcto, se puede corregir el número a mano en WhatsApp antes de
  enviar (no hay forma 100% confiable de adivinar el formato sin una API paga).
- No hay todavía una pantalla para editar o borrar un turno ya creado (sí para confirmarlo o
  cancelarlo).
- El médico ve todos sus turnos en una sola lista (no separados por semana/mes todavía).

## Historia clínica compartida entre médicos, ficha por Secretaría y perfil propio del médico

- **Los pacientes son de Clínica Aurora, no de un médico en particular.** Antes, la ficha de antecedentes,
  las consultas y las fotos de estudios quedaban separadas por médico. Ahora es al revés: si un
  paciente pide turno con el cardiólogo y después con el clínico, los dos ven LA MISMA ficha y el
  mismo historial de consultas — no hace falta cargar los antecedentes dos veces.
- **Buscar por DNI**: tanto en el panel del Médico como en el de Secretaría hay un botón
  "Ver historial de pacientes" que ahora es general (todos los médicos, no solo el propio) y trae
  un buscador por DNI, nombre o teléfono. Al abrir un paciente se ve su ficha (editable ahí mismo),
  sus consultas (con qué médico fue cada una), sus fotos de estudios y su asistencia.
- **Secretaría puede completar la ficha del paciente** (datos personales, cobertura, antecedentes,
  alergias, medicación habitual) desde cada turno de su lista, con un botón "📋 Ficha del
  paciente" — para tenerla lista antes de que el paciente entre al consultorio y ahorrar tiempo en
  la consulta. Secretaría NO carga diagnóstico/tratamiento ni fotos de estudios — eso sigue siendo
  solo del médico, durante la consulta.
- **Cada médico puede editar sus propios datos profesionales** desde un link "Mis datos
  profesionales" en su panel (`/medico/perfil`): nombre, matrícula, especialidad, servicios, nota,
  mensaje de WhatsApp, valor de consulta, alias y monto de la seña, QR y horarios de atención.
  La ÚNICA excepción es la foto de perfil: la sigue cargando y actualizando el administrador, para
  que quede coordinada con el resto de la web (landing, "Especialidades", etc.).

### Reglas de Firestore — hay que volver a publicarlas (de nuevo)

`firestore.rules` cambió otra vez: la colección `doctors` ahora permite que, además del admin, cada
médico actualice SU PROPIO documento (necesario para que "Mis datos profesionales" funcione) — el
admin sigue siendo el único que puede crear o borrar médicos. **Hay que volver a copiar el archivo
actualizado y publicarlo** en Firestore Database → Reglas → Publicar, si no médicos van a recibir
un error de permisos al intentar guardar sus propios datos.
