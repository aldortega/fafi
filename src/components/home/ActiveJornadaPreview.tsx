import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ChevronRight } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/PlayerAvatar"

export function ActiveJornadaPreview({
  sessionId,
  participants,
  mode,
}: {
  sessionId: Id<"sessions">
  participants: Array<Doc<"players">>
  mode: "2v2" | "1v1"
}) {
  const matches = useQuery(api.matches.listBySession, { sessionId })
  const matchCount = matches?.length ?? 0

  return (
    <Link
      to="/jornada"
      className="group block"
      aria-label="Ver jornada activa"
    >
      <Card className="relative overflow-hidden transition hover:border-primary/40">
        <div className="pointer-events-none absolute -right-20 -top-10 size-72 rounded-full bg-primary/10 blur-2xl" />
        <CardContent className="relative flex items-center justify-between gap-4 p-5">
          <div className="flex flex-col gap-3">
            <Badge className="w-fit bg-primary text-primary-foreground hover:bg-primary">
              jornada activa · {mode.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-3">
              <AvatarGroup data-size="sm" className="-space-x-1.5">
                {participants.slice(0, 5).map((p) => (
                  <PlayerAvatar key={p._id} player={p} size="sm" />
                ))}
              </AvatarGroup>
              <p className="text-sm">
                <span className="font-semibold">{participants.length}</span>{" "}
                jugadores ·{" "}
                <span className="font-semibold">{matchCount}</span>{" "}
                {matchCount === 1 ? "partido" : "partidos"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Tocá para ver tabla, próximo partido y resultados
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  )
}
