import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { Edit3, Plus, Shuffle } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { suggestNextMatch } from "@/lib/matchmaking"

export const Route = createFileRoute("/")({ component: Home })

type MatchWithEdits = FunctionReturnType<typeof api.matches.listBySession>[number]

const avatarColorClasses = [
  "bg-rose-200 text-rose-900",
  "bg-sky-200 text-sky-900",
  "bg-lime-200 text-lime-900",
  "bg-violet-200 text-violet-900",
  "bg-amber-200 text-amber-900",
  "bg-teal-200 text-teal-900",
  "bg-pink-200 text-pink-900",
  "bg-blue-200 text-blue-900",
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColorClasses[Math.abs(hash) % avatarColorClasses.length]
}

function useNow() {
  const [now, setNow] = useState(() => formatNow())
  useEffect(() => {
    const timer = setInterval(() => setNow(formatNow()), 60000)
    return () => clearInterval(timer)
  }, [])
  return now
}

function formatNow() {
  return new Date().toLocaleString("es-AR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Home() {
  const user = useQuery(api.auth.getCurrentUser)
  const ensureCurrentPlayer = useMutation(api.players.ensureCurrentPlayer)

  useEffect(() => {
    if (user) {
      void ensureCurrentPlayer({})
    }
  }, [user, ensureCurrentPlayer])

  if (user === undefined) {
    return <LoadingView />
  }

  if (!user) {
    return <LoginView />
  }

  return <SignedInHome userName={user.name ?? user.email ?? "Jugador"} />
}

function LoadingView() {
  return (
    <main className="container mx-auto p-6">
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </main>
  )
}

function LoginView() {
  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Fafi</h1>
      <p className="text-muted-foreground">
        Entrá para empezar a organizar la jornada.
      </p>
      <Button
        onClick={() =>
          authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
          })
        }
      >
        Entrar con Google
      </Button>
    </main>
  )
}

function SignedInHome({ userName }: { userName: string }) {
  const active = useQuery(api.sessions.getActive)
  const now = useNow()

  if (active === undefined) {
    return <LoadingView />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Inicio</h2>
          <div className="ml-auto text-xs text-muted-foreground">{now}</div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <HeaderCard userName={userName} hasSession={!!active} />
              {active ? (
                <>
                  <NextMatchCard
                    sessionId={active.session._id}
                    mode={active.session.mode ?? "2v2"}
                    participants={active.participants}
                  />
                  <TodayTableCard
                    sessionId={active.session._id}
                    participants={active.participants}
                  />
                </>
              ) : null}
            </div>
            <aside className="flex flex-col gap-5">
              {active ? (
                <>
                  <ParticipantsCard participants={active.participants} />
                  <TodayResultsCard
                    sessionId={active.session._id}
                    participants={active.participants}
                  />
                </>
              ) : null}
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HeaderCard({ userName, hasSession }: { userName: string; hasSession: boolean }) {
  const finish = useMutation(api.sessions.finish)
  const active = useQuery(api.sessions.getActive)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClose() {
    if (!active) return
    if (!window.confirm("¿Cerrar la jornada? No se va a poder reabrir.")) return
    setError(null)
    setFinishing(true)
    try {
      await finish({ sessionId: active.session._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la jornada")
    } finally {
      setFinishing(false)
    }
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          fafi
          <span className="size-1.5 rounded-full bg-primary" />
        </div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Buenas, {userName}.
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge
            className={cn(
              "hover:bg-primary",
              hasSession
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {hasSession ? "jornada activa" : "sin jornada"}
          </Badge>
          <span>{useNow()}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {hasSession ? (
          <>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onClose}
              disabled={finishing}
            >
              <Edit3 />
              {finishing ? "Cerrando..." : "Cerrar jornada"}
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/matches/new">
                <Plus />
                Nuevo partido
              </Link>
            </Button>
          </>
        ) : (
          <Button className="rounded-full" asChild>
            <Link to="/sessions/new">
              <Plus />
              Nueva jornada
            </Link>
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </header>
  )
}

function PlayerAvatar({
  player,
  size = "default",
}: {
  player: Doc<"players">
  size?: "sm" | "default" | "lg"
}) {
  return (
    <Avatar size={size}>
      {player.avatarUrl ? (
        <AvatarImage src={player.avatarUrl} alt={player.name} />
      ) : null}
      <AvatarFallback
        className={cn("font-semibold", getAvatarColor(player._id))}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

function Pair({
  players,
  size = "default",
}: {
  players: Array<Doc<"players">>
  size?: "sm" | "default" | "lg"
}) {
  return (
    <AvatarGroup data-size={size}>
      {players.map((p) => (
        <PlayerAvatar key={p._id} player={p} size={size} />
      ))}
    </AvatarGroup>
  )
}

function NextMatchCard({
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

function calculateTable(
  participants: Array<Doc<"players">>,
  matches: Array<MatchWithEdits>
) {
  const rows = new Map<
    string,
    {
      player: Doc<"players">
      pj: number
      pg: number
      pe: number
      pp: number
      gf: number
      gc: number
      pts: number
    }
  >()

  for (const p of participants) {
    rows.set(p._id, {
      player: p,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      pts: 0,
    })
  }

  for (const m of matches) {
    const teamAWon = m.winner === "A"
    for (const pid of m.teamA.players) {
      const row = rows.get(pid)
      if (!row) continue
      row.pj++
      row.gf += m.scoreA
      row.gc += m.scoreB
      if (teamAWon) {
        row.pg++
        row.pts += 3
      } else {
        row.pp++
      }
    }
    for (const pid of m.teamB.players) {
      const row = rows.get(pid)
      if (!row) continue
      row.pj++
      row.gf += m.scoreB
      row.gc += m.scoreA
      if (!teamAWon) {
        row.pg++
        row.pts += 3
      } else {
        row.pp++
      }
    }
  }

  return Array.from(rows.values())
    .map((r) => ({ ...r, dif: r.gf - r.gc }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf)
}

function TodayTableCard({
  sessionId,
  participants,
}: {
  sessionId: Id<"sessions">
  participants: Array<Doc<"players">>
}) {
  const matches = useQuery(api.matches.listBySession, { sessionId })

  const rows = useMemo(() => {
    if (!matches) return []
    return calculateTable(participants, matches)
  }, [participants, matches])

  if (!matches || rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabla del día</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tabla del día</CardTitle>
        <Badge variant="outline">solo partidos sueltos</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead>PJ</TableHead>
              <TableHead>PG</TableHead>
              <TableHead>PE</TableHead>
              <TableHead>PP</TableHead>
              <TableHead>DIF</TableHead>
              <TableHead className="text-right">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow
                key={r.player._id}
                className={cn(
                  i === 0 && "bg-primary/10 hover:bg-primary/10"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar player={r.player} size="sm" />
                    <span className="font-medium">{r.player.name}</span>
                  </div>
                </TableCell>
                <TableCell>{r.pj}</TableCell>
                <TableCell>{r.pg}</TableCell>
                <TableCell>{r.pe}</TableCell>
                <TableCell>{r.pp}</TableCell>
                <TableCell className="tabular-nums">
                  {r.dif > 0 ? `+${r.dif}` : r.dif}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {r.pts}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ParticipantsCard({
  participants,
}: {
  participants: Array<Doc<"players">>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Participantes ({participants.length})
        </CardTitle>
        <AvatarGroup data-size="sm" className="-space-x-1.5">
          {participants.slice(0, 4).map((p) => (
            <PlayerAvatar key={p._id} player={p} size="sm" />
          ))}
        </AvatarGroup>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {participants.map((p, i) => (
            <li key={p._id}>
              {i > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-2.5">
                <PlayerAvatar player={p} size="sm" />
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TodayResultsCard({
  sessionId,
  participants,
}: {
  sessionId: Id<"sessions">
  participants: Array<Doc<"players">>
}) {
  const matches = useQuery(api.matches.listBySession, { sessionId })
  const playerById = useMemo(
    () => new Map(participants.map((p) => [p._id, p] as const)),
    [participants]
  )

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin partidos todavía.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Resultados de hoy</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="text-xs text-muted-foreground"
        >
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {matches.map((m, i) => (
            <div key={m._id}>
              {i > 0 ? <Separator /> : null}
              <ResultRow match={m} playerById={playerById} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultRow({
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
