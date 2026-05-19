import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Flame, Plus, Trophy } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MyStatsCard() {
  const stats = useQuery(api.stats.forCurrentUser)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tu actividad</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground"
          asChild
        >
          <Link to="/profile">Ver perfil →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {stats === undefined ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !stats || stats.pj === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Todavía no jugaste partidos. Creá una jornada para empezar.
            </p>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/sessions/new">
                <Plus />
                Nueva jornada
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="PJ" value={stats.pj} />
              <MiniStat label="PG" value={stats.pg} />
              <MiniStat
                label="Win %"
                value={`${Math.round(stats.winPct * 100)}%`}
              />
              <MiniStat
                label="Racha"
                value={
                  stats.currentStreak === 0
                    ? "—"
                    : stats.currentStreak > 0
                      ? `${stats.currentStreak}W`
                      : `${Math.abs(stats.currentStreak)}L`
                }
                tone={
                  stats.currentStreak > 0
                    ? "win"
                    : stats.currentStreak < 0
                      ? "loss"
                      : "neutral"
                }
              />
            </div>
            {stats.bestTeammate || stats.bestStreak > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {stats.bestStreak > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Flame className="size-3 text-amber-600" />
                    Mejor racha: {stats.bestStreak}W
                  </span>
                ) : null}
                {stats.bestTeammate ? (
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="size-3 text-emerald-600" />
                    Mejor con {stats.bestTeammate.player.name} (
                    {stats.bestTeammate.wins}/{stats.bestTeammate.games})
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: number | string
  tone?: "win" | "loss" | "neutral"
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          tone === "win" && "text-emerald-700",
          tone === "loss" && "text-destructive"
        )}
      >
        {value}
      </p>
    </div>
  )
}
