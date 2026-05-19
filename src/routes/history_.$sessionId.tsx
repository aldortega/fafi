import { useMemo } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ArrowLeft, CalendarDays, History } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { buildSummary, type DetailData } from "@/lib/session-summary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { SummaryCards } from "@/components/history-detail/SummaryCards"
import { WinsBarCard } from "@/components/history-detail/WinsBarCard"
import { GoalsAreaCard } from "@/components/history-detail/GoalsAreaCard"
import { RankingCard } from "@/components/history-detail/RankingCard"
import { MatchRow } from "@/components/history-detail/MatchRow"
import { PlayerChip } from "@/components/history-detail/PlayerChip"

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
            <GoalsAreaCard
              timeline={summary.goalsTimeline}
              avg={summary.avgGoals}
            />
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
