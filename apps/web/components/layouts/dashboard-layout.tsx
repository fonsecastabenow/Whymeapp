import Link from "next/link"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layouts/sidebar"
import { Bell, User } from "lucide-react"

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  logoText?: string
  logoHref?: string
  children: React.ReactNode
  sidebarWidth?: string
  className?: string
  notificationCount?: number
}

export function DashboardLayout({
  title,
  subtitle,
  logoText = "WHY ME?",
  logoHref = "/",
  children,
  sidebarWidth = "lg:w-[264px]",
  className,
  notificationCount = 0,
}: DashboardLayoutProps) {
  // Read user from localStorage (runs on client only)
  let userRole: "candidate" | "company" | null = null
  let userName: string | undefined
  if (typeof window !== "undefined") {
    try {
      const userStr = localStorage.getItem("whyme_user")
      if (userStr) {
        const user = JSON.parse(userStr)
        userRole = user.role ?? null
        userName = user.name ?? user.email
      }
    } catch {}
  }

  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground lg:flex-row", className)}>
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-800 bg-zinc-900",
          "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto",
          sidebarWidth,
        )}
      >
        <Sidebar userRole={userRole} userName={userName} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between border-b border-zinc-800 bg-zinc-950/85 px-7 backdrop-blur-[14px]">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-50">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-[12px] text-zinc-400">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>
            {/* Logo */}
            <Link
              href={logoHref}
              className="text-sm font-black tracking-widest text-gradient-gold uppercase"
            >
              {logoText}
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1480px] flex-1 space-y-6 p-7">{children}</div>
      </div>
    </div>
  )
}
