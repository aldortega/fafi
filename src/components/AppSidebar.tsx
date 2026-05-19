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
  User,
  Users,
} from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar-color"
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

type NavItem = {
  label: string
  icon: typeof Home
  to?: "/" | "/jornada" | "/stats" | "/players" | "/profile" | "/history"
  badge?: string
}

const mainNav: Array<NavItem> = [
  { label: "Inicio", icon: Home, to: "/" },
  { label: "Jornada", icon: CalendarDays, to: "/jornada" },
  { label: "Torneo", icon: Trophy, badge: "EN CURSO" },
  { label: "Estadísticas", icon: LineChart, to: "/stats" },
  { label: "Historial", icon: Clock, to: "/history" },
]

const docsNav: Array<NavItem> = [
  { label: "Jugadores", icon: Users, to: "/players" },
  { label: "Mi perfil", icon: User, to: "/profile" },
  { label: "Reglas", icon: ClipboardList },
  { label: "Ajustes", icon: Settings },
  { label: "Más", icon: MoreHorizontal },
]

export function AppSidebar() {
  const user = useQuery(api.auth.getCurrentUser)
  const currentPlayer = useQuery(api.players.getCurrentPlayer)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

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

              {mainNav.map((item) => (
                <NavRow key={item.label} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Datos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {docsNav.map((item) => (
                <NavRow key={item.label} item={item} pathname={pathname} />
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
                {user?.email ? (
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.to ? pathname === item.to : false
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.label}
        asChild={!!item.to}
      >
        {item.to ? (
          <Link to={item.to}>
            <item.icon />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ) : (
          <>
            <item.icon />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
