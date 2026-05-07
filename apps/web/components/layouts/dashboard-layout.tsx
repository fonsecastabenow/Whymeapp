import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  sidebar: React.ReactNode
  title: string
  subtitle?: string
  logoText?: string
  logoHref?: string
  children: React.ReactNode
  sidebarWidth?: string
  className?: string
}

export function DashboardLayout({
  sidebar,
  title,
  subtitle,
  logoText = "Whyme",
  logoHref = "/",
  children,
  sidebarWidth = "lg:w-72",
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-zinc-950 text-zinc-50 lg:flex-row", className)}>
      <aside
        className={cn(
          "w-full shrink-0 border-b border-zinc-800 bg-zinc-900",
          "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r",
          sidebarWidth,
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-zinc-50">{title}</h2>
              {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
            </div>
            <Link href={logoHref} className="text-lg font-bold tracking-tight text-zinc-50">
              {logoText}
            </Link>
          </div>
        </header>

        <div className="flex-1 space-y-8 p-6 md:p-8">{children}</div>
      </div>
    </div>
  )
}
