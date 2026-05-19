import { Link } from "@tanstack/react-router"
import type { Doc } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function PlayerChip({
  player,
  muted = false,
}: {
  player: Doc<"players">
  muted?: boolean
}) {
  return (
    <Link
      to="/profile"
      search={{ playerId: player._id }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs transition hover:border-foreground/30",
        muted && "opacity-80"
      )}
    >
      <Avatar size="sm">
        {player.avatarUrl ? (
          <AvatarImage src={player.avatarUrl} alt={player.name} />
        ) : null}
        <AvatarFallback
          className={cn("font-semibold", getAvatarColor(player._id))}
        >
          {player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span>{player.name}</span>
    </Link>
  )
}
