import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Flame, Trophy } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type ProfileSearch = {
  playerId?: Id<"players">
}

export const Route = createFileRoute("/_dashboard/profile")({
  component: ProfilePage,
  validateSearch: (search: Record<string, unknown>): ProfileSearch => ({
    playerId:
      typeof search.playerId === "string"
        ? (search.playerId as Id<"players">)
        : undefined,
  }),
})

function ProfilePage() {
  const { playerId } = Route.useSearch()
  const currentStats = useQuery(
    api.stats.forCurrentUser,
    playerId ? "skip" : {},
  )
  const playerStats = useQuery(
    api.stats.forPlayer,
    playerId ? { playerId } : "skip",
  )

  const stats = playerId ? playerStats : currentStats
  const loading = stats === undefined

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
        <h2 className="text-sm font-medium">Perfil</h2>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[900px] flex-col gap-6 p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : stats === null ? (
            <EmptyProfile isOwn={!playerId} />
          ) : (
            <ProfileBody stats={stats} />
          )}
        </div>
      </div>
    </>
  )
}

function EmptyProfile({ isOwn }: { isOwn: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-6">
        <p className="text-sm text-muted-foreground">
          {isOwn
            ? "Todavía no tenés perfil de jugador. Iniciá sesión para crearlo."
            : "Jugador no encontrado."}
        </p>
        <div>
          <Button variant="outline" asChild>
            <Link to="/stats">Ver ranking</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

type Stats = {
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
  tournamentsWon: number
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

function ProfileBody({ stats }: { stats: Stats }) {
  const { player } = stats
  return (
    <>
      <header className="flex items-center gap-4">
        <Avatar size="lg">
          {player.avatarUrl ? (
            <AvatarImage src={player.avatarUrl} alt={player.name} />
          ) : null}
          <AvatarFallback className={cn("font-semibold", getAvatarColor(player._id))}>
            {player.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {player.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {player.userId ? "Registrado" : "Gestionado"} · {stats.pj} partidos jugados
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Partidos" value={stats.pj} />
        <Stat label="Ganados" value={stats.pg} />
        <Stat label="Perdidos" value={stats.pp} />
        <Stat
          label="Win %"
          value={stats.pj === 0 ? "—" : `${Math.round(stats.winPct * 100)}%`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Goles a favor" value={stats.gf} />
        <Stat label="Goles en contra" value={stats.gc} />
        <Stat
          label="Diferencia"
          value={stats.dif > 0 ? `+${stats.dif}` : stats.dif}
        />
        <Stat label="Torneos ganados" value={stats.tournamentsWon} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-emerald-600" />
              Racha actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakDisplay value={stats.currentStreak} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-amber-600" />
              Mejor racha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {stats.bestStreak === 0 ? "—" : `${stats.bestStreak}W`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Victorias consecutivas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RelationCard
          title="Mejor compañero"
          subtitle="Con quién ganaste más"
          relation={
            stats.bestTeammate
              ? {
                  player: stats.bestTeammate.player,
                  count: stats.bestTeammate.wins,
                  total: stats.bestTeammate.games,
                  countLabel: "victorias juntos",
                }
              : null
          }
        />
        <RelationCard
          title="Rival más difícil"
          subtitle="Contra quién perdiste más"
          relation={
            stats.toughestRival
              ? {
                  player: stats.toughestRival.player,
                  count: stats.toughestRival.losses,
                  total: stats.toughestRival.games,
                  countLabel: "derrotas en contra",
                }
              : null
          }
        />
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StreakDisplay({ value }: { value: number }) {
  if (value === 0) {
    return <p className="text-3xl font-semibold text-muted-foreground">—</p>
  }
  if (value > 0) {
    return (
      <p className="text-3xl font-semibold tabular-nums text-emerald-700">
        {value}W
      </p>
    )
  }
  return (
    <p className="text-3xl font-semibold tabular-nums text-destructive">
      {Math.abs(value)}L
    </p>
  )
}

function RelationCard({
  title,
  subtitle,
  relation,
}: {
  title: string
  subtitle: string
  relation: {
    player: Doc<"players">
    count: number
    total: number
    countLabel: string
  } | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {!relation ? (
          <p className="text-sm text-muted-foreground">Sin datos todavía.</p>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar size="default">
              {relation.player.avatarUrl ? (
                <AvatarImage
                  src={relation.player.avatarUrl}
                  alt={relation.player.name}
                />
              ) : null}
              <AvatarFallback
                className={cn(
                  "font-semibold",
                  getAvatarColor(relation.player._id),
                )}
              >
                {relation.player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link
                to="/profile"
                search={{ playerId: relation.player._id }}
                className="text-base font-medium hover:underline"
              >
                {relation.player.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {relation.count} {relation.countLabel} · {relation.total} partidos juntos
              </p>
            </div>
            {relation.total < 5 ? (
              <Badge variant="outline" className="text-[10px]">
                muestra chica
              </Badge>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
