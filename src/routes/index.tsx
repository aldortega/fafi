import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const user = useQuery(api.auth.getCurrentUser)
  const ensureCurrentPlayer = useMutation(api.players.ensureCurrentPlayer)

  useEffect(() => {
    if (user) {
      void ensureCurrentPlayer({})
    }
  }, [user, ensureCurrentPlayer])

  return (
    <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      {user ? (
        <>
          <h1 className="text-3xl font-semibold">Hola, {user.name ?? user.email}</h1>
          <p className="text-muted-foreground">
            Pronto vas a poder armar una jornada acá.
          </p>
          <Button asChild variant="outline">
            <Link to="/players">Ver jugadores</Link>
          </Button>
        </>
      ) : (
        <>
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
        </>
      )}
    </main>
  )
}
