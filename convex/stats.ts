import { v } from "convex/values"
import { query } from "./_generated/server"
import type { QueryCtx } from "./_generated/server"
import { authComponent } from "./auth"
import type { Doc, Id } from "./_generated/dataModel"

type PlayerStats = {
  player: Doc<"players">
  pj: number
  pg: number
  pp: number
  winPct: number
  gf: number
  gc: number
  dif: number
  currentStreak: number
  bestStreak: number
  bestTeammate: {
    player: Doc<"players">
    wins: number
    games: number
  } | null
  toughestRival: {
    player: Doc<"players">
    losses: number
    games: number
  } | null
}

type PlayerAccum = {
  pj: number
  pg: number
  pp: number
  gf: number
  gc: number
  results: Array<"W" | "L">
  withTeammate: Map<string, { wins: number; games: number }>
  vsRival: Map<string, { losses: number; games: number }>
}

function emptyAccum(): PlayerAccum {
  return {
    pj: 0,
    pg: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    results: [],
    withTeammate: new Map(),
    vsRival: new Map(),
  }
}

function computeStreaks(results: Array<"W" | "L">): {
  current: number
  best: number
} {
  let best = 0
  let run = 0
  for (const r of results) {
    if (r === "W") {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }

  if (results.length === 0) return { current: 0, best: 0 }
  const last = results[results.length - 1]
  let current = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) current++
    else break
  }
  return { current: last === "W" ? current : -current, best }
}

function pickBest<T extends { games: number }>(
  map: Map<string, T>,
  rank: (x: T) => number,
): { key: string; value: T } | null {
  let best: { key: string; value: T } | null = null
  for (const [key, value] of map) {
    if (value.games === 0) continue
    if (!best || rank(value) > rank(best.value)) {
      best = { key, value }
    }
  }
  return best
}

async function buildStats(
  ctx: QueryCtx,
  playerIds: Array<Id<"players">>,
): Promise<Array<PlayerStats>> {
  const matches = await ctx.db.query("matches").collect()
  matches.sort((a, b) => a.createdAt - b.createdAt)

  const accums = new Map<string, PlayerAccum>()

  function get(pid: string): PlayerAccum {
    let a = accums.get(pid)
    if (!a) {
      a = emptyAccum()
      accums.set(pid, a)
    }
    return a
  }

  for (const m of matches) {
    const teamAWon = m.winner === "A"
    const sides: Array<{
      team: Array<Id<"players">>
      rival: Array<Id<"players">>
      gf: number
      gc: number
      won: boolean
    }> = [
      {
        team: m.teamA.players,
        rival: m.teamB.players,
        gf: m.scoreA,
        gc: m.scoreB,
        won: teamAWon,
      },
      {
        team: m.teamB.players,
        rival: m.teamA.players,
        gf: m.scoreB,
        gc: m.scoreA,
        won: !teamAWon,
      },
    ]

    for (const side of sides) {
      for (const pid of side.team) {
        const a = get(pid)
        a.pj++
        a.gf += side.gf
        a.gc += side.gc
        if (side.won) {
          a.pg++
          a.results.push("W")
        } else {
          a.pp++
          a.results.push("L")
        }
        for (const mate of side.team) {
          if (mate === pid) continue
          const entry = a.withTeammate.get(mate) ?? { wins: 0, games: 0 }
          entry.games++
          if (side.won) entry.wins++
          a.withTeammate.set(mate, entry)
        }
        for (const opp of side.rival) {
          const entry = a.vsRival.get(opp) ?? { losses: 0, games: 0 }
          entry.games++
          if (!side.won) entry.losses++
          a.vsRival.set(opp, entry)
        }
      }
    }
  }

  const keys = new Set<string>(playerIds.map((id) => id as string))

  // load player docs
  const ids = Array.from(keys) as Array<Id<"players">>
  const playerDocs = await Promise.all(ids.map((id) => ctx.db.get(id)))
  const playerById = new Map<string, Doc<"players">>()
  for (const p of playerDocs) {
    if (p) playerById.set(p._id, p)
  }

  // also load any teammate/rival players we might reference
  const referenced = new Set<string>()
  for (const a of accums.values()) {
    for (const k of a.withTeammate.keys()) referenced.add(k)
    for (const k of a.vsRival.keys()) referenced.add(k)
  }
  const missing = Array.from(referenced).filter((id) => !playerById.has(id))
  const extra = await Promise.all(
    missing.map((id) => ctx.db.get(id as Id<"players">)),
  )
  for (const p of extra) {
    if (p) playerById.set(p._id, p)
  }

  const out: Array<PlayerStats> = []
  for (const idStr of keys) {
    const player = playerById.get(idStr)
    if (!player) continue
    const a = accums.get(idStr) ?? emptyAccum()
    const { current, best } = computeStreaks(a.results)

    const bestMate = pickBest(a.withTeammate, (v) => v.wins * 1000 + v.games)
    const worstRival = pickBest(a.vsRival, (v) => v.losses * 1000 + v.games)

    const bestTeammate = bestMate
      ? (() => {
          const mate = playerById.get(bestMate.key)
          if (!mate || bestMate.value.wins === 0) return null
          return {
            player: mate,
            wins: bestMate.value.wins,
            games: bestMate.value.games,
          }
        })()
      : null

    const toughestRival = worstRival
      ? (() => {
          const opp = playerById.get(worstRival.key)
          if (!opp || worstRival.value.losses === 0) return null
          return {
            player: opp,
            losses: worstRival.value.losses,
            games: worstRival.value.games,
          }
        })()
      : null

    out.push({
      player,
      pj: a.pj,
      pg: a.pg,
      pp: a.pp,
      winPct: a.pj === 0 ? 0 : a.pg / a.pj,
      gf: a.gf,
      gc: a.gc,
      dif: a.gf - a.gc,
      currentStreak: current,
      bestStreak: best,
      bestTeammate,
      toughestRival,
    })
  }

  return out
}

export const globalRanking = query({
  args: {},
  handler: async (ctx) => {
    // include all players, even those with 0 matches
    const players = await ctx.db.query("players").collect()
    const ids = players.map((p) => p._id)
    const rows = await buildStats(ctx, ids)
    return rows.sort(
      (a, b) =>
        b.pg - a.pg ||
        b.winPct - a.winPct ||
        b.dif - a.dif ||
        b.gf - a.gf ||
        a.player.name.localeCompare(b.player.name),
    )
  },
})

export const bestDuos = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").collect()

    type Acc = { wins: number; games: number; gf: number; gc: number }
    const duos = new Map<string, Acc>()

    function pairKey(a: string, b: string): string {
      return a < b ? `${a}|${b}` : `${b}|${a}`
    }

    for (const m of matches) {
      const sides = [
        {
          players: m.teamA.players,
          gf: m.scoreA,
          gc: m.scoreB,
          won: m.winner === "A",
        },
        {
          players: m.teamB.players,
          gf: m.scoreB,
          gc: m.scoreA,
          won: m.winner === "B",
        },
      ]
      for (const side of sides) {
        if (side.players.length < 2) continue
        for (let i = 0; i < side.players.length; i++) {
          for (let j = i + 1; j < side.players.length; j++) {
            const key = pairKey(side.players[i], side.players[j])
            const acc = duos.get(key) ?? { wins: 0, games: 0, gf: 0, gc: 0 }
            acc.games++
            if (side.won) acc.wins++
            acc.gf += side.gf
            acc.gc += side.gc
            duos.set(key, acc)
          }
        }
      }
    }

    const playerIds = new Set<string>()
    for (const key of duos.keys()) {
      const [a, b] = key.split("|")
      playerIds.add(a)
      playerIds.add(b)
    }
    const playerDocs = await Promise.all(
      Array.from(playerIds).map((id) => ctx.db.get(id as Id<"players">)),
    )
    const playerById = new Map<string, Doc<"players">>()
    for (const p of playerDocs) {
      if (p) playerById.set(p._id, p)
    }

    const out: Array<{
      a: Doc<"players">
      b: Doc<"players">
      wins: number
      games: number
      winPct: number
      gf: number
      gc: number
    }> = []
    for (const [key, acc] of duos) {
      const [aId, bId] = key.split("|")
      const a = playerById.get(aId)
      const b = playerById.get(bId)
      if (!a || !b) continue
      out.push({
        a,
        b,
        wins: acc.wins,
        games: acc.games,
        winPct: acc.games === 0 ? 0 : acc.wins / acc.games,
        gf: acc.gf,
        gc: acc.gc,
      })
    }

    return out.sort(
      (x, y) =>
        y.wins - x.wins ||
        y.winPct - x.winPct ||
        y.games - x.games ||
        x.a.name.localeCompare(y.a.name),
    )
  },
})

export const globalSummary = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").collect()
    const players = await ctx.db.query("players").collect()
    const sessions = await ctx.db.query("sessions").collect()

    let totalGoals = 0
    let biggestBlowout: Doc<"matches"> | null = null
    let goalFest: Doc<"matches"> | null = null

    for (const m of matches) {
      totalGoals += m.scoreA + m.scoreB
      const diff = Math.abs(m.scoreA - m.scoreB)
      if (
        !biggestBlowout ||
        diff > Math.abs(biggestBlowout.scoreA - biggestBlowout.scoreB)
      ) {
        biggestBlowout = m
      }
      if (!goalFest || m.scoreA + m.scoreB > goalFest.scoreA + goalFest.scoreB) {
        goalFest = m
      }
    }

    return {
      totalMatches: matches.length,
      totalGoals,
      totalPlayers: players.length,
      activePlayers: players.length, // refined client-side via ranking.pj>0
      totalSessions: sessions.length,
      finishedSessions: sessions.filter((s) => s.status === "finished").length,
      avgGoalsPerMatch: matches.length === 0 ? 0 : totalGoals / matches.length,
      biggestBlowout,
      goalFest,
    }
  },
})

export const forPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const rows = await buildStats(ctx, [args.playerId])
    return rows[0] ?? null
  },
})

export const forCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique()
    if (!player) return null
    const rows = await buildStats(ctx, [player._id])
    return rows[0] ?? null
  },
})
