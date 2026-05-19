import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

const goalsConfig = {
  gf: { label: "Goles a favor", color: "var(--chart-2)" },
  gc: { label: "Goles en contra", color: "var(--chart-4)" },
} satisfies ChartConfig

export function GoalsForAgainstChart({ rows }: { rows: Array<RankRow> }) {
  const data = rows
    .slice()
    .sort((a, b) => b.gf - a.gf)
    .slice(0, 8)
    .map((r) => ({
      name: r.player.name,
      gf: r.gf,
      gc: r.gc,
      dif: r.dif,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goles a favor vs en contra</CardTitle>
        <p className="text-xs text-muted-foreground">
          Top 8 goleadores con su balance defensivo.
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={goalsConfig} className="h-72 w-full">
            <BarChart
              data={data}
              margin={{ left: 8, right: 8, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
                className="text-[10px]"
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const p = entry.payload as { gf: number; gc: number; dif: number }
                      return [
                        `${p.gf} GF · ${p.gc} GC · dif ${p.dif > 0 ? `+${p.dif}` : p.dif}`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Bar dataKey="gf" fill="var(--color-gf)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gc" fill="var(--color-gc)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
