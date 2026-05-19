import {
  CalendarDays,
  ClipboardList,
  Clock,
  Home,
  LineChart,
  MoreHorizontal,
  Plus,
  Settings,
  Trophy,
  Users,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const avatarColorClasses = [
  "bg-rose-200 text-rose-900",
  "bg-sky-200 text-sky-900",
  "bg-lime-200 text-lime-900",
  "bg-violet-200 text-violet-900",
  "bg-amber-200 text-amber-900",
  "bg-teal-200 text-teal-900",
  "bg-pink-200 text-pink-900",
  "bg-blue-200 text-blue-900",
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColorClasses[Math.abs(hash) % avatarColorClasses.length]
}

const mainNav = [
  { label: "Inicio", icon: Home, active: true, to: "/" as const },
  { label: "Jornada", icon: CalendarDays },
  { label: "Torneo", icon: Trophy, badge: "EN CURSO" },
  { label: "Estadísticas", icon: LineChart },
  { label: "Historial", icon: Clock },
]

const docsNav = [
  { label: "Jugadores", icon: Users, to: "/players" as const },
  { label: "Reglas", icon: ClipboardList },
  { label: "Ajustes", icon: Settings },
  { label: "Más", icon: MoreHorizontal },
]

export function AppSidebar() {
  const user = useQuery(api.auth.getCurrentUser)
  const currentPlayer = useQuery(api.players.getCurrentPlayer)

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <span className="size-4" />
                <span className="font-semibold">fafi</span>
                <span className="size-1.5 rounded-full bg-primary" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                >
                  <Link to="/matches/new">
                    <Plus className="size-4" />
                    Nuevo partido
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {mainNav.map((item) => {
                const badge =
                  "badge" in item ? (item as { badge?: string }).badge : undefined
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={item.active}
                      tooltip={item.label}
                      asChild={!!item.to}
                    >
                      {item.to ? (
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                          {badge ? (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <>
                          <item.icon />
                          <span>{item.label}</span>
                          {badge ? (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                              {badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Datos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {docsNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton tooltip={item.label} asChild={!!item.to}>
                    {item.to ? (
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <>
                        <item.icon />
                        <span>{item.label}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={user?.name ?? "Usuario"}
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  currentPlayer
                    ? getAvatarColor(currentPlayer._id)
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentPlayer
                  ? currentPlayer.name.slice(0, 2).toUpperCase()
                  : "??"}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium">
                  {user?.name ?? "Usuario"}
                </span>
                <span className="text-xs text-muted-foreground">mockup</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
