import { useMemo } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Goal,
  History,
  ScanEye,
  Sparkles,
  Trophy,
} from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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

export const Route = createFileRoute("/history_/$sessionId")({
  component: HistoryDetailPage,
})

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
})

function HistoryDetailPage() {
  const { sessionId } = Route.useParams()
  const data = useQuery(api.sessions.getDetail, {
    sessionId: sessionId as Id<"sessions">,
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Sesión pasada</h2>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-6 p-6">
            <div>
              <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link to="/history">
                  <ArrowLeft className="size-4" />
                  Volver al historial
                </Link>
              </Button>
            </div>

            {data === undefined ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : data === null ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Sesión no encontrada.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Detail data={data} />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

type DetailData = {
  session: Doc<"sessions">
  participants: Array<Doc<"players">>
  matches: Array<Doc<"matches">>
  playersById: Record<string, Doc<"players">>
}

type PlayerLineRow = {
  player: Doc<"players">
  pj: number
  pg: number
  pp: number
  gf: number
  gc: number
  dif: number
  winPct: number
}

type Summary = {
  totalMatches: number
  totalGoals: number
  avgGoals: number
  avgDiff: number
  durationMs: number | null
  biggest: Doc<"matches"> | null
  tightest: Doc<"matches"> | null
  topScorer: PlayerLineRow | null
  ranking: Array<PlayerLineRow>
  goalsTimeline: Array<{ idx: number; label: string; goals: number; diff: number }>
}

function buildSummary(data: DetailData): Summary {
  const { matches, participants, playersById } = data
  const sorted = [...matches].sort((a, b) => a.createdAt - b.createdAt)

  const playerRows = new Map<string, PlayerLineRow>()
  for (const p of participants) {
    playerRows.set(p._id, {
      player: p,
      pj: 0,
      pg: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      winPct: 0,
    })
  }

  let totalGoals = 0
  let biggest: Doc<"matches"> | null = null
  let tightest: Doc<"matches"> | null = null

  for (const m of sorted) {
    const matchGoals = m.scoreA + m.scoreB
    const matchDiff = Math.abs(m.scoreA - m.scoreB)
    totalGoals += matchGoals
    if (!biggest || matchGoals > biggest.scoreA + biggest.scoreB) biggest = m
    if (
      !tightest ||
      matchDiff < Math.abs(tightest.scoreA - tightest.scoreB) ||
      (matchDiff === Math.abs(tightest.scoreA - tightest.scoreB) &&
        matchGoals > tightest.scoreA + tightest.scoreB)
    ) {
      tightest = m
    }

    const sides = [
      {
        players: m.teamA.players,
        gf: m.scoreA,
        gc: m.scoreB,
        won: m.winner === "A",
      },
      {
        players: m.teamB.players,
        gf: m.scoreB,
        gc: m.scoreA,
        won: m.winner === "B",
      },
    ]
    for (const side of sides) {
      for (const pid of side.players) {
        let row = playerRows.get(pid)
        if (!row) {
          const p = playersById[pid]
          if (!p) continue
          row = {
            player: p,
            pj: 0,
            pg: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dif: 0,
            winPct: 0,
          }
          playerRows.set(pid, row)
        }
        row.pj++
        row.gf += side.gf
        row.gc += side.gc
        if (side.won) row.pg++
        else row.pp++
      }
    }
  }

  for (const row of playerRows.values()) {
    row.dif = row.gf - row.gc
    row.winPct = row.pj === 0 ? 0 : row.pg / row.pj
  }

  const ranking = Array.from(playerRows.values()).sort(
    (a, b) =>
      b.pg - a.pg ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      a.player.name.localeCompare(b.player.name),
  )

  const topScorer = ranking[0] && ranking[0].pj > 0 ? ranking[0] : null

  const durationMs =
    sorted.length >= 2
      ? sorted[sorted.length - 1].createdAt - sorted[0].createdAt
      : null

  const goalsTimeline = sorted.map((m, i) => ({
    idx: i + 1,
    label: `#${i + 1}`,
    goals: m.scoreA + m.scoreB,
    diff: Math.abs(m.scoreA - m.scoreB),
  }))

  return {
    totalMatches: sorted.length,
    totalGoals,
    avgGoals: sorted.length === 0 ? 0 : totalGoals / sorted.length,
    avgDiff:
      sorted.length === 0
        ? 0
        : sorted.reduce((s, m) => s + Math.abs(m.scoreA - m.scoreB), 0) /
          sorted.length,
    durationMs,
    biggest,
    tightest,
    topScorer,
    ranking,
    goalsTimeline,
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

function Detail({ data }: { data: DetailData }) {
  const { session, participants, matches, playersById } = data
  const summary = useMemo(() => buildSummary(data), [data])
  const when = session.finishedAt ?? session.createdAt
  const isFinished = session.status === "finished"

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <CalendarDays className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {dateFormatter.format(when)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFinished ? "Sesión cerrada" : "Sesión activa"} ·{" "}
              {participants.length} participantes · {matches.length} partidos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.mode ? (
            <Badge variant="outline">{session.mode}</Badge>
          ) : null}
          <Badge variant={isFinished ? "secondary" : "default"}>
            {session.status}
          </Badge>
        </div>
      </header>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No se cargaron partidos en esta jornada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SummaryCards summary={summary} playersById={playersById} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WinsBarCard ranking={summary.ranking} />
            <GoalsAreaCard timeline={summary.goalsTimeline} avg={summary.avgGoals} />
          </div>

          <RankingCard ranking={summary.ranking} />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <PlayerChip key={p._id} player={p} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Partidos</CardTitle>
          <Badge variant="outline">{matches.length}</Badge>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se cargaron partidos en esta jornada.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {matches.map((m) => (
                <MatchRow key={m._id} match={m} playersById={playersById} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <History className="size-3" />
        Solo lectura. Las sesiones cerradas no se editan.
      </p>
    </>
  )
}

function SummaryCards({
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
      <TopScorerCard
        topScorer={summary.topScorer}
        playersById={playersById}
      />
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

function TopScorerCard({
  topScorer,
}: {
  topScorer: PlayerLineRow | null
  playersById: Record<string, Doc<"players">>
}) {
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
                  getAvatarColor(topScorer.player._id),
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
        won ? "font-medium text-foreground" : "text-muted-foreground",
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

const winsChartConfig = {
  pg: {
    label: "Victorias",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function WinsBarCard({ ranking }: { ranking: Array<PlayerLineRow> }) {
  const data = ranking
    .filter((r) => r.pj > 0)
    .map((r) => ({
      name: r.player.name,
      pg: r.pg,
      pp: r.pp,
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Victorias por jugador</CardTitle>
        <p className="text-xs text-muted-foreground">
          Cantidad de partidos ganados en la jornada.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={winsChartConfig} className="h-64 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const payload = entry.payload as {
                        pg: number
                        pp: number
                        pj: number
                      }
                      return [
                        `${payload.pg}W / ${payload.pp}L (${payload.pj} PJ)`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Bar
                dataKey="pg"
                fill="var(--color-pg)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="pg"
                  position="right"
                  className="fill-foreground text-xs tabular-nums"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

const goalsChartConfig = {
  goals: {
    label: "Goles",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function GoalsAreaCard({
  timeline,
  avg,
}: {
  timeline: Array<{ idx: number; label: string; goals: number; diff: number }>
  avg: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goles por partido</CardTitle>
        <p className="text-xs text-muted-foreground">
          En orden cronológico. Promedio de la jornada:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {avg.toFixed(1)}
          </span>
          .
        </p>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={goalsChartConfig} className="h-64 w-full">
            <AreaChart
              data={timeline}
              margin={{ left: 8, right: 16, top: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="goalsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-goals)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-goals)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const payload = entry.payload as {
                        goals: number
                        diff: number
                      }
                      return [
                        `${payload.goals} goles · dif ${payload.diff}`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="goals"
                stroke="var(--color-goals)"
                strokeWidth={2}
                fill="url(#goalsFill)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function RankingCard({ ranking }: { ranking: Array<PlayerLineRow> }) {
  const played = ranking.filter((r) => r.pj > 0)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Ranking de la jornada</CardTitle>
        <Badge variant="outline">{played.length} jugaron</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-right">PJ</TableHead>
              <TableHead className="text-right">PG</TableHead>
              <TableHead className="text-right">PP</TableHead>
              <TableHead className="text-right">Win %</TableHead>
              <TableHead className="text-right">GF</TableHead>
              <TableHead className="text-right">GC</TableHead>
              <TableHead className="text-right">DIF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((r, i) => (
              <TableRow
                key={r.player._id}
                className={cn(
                  i === 0 && r.pj > 0 && "bg-primary/10 hover:bg-primary/10",
                  r.pj === 0 && "opacity-60",
                )}
              >
                <TableCell className="text-muted-foreground tabular-nums">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <Link
                    to="/profile"
                    search={{ playerId: r.player._id }}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar size="sm">
                      {r.player.avatarUrl ? (
                        <AvatarImage
                          src={r.player.avatarUrl}
                          alt={r.player.name}
                        />
                      ) : null}
                      <AvatarFallback
                        className={cn(
                          "font-semibold",
                          getAvatarColor(r.player._id),
                        )}
                      >
                        {r.player.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{r.player.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.pj}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.pg}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.pp}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.pj === 0 ? "—" : `${Math.round(r.winPct * 100)}%`}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.gf}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.gc}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.dif > 0 ? `+${r.dif}` : r.dif}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function MatchRow({
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
        won ? "font-medium" : "text-muted-foreground",
      )}
    >
      {players.map((p) => (
        <PlayerChip key={p._id} player={p} muted={!won} />
      ))}
    </div>
  )
}

function PlayerChip({
  player,
  muted = false,
}: {
  player: Doc<"players">
  muted?: boolean
}) {
  return (
    <Link
      to="/profile"
      search={{ playerId: player._id }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs transition hover:border-foreground/30",
        muted && "opacity-80",
      )}
    >
      <Avatar size="sm">
        {player.avatarUrl ? (
          <AvatarImage src={player.avatarUrl} alt={player.name} />
        ) : null}
        <AvatarFallback className={cn("font-semibold", getAvatarColor(player._id))}>
          {player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span>{player.name}</span>
    </Link>
  )
}
