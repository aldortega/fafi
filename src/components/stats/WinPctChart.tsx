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

const winPctConfig = {
  winPct: { label: "Win %", color: "var(--chart-3)" },
} satisfies ChartConfig

export function WinPctChart({ rows }: { rows: Array<RankRow> }) {
  const eligible = rows.filter((r) => r.pj >= 3)
  const data = eligible
    .slice()
    .sort((a, b) => b.winPct - a.winPct)
    .slice(0, 10)
    .map((r) => ({
      name: r.player.name,
      winPct: Math.round(r.winPct * 100),
      pj: r.pj,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Win % (mín. 3 partidos)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Porcentaje de victorias entre quienes jugaron al menos 3 partidos.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nadie llega al mínimo de 3 partidos todavía.
          </p>
        ) : (
          <ChartContainer config={winPctConfig} className="h-72 w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
              />
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
                      const p = entry.payload as { winPct: number; pj: number }
                      return [`${p.winPct}% en ${p.pj} PJ`, ""]
                    }}
                  />
                }
              />
              <Bar
                dataKey="winPct"
                fill="var(--color-winPct)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="winPct"
                  position="right"
                  formatter={(v) => `${String(v)}%`}
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
