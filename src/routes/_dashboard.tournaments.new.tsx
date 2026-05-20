import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { Minus, Plus } from "lucide-react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_dashboard/tournaments/new")({
  component: NewTournamentPage,
})

const MIN_TEAMS = 2
const MAX_TEAMS = 8

function NewTournamentPage() {
  const navigate = useNavigate()
  const active = useQuery(api.sessions.getActive)
  const activeTournament = useQuery(
    api.tournaments.getActiveBySession,
    active?.session ? { sessionId: active.session._id } : "skip",
  )
  const createLiga = useMutation(api.tournaments.createLiga)

  const [name, setName] = useState("")
  const [teamCount, setTeamCount] = useState(2)
  const [teamNames, setTeamNames] = useState<Array<string>>([
    "Equipo 1",
    "Equipo 2",
  ])
  const [assign, setAssign] = useState<Map<Id<"players">, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teams: Array<Array<Id<"players">>> = useMemo(() => {
    const out: Array<Array<Id<"players">>> = Array.from(
      { length: teamCount },
      () => [],
    )
    for (const [pid, idx] of assign) {
      if (idx < teamCount) out[idx].push(pid)
    }
    return out
  }, [assign, teamCount])

  if (active === undefined || activeTournament === undefined) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Crear torneo</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </>
    )
  }

  if (!active) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Crear torneo</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground">
            No hay sesión activa. Creá una primero.
          </p>
        </div>
      </>
    )
  }

  if (activeTournament) {
    return (
      <>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Crear torneo</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground">
            Ya hay un torneo activo en esta sesión.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              navigate({
                to: "/tournaments/$tournamentId",
                params: { tournamentId: activeTournament._id },
              })
            }
          >
            Ir al torneo
          </Button>
        </div>
      </>
    )
  }

  function changeTeamCount(next: number) {
    const clamped = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, next))
    setTeamCount(clamped)
    setTeamNames((prev) => {
      const out = [...prev]
      while (out.length < clamped) out.push(`Equipo ${out.length + 1}`)
      out.length = clamped
      return out
    })
    setAssign((prev) => {
      const next = new Map<Id<"players">, number>()
      for (const [pid, idx] of prev) {
        if (idx < clamped) next.set(pid, idx)
      }
      return next
    })
  }

  function setSlot(pid: Id<"players">, idx: number) {
    setAssign((prev) => {
      const next = new Map(prev)
      if (next.get(pid) === idx) next.delete(pid)
      else next.set(pid, idx)
      return next
    })
  }

  const participants = active.participants
  const teamSizes = teams.map((t) => t.length)
  const allSameSize =
    teamSizes.every((s) => s === teamSizes[0]) && teamSizes[0] > 0
  const canSubmit = allSameSize && teamNames.every((n) => n.trim() !== "")

  async function onSubmit() {
    if (!active) return
    setError(null)
    setSubmitting(true)
    try {
      const id = await createLiga({
        sessionId: active.session._id,
        name: name.trim() || undefined,
        teams: teams.map((players, i) => ({
          name: teamNames[i],
          players,
        })),
      })
      await navigate({
        to: "/tournaments/$tournamentId",
        params: { tournamentId: id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el torneo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
        <h2 className="text-sm font-medium">Crear torneo · Liga</h2>
      </header>

      <div className="flex-1 overflow-auto">
        <main className="container mx-auto flex max-w-3xl flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground -mt-2">
            Equipos fijos · todos contra todos.
          </p>

          <section className="grid gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Nombre (opcional)</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Liga del viernes"
              />
            </label>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Cantidad de equipos</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => changeTeamCount(teamCount - 1)}
                  disabled={teamCount <= MIN_TEAMS}
                >
                  <Minus />
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {teamCount}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => changeTeamCount(teamCount + 1)}
                  disabled={teamCount >= MAX_TEAMS}
                >
                  <Plus />
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {teamNames.map((tn, i) => (
                <label key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Equipo {i + 1} · {teamSizes[i]} jugador
                    {teamSizes[i] === 1 ? "" : "es"}
                  </span>
                  <Input
                    value={tn}
                    onChange={(e) =>
                      setTeamNames((prev) => {
                        const next = [...prev]
                        next[i] = e.target.value
                        return next
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-2">
            <h2 className="text-sm font-medium">Asignar jugadores</h2>
            <ul className="flex flex-col divide-y rounded-lg border">
              {participants.map((p) => {
                const idx = assign.get(p._id)
                return (
                  <li
                    key={p._id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <PlayerRow player={p} />
                    <div className="flex flex-wrap gap-1">
                      {teamNames.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSlot(p._id, i)}
                          className={cn(
                            "h-8 min-w-8 rounded border px-2 text-xs font-medium transition-colors",
                            idx === i
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input hover:bg-muted",
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
            {!allSameSize ? (
              <p className="text-xs text-muted-foreground">
                Todos los equipos deben tener la misma cantidad de jugadores.
              </p>
            ) : null}
          </section>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Creando..." : "Crear torneo"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/jornada" })}
              disabled={submitting}
            >
              Cancelar
            </Button>
          </div>
        </main>
      </div>
    </>
  )
}

function PlayerRow({ player }: { player: Doc<"players"> }) {
  return (
    <div className="flex items-center gap-3">
      {player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt=""
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {player.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="text-sm">{player.name}</span>
    </div>
  )
}
