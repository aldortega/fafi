import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { Trophy } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_dashboard/tournaments_/$tournamentId")({
  component: TournamentDetailPage,
})

function TournamentDetailPage() {
  const { tournamentId } = Route.useParams()
  const navigate = useNavigate()
  const detail = useQuery(api.tournaments.getDetail, {
    tournamentId: tournamentId as Id<"tournaments">,
  })
  const cancelTournament = useMutation(api.tournaments.cancel)

  if (detail === undefined) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Torneo</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </>
    )
  }
  if (detail === null) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Torneo</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground">Torneo inexistente.</p>
        </div>
      </>
    )
  }

  const { tournament, teams, fixtures, standings, playersById } = detail
  const teamById = new Map(teams.map((t) => [t._id, t]))
  const rounds = new Map<number, Array<(typeof fixtures)[number]>>()
  for (const f of fixtures) {
    const arr = rounds.get(f.fixture.round) ?? []
    arr.push(f)
    rounds.set(f.fixture.round, arr)
  }
  const roundKeys = Array.from(rounds.keys()).sort((a, b) => a - b)

  const totalFixtures = fixtures.length
  const playedFixtures = fixtures.filter((f) => f.match !== null).length
  const champion = tournament.championTeamId
    ? teamById.get(tournament.championTeamId)
    : null

  async function onCancel() {
    if (!confirm("¿Cancelar este torneo? Los partidos jugados se conservan.")) {
      return
    }
    try {
      await cancelTournament({ tournamentId: tournament._id })
      await navigate({ to: "/jornada" })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cancelar")
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">
            {tournament.name ?? "Torneo"}
          </h2>
          <StatusBadge status={tournament.status} />
        </div>
        <div>
          {tournament.status === "active" ? (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancelar torneo
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground -mt-2">
            Liga · equipos fijos · {playedFixtures}/{totalFixtures} partidos
          </p>

          {champion ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="size-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Campeón
                  </p>
                  <p className="text-base font-semibold">{champion.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {champion.players
                      .map((p) => playersById[p]?.name ?? "—")
                      .join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Posiciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">PJ</TableHead>
                    <TableHead className="text-right">PG</TableHead>
                    <TableHead className="text-right">PP</TableHead>
                    <TableHead className="text-right">GF</TableHead>
                    <TableHead className="text-right">GC</TableHead>
                    <TableHead className="text-right">DG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((row, i) => (
                    <TableRow key={row.team._id}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {row.team.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {row.team.players
                              .map((p) => playersById[p]?.name ?? "—")
                              .join(", ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.pj}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.pg}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.pp}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.gf}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.gc}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          row.dif > 0 && "text-emerald-600",
                          row.dif < 0 && "text-destructive",
                        )}
                      >
                        {row.dif > 0 ? `+${row.dif}` : row.dif}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-base font-medium">Fixture</h2>
            {roundKeys.map((r) => (
              <Card key={r}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Fecha {r}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col divide-y">
                  {(rounds.get(r) ?? []).map(({ fixture, match }) => (
                    <FixtureRow
                      key={fixture._id}
                      fixture={fixture}
                      match={match}
                      teamA={teamById.get(fixture.teamAId)!}
                      teamB={teamById.get(fixture.teamBId)!}
                      active={tournament.status === "active"}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: Doc<"tournaments">["status"] }) {
  if (status === "active") return <Badge>En curso</Badge>
  if (status === "finished") return <Badge variant="secondary">Finalizado</Badge>
  return <Badge variant="outline">Cancelado</Badge>
}

function FixtureRow({
  fixture,
  match,
  teamA,
  teamB,
  active,
}: {
  fixture: Doc<"tournamentFixtures">
  match: Doc<"matches"> | null
  teamA: Doc<"tournamentTeams">
  teamB: Doc<"tournamentTeams">
  active: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [scoreA, setScoreA] = useState("")
  const [scoreB, setScoreB] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recordResult = useMutation(api.tournaments.recordResult)

  async function onSave() {
    setError(null)
    const a = Number(scoreA)
    const b = Number(scoreB)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("Goles inválidos")
      return
    }
    if (a === b) {
      setError("No se permiten empates")
      return
    }
    setSubmitting(true)
    try {
      await recordResult({ fixtureId: fixture._id, scoreA: a, scoreB: b })
      setEditing(false)
      setScoreA("")
      setScoreB("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex-1 text-right text-sm",
            match && match.winner === "A" && "font-semibold",
          )}
        >
          {teamA.name}
        </span>
        <div className="flex min-w-24 items-center justify-center gap-2 font-mono text-sm">
          {match ? (
            <>
              <span>{match.scoreA}</span>
              <span className="text-muted-foreground">-</span>
              <span>{match.scoreB}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">vs</span>
          )}
        </div>
        <span
          className={cn(
            "flex-1 text-sm",
            match && match.winner === "B" && "font-semibold",
          )}
        >
          {teamB.name}
        </span>
        <div className="w-24 text-right">
          {!match && active ? (
            <Button
              size="sm"
              variant={editing ? "outline" : "secondary"}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Cerrar" : "Cargar"}
            </Button>
          ) : null}
        </div>
      </div>
      {editing && !match ? (
        <div className="flex flex-wrap items-center justify-end gap-2 pl-1">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            className="w-20"
            placeholder="A"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            className="w-20"
            placeholder="B"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
          />
          <Button
            size="sm"
            onClick={onSave}
            disabled={submitting || scoreA === "" || scoreB === ""}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
          {error ? (
            <p className="w-full text-right text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
