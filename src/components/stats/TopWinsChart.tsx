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
import type { RankRow } from "./types"

const winsConfig = {
  pg: { label: "Victorias", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TopWinsChart({ rows }: { rows: Array<RankRow> }) {
  const data = rows
    .slice()
    .sort((a, b) => b.pg - a.pg)
    .slice(0, 10)
    .map((r) => ({
      name: r.player.name,
      pg: r.pg,
      pp: r.pp,
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top victorias</CardTitle>
        <p className="text-xs text-muted-foreground">
          Los 10 jugadores con más partidos ganados.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={winsConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 28, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const p = entry.payload as {
                        pg: number
                        pp: number
                        pj: number
                      }
                      return [`${p.pg}W / ${p.pp}L (${p.pj} PJ)`, ""]
                    }}
                  />
                }
              />
              <Bar dataKey="pg" fill="var(--color-pg)" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="pg"
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
