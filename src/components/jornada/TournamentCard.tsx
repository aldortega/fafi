import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus, Trophy } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function TournamentCard({ sessionId }: { sessionId: Id<"sessions"> }) {
  const tournament = useQuery(api.tournaments.getActiveBySession, { sessionId })
  const detail = useQuery(
    api.tournaments.getDetail,
    tournament ? { tournamentId: tournament._id } : "skip",
  )

  if (tournament === undefined) return null

  if (!tournament) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4" /> Torneo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Sin torneo activo. Armá una liga con equipos fijos.
          </p>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/tournaments/new">
              <Plus /> Crear torneo
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const played =
    detail?.fixtures.filter((f) => f.match !== null).length ?? 0
  const total = detail?.fixtures.length ?? 0
  const leader = detail?.standings[0] ?? null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4" /> {tournament.name ?? "Torneo"}
          </CardTitle>
          <Badge>En curso</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Avance</span>
          <span className="font-mono">
            {played}/{total}
          </span>
        </div>
        {leader ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Líder</span>
            <span className="font-medium">{leader.team.name}</span>
          </div>
        ) : null}
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link
            to="/tournaments/$tournamentId"
            params={{ tournamentId: tournament._id }}
          >
            Ver torneo
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
