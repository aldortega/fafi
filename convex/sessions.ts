import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import type { Doc } from "./_generated/dataModel"

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique()
    if (!session) return null

    const participantRows = await ctx.db
      .query("sessionParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect()

    const players = await Promise.all(
      participantRows.map((row) => ctx.db.get(row.playerId)),
    )

    return {
      session,
      participants: players.filter((p): p is Doc<"players"> => p !== null),
    }
  },
})

export const create = mutation({
  args: {
    playerIds: v.array(v.id("players")),
    mode: v.union(v.literal("2v2"), v.literal("1v1")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) throw new Error("No autenticado")

    const creator = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
    if (!creator) throw new Error("No tenés perfil de jugador")

    if (args.playerIds.length === 0) {
      throw new Error("Elegí al menos un participante")
    }

    const existingActive = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique()
    if (existingActive) {
      throw new Error("Ya hay una sesión activa")
    }

    const unique = Array.from(new Set(args.playerIds))
    for (const pid of unique) {
      const player = await ctx.db.get(pid)
      if (!player) throw new Error("Jugador inválido")
    }

    const sessionId = await ctx.db.insert("sessions", {
      status: "active",
      mode: args.mode,
      createdBy: creator._id,
      createdAt: Date.now(),
    })

    for (const playerId of unique) {
      await ctx.db.insert("sessionParticipants", { sessionId, playerId })
    }

    return sessionId
  },
})

export const finish = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) throw new Error("No autenticado")

    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Sesión inexistente")
    if (session.status !== "active") {
      throw new Error("La sesión ya está cerrada")
    }

    await ctx.db.patch(args.sessionId, {
      status: "finished",
      finishedAt: Date.now(),
    })
  },
})
