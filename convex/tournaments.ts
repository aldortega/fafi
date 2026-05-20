import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { authComponent } from "./auth"
import type { Doc, Id } from "./_generated/dataModel"

async function requireCurrentPlayer(
  ctx: MutationCtx | QueryCtx,
): Promise<Doc<"players">> {
  const user = await authComponent.safeGetAuthUser(ctx)
  if (!user) throw new Error("No autenticado")
  const player = await ctx.db
    .query("players")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique()
  if (!player) throw new Error("No tenés perfil de jugador")
  return player
}

function generateRoundRobin(
  teamIds: Array<Id<"tournamentTeams">>,
): Array<{ round: number; position: number; teamAId: Id<"tournamentTeams">; teamBId: Id<"tournamentTeams"> }> {
  // Circle method (Berger tables). Adds a bye if odd.
  const teams: Array<Id<"tournamentTeams"> | null> = [...teamIds]
  if (teams.length % 2 === 1) teams.push(null)
  const n = teams.length
  const rounds = n - 1
  const half = n / 2

  const out: Array<{
    round: number
    position: number
    teamAId: Id<"tournamentTeams">
    teamBId: Id<"tournamentTeams">
  }> = []

  let rotating = teams.slice(1)
  for (let r = 0; r < rounds; r++) {
    const lineup = [teams[0], ...rotating]
    let position = 0
    for (let i = 0; i < half; i++) {
      const a = lineup[i]
      const b = lineup[n - 1 - i]
      if (a && b) {
        // Alternate home/away to even out
        if ((r + i) % 2 === 0) {
          out.push({ round: r + 1, position: position++, teamAId: a, teamBId: b })
        } else {
          out.push({ round: r + 1, position: position++, teamAId: b, teamBId: a })
        }
      }
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }
  return out
}

export const getActiveBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tournaments")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "active"),
      )
      .unique()
  },
})

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tournaments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect()
    return rows
  },
})

type StandingsRow = {
  team: Doc<"tournamentTeams">
  pj: number
  pg: number
  pp: number
  gf: number
  gc: number
  dif: number
}

async function loadStandings(
  ctx: QueryCtx | MutationCtx,
  tournamentId: Id<"tournaments">,
): Promise<{
  teams: Array<Doc<"tournamentTeams">>
  fixtures: Array<{
    fixture: Doc<"tournamentFixtures">
    match: Doc<"matches"> | null
  }>
  standings: Array<StandingsRow>
}> {
  const teams = await ctx.db
    .query("tournamentTeams")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
    .collect()

  const fixtureRows = await ctx.db
    .query("tournamentFixtures")
    .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
    .collect()
  fixtureRows.sort((a, b) => a.round - b.round || a.position - b.position)

  const fixtures = await Promise.all(
    fixtureRows.map(async (f) => ({
      fixture: f,
      match: f.matchId ? await ctx.db.get(f.matchId) : null,
    })),
  )

  const acc = new Map<string, StandingsRow>()
  for (const t of teams) {
    acc.set(t._id, { team: t, pj: 0, pg: 0, pp: 0, gf: 0, gc: 0, dif: 0 })
  }
  for (const { fixture, match } of fixtures) {
    if (!match) continue
    const a = acc.get(fixture.teamAId)
    const b = acc.get(fixture.teamBId)
    if (!a || !b) continue
    a.pj++
    b.pj++
    a.gf += match.scoreA
    a.gc += match.scoreB
    b.gf += match.scoreB
    b.gc += match.scoreA
    if (match.winner === "A") {
      a.pg++
      b.pp++
    } else {
      b.pg++
      a.pp++
    }
    a.dif = a.gf - a.gc
    b.dif = b.gf - b.gc
  }

  const standings = Array.from(acc.values()).sort(
    (x, y) =>
      y.pg - x.pg ||
      y.dif - x.dif ||
      y.gf - x.gf ||
      x.team.name.localeCompare(y.team.name),
  )

  return { teams, fixtures, standings }
}

export const getDetail = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId)
    if (!tournament) return null
    const { teams, fixtures, standings } = await loadStandings(
      ctx,
      args.tournamentId,
    )

    const playerIds = new Set<string>()
    for (const t of teams) for (const p of t.players) playerIds.add(p)
    const playerDocs = await Promise.all(
      Array.from(playerIds).map((id) => ctx.db.get(id as Id<"players">)),
    )
    const playersById: Record<string, Doc<"players">> = {}
    for (const p of playerDocs) if (p) playersById[p._id] = p

    return { tournament, teams, fixtures, standings, playersById }
  },
})

export const createLiga = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.optional(v.string()),
    teams: v.array(
      v.object({
        name: v.string(),
        players: v.array(v.id("players")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const creator = await requireCurrentPlayer(ctx)

    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    if (session.status !== "active") throw new Error("La sesión no está activa")

    if (args.teams.length < 2) {
      throw new Error("Necesitás al menos 2 equipos")
    }

    const sizes = new Set(args.teams.map((t) => t.players.length))
    if (sizes.size !== 1) {
      throw new Error("Todos los equipos deben tener la misma cantidad de jugadores")
    }
    if (args.teams.some((t) => t.players.length === 0)) {
      throw new Error("Cada equipo necesita al menos un jugador")
    }
    if (args.teams.some((t) => t.name.trim() === "")) {
      throw new Error("Cada equipo necesita un nombre")
    }

    const allPlayers: Array<Id<"players">> = []
    for (const t of args.teams) allPlayers.push(...t.players)
    if (new Set(allPlayers).size !== allPlayers.length) {
      throw new Error("Un jugador no puede estar en dos equipos")
    }

    const participantRows = await ctx.db
      .query("sessionParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()
    const allowed = new Set(participantRows.map((r) => r.playerId as string))
    for (const pid of allPlayers) {
      if (!allowed.has(pid)) {
        throw new Error("Hay jugadores que no son de esta sesión")
      }
    }

    const existing = await ctx.db
      .query("tournaments")
      .withIndex("by_session_and_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("status", "active"),
      )
      .unique()
    if (existing) {
      throw new Error("Ya hay un torneo activo en esta sesión")
    }

    const tournamentId = await ctx.db.insert("tournaments", {
      sessionId: args.sessionId,
      name: args.name?.trim() || undefined,
      format: "liga",
      teamMode: "fixed",
      status: "active",
      createdBy: creator._id,
      createdAt: Date.now(),
    })

    const teamIds: Array<Id<"tournamentTeams">> = []
    for (const t of args.teams) {
      const id = await ctx.db.insert("tournamentTeams", {
        tournamentId,
        name: t.name.trim(),
        players: t.players,
      })
      teamIds.push(id)
    }

    // Shuffle team order for fixture randomness
    const shuffled = [...teamIds]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const pairings = generateRoundRobin(shuffled)
    for (const p of pairings) {
      await ctx.db.insert("tournamentFixtures", {
        tournamentId,
        round: p.round,
        position: p.position,
        teamAId: p.teamAId,
        teamBId: p.teamBId,
      })
    }

    return tournamentId
  },
})

export const recordResult = mutation({
  args: {
    fixtureId: v.id("tournamentFixtures"),
    scoreA: v.number(),
    scoreB: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await requireCurrentPlayer(ctx)

    const fixture = await ctx.db.get(args.fixtureId)
    if (!fixture) throw new Error("Partido inexistente")
    if (fixture.matchId) {
      throw new Error("Ese partido ya tiene resultado cargado")
    }

    const tournament = await ctx.db.get(fixture.tournamentId)
    if (!tournament) throw new Error("Torneo inexistente")
    if (tournament.status !== "active") {
      throw new Error("El torneo ya no está activo")
    }

    const session = await ctx.db.get(tournament.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    if (session.status !== "active") {
      throw new Error("La sesión no está activa")
    }

    if (!Number.isInteger(args.scoreA) || !Number.isInteger(args.scoreB)) {
      throw new Error("Los goles deben ser enteros")
    }
    if (args.scoreA < 0 || args.scoreB < 0) {
      throw new Error("Los goles no pueden ser negativos")
    }
    if (args.scoreA === args.scoreB) {
      throw new Error("No se permiten empates")
    }
    const winner: "A" | "B" = args.scoreA > args.scoreB ? "A" : "B"

    const teamA = await ctx.db.get(fixture.teamAId)
    const teamB = await ctx.db.get(fixture.teamBId)
    if (!teamA || !teamB) throw new Error("Equipos inexistentes")

    const matchId = await ctx.db.insert("matches", {
      sessionId: tournament.sessionId,
      tournamentId: tournament._id,
      createdBy: player._id,
      createdAt: Date.now(),
      teamA: { players: teamA.players },
      teamB: { players: teamB.players },
      scoreA: args.scoreA,
      scoreB: args.scoreB,
      winner,
    })

    await ctx.db.patch(args.fixtureId, { matchId })

    // Check if all fixtures completed → finalize tournament
    const remaining = await ctx.db
      .query("tournamentFixtures")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
      .collect()
    const allPlayed = remaining.every((f) => f.matchId !== undefined)
    if (allPlayed) {
      const { standings } = await loadStandings(ctx, tournament._id)
      const champion = standings[0]
      await ctx.db.patch(tournament._id, {
        status: "finished",
        finishedAt: Date.now(),
        championTeamId: champion?.team._id,
      })
    }

    return matchId
  },
})

export const cancel = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const player = await requireCurrentPlayer(ctx)
    const tournament = await ctx.db.get(args.tournamentId)
    if (!tournament) throw new Error("Torneo inexistente")
    if (tournament.status !== "active") {
      throw new Error("El torneo ya no está activo")
    }
    const session = await ctx.db.get(tournament.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    const isCreator = tournament.createdBy === player._id
    const isSessionOwner = session.createdBy === player._id
    if (!isCreator && !isSessionOwner) {
      throw new Error("Solo el creador del torneo o de la sesión puede cancelarlo")
    }
    await ctx.db.patch(args.tournamentId, {
      status: "cancelled",
      finishedAt: Date.now(),
    })
  },
})
