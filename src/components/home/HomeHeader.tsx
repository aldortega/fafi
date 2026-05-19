import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HomeHeader({
  userName,
  hasSession,
}: {
  userName: string
  hasSession: boolean
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Buenas, {userName}.
        </h1>
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
