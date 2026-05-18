import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  players: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
})
