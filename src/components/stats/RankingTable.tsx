import { Link } from "@tanstack/react-router"
import { Flame, Trophy } from "lucide-react"
import type { Doc } from "../../../convex/_generated/dataModel"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RankRow } from "./types"

export function RankingTable({ rows }: { rows: Array<RankRow> }) {
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
                className={cn(
                  i === 0 && r.pj > 0 && "bg-primary/10 hover:bg-primary/10"
                )}
              >
                <TableCell className="text-muted-foreground tabular-nums">
                  {i + 1}
                </TableCell>
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
        <AvatarFallback
          className={cn("font-semibold", getAvatarColor(player._id))}
        >
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
