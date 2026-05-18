# Fafi — Fases de implementación

Plan incremental basado en PROJECT.md. Cada fase es **shippable**: al terminarla, la app hace algo útil de punta a punta. El orden respeta las dependencias técnicas (auth antes que sesiones, sesiones antes que partidos, partidos antes que stats) y prioriza primero el flujo más usado (jornada con partidos sueltos) sobre lo más complejo (torneos, mixed teams).

---

## Fase 0 — Infra base

**Objetivo:** la app levanta, hay login con Google, hay backend conectado.

- Convex inicializado (`npx convex dev` corriendo), `convex/schema.ts` vacío commiteado.
- Better Auth configurado con adaptador Convex.
  - `src/lib/auth.ts` (server config).
  - `src/lib/auth-client.ts` (browser client).
  - `src/routes/api/auth/$.ts` (handler).
  - Provider Google OAuth (credenciales en env).
- Tablas de Better Auth (`users`, `sessions`, `accounts`) declaradas en el schema de Convex.
- Página `/` muestra "Hola {nombre}" si hay sesión, botón "Entrar con Google" si no.
- Layout base en `__root.tsx` con header (logo + usuario + logout).

**Criterio de done:** un amigo entra con Google y ve su nombre en pantalla.

---

## Fase 1 — Players (registrados + gestionados)

**Objetivo:** existe la tabla unificada de jugadores y se pueden crear perfiles gestionados.

- Tabla `players` en `convex/schema.ts`:
  - `userId: optional(id("users"))` — vacío para gestionados.
  - `name`, `avatarUrl` (opcional), `createdAt`.
- Hook: al loguearse un usuario nuevo, se crea su row en `players` (vinculada a `userId`).
- Pantalla "Jugadores": lista de todos los `players`, botón "Agregar jugador gestionado" (form con nombre y opcionalmente avatar).
- (Diferido a Fase 9) Flujo de "reclamar perfil gestionado" cuando un gestionado se loguea por primera vez.

**Criterio de done:** se puede crear un perfil gestionado y aparece en la lista junto a los usuarios registrados.

---

## Fase 2 — Sesión

**Objetivo:** se crea y se cierra una jornada, con participantes bloqueados.

- Tabla `sessions`: `status` (`active` | `finished`), `createdBy`, `createdAt`, `finishedAt`.
- Tabla `sessionParticipants`: `sessionId`, `playerId` (unique por session).
- Constraint: solo un `sessions` puede tener `status = active` a la vez (validación en mutation).
- Pantalla "Crear sesión": selector multi-pick de `players`, botón "Iniciar jornada".
- Home: si hay sesión activa, muestra la pantalla de sesión activa (vacía por ahora salvo participantes). Si no, muestra botón "Crear sesión".
- Botón "Cerrar sesión" con confirmación modal. Lleva a estado `finished`, vuelve al home.

**Criterio de done:** se crea una jornada con 4-6 amigos, se cierra, queda en historial básico.

---

## Fase 3 — Partidos sueltos con score

**Objetivo:** dentro de una sesión activa se cargan partidos casuales con resultado.

- Tabla `matches`:
  - `sessionId`, `tournamentId: optional`, `createdBy`, `createdAt`.
  - `teamA: { players: id("players")[] }`, `teamB: { players: id("players")[] }`.
  - `scoreA`, `scoreB`, `winner: "A" | "B"` (derivado pero guardado para queries simples).
- Tabla `matchEdits` (audit trail): `matchId`, `editedBy`, `editedAt`, `before`, `after`.
- UI "Nuevo partido suelto" dentro de sesión activa: dos columnas, drag/click para asignar jugadores a equipo A o B, dos inputs de score, validación de score (sin empates → forzar ganador).
- Edición restringida al autor o al `createdBy` de la sesión.
- Lista de partidos del día visible en la pantalla de sesión activa.

**Criterio de done:** se juegan 3 partidos sueltos, se cargan resultados, se corrige un typo, se ve el audit trail.

---

## Fase 4 — Rotación (random con equidad)

**Objetivo:** la app sugiere quién juega el próximo partido cuando hay equipos esperando.

- Algoritmo de matchmaking:
  - Input: lista de jugadores presentes, modo (2v2 o 1v1), historial reciente de partidos en la sesión.
  - Output: dos equipos sugeridos + cola de espera.
  - Restricciones de equidad: nadie descansa dos partidos seguidos; sin pareja repetida en partidos consecutivos.
  - Si las restricciones no se pueden cumplir simultáneamente, se relaja primero la regla de pareja repetida (documentado en código).
- UI "Próximo partido": muestra los dos equipos sugeridos + los que esperan. Botones "Confirmar y empezar" / "Volver a sortear".
- Cuando el conteo es impar para 2v2, la UI sugiere crear un torneo mixed teams (link al flujo de Fase 7) — esto se puede stubear acá y conectar realmente en Fase 7.

**Criterio de done:** con 6 amigos en 2v2, la app rota correctamente durante 8+ partidos sin repetir injustamente.

---

## Fase 5 — Estadísticas básicas

**Objetivo:** después de una jornada se ven stats por jugador.

- Queries Convex que agregan sobre `matches`:
  - Partidos jugados / ganados / perdidos.
  - Win %.
  - Goles a favor / en contra.
  - Racha actual y mejor racha.
  - Mejor compañero (con quién ganó más).
  - Rival más difícil (contra quién perdió más).
- Pantalla "Estadísticas": ranking global por jugador.
- Pantalla "Perfil": stats del usuario logueado.
- (Decisión pendiente del project) — definir si "mejor compañero" / "rival" se esconden cuando hay menos de N partidos juntos. Por ahora mostrar siempre con un badge "muestra chica" si es <5.

**Criterio de done:** después de varias jornadas, los rankings se ven y los números cuadran con cuentas manuales.

---

## Fase 6 — Historial

**Objetivo:** se ven sesiones pasadas con todos sus partidos.

- Pantalla "Historial": lista de sesiones `finished` con fecha y conteo de partidos.
- Pantalla "Sesión pasada": detalle de una jornada (participantes, partidos, resultados, ganadores de torneos si los hubo).
- Solo lectura — no se editan resultados de sesiones pasadas (a re-discutir: la regla de Q7 del project no aclara si edits funcionan después de `finished`).

**Criterio de done:** abrir una sesión vieja y ver todo lo que pasó.

---

## Fase 7 — Torneo Liga (equipos fijos)

**Objetivo:** dentro de una sesión activa se corre una liga.

- Tabla `tournaments`:
  - `sessionId`, `format: "liga" | "bracket"`, `teamMode: "fixed" | "mixed"`.
  - `status: "active" | "finished" | "cancelled"`.
  - `createdBy`, `createdAt`, `finishedAt`.
- Tabla `tournamentTeams` (solo para `fixed`): `tournamentId`, `name`, `players: id("players")[]`.
- Flujo "Crear torneo":
  - Elegir formato (liga) + teamMode (fixed).
  - Armar equipos (manual o sorteo).
  - Generar fixture (round robin) — todos los partidos creados con `tournamentId` seteado pero sin score.
- Pantalla de torneo: tabla de posiciones ordenada por victorias → dif. gol → goles a favor; lista de partidos pendientes y jugados.
- Cargar resultado de un partido del fixture actualiza la tabla en tiempo real (gratis con Convex subs).
- Constraint: solo un `tournaments` por sesión con `status = active`.
- Al cerrarse (todos los partidos cargados) → `status = finished`. Incrementa `torneos ganados` para los jugadores del equipo campeón.
- Coexistencia: los partidos sueltos siguen funcionando en paralelo (`tournamentId = null`).

**Criterio de done:** se corre una liga de 4 equipos fijos, se cargan todos los resultados, el campeón queda con el contador "torneos ganados +1".

---

## Fase 8 — Torneo Eliminación directa (bracket)

**Objetivo:** se corre un bracket.

- Reusa `tournaments` con `format: "bracket"`, `teamMode: "fixed"` (mixed no permitido — UI lo deshabilita).
- Validación: cantidad de equipos debe ser potencia de 2 (2, 4, 8). Si no, mostrar "Pasá a liga".
- Sembrado aleatorio.
- Tabla `bracketMatches` o flag en `matches` para ubicar al partido en el árbol (`round`, `bracketSlot`).
- UI bracket: árbol visual (componente custom o lib). Cada match clickeable para cargar score.
- Cargar score avanza al ganador a la siguiente ronda automáticamente.
- Final → `tournaments.status = finished`, incrementa "torneos ganados" para los del equipo campeón.

**Criterio de done:** se corre un bracket de 4 equipos, el ganador se ve en el árbol y suma al contador.

---

## Fase 9 — Mixed teams liga + reclamo de perfiles

**Objetivo:** torneos liga con equipos rotativos y flujo de claim.

- En "Crear torneo": si format=liga y teamMode=mixed, no se arman equipos al principio. Se genera un fixture donde cada partido define sus equipos al momento de jugarse (usando matchmaking de Fase 4 con un peso extra: distribuir equitativamente con quién jugó cada uno).
- Standings en mixed: por **jugador individual**. Cada jugador del lado ganador suma +1 victoria. Orden: victorias → dif. gol → goles a favor.
- "Reclamar perfil gestionado": cuando alguien se loguea con Google por primera vez y existe un `players` con `userId = null` y nombre parecido (o coincidencia manual), se le ofrece reclamarlo. Vincula `userId` al row existente — el historial se conserva.

**Criterio de done:** se corre una liga mixed con 5 jugadores donde todos juegan, el ranking individual queda coherente. Y un amigo gestionado se loguea, reclama su perfil, y sus stats se conservan.

---

## Fase 10 — Polish

**Objetivo:** detalles que no son críticos pero hacen al producto.

- Whitelist de emails opcional (env var). Si se setea, solo esos emails pueden loguearse.
- Avatares custom para players gestionados (upload o iniciales generadas).
- PWA / mobile install.
- Animaciones del sorteo (UX más festiva).
- (Si hay demanda) sugerencias balanceadas por skill — heurística simple basada en win %, sin LLM. Si se valida la utilidad, recién ahí evaluar Gemini.

---

## Notas sobre el orden

- Las fases 0–5 son el **MVP usable**: jornada con partidos sueltos, rotación, stats. Una persona puede empezar a usar la app después de Fase 5 sin torneos.
- Las fases 6–8 amplían sin tocar lo de abajo: historial es solo-lectura sobre datos existentes, torneos agregan estructura encima de `matches`.
- Mixed teams (Fase 9) se posterga porque depende del matchmaking de Fase 4 ya estabilizado y del flujo de torneos de Fase 7 funcionando.
- Si en algún momento se valida que los gestionados generan fricción al loguearse, **Fase 9 sube de prioridad** (puede saltarse antes que mixed teams si hace falta).
