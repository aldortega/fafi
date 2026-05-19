import type { Doc } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { PlayerChip } from "./PlayerChip"

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
})

export function MatchRow({
  match,
  playersById,
}: {
  match: Doc<"matches">
  playersById: Record<string, Doc<"players">>
}) {
  const teamA = match.teamA.players
    .map((id) => playersById[id])
    .filter(Boolean)
  const teamB = match.teamB.players
    .map((id) => playersById[id])
    .filter(Boolean)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3">
      <TeamSide players={teamA} won={match.winner === "A"} align="right" />
      <div className="flex flex-col items-center">
        <div className="font-heading text-xl font-semibold tabular-nums">
          <span className={cn(match.winner === "A" && "text-foreground")}>
            {match.scoreA}
          </span>
          <span className="mx-1 text-muted-foreground">–</span>
          <span className={cn(match.winner === "B" && "text-foreground")}>
            {match.scoreB}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {timeFormatter.format(match.createdAt)}
        </span>
      </div>
      <TeamSide players={teamB} won={match.winner === "B"} align="left" />
    </div>
  )
}

function TeamSide({
  players,
  won,
  align,
}: {
  players: Array<Doc<"players">>
  won: boolean
  align: "left" | "right"
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        align === "right" ? "justify-end" : "justify-start",
        won ? "font-medium" : "text-muted-foreground"
      )}
    >
      {players.map((p) => (
        <PlayerChip key={p._id} player={p} muted={!won} />
      ))}
    </div>
  )
}
