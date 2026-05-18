import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

type ActiveSession = NonNullable<FunctionReturnType<typeof api.sessions.getActive>>

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
    return (
      <main className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (!user) {
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

  return <SignedInHome userName={user.name ?? user.email ?? "Jugador"} />
}

function SignedInHome({ userName }: { userName: string }) {
  const active = useQuery(api.sessions.getActive)

  if (active === undefined) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (!active) {
    return (
      <main className="container mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center">
        <h1 className="text-2xl font-semibold">Hola, {userName}</h1>
        <p className="text-muted-foreground">
          No hay una jornada activa. Armá una para empezar.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/sessions/new">Crear sesión</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/players">Ver jugadores</Link>
          </Button>
        </div>
      </main>
    )
  }

  return <ActiveSessionView session={active.session} participants={active.participants} />
}

function ActiveSessionView({
  session,
  participants,
}: {
  session: ActiveSession["session"]
  participants: ActiveSession["participants"]
}) {
  const finish = useMutation(api.sessions.finish)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClose() {
    if (!window.confirm("¿Cerrar la sesión? No se va a poder reabrir.")) return
    setError(null)
    setFinishing(true)
    try {
      await finish({ sessionId: session._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la sesión")
    } finally {
      setFinishing(false)
    }
  }

  const startedAt = new Date(session.createdAt).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <main className="container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Jornada activa</h1>
          <p className="text-sm text-muted-foreground">Iniciada: {startedAt}</p>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={finishing}
        >
          {finishing ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </header>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">
          Participantes ({participants.length})
        </h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin participantes.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {participants.map((p) => (
              <li key={p._id} className="flex items-center gap-3 p-3">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm">{p.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
