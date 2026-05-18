import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/sessions/new")({ component: NewSessionPage })

function NewSessionPage() {
  const navigate = useNavigate()
  const players = useQuery(api.players.list)
  const active = useQuery(api.sessions.getActive)
  const createSession = useMutation(api.sessions.create)

  const [selected, setSelected] = useState<Set<Id<"players">>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: Id<"players">) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onStart() {
    setError(null)
    if (selected.size === 0) {
      setError("Elegí al menos un participante")
      return
    }
    setSubmitting(true)
    try {
      await createSession({ playerIds: Array.from(selected) })
      await navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la sesión")
    } finally {
      setSubmitting(false)
    }
  }

  if (active === undefined || players === undefined) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (active) {
    return (
      <main className="container mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">
          Ya hay una sesión activa. Cerrala antes de crear una nueva.
        </p>
      </main>
    )
  }

  return (
    <main className="container mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Crear sesión</h1>
        <p className="text-sm text-muted-foreground">
          Elegí quiénes están presentes hoy.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">
          Participantes ({selected.size})
        </h2>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay jugadores todavía. Agregá perfiles en la pantalla Jugadores.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {players.map((p) => {
              const isSelected = selected.has(p._id)
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => toggle(p._id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 p-3 text-left transition-colors",
                      isSelected ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded border text-xs",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                      aria-hidden
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button onClick={onStart} disabled={submitting || selected.size === 0}>
          {submitting ? "Iniciando..." : "Iniciar jornada"}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          disabled={submitting}
        >
          Cancelar
        </Button>
      </div>
    </main>
  )
}
