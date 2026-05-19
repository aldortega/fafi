import type { Doc } from "../../../convex/_generated/dataModel"
import { AvatarGroup } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PlayerAvatar } from "@/components/PlayerAvatar"

export function ParticipantsCard({
  participants,
}: {
  participants: Array<Doc<"players">>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Participantes ({participants.length})
        </CardTitle>
        <AvatarGroup data-size="sm" className="-space-x-1.5">
          {participants.slice(0, 4).map((p) => (
            <PlayerAvatar key={p._id} player={p} size="sm" />
          ))}
        </AvatarGroup>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {participants.map((p, i) => (
            <li key={p._id}>
              {i > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-2.5">
                <PlayerAvatar player={p} size="sm" />
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
