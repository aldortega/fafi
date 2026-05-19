import type { Doc } from "../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar"

type Size = "sm" | "default" | "lg"

export function PlayerAvatar({
  player,
  size = "default",
}: {
  player: Doc<"players">
  size?: Size
}) {
  return (
    <Avatar size={size}>
      {player.avatarUrl ? (
        <AvatarImage src={player.avatarUrl} alt={player.name} />
      ) : null}
      <AvatarFallback
        className={cn("font-semibold", getAvatarColor(player._id))}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export function Pair({
  players,
  size = "default",
}: {
  players: Array<Doc<"players">>
  size?: Size
}) {
  return (
    <AvatarGroup data-size={size}>
      {players.map((p) => (
        <PlayerAvatar key={p._id} player={p} size={size} />
      ))}
    </AvatarGroup>
  )
}
