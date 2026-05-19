import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MatchResultRow } from "@/components/MatchResultRow"

export function TodayResultsCard({
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
              <MatchResultRow match={m} playerById={playerById} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
