import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import type { PlayerLineRow } from "@/lib/session-summary"
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

export function RankingCard({ ranking }: { ranking: Array<PlayerLineRow> }) {
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
                  r.pj === 0 && "opacity-60"
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
                          getAvatarColor(r.player._id)
                        )}
                      >
                        {r.player.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{r.player.name}</span>
                  </Link>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
