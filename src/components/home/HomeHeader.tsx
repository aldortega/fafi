import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function HomeHeader({
  userName,
  hasSession,
  now,
}: {
  userName: string
  hasSession: boolean
  now: string
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenas, {userName}.
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge
            className={cn(
              "hover:bg-primary",
              hasSession
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {hasSession ? "jornada activa" : "sin jornada"}
          </Badge>
          <span>{now}</span>
        </div>
      </div>
      {hasSession ? (
        <Button className="rounded-full" asChild>
          <Link to="/jornada">Ir a la jornada →</Link>
        </Button>
      ) : (
        <Button className="rounded-full" asChild>
          <Link to="/sessions/new">
            <Plus />
            Nueva jornada
          </Link>
        </Button>
      )}
    </header>
  )
}
