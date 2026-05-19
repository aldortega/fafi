import { useMemo } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  CalendarRange,
  Flame,
  Goal,
  Swords,
  Trophy,
  Users,
} from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

export const Route = createFileRoute("/stats")({ component: StatsPage })

type RankRow = {
  player: Doc<"players">
  pj: number
  pg: number
  pp: number
  winPct: number
  gf: number
  gc: number
  dif: number
  currentStreak: number
  bestStreak: number
  bestTeammate: {
    player: Doc<"players">
    wins: number
    games: number
  } | null
  toughestRival: {
    player: Doc<"players">
    losses: number
    games: number
  } | null
}

function StatsPage() {
  const ranking = useQuery(api.stats.globalRanking)
  const summary = useQuery(api.stats.globalSummary)
  const duos = useQuery(api.stats.bestDuos)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Estadísticas</h2>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6 p-6">
            <header>
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Ranking global
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acumulado de todos los partidos jugados (sueltos y de torneos).
              </p>
            </header>

            {ranking === undefined || summary === undefined || duos === undefined ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : ranking.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay jugadores.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <SummarySection ranking={ranking} summary={summary} />
                <ChartsGrid ranking={ranking} duos={duos} />
                <RankingTable rows={ranking} />
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

type Summary = {
  totalMatches: number
  totalGoals: number
  totalPlayers: number
  activePlayers: number
  totalSessions: number
  finishedSessions: number
  avgGoalsPerMatch: number
  biggestBlowout: Doc<"matches"> | null
  goalFest: Doc<"matches"> | null
}

function SummarySection({
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

function HighlightCard({
  title,
  icon,
  player,
  primary,
  secondary,
}: {
  title: string
  icon: React.ReactNode
  player: Doc<"players"> | null
  primary: string
  secondary: string | null
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <p className="text-xs uppercase tracking-wider">{title}</p>
        </div>
        {!player ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="default">
              {player.avatarUrl ? (
                <AvatarImage src={player.avatarUrl} alt={player.name} />
              ) : null}
              <AvatarFallback
                className={cn("font-semibold", getAvatarColor(player._id))}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {player.name}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight">
                {primary}
              </p>
              {secondary ? (
                <p className="text-[10px] text-muted-foreground">{secondary}</p>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type Duo = {
  a: Doc<"players">
  b: Doc<"players">
  wins: number
  games: number
  winPct: number
  gf: number
  gc: number
}

function ChartsGrid({
  ranking,
  duos,
}: {
  ranking: Array<RankRow>
  duos: Array<Duo>
}) {
  const played = ranking.filter((r) => r.pj > 0)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TopWinsChart rows={played} />
      <GoalsForAgainstChart rows={played} />
      <WinPctChart rows={played} />
      <TopDuosChart duos={duos} />
    </div>
  )
}

const winsConfig = {
  pg: { label: "Victorias", color: "var(--chart-1)" },
} satisfies ChartConfig

function TopWinsChart({ rows }: { rows: Array<RankRow> }) {
  const data = rows
    .slice()
    .sort((a, b) => b.pg - a.pg)
    .slice(0, 10)
    .map((r) => ({
      name: r.player.name,
      pg: r.pg,
      pp: r.pp,
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top victorias</CardTitle>
        <p className="text-xs text-muted-foreground">
          Los 10 jugadores con más partidos ganados.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={winsConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 28, top: 4, bottom: 4 }}
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
                      const p = entry.payload as {
                        pg: number
                        pp: number
                        pj: number
                      }
                      return [`${p.pg}W / ${p.pp}L (${p.pj} PJ)`, ""]
                    }}
                  />
                }
              />
              <Bar dataKey="pg" fill="var(--color-pg)" radius={[0, 6, 6, 0]}>
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

const goalsConfig = {
  gf: { label: "Goles a favor", color: "var(--chart-2)" },
  gc: { label: "Goles en contra", color: "var(--chart-4)" },
} satisfies ChartConfig

function GoalsForAgainstChart({ rows }: { rows: Array<RankRow> }) {
  const data = rows
    .slice()
    .sort((a, b) => b.gf - a.gf)
    .slice(0, 8)
    .map((r) => ({
      name: r.player.name,
      gf: r.gf,
      gc: r.gc,
      dif: r.dif,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goles a favor vs en contra</CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 8 goleadores con su balance defensivo.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={goalsConfig} className="h-72 w-full">
            <BarChart
              data={data}
              margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
                className="text-[10px]"
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const p = entry.payload as { gf: number; gc: number; dif: number }
                      return [
                        `${p.gf} GF · ${p.gc} GC · dif ${p.dif > 0 ? `+${p.dif}` : p.dif}`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Bar dataKey="gf" fill="var(--color-gf)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gc" fill="var(--color-gc)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

const winPctConfig = {
  winPct: { label: "Win %", color: "var(--chart-3)" },
} satisfies ChartConfig

function WinPctChart({ rows }: { rows: Array<RankRow> }) {
  const eligible = rows.filter((r) => r.pj >= 3)
  const data = eligible
    .slice()
    .sort((a, b) => b.winPct - a.winPct)
    .slice(0, 10)
    .map((r) => ({
      name: r.player.name,
      winPct: Math.round(r.winPct * 100),
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Win % (mín. 3 partidos)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Porcentaje de victorias entre quienes jugaron al menos 3 partidos.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nadie llega al mínimo de 3 partidos todavía.
          </p>
        ) : (
          <ChartContainer config={winPctConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
              />
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
                      const p = entry.payload as { winPct: number; pj: number }
                      return [`${p.winPct}% en ${p.pj} PJ`, ""]
                    }}
                  />
                }
              />
              <Bar
                dataKey="winPct"
                fill="var(--color-winPct)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="winPct"
                  position="right"
                  formatter={(v) => `${String(v)}%`}
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

const duosConfig = {
  wins: { label: "Victorias juntos", color: "var(--chart-1)" },
} satisfies ChartConfig

function TopDuosChart({ duos }: { duos: Array<Duo> }) {
  const data = duos
    .filter((d) => d.wins > 0)
    .slice(0, 10)
    .map((d) => ({
      name: `${d.a.name} + ${d.b.name}`,
      wins: d.wins,
      games: d.games,
      winPct: Math.round(d.winPct * 100),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mejores duplas</CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 10 parejas con más victorias jugando juntas.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay duplas con victorias.
          </p>
        ) : (
          <ChartContainer config={duosConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tickLine={false}
                axisLine={false}
                className="text-[11px]"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const p = entry.payload as {
                        wins: number
                        games: number
                        winPct: number
                      }
                      return [
                        `${p.wins}W en ${p.games} PJ (${p.winPct}%)`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Bar
                dataKey="wins"
                fill="var(--color-wins)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="wins"
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

function RankingTable({ rows }: { rows: Array<RankRow> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Jugadores</CardTitle>
        <Badge variant="outline">{rows.length}</Badge>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-right">PJ</TableHead>
              <TableHead className="text-right">PG</TableHead>
              <TableHead className="text-right">PP</TableHead>
              <TableHead className="text-right">Win %</TableHead>
              <TableHead className="text-right">GF</TableHead>
              <TableHead className="text-right">GC</TableHead>
              <TableHead className="text-right">DIF</TableHead>
              <TableHead className="text-right">Racha</TableHead>
              <TableHead className="text-right">Mejor</TableHead>
              <TableHead>Mejor compañero</TableHead>
              <TableHead>Rival más difícil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow
                key={r.player._id}
                className={cn(i === 0 && r.pj > 0 && "bg-primary/10 hover:bg-primary/10")}
              >
                <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <PlayerCell player={r.player} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.pj}</TableCell>
                <TableCell className="text-right tabular-nums">{r.pg}</TableCell>
                <TableCell className="text-right tabular-nums">{r.pp}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.pj === 0 ? "—" : `${Math.round(r.winPct * 100)}%`}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.gf}</TableCell>
                <TableCell className="text-right tabular-nums">{r.gc}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.dif > 0 ? `+${r.dif}` : r.dif}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <StreakBadge value={r.currentStreak} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.bestStreak === 0 ? (
                    "—"
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Flame className="size-3" />
                      {r.bestStreak}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <PartnerCell partner={r.bestTeammate} />
                </TableCell>
                <TableCell>
                  <RivalCell rival={r.toughestRival} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PlayerCell({ player }: { player: Doc<"players"> }) {
  return (
    <Link
      to="/profile"
      search={{ playerId: player._id }}
      className="flex items-center gap-2 hover:underline"
    >
      <Avatar size="sm">
        {player.avatarUrl ? (
          <AvatarImage src={player.avatarUrl} alt={player.name} />
        ) : null}
        <AvatarFallback className={cn("font-semibold", getAvatarColor(player._id))}>
          {player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{player.name}</span>
    </Link>
  )
}

function StreakBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700">
        <Trophy className="size-3" />
        {value}W
      </span>
    )
  }
  return <span className="text-destructive">{Math.abs(value)}L</span>
}

function PartnerCell({
  partner,
}: {
  partner: { player: Doc<"players">; wins: number; games: number } | null
}) {
  if (!partner) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium">{partner.player.name}</span>
      <span className="text-muted-foreground tabular-nums">
        {partner.wins}/{partner.games}
      </span>
      {partner.games < 5 ? (
        <Badge variant="outline" className="text-[10px]">
          muestra chica
        </Badge>
      ) : null}
    </div>
  )
}

function RivalCell({
  rival,
}: {
  rival: { player: Doc<"players">; losses: number; games: number } | null
}) {
  if (!rival) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium">{rival.player.name}</span>
      <span className="text-muted-foreground tabular-nums">
        {rival.losses}/{rival.games}
      </span>
      {rival.games < 5 ? (
        <Badge variant="outline" className="text-[10px]">
          muestra chica
        </Badge>
      ) : null}
    </div>
  )
}
