import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Edit3, Plus } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"

export function JornadaHeader({
  userName,
  sessionId,
}: {
  userName: string
  sessionId: Id<"sessions">
}) {
  const finish = useMutation(api.sessions.finish)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClose() {
    if (!window.confirm("¿Cerrar la jornada? No se va a poder reabrir.")) return
    setError(null)
    setFinishing(true)
    try {
      await finish({ sessionId })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la jornada")
    } finally {
      setFinishing(false)
    }
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenas, {userName}.
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={onClose}
          disabled={finishing}
        >
          <Edit3 />
          {finishing ? "Cerrando..." : "Cerrar jornada"}
        </Button>
        <Button className="rounded-full" asChild>
          <Link to="/matches/new">
            <Plus />
            Nuevo partido
          </Link>
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </header>
  )
}
