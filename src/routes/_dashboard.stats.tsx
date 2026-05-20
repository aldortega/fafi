import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SummarySection } from "@/components/stats/SummarySection"
import { ChartsGrid } from "@/components/stats/ChartsGrid"
import { RankingTable } from "@/components/stats/RankingTable"

export const Route = createFileRoute("/_dashboard/stats")({ component: StatsPage })

function StatsPage() {
  const ranking = useQuery(api.stats.globalRanking)
  const summary = useQuery(api.stats.globalSummary)
  const duos = useQuery(api.stats.bestDuos)

  return (
    <>
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

          {ranking === undefined ||
          summary === undefined ||
          duos === undefined ? (
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
    </>
  )
}
