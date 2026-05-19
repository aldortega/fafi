import type { Doc } from "../../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

export function HighlightCard({
  title,
  icon,
  player,
  primary,
  secondary,
}: {
  title: string
  icon: React.ReactNode
  player: Doc<"players"> | null
  primary: string
  secondary: string | null
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <p className="text-xs uppercase tracking-wider">{title}</p>
        </div>
        {!player ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin datos</p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="default">
              {player.avatarUrl ? (
                <AvatarImage src={player.avatarUrl} alt={player.name} />
              ) : null}
              <AvatarFallback
                className={cn("font-semibold", getAvatarColor(player._id))}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {player.name}
              </p>
              <p className="text-lg font-semibold tabular-nums leading-tight">
                {primary}
              </p>
              {secondary ? (
                <p className="text-[10px] text-muted-foreground">{secondary}</p>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
