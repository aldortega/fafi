import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Duo } from "./types"

const duosConfig = {
  wins: { label: "Victorias juntos", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TopDuosChart({ duos }: { duos: Array<Duo> }) {
  const data = duos
    .filter((d) => d.wins > 0)
    .slice(0, 10)
    .map((d) => ({
      name: `${d.a.name} + ${d.b.name}`,
      wins: d.wins,
      games: d.games,
      winPct: Math.round(d.winPct * 100),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mejores duplas</CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 10 parejas con más victorias jugando juntas.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay duplas con victorias.
          </p>
        ) : (
          <ChartContainer config={duosConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tickLine={false}
                axisLine={false}
                className="text-[11px]"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const p = entry.payload as {
                        wins: number
                        games: number
                        winPct: number
                      }
                      return [
                        `${p.wins}W en ${p.games} PJ (${p.winPct}%)`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Bar
                dataKey="wins"
                fill="var(--color-wins)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="wins"
                  position="right"
                  className="fill-foreground text-xs tabular-nums"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
