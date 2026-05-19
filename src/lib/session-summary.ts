import type { Doc } from "../../convex/_generated/dataModel"

export type DetailData = {
  session: Doc<"sessions">
  participants: Array<Doc<"players">>
  matches: Array<Doc<"matches">>
  playersById: Record<string, Doc<"players">>
}

export type PlayerLineRow = {
  player: Doc<"players">
  pj: number
  pg: number
  pp: number
  gf: number
  gc: number
  dif: number
  winPct: number
}

export type Summary = {
  totalMatches: number
  totalGoals: number
  avgGoals: number
  avgDiff: number
  durationMs: number | null
  biggest: Doc<"matches"> | null
  tightest: Doc<"matches"> | null
  topScorer: PlayerLineRow | null
  ranking: Array<PlayerLineRow>
  goalsTimeline: Array<{ idx: number; label: string; goals: number; diff: number }>
}

export function buildSummary(data: DetailData): Summary {
  const { matches, participants, playersById } = data
  const sorted = [...matches].sort((a, b) => a.createdAt - b.createdAt)

  const playerRows = new Map<string, PlayerLineRow>()
  for (const p of participants) {
    playerRows.set(p._id, {
      player: p,
      pj: 0,
      pg: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      winPct: 0,
    })
  }

  let totalGoals = 0
  let biggest: Doc<"matches"> | null = null
  let tightest: Doc<"matches"> | null = null

  for (const m of sorted) {
    const matchGoals = m.scoreA + m.scoreB
    const matchDiff = Math.abs(m.scoreA - m.scoreB)
    totalGoals += matchGoals
    if (!biggest || matchGoals > biggest.scoreA + biggest.scoreB) biggest = m
    if (
      !tightest ||
      matchDiff < Math.abs(tightest.scoreA - tightest.scoreB) ||
      (matchDiff === Math.abs(tightest.scoreA - tightest.scoreB) &&
        matchGoals > tightest.scoreA + tightest.scoreB)
    ) {
      tightest = m
    }

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
      for (const pid of side.players) {
        let row = playerRows.get(pid)
        if (!row) {
          const p = playersById[pid]
          if (!p) continue
          row = {
            player: p,
            pj: 0,
            pg: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dif: 0,
            winPct: 0,
          }
          playerRows.set(pid, row)
        }
        row.pj++
        row.gf += side.gf
        row.gc += side.gc
        if (side.won) row.pg++
        else row.pp++
      }
    }
  }

  for (const row of playerRows.values()) {
    row.dif = row.gf - row.gc
    row.winPct = row.pj === 0 ? 0 : row.pg / row.pj
  }

  const ranking = Array.from(playerRows.values()).sort(
    (a, b) =>
      b.pg - a.pg ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      a.player.name.localeCompare(b.player.name)
  )

  const topScorer = ranking[0] && ranking[0].pj > 0 ? ranking[0] : null

  const durationMs =
    sorted.length >= 2
      ? sorted[sorted.length - 1].createdAt - sorted[0].createdAt
      : null

  const goalsTimeline = sorted.map((m, i) => ({
    idx: i + 1,
    label: `#${i + 1}`,
    goals: m.scoreA + m.scoreB,
    diff: Math.abs(m.scoreA - m.scoreB),
  }))

  return {
    totalMatches: sorted.length,
    totalGoals,
    avgGoals: sorted.length === 0 ? 0 : totalGoals / sorted.length,
    avgDiff:
      sorted.length === 0
        ? 0
        : sorted.reduce((s, m) => s + Math.abs(m.scoreA - m.scoreB), 0) /
          sorted.length,
    durationMs,
    biggest,
    tightest,
    topScorer,
    ranking,
    goalsTimeline,
  }
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
