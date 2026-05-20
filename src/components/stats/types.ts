import type { Doc } from "../../../convex/_generated/dataModel"

export type RankRow = {
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
  tournamentsWon: number
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

export type Summary = {
  totalMatches: number
  totalGoals: number
  totalPlayers: number
  activePlayers: number
  totalSessions: number
  finishedSessions: number
  avgGoalsPerMatch: number
  biggestBlowout: Doc<"matches"> | null
  goalFest: Doc<"matches"> | null
}

export type Duo = {
  a: Doc<"players">
  b: Doc<"players">
  wins: number
  games: number
  winPct: number
  gf: number
  gc: number
}
