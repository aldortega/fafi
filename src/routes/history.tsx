import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { CalendarDays, ChevronRight, Users } from "lucide-react"
import { api } from "../../convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export const Route = createFileRoute("/history")({ component: HistoryPage })

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
})

function HistoryPage() {
  const sessions = useQuery(api.sessions.listFinished)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Historial</h2>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-[900px] flex-col gap-6 p-6">
            <header>
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                Sesiones pasadas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas las jornadas cerradas, en orden cronológico.
              </p>
            </header>

            {sessions === undefined ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay sesiones cerradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((row) => {
                  const when = row.session.finishedAt ?? row.session.createdAt
                  return (
                    <Link
                      key={row.session._id}
                      to="/history/$sessionId"
                      params={{ sessionId: row.session._id }}
                      className="group block"
                    >
                      <Card className="transition hover:border-foreground/30 hover:shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <CalendarDays className="size-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {dateFormatter.format(when)}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                Cerrada {timeFormatter.format(when)} ·{" "}
                                {row.createdByName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {row.session.mode ? (
                              <Badge variant="outline">{row.session.mode}</Badge>
                            ) : null}
                            <Badge variant="secondary">
                              {row.matchCount} partidos
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Users className="size-3" />
                              {row.participantCount}
                            </Badge>
                            <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
