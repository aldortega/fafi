import { v } from "convex/values"
import {   mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import type {MutationCtx, QueryCtx} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel"

const teamArg = v.object({
  players: v.array(v.id("players")),
})

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

function validateTeams(
  teamA: { players: Array<Id<"players">> },
  teamB: { players: Array<Id<"players">> },
) {
  if (teamA.players.length === 0 || teamB.players.length === 0) {
    throw new Error("Cada equipo necesita al menos un jugador")
  }
  if (teamA.players.length !== teamB.players.length) {
    throw new Error("Los equipos deben tener la misma cantidad de jugadores")
  }
  const all = [...teamA.players, ...teamB.players]
  if (new Set(all).size !== all.length) {
    throw new Error("Un jugador no puede estar en ambos equipos")
  }
}

function deriveWinner(scoreA: number, scoreB: number): "A" | "B" {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    throw new Error("Los goles deben ser enteros")
  }
  if (scoreA < 0 || scoreB < 0) {
    throw new Error("Los goles no pueden ser negativos")
  }
  if (scoreA === scoreB) {
    throw new Error("No se permiten empates")
  }
  return scoreA > scoreB ? "A" : "B"
}

async function assertParticipants(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  playerIds: Array<Id<"players">>,
) {
  const rows = await ctx.db
    .query("sessionParticipants")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect()
  const allowed = new Set(rows.map((r) => r.playerId))
  for (const pid of playerIds) {
    if (!allowed.has(pid)) {
      throw new Error("Hay jugadores que no son de esta sesión")
    }
  }
}

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect()

    const edits = await Promise.all(
      matches.map((m) =>
        ctx.db
          .query("matchEdits")
          .withIndex("by_match", (q) => q.eq("matchId", m._id))
          .order("desc")
          .collect(),
      ),
    )

    return matches.map((match, i) => ({
      ...match,
      edits: edits[i],
    }))
  },
})

export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    teamA: teamArg,
    teamB: teamArg,
    scoreA: v.number(),
    scoreB: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await requireCurrentPlayer(ctx)

    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    if (session.status !== "active") {
      throw new Error("La sesión no está activa")
    }

    validateTeams(args.teamA, args.teamB)
    const winner = deriveWinner(args.scoreA, args.scoreB)
    await assertParticipants(ctx, args.sessionId, [
      ...args.teamA.players,
      ...args.teamB.players,
    ])

    return await ctx.db.insert("matches", {
      sessionId: args.sessionId,
      createdBy: player._id,
      createdAt: Date.now(),
      teamA: args.teamA,
      teamB: args.teamB,
      scoreA: args.scoreA,
      scoreB: args.scoreB,
      winner,
    })
  },
})

export const update = mutation({
  args: {
    matchId: v.id("matches"),
    teamA: teamArg,
    teamB: teamArg,
    scoreA: v.number(),
    scoreB: v.number(),
  },
  handler: async (ctx, args) => {
    const player = await requireCurrentPlayer(ctx)

    const match = await ctx.db.get(args.matchId)
    if (!match) throw new Error("Partido inexistente")

    const session = await ctx.db.get(match.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    if (session.status !== "active") {
      throw new Error("La sesión ya está cerrada")
    }

    const isAuthor = match.createdBy === player._id
    const isSessionOwner = session.createdBy === player._id
    if (!isAuthor && !isSessionOwner) {
      throw new Error("Solo el autor o quien creó la sesión puede editar")
    }

    validateTeams(args.teamA, args.teamB)
    const winner = deriveWinner(args.scoreA, args.scoreB)
    await assertParticipants(ctx, match.sessionId, [
      ...args.teamA.players,
      ...args.teamB.players,
    ])

    const before = {
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      winner: match.winner,
    }
    const after = {
      teamA: args.teamA,
      teamB: args.teamB,
      scoreA: args.scoreA,
      scoreB: args.scoreB,
      winner,
    }

    const changed =
      before.scoreA !== after.scoreA ||
      before.scoreB !== after.scoreB ||
      JSON.stringify(before.teamA.players) !==
        JSON.stringify(after.teamA.players) ||
      JSON.stringify(before.teamB.players) !==
        JSON.stringify(after.teamB.players)

    if (!changed) return

    await ctx.db.patch(args.matchId, {
      teamA: args.teamA,
      teamB: args.teamB,
      scoreA: args.scoreA,
      scoreB: args.scoreB,
      winner,
    })

    await ctx.db.insert("matchEdits", {
      matchId: args.matchId,
      editedBy: player._id,
      editedAt: Date.now(),
      before,
      after,
    })
  },
})
