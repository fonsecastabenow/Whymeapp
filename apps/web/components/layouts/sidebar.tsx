"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  User,
  Orbit,
  Briefcase,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useMemo } from "react"

interface SidebarProps {
  userRole: "candidate" | "company" | null
  userName?: string
}

const NAV_ITEMS = {
  candidate: [
    { label: "Dashboard", href: "", icon: LayoutDashboard, pattern: "/dashboard" },
    { label: "Perfil", href: "/profile", icon: User, pattern: "/profile" },
    { label: "Órbita", href: "/orbita", icon: Orbit, pattern: "/orbita" },
    { label: "Notificações", href: "/notifications", icon: Bell, pattern: "/notifications" },
  ],
  company: [
    { label: "Dashboard", href: "", icon: LayoutDashboard, pattern: "/dashboard" },
    { label: "Vagas", href: "/jobs", icon: Briefcase, pattern: "/jobs" },
    { label: "Órbita", href: "/orbita", icon: Orbit, pattern: "/orbita" },
    { label: "Perfil", href: "/profile", icon: User, pattern: "/profile" },
    { label: "Notificações", href: "/notifications", icon: Bell, pattern: "/notifications" },
  ],
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const items = useMemo(() => {
    const base = NAV_ITEMS[userRole === "company" ? "company" : "candidate"]
    const prefix = userRole === "company" ? "" : `/candidate`
    return base.map((item) => ({
      ...item,
      fullHref: `${prefix}${item.href}`,
    }))
  }, [userRole])

  const isActive = (pattern: string) => {
    if (pattern === "/dashboard") return pathname.includes("/dashboard")
    if (pattern === "/orbita") return pathname.includes("/orbita")
    return pathname.includes(pattern)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("whyme_token")
      localStorage.removeItem("whyme_user")
    } catch (e) {
      console.error("Logout error:", e)
    }
    router.push("/login")
  }

  const initial = userName?.charAt(0).toUpperCase() ?? "?"

  return (
    <nav className="flex h-full flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-2 px-5 pt-6 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-black tracking-tight text-white">
          W
        </div>
        <span className="text-sm font-black tracking-widest text-gradient-gold uppercase">
          WHY ME?
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 px-3 py-2">
        <div className="eyebrow px-2 pb-2 text-[10px]">Navegação</div>
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.pattern)
          return (
            <Link
              key={item.label}
              href={item.fullHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "nav-active"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Config section */}
      <div className="border-t border-sidebar-line px-3 py-3">
        <div className="eyebrow px-2 pb-2 text-[10px]">Configurações</div>
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-hover hover:text-sidebar-fg"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
        </button>
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-fg">{userName ?? "Usuário"}</p>
            <p className="text-xs text-sidebar-muted">{userRole === "company" ? "Empresa" : "Candidato"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-red-400"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
