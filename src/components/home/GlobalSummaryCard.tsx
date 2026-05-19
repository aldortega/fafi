import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { CalendarDays, Goal, Swords, Users } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function GlobalSummaryCard() {
  const summary = useQuery(api.stats.globalSummary)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Resumen global</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground"
          asChild
        >
          <Link to="/stats">Ver estadísticas →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {summary === undefined ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : summary.totalMatches === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin partidos todavía. Las estadísticas aparecen acá una vez que
            empiecen a rodar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              icon={<Swords className="size-4" />}
              label="Partidos"
              value={summary.totalMatches}
            />
            <SummaryTile
              icon={<Goal className="size-4" />}
              label="Goles"
              value={summary.totalGoals}
              hint={`Prom. ${summary.avgGoalsPerMatch.toFixed(1)}/partido`}
            />
            <SummaryTile
              icon={<CalendarDays className="size-4" />}
              label="Jornadas"
              value={summary.finishedSessions}
              hint="cerradas"
            />
            <SummaryTile
              icon={<Users className="size-4" />}
              label="Jugadores"
              value={summary.totalPlayers}
              hint="registrados"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryTile({
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
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <p className="text-[11px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
