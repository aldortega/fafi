import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

const goalsChartConfig = {
  goals: {
    label: "Goles",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function GoalsAreaCard({
  timeline,
  avg,
}: {
  timeline: Array<{ idx: number; label: string; goals: number; diff: number }>
  avg: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Goles por partido</CardTitle>
        <p className="text-xs text-muted-foreground">
          En orden cronológico. Promedio de la jornada:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {avg.toFixed(1)}
          </span>
          .
        </p>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ChartContainer config={goalsChartConfig} className="h-64 w-full">
            <AreaChart
              data={timeline}
              margin={{ left: 8, right: 16, top: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="goalsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-goals)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-goals)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, entry) => {
                      const payload = entry.payload as {
                        goals: number
                        diff: number
                      }
                      return [
                        `${payload.goals} goles · dif ${payload.diff}`,
                        "",
                      ]
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="goals"
                stroke="var(--color-goals)"
                strokeWidth={2}
                fill="url(#goalsFill)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
