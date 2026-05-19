import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts"
import type { PlayerLineRow } from "@/lib/session-summary"
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

const winsChartConfig = {
  pg: {
    label: "Victorias",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function WinsBarCard({ ranking }: { ranking: Array<PlayerLineRow> }) {
  const data = ranking
    .filter((r) => r.pj > 0)
    .map((r) => ({
      name: r.player.name,
      pg: r.pg,
      pp: r.pp,
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Victorias por jugador</CardTitle>
        <p className="text-xs text-muted-foreground">
          Cantidad de partidos ganados en la jornada.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={winsChartConfig} className="h-64 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
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
                      const payload = entry.payload as {
                        pg: number
                        pp: number
                        pj: number
                      }
                      return [
                        `${payload.pg}W / ${payload.pp}L (${payload.pj} PJ)`,
                        "",
                      ]
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
