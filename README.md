# Fafi

<p align="center">
  <strong>Organizá tu jornada de FIFA entre amigos sin dramas.</strong>
</p>

<p align="center">
  <a href="#qu%C3%A9-es-fafi">Qué es</a> •
  <a href="#caracter%C3%ADsticas">Características</a> •
  <a href="#stack-t%C3%A9cnico">Stack</a> •
  <a href="#estado-del-proyecto">Estado</a>
</p>

---

## Qué es Fafi

Fafi es una app web para grupos de amigos que se juntan a jugar FIFA. Te permite organizar la jornada del día: crear una sesión, armar equipos, cargar resultados, correr torneos y llevar estadísticas de quién le gana a quién.

Nada de planillas, nada de discutir quién juega con quién. La app sortea los equipos con reglas de equidad, rota automáticamente cuando sobran jugadores, y mantiene un historial completo de todas las jornadas.

---

## Características

### Jornadas (Sesiones)
- Creá una jornada seleccionando quiénes están presentes.
- Cerrá la jornada cuando terminen. Queda guardada en el historial de forma inmutable.

### Jugadores
- **Registrados:** entrán con Google OAuth.
- **Gestionados:** perfiles livianos (nombre + avatar) que cualquiera puede crear para un amigo que todavía no se logueó. Acumulan stats y pueden ser reclamados más adelante.

### Equipos y Partidos
- Armá equipos manualmente o dejá que la app los sortee.
- Cargá resultados con score completo (ej: 3–1). Sin empates: siempre hay un ganador.

### Rotación Inteligente
Cuando son más de 4 jugadores en modo 2v2, la app sugiere quién juega el próximo partido respetando dos reglas:
- Nadie descansa dos partidos seguidos.
- No se repite la misma pareja de compañeros en partidos consecutivos.

### Torneos
- **Liga:** todos contra todos. Soporta equipos fijos o mixed teams (equipos rotativos, puntos por jugador individual).
- **Eliminación directa:** bracket con sembrado aleatorio. Solo equipos fijos y cantidades potencia de 2.
- Los partidos sueltos siguen funcionando en paralelo al torneo.

### Estadísticas
- Partidos jugados, ganados y perdidos.
- Porcentaje de victorias, goles a favor/en contra.
- Racha actual y mejor racha.
- Mejor compañero y rival más difícil.
- Torneos ganados.

### Historial
- Accedé a cualquier jornada pasada con todos sus partidos, resultados y ganadores de torneos.

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) — React 19, SSR, file-based routing |
| Backend / DB | [Convex](https://convex.dev) — funciones serverless en tiempo real |
| Auth | [Better Auth](https://www.better-auth.com) — Google OAuth |
| UI | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |

---

## Estado del Proyecto

El desarrollo sigue un plan incremental por fases. Cada fase es funcional de punta a punta.

| Fase | Estado | Descripción |
|------|--------|-------------|
| 0 — Infra base | ✅ | App levantada, login con Google, backend conectado |
| 1 — Players | ✅ | Tabla unificada de jugadores, perfiles gestionados |
| 2 — Sesiones | ✅ | Crear y cerrar jornadas con participantes bloqueados |
| 3 — Partidos sueltos | ✅ | Cargar resultados con score, edición con audit trail |
| 4 — Rotación | ✅ | Matchmaking aleatorio con restricciones de equidad |
| 5 — Estadísticas | 🔄 | Stats por jugador (en progreso) |
| 6 — Historial | ⏳ | Ver sesiones pasadas en solo lectura |
| 7 — Torneo Liga | ⏳ | Liga con equipos fijos y tabla de posiciones |
| 8 — Torneo Bracket | ⏳ | Eliminación directa con bracket visual |
| 9 — Mixed Teams + Claim | ⏳ | Liga con equipos rotativos y reclamo de perfiles gestionados |
| 10 — Polish | ⏳ | Whitelist, avatares, PWA, animaciones |

> **MVP usable:** las fases 0–5 cubren el flujo más común: juntarse, crear una jornada, jugar partidos sueltos con rotación, y ver estadísticas.

---

## Estructura del Proyecto

```
├── convex/                 # Backend Convex (schema, mutations, queries)
│   ├── schema.ts           # Definición de tablas
│   ├── sessions.ts         # Lógica de jornadas
│   ├── matches.ts          # Lógica de partidos
│   ├── players.ts          # Gestión de jugadores
│   └── auth.ts             # Configuración de Better Auth
├── src/
│   ├── routes/             # Rutas de TanStack Router
│   │   ├── index.tsx       # Home (sesión activa o crear nueva)
│   │   ├── sessions.new.tsx
│   │   ├── matches.new.tsx
│   │   └── players.tsx
│   ├── components/         # Componentes de React (shadcn/ui + custom)
│   ├── lib/                # Utilidades, auth client, matchmaking
│   └── hooks/              # Custom hooks
├── public/                 # Assets estáticos
└── package.json
```

---


## Roadmap Futuro

- Whitelist opcional por email.
- Sugerencias de equipos balanceadas por skill (heurística simple basada en win %).
- Soporte para PWA / instalación mobile.
- Avatares custom para jugadores gestionados.
- Integración con IA (Gemini) para sugerencias avanzadas de equipos y fixtures.

---

<p align="center">
  Hecho con ⚽ para juntadas de FIFA.
</p>
