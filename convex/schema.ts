import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  players: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  sessions: defineTable({
    status: v.union(v.literal("active"), v.literal("finished")),
    createdBy: v.id("players"),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  sessionParticipants: defineTable({
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_player", ["sessionId", "playerId"]),
})
