import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").order("asc").take(500)
    return players
  },
})

export const getCurrentPlayer = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null
    return await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
  },
})

export const ensureCurrentPlayer = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null

    const existing = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
    if (existing) return existing._id

    return await ctx.db.insert("players", {
      userId: user._id,
      name: user.name ?? user.email ?? "Jugador",
      avatarUrl: user.image ?? undefined,
      createdAt: Date.now(),
    })
  },
})

export const createManaged = mutation({
  args: {
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) throw new Error("No autenticado")

    const name = args.name.trim()
    if (!name) throw new Error("El nombre no puede estar vacío")

    const avatarUrl = args.avatarUrl?.trim() || undefined

    return await ctx.db.insert("players", {
      name,
      avatarUrl,
      createdAt: Date.now(),
    })
  },
})
