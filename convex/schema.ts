import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const teamValidator = v.object({
  players: v.array(v.id("players")),
})

const matchSnapshotValidator = v.object({
  teamA: teamValidator,
  teamB: teamValidator,
  scoreA: v.number(),
  scoreB: v.number(),
  winner: v.union(v.literal("A"), v.literal("B")),
})

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

  matches: defineTable({
    sessionId: v.id("sessions"),
    tournamentId: v.optional(v.id("tournaments")),
    createdBy: v.id("players"),
    createdAt: v.number(),
    teamA: teamValidator,
    teamB: teamValidator,
    scoreA: v.number(),
    scoreB: v.number(),
    winner: v.union(v.literal("A"), v.literal("B")),
  })
    .index("by_session", ["sessionId"])
    .index("by_tournament", ["tournamentId"]),

  matchEdits: defineTable({
    matchId: v.id("matches"),
    editedBy: v.id("players"),
    editedAt: v.number(),
    before: matchSnapshotValidator,
    after: matchSnapshotValidator,
  }).index("by_match", ["matchId"]),

  tournaments: defineTable({
    sessionId: v.id("sessions"),
    format: v.union(v.literal("liga"), v.literal("bracket")),
    teamMode: v.union(v.literal("fixed"), v.literal("mixed")),
    status: v.union(
      v.literal("active"),
      v.literal("finished"),
      v.literal("cancelled"),
    ),
    createdBy: v.id("players"),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index("by_session", ["sessionId"]),
})
