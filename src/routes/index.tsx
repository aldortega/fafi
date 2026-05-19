import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { useNow } from "@/lib/useNow"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { HomeHeader } from "@/components/home/HomeHeader"
import { ActiveJornadaPreview } from "@/components/home/ActiveJornadaPreview"
import { MyStatsCard } from "@/components/home/MyStatsCard"
import { GlobalSummaryCard } from "@/components/home/GlobalSummaryCard"
import { RecentSessionsCard } from "@/components/home/RecentSessionsCard"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const user = useQuery(api.auth.getCurrentUser)
  const ensureCurrentPlayer = useMutation(api.players.ensureCurrentPlayer)

  useEffect(() => {
    if (user) {
      void ensureCurrentPlayer({})
    }
  }, [user, ensureCurrentPlayer])

  if (user === undefined) {
    return <LoadingView />
  }

  if (!user) {
    return <LoginView />
  }

  return <SignedInHome userName={user.name ?? user.email ?? "Jugador"} />
}

function LoadingView() {
  return (
    <main className="container mx-auto p-6">
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </main>
  )
}

function LoginView() {
  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Fafi</h1>
      <p className="text-muted-foreground">
        Entrá para empezar a organizar la jornada.
      </p>
      <Button
        onClick={() =>
          authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
          })
        }
      >
        Entrar con Google
      </Button>
    </main>
  )
}

function SignedInHome({ userName }: { userName: string }) {
  const active = useQuery(api.sessions.getActive)
  const now = useNow()

  if (active === undefined) {
    return <LoadingView />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Inicio</h2>
          <div className="ml-auto text-xs text-muted-foreground">{now}</div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-[900px] flex-col gap-5 p-6">
            <HomeHeader userName={userName} hasSession={!!active} now={now} />
            {active ? (
              <ActiveJornadaPreview
                sessionId={active.session._id}
                participants={active.participants}
                mode={active.session.mode ?? "2v2"}
              />
            ) : null}
            <MyStatsCard />
            <GlobalSummaryCard />
            <RecentSessionsCard />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
