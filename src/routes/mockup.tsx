import { createFileRoute } from "@tanstack/react-router"
import {
  Bell,
  Clock,
  Edit3,
  Home as HomeIcon,
  LineChart,
  Plus,
  RotateCw,
  Search,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/mockup")({ component: MockupHome })

type AvatarColor = "rose" | "sky" | "lime" | "violet" | "amber" | "teal" | "pink" | "blue"

const avatarBg: Record<AvatarColor, string> = {
  rose: "bg-rose-200 text-rose-900",
  sky: "bg-sky-200 text-sky-900",
  lime: "bg-lime-200 text-lime-900",
  violet: "bg-violet-200 text-violet-900",
  amber: "bg-amber-200 text-amber-900",
  teal: "bg-teal-200 text-teal-900",
  pink: "bg-pink-200 text-pink-900",
  blue: "bg-blue-200 text-blue-900",
}

type Player = { code: string; name: string; color: AvatarColor }

const players: Record<string, Player> = {
  TA: { code: "TA", name: "Tato", color: "rose" },
  LU: { code: "LU", name: "Lucho", color: "sky" },
  JU: { code: "JU", name: "Juancho", color: "lime" },
  MA: { code: "MA", name: "Mati", color: "teal" },
  NA: { code: "NA", name: "Nacho", color: "rose" },
  BR: { code: "BR", name: "Bruno", color: "blue" },
  FE: { code: "FE", name: "Fede", color: "pink" },
  SA: { code: "SA", name: "Santi", color: "amber" },
  PE: { code: "PE", name: "Pepe", color: "sky" },
}

function PlayerAvatar({
  code,
  size = "default",
}: {
  code: string
  size?: "sm" | "default" | "lg"
}) {
  const p = players[code]
  return (
    <Avatar size={size}>
      <AvatarFallback className={cn("font-semibold", avatarBg[p?.color ?? "sky"])}>
        {code}
      </AvatarFallback>
    </Avatar>
  )
}

function Pair({
  codes,
  size = "default",
}: {
  codes: Array<string>
  size?: "sm" | "default" | "lg"
}) {
  return (
    <AvatarGroup data-size={size}>
      {codes.map((c) => (
        <PlayerAvatar key={c} code={c} size={size} />
      ))}
    </AvatarGroup>
  )
}

function MockupHome() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_220)] text-foreground">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[220px_minmax(0,1fr)_320px] gap-6 p-6">
        <Sidebar />
        <MainColumn />
        <RightColumn />
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
          fafi
          <span className="size-1.5 rounded-full bg-lime-500" />
        </div>
        <Button variant="outline" size="icon" className="rounded-full">
          <Search />
        </Button>
      </div>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-lime-500" />
            Jornada activa
          </div>
          <CardTitle className="text-sm">Domingo · 8 amigos</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarGroup data-size="sm" className="-space-x-1.5">
            {["TA", "JU", "MA", "LU", "NA", "BR", "FE", "SA"].map((c) => (
              <PlayerAvatar key={c} code={c} size="sm" />
            ))}
          </AvatarGroup>
        </CardContent>
      </Card>

      <nav className="flex flex-col gap-1 text-sm">
        <NavItem icon={<HomeIcon className="size-4" />} label="Hoy" active />
        <NavItem icon={<Plus className="size-4" />} label="Nueva jornada" />
        <NavItem icon={<Trophy className="size-4" />} label="Torneo" badge="EN CURSO" />
        <NavItem icon={<RotateCw className="size-4" />} label="Rotación" />
        <NavItem icon={<LineChart className="size-4" />} label="Estadísticas" />
        <NavItem icon={<Clock className="size-4" />} label="Historial" />
      </nav>

      <Card size="sm" className="mt-auto">
        <CardContent className="flex items-center gap-3">
          <PlayerAvatar code="TA" />
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">Tato</p>
            <p className="text-xs text-muted-foreground">67% · racha 4</p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function NavItem({
  icon,
  label,
  active,
  badge,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: string
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors",
        active ? "bg-card shadow-sm ring-1 ring-foreground/10" : "text-muted-foreground hover:bg-card/60",
      )}
    >
      {icon}
      <span className="flex-1 text-sm">{label}</span>
      {badge ? (
        <Badge className="bg-lime-200 text-lime-900 hover:bg-lime-200">{badge}</Badge>
      ) : null}
    </button>
  )
}

function MainColumn() {
  return (
    <main className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Domingo · 21:14
          </p>
          <h1 className="mt-1 font-heading text-4xl font-semibold tracking-tight">
            Buenas, Tato.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hay jornada armada y un torneo de copa en curso.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="rounded-full">
            <Edit3 />
            Cerrar jornada
          </Button>
          <Button className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
            <Plus />
            Nuevo partido
          </Button>
        </div>
      </header>

      <CurrentMatchCard />

      <div className="grid grid-cols-2 gap-5">
        <CupCard />
        <ResultsCard />
      </div>

      <TableCard />
    </main>
  )
}

function CurrentMatchCard() {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-10 size-80 rounded-full bg-lime-100/60 blur-2xl" />
      <CardHeader className="relative flex flex-row items-start justify-between">
        <Badge className="bg-lime-200 text-lime-900 hover:bg-lime-200">EN CANCHA</Badge>
        <p className="text-xs text-muted-foreground">PARTIDO 4 · empezó hace 6 min</p>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex items-center gap-4">
            <Pair codes={["TA", "LU"]} size="lg" />
            <div>
              <p className="text-xl font-semibold">Tato · Lucho</p>
              <p className="text-xs text-muted-foreground">compañeros · 84% juntos</p>
            </div>
          </div>
          <div className="text-2xl font-medium text-muted-foreground">vs</div>
          <div className="flex items-center justify-end gap-4 text-right">
            <div>
              <p className="text-xl font-semibold">Juancho · Mati</p>
              <p className="text-xs text-muted-foreground">primera vez juntos</p>
            </div>
            <Pair codes={["JU", "MA"]} size="lg" />
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex items-end justify-between">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Mejor compañero
              </p>
              <p className="mt-0.5 text-sm font-semibold">Tato + Lucho</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Histórico
              </p>
              <p className="mt-0.5 text-sm font-semibold">3–1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full">
              <Edit3 />
              Editar equipos
            </Button>
            <Button className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
              Cargar resultado →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CupCard() {
  return (
    <Card className="relative overflow-hidden bg-lime-100/70">
      <div className="pointer-events-none absolute -bottom-16 -right-16 size-72 rounded-full bg-lime-200/70 blur-2xl" />
      <CardHeader className="relative flex flex-row items-start justify-between">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime-900">
          <Trophy className="size-4" />
          COPA DEL DOMINGO
        </div>
        <Badge variant="secondary" className="bg-background">
          Eliminatoria
        </Badge>
      </CardHeader>
      <CardContent className="relative">
        <CardTitle className="text-xl">Semis jugadas · final pendiente</CardTitle>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <SemiRow a={["TA", "LU"]} b={["NA", "BR"]} sa={4} sb={2} winner="a" />
          <SemiRow a={["JU", "MA"]} b={["FE", "SA"]} sa={1} sb={3} winner="b" />
        </div>

        <Button className="mt-5 w-full rounded-2xl bg-[oklch(0.27_0.05_150)] py-6 text-white hover:bg-[oklch(0.3_0.05_150)]">
          Final: Tato·Lucho vs Fede·Santi →
        </Button>
      </CardContent>
    </Card>
  )
}

function SemiRow({
  a,
  b,
  sa,
  sb,
  winner,
}: {
  a: Array<string>
  b: Array<string>
  sa: number
  sb: number
  winner: "a" | "b"
}) {
  return (
    <div className="rounded-xl bg-background p-3 text-sm">
      <Line codes={a} score={sa} bold={winner === "a"} />
      <Separator className="my-1" />
      <Line codes={b} score={sb} bold={winner === "b"} />
    </div>
  )
}

function Line({
  codes,
  score,
  bold,
}: {
  codes: Array<string>
  score: number
  bold?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        bold ? "font-semibold" : "text-muted-foreground",
      )}
    >
      <span>{codes.map((c) => players[c]?.name).join("·")}</span>
      <span>{score}</span>
    </div>
  )
}

function ResultsCard() {
  const results: Array<{
    a: Array<string>
    b: Array<string>
    sa: number
    sb: number
    ago: string
  }> = [
    { a: ["TA", "LU"], b: ["NA", "BR"], sa: 4, sb: 2, ago: "hace 12 min" },
    { a: ["JU", "MA"], b: ["FE", "SA"], sa: 1, sb: 3, ago: "hace 28 min" },
    { a: ["TA", "LU"], b: ["FE", "SA"], sa: 2, sb: 2, ago: "3–4 penales" },
  ]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Resultados de hoy</CardTitle>
        <Button variant="link" size="sm" className="text-xs text-muted-foreground">
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {results.map((r, i) => (
            <div key={i}>
              {i > 0 ? <Separator /> : null}
              <ResultRow {...r} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultRow({
  a,
  b,
  sa,
  sb,
  ago,
}: {
  a: Array<string>
  b: Array<string>
  sa: number
  sb: number
  ago: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Pair codes={a} size="sm" />
          <span>{a.map((c) => players[c]?.name).join(" · ")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Pair codes={b} size="sm" />
          <span>{b.map((c) => players[c]?.name).join(" · ")}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-semibold tabular-nums">
          {sa} – {sb}
        </p>
        <p className="text-[11px] text-muted-foreground">{ago}</p>
      </div>
    </div>
  )
}

function TableCard() {
  const rows = [
    { code: "TA", pj: 3, pg: 3, pe: 0, pp: 0, dif: "+5", pts: 9 },
    { code: "LU", pj: 3, pg: 2, pe: 1, pp: 0, dif: "+3", pts: 7 },
    { code: "FE", pj: 3, pg: 1, pe: 1, pp: 1, dif: "0", pts: 4 },
    { code: "MA", pj: 2, pg: 0, pe: 0, pp: 2, dif: "-4", pts: 0 },
  ]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tabla del día</CardTitle>
        <Badge variant="outline">solo partidos sueltos</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead>PJ</TableHead>
              <TableHead>PG</TableHead>
              <TableHead>PE</TableHead>
              <TableHead>PP</TableHead>
              <TableHead>DIF</TableHead>
              <TableHead className="text-right">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.code} className={cn(i === 0 && "bg-lime-100/60 hover:bg-lime-100/60")}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar code={r.code} size="sm" />
                    <span className="font-medium">{players[r.code]?.name}</span>
                  </div>
                </TableCell>
                <TableCell>{r.pj}</TableCell>
                <TableCell>{r.pg}</TableCell>
                <TableCell>{r.pe}</TableCell>
                <TableCell>{r.pp}</TableCell>
                <TableCell className="tabular-nums">{r.dif}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {r.pts}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RightColumn() {
  return (
    <aside className="flex flex-col gap-5 pt-2">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Cola
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <QueueRow
            codes={["NA", "BR"]}
            name="Nacho · Bruno"
            wait="esperan: 2 partidos"
            tag="entran ahora"
          />
          <QueueRow
            codes={["FE", "SA"]}
            name="Fede · Santi"
            wait="esperan: recién"
            tag="entran ahora"
          />
          <QueueRow
            codes={["PE"]}
            name="Pepe"
            wait="esperan: 1 partido"
            tag="próximo"
            muted
          />
          <QueueRow
            codes={["MA"]}
            name="Mariano"
            wait="esperan: 1 partido"
            tag="próximo"
            muted
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Resumen del día
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Partidos" value="3" sub="" />
          <Stat label="Goles" value="18" sub="2.3 por partido" />
          <Stat label="Tiempo" value="1:17" sub="en cancha" />
          <Stat label="MVP" value="Tato" sub="3 ganados" />
        </div>
      </div>

      <Card size="sm">
        <CardContent>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4" />
            Pepe lleva 2 turnos
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Nadie descansa 2 seguidos — entra el próximo aunque se rompa la dupla.
          </p>
        </CardContent>
      </Card>
    </aside>
  )
}

function QueueRow({
  codes,
  name,
  wait,
  tag,
  muted,
}: {
  codes: Array<string>
  name: string
  wait: string
  tag: string
  muted?: boolean
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <Pair codes={codes} size="sm" />
        <div className="flex-1 leading-tight">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[11px] text-muted-foreground">{wait}</p>
        </div>
        <Badge
          className={cn(
            muted
              ? "bg-muted text-muted-foreground hover:bg-muted"
              : "bg-lime-200 text-lime-900 hover:bg-lime-200",
          )}
        >
          {tag}
        </Badge>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-heading text-2xl font-semibold leading-none">{value}</p>
        {sub ? <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}
