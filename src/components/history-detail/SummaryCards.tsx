import { Clock, Goal, ScanEye, Sparkles, Trophy } from "lucide-react"
import type { Doc } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { formatDuration, type PlayerLineRow, type Summary } from "@/lib/session-summary"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

export function SummaryCards({
  summary,
  playersById,
}: {
  summary: Summary
  playersById: Record<string, Doc<"players">>
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<Goal className="size-4" />}
        label="Goles totales"
        value={summary.totalGoals}
        hint={`Promedio ${summary.avgGoals.toFixed(1)} por partido`}
      />
      <StatCard
        icon={<ScanEye className="size-4" />}
        label="Diferencia promedio"
        value={summary.avgDiff.toFixed(1)}
        hint="Por partido"
      />
      <StatCard
        icon={<Clock className="size-4" />}
        label="Duración"
        value={
          summary.durationMs === null ? "—" : formatDuration(summary.durationMs)
        }
        hint={
          summary.durationMs === null
            ? "Un solo partido"
            : "Entre primer y último partido"
        }
      />
      <TopScorerCard topScorer={summary.topScorer} />
      <BiggestMatchCard
        title="Partido más goleado"
        icon={<Sparkles className="size-4 text-amber-600" />}
        match={summary.biggest}
        playersById={playersById}
        metric={(m) => `${m.scoreA + m.scoreB} goles`}
      />
      <BiggestMatchCard
        title="Partido más cerrado"
        icon={<ScanEye className="size-4 text-sky-600" />}
        match={summary.tightest}
        playersById={playersById}
        metric={(m) =>
          `Diferencia ${Math.abs(m.scoreA - m.scoreB)} · ${m.scoreA + m.scoreB} goles`
        }
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <p className="text-xs uppercase tracking-wider">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TopScorerCard({ topScorer }: { topScorer: PlayerLineRow | null }) {
  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="size-4 text-emerald-600" />
          <p className="text-xs uppercase tracking-wider">MVP de la jornada</p>
        </div>
        {!topScorer ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="default">
              {topScorer.player.avatarUrl ? (
                <AvatarImage
                  src={topScorer.player.avatarUrl}
                  alt={topScorer.player.name}
                />
              ) : null}
              <AvatarFallback
                className={cn(
                  "font-semibold",
                  getAvatarColor(topScorer.player._id)
                )}
              >
                {topScorer.player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-tight">
                {topScorer.player.name}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {topScorer.pg}W · {topScorer.pp}L · DIF{" "}
                {topScorer.dif > 0 ? `+${topScorer.dif}` : topScorer.dif}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BiggestMatchCard({
  title,
  icon,
  match,
  playersById,
  metric,
}: {
  title: string
  icon: React.ReactNode
  match: Doc<"matches"> | null
  playersById: Record<string, Doc<"players">>
  metric: (m: Doc<"matches">) => string
}) {
  return (
    <Card className="col-span-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <p className="text-xs uppercase tracking-wider">{title}</p>
        </div>
        {!match ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-4">
            <MiniTeam
              players={match.teamA.players
                .map((id) => playersById[id])
                .filter(Boolean)}
              won={match.winner === "A"}
            />
            <div className="text-center">
              <p className="font-heading text-lg font-semibold tabular-nums">
                {match.scoreA}–{match.scoreB}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {metric(match)}
              </p>
            </div>
            <MiniTeam
              players={match.teamB.players
                .map((id) => playersById[id])
                .filter(Boolean)}
              won={match.winner === "B"}
              align="right"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniTeam({
  players,
  won,
  align = "left",
}: {
  players: Array<Doc<"players">>
  won: boolean
  align?: "left" | "right"
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-wrap items-center gap-1 text-xs",
        align === "right" ? "justify-end" : "justify-start",
        won ? "font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      {players.map((p) => (
        <span
          key={p._id}
          className="inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5"
        >
          {p.name}
        </span>
      ))}
    </div>
  )
}
