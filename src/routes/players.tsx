import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/players")({ component: PlayersPage })

function PlayersPage() {
  const players = useQuery(api.players.list)
  const createManaged = useMutation(api.players.createManaged)

  const [name, setName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Ingresá un nombre")
      return
    }
    setSubmitting(true)
    try {
      await createManaged({
        name: trimmed,
        avatarUrl: avatarUrl.trim() || undefined,
      })
      setName("")
      setAvatarUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear jugador")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Jugadores</h1>
        <p className="text-sm text-muted-foreground">
          Usuarios registrados y perfiles gestionados.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Agregar jugador gestionado</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="player-name">
              Nombre
            </label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan"
              disabled={submitting}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground" htmlFor="player-avatar">
              Avatar URL (opcional)
            </label>
            <Input
              id="player-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              disabled={submitting}
              autoComplete="off"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Lista</h2>
        {players === undefined ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : players.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay jugadores.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {players.map((p) => (
              <li
                key={p._id}
                className="flex items-center justify-between gap-3 p-3"
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
                <span className="text-xs text-muted-foreground">
                  {p.userId ? "Registrado" : "Gestionado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
