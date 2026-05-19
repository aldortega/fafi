import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { JornadaHeader } from "@/components/jornada/JornadaHeader"
import { NextMatchCard } from "@/components/jornada/NextMatchCard"
import { TodayTableCard } from "@/components/jornada/TodayTableCard"
import { ParticipantsCard } from "@/components/jornada/ParticipantsCard"
import { TodayResultsCard } from "@/components/jornada/TodayResultsCard"

export const Route = createFileRoute("/jornada")({ component: JornadaPage })

function JornadaPage() {
  const user = useQuery(api.auth.getCurrentUser)
  const active = useQuery(api.sessions.getActive)
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Jornada</h2>
        </header>
        <div className="flex-1 overflow-auto">
          {user === undefined || active === undefined ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
          ) : !active ? (
            <EmptyJornada />
          ) : (
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 p-6 lg:grid-cols-3">
              <div className="flex flex-col gap-5 lg:col-span-2">
                <JornadaHeader
                  userName={user?.name ?? user?.email ?? "Jugador"}
                  sessionId={active.session._id}
                />
                <NextMatchCard
                  sessionId={active.session._id}
                  mode={active.session.mode ?? "2v2"}
                  participants={active.participants}
                />
                <TodayTableCard
                  sessionId={active.session._id}
                  participants={active.participants}
                />
              </div>
              <aside className="flex flex-col gap-5">
                <ParticipantsCard participants={active.participants} />
                <TodayResultsCard
                  sessionId={active.session._id}
                  participants={active.participants}
                />
              </aside>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function EmptyJornada() {
  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              No hay jornada activa
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creá una nueva para empezar a anotar partidos.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/sessions/new">
              <Plus />
              Nueva jornada
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
