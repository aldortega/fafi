import { describe, expect, it } from "vitest"
import { suggestNextMatch } from "./matchmaking"
import type { MatchHistory } from "./matchmaking"

describe("suggestNextMatch", () => {
  it("returns insufficient when there are too few players", () => {
    const res = suggestNextMatch({
      participants: ["a", "b", "c"],
      matches: [],
      mode: "2v2",
      seed: 1,
    })
    expect(res.kind).toBe("insufficient")
  })

  it("forces a rester to play the next match", () => {
    const matches: Array<MatchHistory> = [
      { teamA: { players: ["a", "b"] }, teamB: { players: ["c", "d"] } },
    ]
    for (let seed = 1; seed < 20; seed++) {
      const res = suggestNextMatch({
        participants: ["a", "b", "c", "d", "e", "f"],
        matches,
        mode: "2v2",
        seed,
      })
      if (res.kind !== "ok") throw new Error("expected ok")
      const playing = new Set([...res.teamA, ...res.teamB])
      expect(playing.has("e")).toBe(true)
      expect(playing.has("f")).toBe(true)
    }
  })

  it("avoids repeating the last partnership when possible", () => {
    const matches: Array<MatchHistory> = [
      { teamA: { players: ["a", "b"] }, teamB: { players: ["c", "d"] } },
    ]
    for (let seed = 1; seed < 20; seed++) {
      const res = suggestNextMatch({
        participants: ["a", "b", "c", "d"],
        matches,
        mode: "2v2",
        seed,
      })
      if (res.kind !== "ok") throw new Error("expected ok")
      const teams = [res.teamA, res.teamB]
      const repeated = teams.some(
        (t) =>
          (t.includes("a") && t.includes("b")) ||
          (t.includes("c") && t.includes("d")),
      )
      expect(repeated).toBe(false)
      expect(res.relaxedPairRule).toBe(false)
    }
  })

  it("rotates fairly over 10 simulated matches with 6 players 2v2", () => {
    const participants = ["a", "b", "c", "d", "e", "f"]
    const matches: Array<MatchHistory> = []
    let prevResting: Set<string> = new Set()

    for (let i = 0; i < 10; i++) {
      const res = suggestNextMatch({
        participants,
        matches,
        mode: "2v2",
        seed: i + 1,
      })
      if (res.kind !== "ok") throw new Error("expected ok")
      const playing = new Set([...res.teamA, ...res.teamB])
      const resting = new Set(participants.filter((p) => !playing.has(p)))

      // Rest rule: no overlap with previous resters.
      for (const p of prevResting) {
        expect(resting.has(p)).toBe(false)
      }
      expect(playing.size).toBe(4)
      expect(resting.size).toBe(2)

      // Prepend as the new most-recent match.
      matches.unshift({
        teamA: { players: res.teamA },
        teamB: { players: res.teamB },
      })
      prevResting = resting
    }
  })

  it("works in 1v1 mode", () => {
    const res = suggestNextMatch({
      participants: ["a", "b", "c"],
      matches: [{ teamA: { players: ["a"] }, teamB: { players: ["b"] } }],
      mode: "1v1",
      seed: 7,
    })
    if (res.kind !== "ok") throw new Error("expected ok")
    expect(res.teamA.length).toBe(1)
    expect(res.teamB.length).toBe(1)
    const playing = new Set([...res.teamA, ...res.teamB])
    expect(playing.has("c")).toBe(true)
  })
})
