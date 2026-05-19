import { createFileRoute } from "@tanstack/react-router"
import { Edit3, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export const Route = createFileRoute("/home-v2")({ component: HomeV2 })

type AvatarColor =
  | "rose"
  | "sky"
  | "lime"
  | "violet"
  | "amber"
  | "teal"
  | "pink"
  | "blue"

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
  NA: { code: "NA", name: "Nacho", color: "violet" },
  BR: { code: "BR", name: "Bruno", color: "blue" },
  FE: { code: "FE", name: "Fede", color: "pink" },
  SA: { code: "SA", name: "Santi", color: "amber" },
}

const participantCodes = ["TA", "LU", "JU", "MA", "NA", "BR", "FE", "SA"]

type Result = {
  a: Array<string>
  b: Array<string>
  sa: number
  sb: number
  ago: string
  penales?: string
}

const results: Array<Result> = [
  { a: ["TA", "LU"], b: ["NA", "BR"], sa: 4, sb: 2, ago: "hace 12 min" },
  { a: ["JU", "MA"], b: ["FE", "SA"], sa: 1, sb: 3, ago: "hace 28 min" },
  {
    a: ["TA", "LU"],
    b: ["FE", "SA"],
    sa: 2,
    sb: 2,
    ago: "hace 41 min",
    penales: "3-4 penales",
  },
  { a: ["NA", "BR"], b: ["JU", "MA"], sa: 2, sb: 0, ago: "hace 1 h" },
]

type TableRowData = {
  code: string
  pj: number
  pg: number
  pe: number
  pp: number
  dif: string
  pts: number
}

const tableRows: Array<TableRowData> = [
  { code: "TA", pj: 3, pg: 3, pe: 0, pp: 0, dif: "+5", pts: 9 },
  { code: "LU", pj: 3, pg: 2, pe: 1, pp: 0, dif: "+3", pts: 7 },
  { code: "FE", pj: 3, pg: 1, pe: 1, pp: 1, dif: "0", pts: 4 },
  { code: "SA", pj: 3, pg: 1, pe: 1, pp: 1, dif: "0", pts: 4 },
  { code: "NA", pj: 3, pg: 1, pe: 0, pp: 2, dif: "-1", pts: 3 },
  { code: "BR", pj: 3, pg: 1, pe: 0, pp: 2, dif: "-1", pts: 3 },
  { code: "JU", pj: 3, pg: 0, pe: 0, pp: 3, dif: "-3", pts: 0 },
  { code: "MA", pj: 3, pg: 0, pe: 0, pp: 3, dif: "-3", pts: 0 },
]

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
      <AvatarFallback
        className={cn("font-semibold", avatarBg[p?.color ?? "sky"])}
      >
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

function HomeV2() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 !self-center" />
          <h2 className="text-sm font-medium">Inicio</h2>
          <div className="ml-auto text-xs text-muted-foreground">
            Domingo · 21:14
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <HeaderCard />
              <CurrentMatchCard />
              <TodayTableCard />
            </div>
            <aside className="flex flex-col gap-5">
              <ParticipantsCard />
              <TodayResultsCard />
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HeaderCard() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          fafi
          <span className="size-1.5 rounded-full bg-lime-500" />
        </div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Buenas, Tato.
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge className="bg-lime-200 text-lime-900 hover:bg-lime-200">
            jornada activa
          </Badge>
          <span>Domingo · 21:14</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" className="rounded-full">
          <Edit3 />
          Cerrar jornada
        </Button>
        <Button className="rounded-full">
          <Plus />
          Nuevo partido
        </Button>
      </div>
    </header>
  )
}

function CurrentMatchCard() {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-10 size-72 rounded-full bg-lime-100/60 blur-2xl" />
      <CardHeader className="relative flex flex-row items-start justify-between">
        <Badge className="bg-lime-200 text-lime-900 hover:bg-lime-200">
          EN CANCHA
        </Badge>
        <p className="text-xs text-muted-foreground">
          PARTIDO 4 · empezó hace 6 min
        </p>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <div className="flex items-center gap-4">
            <Pair codes={["TA", "LU"]} size="lg" />
            <div>
              <p className="text-lg font-semibold">Tato · Lucho</p>
              <p className="text-xs text-muted-foreground">
                compañeros · 84% juntos
              </p>
            </div>
          </div>
          <div className="hidden text-2xl font-medium text-muted-foreground sm:block">
            vs
          </div>
          <div className="flex items-center gap-4 sm:justify-end sm:text-right">
            <div className="order-2 sm:order-1">
              <p className="text-lg font-semibold">Juancho · Mati</p>
              <p className="text-xs text-muted-foreground">
                primera vez juntos
              </p>
            </div>
            <div className="order-1 sm:order-2">
              <Pair codes={["JU", "MA"]} size="lg" />
            </div>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex gap-6">
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
            <Button className="rounded-full">Cargar resultado →</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TodayTableCard() {
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
            {tableRows.map((r, i) => (
              <TableRow
                key={r.code}
                className={cn(
                  i === 0 && "bg-lime-100/60 hover:bg-lime-100/60",
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar code={r.code} size="sm" />
                    <span className="font-medium">
                      {players[r.code]?.name}
                    </span>
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

function ParticipantsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Participantes ({participantCodes.length})
        </CardTitle>
        <AvatarGroup data-size="sm" className="-space-x-1.5">
          {participantCodes.slice(0, 4).map((c) => (
            <PlayerAvatar key={c} code={c} size="sm" />
          ))}
        </AvatarGroup>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {participantCodes.map((c, i) => (
            <li key={c}>
              {i > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-2.5">
                <PlayerAvatar code={c} size="sm" />
                <span className="text-sm font-medium">
                  {players[c]?.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TodayResultsCard() {
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

function ResultRow({ a, b, sa, sb, ago, penales }: Result) {
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
        <p className="text-[11px] text-muted-foreground">
          {penales ?? ago}
        </p>
      </div>
    </div>
  )
}
