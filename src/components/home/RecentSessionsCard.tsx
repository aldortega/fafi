import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { CalendarDays, ChevronRight, Plus } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const recentDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
})

export function RecentSessionsCard() {
  const sessions = useQuery(api.sessions.listFinished)
  const recent = sessions?.slice(0, 5) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Últimas jornadas</CardTitle>
        {sessions && sessions.length > 0 ? (
          <Button
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground"
            asChild
          >
            <Link to="/history">Ver todas →</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {sessions === undefined ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Todavía no hay sesiones cerradas. Creá la primera.
            </p>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/sessions/new">
                <Plus />
                Nueva jornada
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col">
            {recent.map((row, i) => {
              const when = row.session.finishedAt ?? row.session.createdAt
              return (
                <li key={row.session._id}>
                  {i > 0 ? <Separator /> : null}
                  <Link
                    to="/history/$sessionId"
                    params={{ sessionId: row.session._id }}
                    className="group flex items-center justify-between gap-3 py-2.5 -mx-2 px-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <CalendarDays className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {recentDateFormatter.format(when)}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {row.matchCount} partidos · {row.participantCount} jug.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
