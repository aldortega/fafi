import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Shuffle } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { suggestNextMatch } from "@/lib/matchmaking"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Pair } from "@/components/PlayerAvatar"

export function NextMatchCard({
  sessionId,
  mode,
  participants,
}: {
  sessionId: Id<"sessions">
  mode: "2v2" | "1v1"
  participants: Array<Doc<"players">>
}) {
  const matches = useQuery(api.matches.listBySession, { sessionId })
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const playerById = useMemo(
    () => new Map(participants.map((p) => [p._id, p] as const)),
    [participants]
  )

  const suggestion = useMemo(() => {
    if (!matches) return null
    return suggestNextMatch({
      participants: participants.map((p) => p._id),
      matches: matches.map((m) => ({ teamA: m.teamA, teamB: m.teamB })),
      mode,
      seed,
    })
  }, [matches, participants, mode, seed])

  if (!suggestion) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Calculando próximo partido...</p>
        </CardContent>
      </Card>
    )
  }

  if (suggestion.kind === "insufficient") {
    return (
      <Card>
        <CardHeader>
          <Badge variant="outline">próximo partido</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{suggestion.message}</p>
          {mode === "2v2" ? (
            <p className="text-xs text-muted-foreground">
              Tip: con jugadores impares podés correr un torneo mixed teams (próximamente).
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  const teamAPlayers = suggestion.teamA
    .map((id) => playerById.get(id as Id<"players">))
    .filter(Boolean) as Doc<"players">[]
  const teamBPlayers = suggestion.teamB
    .map((id) => playerById.get(id as Id<"players">))
    .filter(Boolean) as Doc<"players">[]
  const queuePlayers = suggestion.queue
    .map((id) => playerById.get(id as Id<"players">))
    .filter(Boolean) as Doc<"players">[]

  const searchParams = {
    teamA: suggestion.teamA.join(","),
    teamB: suggestion.teamB.join(","),
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-10 size-72 rounded-full bg-primary/10 blur-2xl" />
      <CardHeader className="relative flex flex-row items-start justify-between">
        <Badge className="bg-primary text-primary-foreground hover:bg-primary">
          PRÓXIMO PARTIDO · {mode.toUpperCase()}
        </Badge>
        {suggestion.relaxedPairRule ? (
          <Badge variant="outline" className="text-[10px]">
            pareja repetida (inevitable)
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <div className="flex items-center gap-4">
            <Pair players={teamAPlayers} size="lg" />
            <div>
              <p className="text-lg font-semibold">
                {teamAPlayers.map((p) => p.name).join(" · ")}
              </p>
              <p className="text-xs text-muted-foreground">equipo A</p>
            </div>
          </div>
          <div className="hidden text-2xl font-medium text-muted-foreground sm:block">
            vs
          </div>
          <div className="flex items-center gap-4 sm:justify-end sm:text-right">
            <div className="order-2 sm:order-1">
              <p className="text-lg font-semibold">
                {teamBPlayers.map((p) => p.name).join(" · ")}
              </p>
              <p className="text-xs text-muted-foreground">equipo B</p>
            </div>
            <div className="order-1 sm:order-2">
              <Pair players={teamBPlayers} size="lg" />
            </div>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              En espera
            </p>
            {queuePlayers.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Nadie descansa</p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <Pair players={queuePlayers} size="sm" />
                <p className="text-sm">
                  {queuePlayers.map((p) => p.name).join(", ")}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
            >
              <Shuffle />
              Volver a sortear
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/matches/new" search={searchParams}>
                Confirmar y empezar →
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
