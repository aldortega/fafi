import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/matches/new")({ component: NewMatchPage })

type Side = "A" | "B" | null

function NewMatchPage() {
  const navigate = useNavigate()
  const active = useQuery(api.sessions.getActive)
  const createMatch = useMutation(api.matches.create)

  const [assign, setAssign] = useState<Map<Id<"players">, Side>>(new Map())
  const [scoreA, setScoreA] = useState("")
  const [scoreB, setScoreB] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (active === undefined) {
    return (
      <main className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  if (!active) {
    return (
      <main className="container mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">
          No hay sesión activa. Creá una primero.
        </p>
      </main>
    )
  }

  const participants = active.participants

  function setSide(id: Id<"players">, side: Side) {
    setAssign((prev) => {
      const next = new Map(prev)
      if (side === null) next.delete(id)
      else next.set(id, side)
      return next
    })
  }

  const teamA: Array<Id<"players">> = []
  const teamB: Array<Id<"players">> = []
  for (const [id, side] of assign) {
    if (side === "A") teamA.push(id)
    else if (side === "B") teamB.push(id)
  }

  const canSubmit =
    teamA.length > 0 &&
    teamA.length === teamB.length &&
    scoreA !== "" &&
    scoreB !== "" &&
    scoreA !== scoreB

  async function onSubmit() {
    if (!active) return
    setError(null)
    const a = Number(scoreA)
    const b = Number(scoreB)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("Los goles deben ser enteros no negativos")
      return
    }
    if (a === b) {
      setError("No se permiten empates")
      return
    }
    setSubmitting(true)
    try {
      await createMatch({
        sessionId: active.session._id,
        teamA: { players: teamA },
        teamB: { players: teamB },
        scoreA: a,
        scoreB: b,
      })
      await navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Nuevo partido</h1>
        <p className="text-sm text-muted-foreground">
          Asigná jugadores a cada equipo y cargá el resultado.
        </p>
      </header>

      <section className="grid gap-2">
        <h2 className="text-sm font-medium">
          Jugadores · A {teamA.length} vs B {teamB.length}
        </h2>
        <ul className="flex flex-col divide-y rounded-lg border">
          {participants.map((p) => {
            const side = assign.get(p._id) ?? null
            return (
              <li
                key={p._id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <PlayerRow player={p} />
                <div className="flex gap-1">
                  <SideButton
                    active={side === "A"}
                    onClick={() => setSide(p._id, side === "A" ? null : "A")}
                  >
                    A
                  </SideButton>
                  <SideButton
                    active={side === "B"}
                    onClick={() => setSide(p._id, side === "B" ? null : "B")}
                  >
                    B
                  </SideButton>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Goles A</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Goles B</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
          />
        </label>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Guardando..." : "Guardar partido"}
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

function SideButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded border text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input hover:bg-muted",
      )}
    >
      {children}
    </button>
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
