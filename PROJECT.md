# Fafi — App de FIFA entre amigos

## La idea

Somos amigos que nos juntamos a jugar FIFA. Necesitábamos algo simple para organizar el día: armar equipos, crear partidos, llevar un torneo y ver quién gana. Nada elaborado, solo una app que resuelva lo que antes hacíamos a mano o le pedíamos a una ia por chat.

---

## Usuarios

Amigos con cuenta propia (Google OAuth). Todos tienen los mismos permisos — cualquiera puede crear una sesión, armar equipos o cargar resultados. No hay admin.

### Tipos de jugador

- **Usuario registrado** — entra con Google OAuth.
- **Jugador gestionado (managed)** — un perfil liviano (nombre + avatar) que cualquier usuario registrado puede crear para un amigo que todavía no se logueó. Persiste entre sesiones, acumula stats, y puede ser "reclamado" más adelante cuando esa persona entre con Google (se vincula su `userId` al perfil existente, conservando todo el historial).

Internamente ambos viven en una sola tabla `players`. El `userId` es opcional: presente para registrados, vacío para gestionados.

### Acceso

Por ahora el login con Google está abierto a cualquier cuenta. No hay whitelist (queda como posible mejora futura si la URL se filtra).

---

## Conceptos del dominio

### Sesión (Jornada)

La unidad del día. Alguien abre la app, crea una sesión y elige quiénes están presentes. Desde ahí se organiza todo lo del día.

- Un usuario la crea y define los participantes presentes.
- **Solo puede haber una sesión activa a la vez en toda la app** (alcance global — la app está pensada para un grupo de amigos).
- Estados: `active` → `finished`. **`finished` es terminal**: una vez cerrada, no se reabre. La pantalla de cierre pide confirmación.
- **La lista de participantes se bloquea al crear la sesión.** No se agregan ni se sacan jugadores después. Si llega alguien tarde y no estaba en la lista, no juega esa jornada (o se cierra y se abre una nueva).
- Al cerrarla queda guardada en el historial.

### Equipos

Se arman dentro de la sesión según cómo quieran jugar ese día:

- **2v2** — 2 jugadores por equipo.
- **1v1** — 1 jugador por equipo.

Los equipos son para esa jornada. Reglas:

- En **partidos sueltos** los equipos se rearman libremente entre partidos.
- En un **torneo con equipos fijos** los equipos se definen al crear el torneo y se mantienen estables durante todo el torneo (necesario para que la tabla / bracket tenga sentido).
- Un torneo puede ser también **mixed teams** (equipos rotativos): los jugadores se mezclan en cada partido y los puntos se acumulan por jugador individual, no por equipo. Esta opción solo está disponible en torneos de **liga** (no en eliminación directa — ver torneos abajo).

Se pueden armar manualmente o con un sorteo aleatorio (con restricciones de equidad — ver rotación).

### Partidos

Dos equipos se enfrentan. Pueden ser:

- **Partidos sueltos** — fuera de un torneo, solo por diversión.
- **Dentro de un torneo** — forman parte del fixture generado.

Reglas de partido:

- **Sin empates.** Todo partido tiene un ganador. Si el resultado en juego fue empate, se resuelve en cancha (alargue / penales en FIFA) y se carga el ganador final.
- **Se carga el resultado completo (score), no solo el ganador.** Ej: 3–1. Esto habilita desempate por diferencia de gol en liga y stats de goles a favor / en contra.
- **Edición de resultado:** solo lo puede editar la persona que cargó el resultado o el creador de la sesión. Cada edición queda en un audit trail (quién, cuándo).
- **No se borran partidos.** Si se cargó algo que no debería estar, se edita con una anotación clara.

### Rotación

Cuando los jugadores presentes no entran todos en cancha al mismo tiempo (típicamente 6+ en 2v2), hay equipos esperando. La rotación es **aleatoria con restricciones de equidad**:

- Nadie descansa dos partidos seguidos.
- No se repite la misma pareja de compañeros en dos partidos consecutivos.

(No usamos la regla clásica "ganador queda" — es todo random con esas dos restricciones.)

Cuando la cantidad de jugadores no permite armar equipos parejos (ej. 5 jugadores en 2v2), la app sugiere usar un torneo en modo **mixed teams** para que todos jueguen rotando.

### Torneo

Se decide y crea el mismo día. Vive dentro de una sesión. **Una sesión puede tener un solo torneo activo a la vez**, y los partidos sueltos pueden seguir jugándose en paralelo al torneo (no son excluyentes).

Dos formatos:

- **Liga** — todos contra todos. Soporta equipos fijos o mixed teams.
  - Tabla de posiciones ordenada por: victorias → diferencia de gol → goles a favor.
  - En mixed teams, la tabla es por jugador individual (cada jugador del lado ganador suma +1 victoria).
- **Eliminación directa** — bracket. **Solo equipos fijos** (mixed teams no aplica conceptualmente).
  - Sembrado aleatorio.
  - **Solo se aceptan cantidades potencia de 2** (2, 4, 8 equipos). Con cantidades distintas la app sugiere armar una liga en su lugar.

Estados de torneo: `active` → `finished` o `cancelled`. Los resultados actualizan la tabla / bracket en tiempo real.

---

## Funcionalidades

### Sesión
- Crear sesión seleccionando participantes (registrados + gestionados).
- Ver sesión activa con estado actual.
- Cerrar sesión al terminar (con confirmación).

### Equipos
- Armar equipos manualmente.
- Sorteo aleatorio con restricciones de equidad.
- (Futuro: sugerencias balanceadas por skill — ver "Fuera de alcance v1".)

### Partidos
- Crear partido entre dos equipos.
- Cargar resultado con score (ej: 3–1).
- Editar resultado (con audit trail) — restringido al autor o al creador de la sesión.
- Ver quién juega y quién espera (rotación).

### Torneo
- Crear torneo liga o eliminatoria.
- Elegir equipos fijos o mixed teams (solo liga).
- Fixture generado automáticamente.
- Tabla de posiciones (liga) o bracket (eliminatoria) en tiempo real.

### Historial
- Ver todas las sesiones pasadas con sus partidos y resultados (solo lectura).

### Estadísticas por jugador

Todas las stats agregan **todos los partidos** (sueltos + de torneo) salvo "torneos ganados" que se cuenta aparte.

- Partidos jugados, ganados y perdidos.
- Porcentaje de victorias.
- Goles a favor / en contra (derivado de scores).
- Racha actual y mejor racha.
- Mejor compañero (con quién ganás más).
- Rival más difícil (contra quién perdés más).
- Torneos ganados (contador separado, se incrementa al finalizar un torneo).

---

## Pantallas (aproximado)

| Pantalla | Descripción |
|---|---|
| Home | Sesión activa si hay una, o botón para crear |
| Crear sesión | Seleccionar participantes del día (registrados + gestionados) |
| Sesión activa | Equipos, partidos, torneo en curso |
| Crear equipos | Manual o sorteo |
| Partido | Detalle y carga / edición de resultado |
| Torneo | Tabla o bracket en tiempo real |
| Historial | Lista de sesiones pasadas |
| Sesión pasada | Detalle de una jornada terminada |
| Estadísticas | Stats globales por jugador |
| Perfil | Datos del usuario y sus stats |

---

## Stack técnico

- **TanStack Start** — framework SSR, React 19, file-based routing.
- **Convex** — base de datos, server functions, tiempo real.
- **Better Auth** — autenticación con Google OAuth.
- **shadcn/ui** — componentes (estilo `radix-nova`, color `mist`).
- **Tailwind CSS v4** — estilos.

---

## Fuera de alcance v1

- **IA (Gemini) para sugerir equipos / fixtures.** El sorteo v1 es random con restricciones de equidad, sin LLM. La puerta queda abierta para sumar sugerencias balanceadas por skill más adelante (puede ser heurística simple sobre win % antes que un LLM).
- **Whitelist de emails.** Por ahora cualquier cuenta de Google puede entrar. Si la URL se filtra se agrega una whitelist por env.
- **Multi-grupo / multi-tenant.** La app es para un único grupo de amigos. No hay concepto de "Group" — un solo `active session` global.
- **Reabrir sesiones cerradas.** `finished` es terminal.
- **Borrar partidos.** Solo editar.

---

## Decisiones pendientes

- Definición exacta del algoritmo de matchmaking con restricciones (qué hacer cuando las restricciones no se pueden cumplir todas a la vez).
- Detalles de UX del flujo de "reclamar perfil gestionado" cuando un jugador se loguea por primera vez.
- Mínimo de muestras para que "mejor compañero" / "rival más difícil" sean significativos (¿esconder el dato si hay menos de N partidos juntos?).
