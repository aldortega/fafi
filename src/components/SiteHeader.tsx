import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  const user = useQuery(api.auth.getCurrentUser)

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-semibold">
            Fafi
          </Link>
          {user ? (
            <Link
              to="/players"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Jugadores
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.name ?? user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => authClient.signOut()}
              >
                Salir
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
