export type Mode = "2v2" | "1v1"

export type MatchHistory = {
  teamA: { players: Array<string> }
  teamB: { players: Array<string> }
}

export type Suggestion =
  | {
      kind: "ok"
      teamA: Array<string>
      teamB: Array<string>
      queue: Array<string>
      relaxedPairRule: boolean
    }
  | { kind: "insufficient"; message: string }

function mulberry32(seed: number) {
  let t = (seed || 1) >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(arr: ReadonlyArray<T>, rand: () => number): Array<T> {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function suggestNextMatch({
  participants,
  matches,
  mode,
  seed,
}: {
  participants: ReadonlyArray<string>
  // Ordered most recent first.
  matches: ReadonlyArray<MatchHistory>
  mode: Mode
  seed: number
}): Suggestion {
  const teamSize = mode === "2v2" ? 2 : 1
  const needed = teamSize * 2

  if (participants.length < needed) {
    return {
      kind: "insufficient",
      message:
        mode === "2v2"
          ? "Hacen falta al menos 4 jugadores para 2v2"
          : "Hacen falta al menos 2 jugadores para 1v1",
    }
  }

  const rand = mulberry32(seed)
  const hasHistory = matches.length > 0
  const last = hasHistory ? matches[0] : null
  const lastPlayers = new Set<string>(
    last ? [...last.teamA.players, ...last.teamB.players] : [],
  )

  // For 2v2: map each player to their partner in the last match (if any).
  const lastPartner = new Map<string, string>()
  if (last) {
    for (const team of [last.teamA.players, last.teamB.players]) {
      if (team.length === 2) {
        lastPartner.set(team[0], team[1])
        lastPartner.set(team[1], team[0])
      }
    }
  }

  // Rest rule: anyone who didn't play in the last match must play in this one.
  const mustPlay = participants.filter((p) => !lastPlayers.has(p))
  const playedLast = participants.filter((p) => lastPlayers.has(p))

  let roster: Array<string>
  if (mustPlay.length >= needed) {
    roster = shuffled(mustPlay, rand).slice(0, needed)
  } else {
    const extras = shuffled(playedLast, rand).slice(0, needed - mustPlay.length)
    roster = [...mustPlay, ...extras]
  }
  const rosterSet = new Set(roster)
  const queue = participants.filter((p) => !rosterSet.has(p))

  let teamA: Array<string>
  let teamB: Array<string>
  let relaxedPairRule = false

  if (teamSize === 1) {
    const [a, b] = shuffled(roster, rand)
    teamA = [a]
    teamB = [b]
  } else {
    const [p0, p1, p2, p3] = shuffled(roster, rand)
    const splits: Array<[Array<string>, Array<string>]> = [
      [[p0, p1], [p2, p3]],
      [[p0, p2], [p1, p3]],
      [[p0, p3], [p1, p2]],
    ]
    const repeatPairs = (split: [Array<string>, Array<string>]) =>
      split.reduce(
        (n, team) => n + (lastPartner.get(team[0]) === team[1] ? 1 : 0),
        0,
      )
    const ranked = splits
      .map((s) => ({ s, score: repeatPairs(s) }))
      .sort((a, b) => a.score - b.score)
    const chosen = ranked[0]
    teamA = chosen.s[0]
    teamB = chosen.s[1]
    relaxedPairRule = chosen.score > 0
    if (rand() < 0.5) [teamA, teamB] = [teamB, teamA]
  }

  return { kind: "ok", teamA, teamB, queue, relaxedPairRule }
}
