import type { FunctionReturnType } from "convex/server"
import type { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Pair } from "@/components/PlayerAvatar"

type MatchWithEdits = FunctionReturnType<typeof api.matches.listBySession>[number]

export function MatchResultRow({
  match,
  playerById,
}: {
  match: MatchWithEdits
  playerById: Map<Id<"players">, Doc<"players">>
}) {
  const teamAPlayers = match.teamA.players
    .map((id) => playerById.get(id))
    .filter(Boolean) as Doc<"players">[]
  const teamBPlayers = match.teamB.players
    .map((id) => playerById.get(id))
    .filter(Boolean) as Doc<"players">[]
  const ago = new Date(match.createdAt).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  })

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Pair players={teamAPlayers} size="sm" />
          <span>{teamAPlayers.map((p) => p.name).join(" · ")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Pair players={teamBPlayers} size="sm" />
          <span>{teamBPlayers.map((p) => p.name).join(" · ")}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-semibold tabular-nums">
          {match.scoreA} – {match.scoreB}
        </p>
        <p className="text-[11px] text-muted-foreground">{ago}</p>
      </div>
    </div>
  )
}
