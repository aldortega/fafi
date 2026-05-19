import type { Duo, RankRow } from "./types"
import { TopWinsChart } from "./TopWinsChart"
import { GoalsForAgainstChart } from "./GoalsForAgainstChart"
import { WinPctChart } from "./WinPctChart"
import { TopDuosChart } from "./TopDuosChart"

export function ChartsGrid({
  ranking,
  duos,
}: {
  ranking: Array<RankRow>
  duos: Array<Duo>
}) {
  const played = ranking.filter((r) => r.pj > 0)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TopWinsChart rows={played} />
      <GoalsForAgainstChart rows={played} />
      <WinPctChart rows={played} />
      <TopDuosChart duos={duos} />
    </div>
  )
}
