import { useMemo } from "react"
import {
  Activity,
  CalendarRange,
  Flame,
  Goal,
  Swords,
  Trophy,
  Users,
} from "lucide-react"
import type { RankRow, Summary } from "./types"
import { StatCard } from "./StatCard"
import { HighlightCard } from "./HighlightCard"

export function SummarySection({
  ranking,
  summary,
}: {
  ranking: Array<RankRow>
  summary: Summary
}) {
  const activePlayers = ranking.filter((r) => r.pj > 0).length
  const topWinner = ranking.find((r) => r.pj > 0) ?? null
  const topScorer = useMemo(() => {
    const played = ranking.filter((r) => r.pj > 0)
    if (played.length === 0) return null
    return [...played].sort((a, b) => b.gf - a.gf)[0]
  }, [ranking])
  const longestStreak = useMemo(() => {
    const played = ranking.filter((r) => r.bestStreak > 0)
    if (played.length === 0) return null
    return [...played].sort((a, b) => b.bestStreak - a.bestStreak)[0]
  }, [ranking])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<Swords className="size-4" />}
        label="Partidos"
        value={summary.totalMatches}
        hint={`En ${summary.finishedSessions} jornadas cerradas`}
      />
      <StatCard
        icon={<Goal className="size-4" />}
        label="Goles totales"
        value={summary.totalGoals}
        hint={`Promedio ${summary.avgGoalsPerMatch.toFixed(1)} por partido`}
      />
      <StatCard
        icon={<Users className="size-4" />}
        label="Jugadores activos"
        value={activePlayers}
        hint={`${summary.totalPlayers} en total`}
      />
      <StatCard
        icon={<CalendarRange className="size-4" />}
        label="Jornadas"
        value={summary.totalSessions}
        hint={`${summary.finishedSessions} cerradas`}
      />

      <HighlightCard
        title="Líder en victorias"
        icon={<Trophy className="size-4 text-emerald-600" />}
        player={topWinner?.player ?? null}
        primary={topWinner ? `${topWinner.pg}W` : "—"}
        secondary={
          topWinner
            ? `${topWinner.pj} PJ · ${Math.round(topWinner.winPct * 100)}% Win`
            : null
        }
      />
      <HighlightCard
        title="Máximo goleador"
        icon={<Goal className="size-4 text-sky-600" />}
        player={topScorer?.player ?? null}
        primary={topScorer ? `${topScorer.gf} GF` : "—"}
        secondary={
          topScorer
            ? `Dif ${topScorer.dif > 0 ? `+${topScorer.dif}` : topScorer.dif} en ${topScorer.pj} partidos`
            : null
        }
      />
      <HighlightCard
        title="Mejor racha histórica"
        icon={<Flame className="size-4 text-amber-600" />}
        player={longestStreak?.player ?? null}
        primary={longestStreak ? `${longestStreak.bestStreak}W` : "—"}
        secondary={
          longestStreak ? "Victorias consecutivas" : "Sin rachas todavía"
        }
      />
      <StatCard
        icon={<Activity className="size-4" />}
        label="Goles por jornada"
        value={
          summary.finishedSessions === 0
            ? "—"
            : (summary.totalGoals / summary.finishedSessions).toFixed(1)
        }
        hint="Promedio histórico"
      />
    </div>
  )
}
