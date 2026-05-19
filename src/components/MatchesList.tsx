import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { FunctionReturnType } from "convex/server"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Matches = FunctionReturnType<typeof api.matches.listBySession>
type Match = Matches[number]

export function MatchesList({
  matches,
  participants,
  currentPlayerId,
  sessionCreatedBy,
}: {
  matches: Matches
  participants: Array<Doc<"players">>
  currentPlayerId: Id<"players"> | null
  sessionCreatedBy: Id<"players">
}) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin partidos cargados todavía.
      </p>
    )
  }

  const playerById = new Map(participants.map((p) => [p._id, p] as const))

  return (
    <ul className="flex flex-col gap-3">
      {matches.map((m) => (
        <MatchCard
          key={m._id}
          match={m}
          participants={participants}
          playerById={playerById}
          currentPlayerId={currentPlayerId}
          sessionCreatedBy={sessionCreatedBy}
        />
      ))}
    </ul>
  )
}

function MatchCard({
  match,
  participants,
  playerById,
  currentPlayerId,
  sessionCreatedBy,
}: {
  match: Match
  participants: Array<Doc<"players">>
  playerById: Map<Id<"players">, Doc<"players">>
  currentPlayerId: Id<"players"> | null
  sessionCreatedBy: Id<"players">
}) {
  const [editing, setEditing] = useState(false)
  const [showAudit, setShowAudit] = useState(false)

  const canEdit =
    currentPlayerId !== null &&
    (currentPlayerId === match.createdBy ||
      currentPlayerId === sessionCreatedBy)

  return (
    <li className="rounded-lg border p-4">
      {editing ? (
        <MatchEditor
          match={match}
          participants={participants}
          onDone={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <ScoreLine match={match} playerById={playerById} />
            <div className="flex shrink-0 gap-2">
              {match.edits.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAudit((s) => !s)}
                >
                  {match.edits.length} edit{match.edits.length === 1 ? "" : "s"}
                </Button>
              ) : null}
              {canEdit ? (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              ) : null}
            </div>
          </div>
          {showAudit ? (
            <AuditTrail edits={match.edits} playerById={playerById} />
          ) : null}
        </>
      )}
    </li>
  )
}

function ScoreLine({
  match,
  playerById,
}: {
  match: Match
  playerById: Map<Id<"players">, Doc<"players">>
}) {
  const names = (ids: Array<Id<"players">>) =>
    ids.map((id) => playerById.get(id)?.name ?? "?").join(", ")

  return (
    <div className="flex flex-1 items-center gap-3">
      <TeamLabel
        names={names(match.teamA.players)}
        bold={match.winner === "A"}
        align="right"
      />
      <div className="flex shrink-0 items-baseline gap-2 font-mono text-lg">
        <span className={cn(match.winner === "A" && "font-semibold")}>
          {match.scoreA}
        </span>
        <span className="text-muted-foreground">—</span>
        <span className={cn(match.winner === "B" && "font-semibold")}>
          {match.scoreB}
        </span>
      </div>
      <TeamLabel
        names={names(match.teamB.players)}
        bold={match.winner === "B"}
        align="left"
      />
    </div>
  )
}

function TeamLabel({
  names,
  bold,
  align,
}: {
  names: string
  bold: boolean
  align: "left" | "right"
}) {
  return (
    <span
      className={cn(
        "flex-1 text-sm",
        align === "right" ? "text-right" : "text-left",
        bold ? "font-semibold" : "text-muted-foreground",
      )}
    >
      {names}
    </span>
  )
}

function AuditTrail({
  edits,
  playerById,
}: {
  edits: Match["edits"]
  playerById: Map<Id<"players">, Doc<"players">>
}) {
  return (
    <ol className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
      {edits.map((e) => {
        const editor = playerById.get(e.editedBy)?.name ?? "alguien"
        const when = new Date(e.editedAt).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        })
        return (
          <li key={e._id}>
            {editor} · {when} · {e.before.scoreA}–{e.before.scoreB} → {e.after.scoreA}–{e.after.scoreB}
          </li>
        )
      })}
    </ol>
  )
}

type Side = "A" | "B" | null

function MatchEditor({
  match,
  participants,
  onDone,
}: {
  match: Match
  participants: Array<Doc<"players">>
  onDone: () => void
}) {
  const updateMatch = useMutation(api.matches.update)
  const initialAssign = new Map<Id<"players">, Side>()
  for (const id of match.teamA.players) initialAssign.set(id, "A")
  for (const id of match.teamB.players) initialAssign.set(id, "B")

  const [assign, setAssign] = useState<Map<Id<"players">, Side>>(initialAssign)
  const [scoreA, setScoreA] = useState(String(match.scoreA))
  const [scoreB, setScoreB] = useState(String(match.scoreB))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function onSave() {
    setError(null)
    const a = Number(scoreA)
    const b = Number(scoreB)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      setError("Goles inválidos")
      return
    }
    if (a === b) {
      setError("No se permiten empates")
      return
    }
    if (teamA.length === 0 || teamA.length !== teamB.length) {
      setError("Equipos inválidos")
      return
    }
    setSubmitting(true)
    try {
      await updateMatch({
        matchId: match._id,
        teamA: { players: teamA },
        teamB: { players: teamB },
        scoreA: a,
        scoreB: b,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y rounded border">
        {participants.map((p) => {
          const side = assign.get(p._id) ?? null
          return (
            <li
              key={p._id}
              className="flex items-center justify-between gap-3 p-2"
            >
              <span className="text-sm">{p.name}</span>
              <div className="flex gap-1">
                {(["A", "B"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(p._id, side === s ? null : s)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded border text-xs font-medium",
                      side === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-muted",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          min={0}
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
        />
        <Input
          type="number"
          min={0}
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={submitting}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
