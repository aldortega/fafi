import { useMemo } from "react"
import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
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
import { PlayerAvatar } from "@/components/PlayerAvatar"

type MatchWithEdits = FunctionReturnType<typeof api.matches.listBySession>[number]

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

export function TodayTableCard({
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
                className={cn(i === 0 && "bg-primary/10 hover:bg-primary/10")}
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
