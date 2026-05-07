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
  logoText = "WHY ME?",
  logoHref = "/",
  children,
  sidebarWidth = "lg:w-72",
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground lg:flex-row", className)}>
      {/* Sidebar */}
      <aside
        className={cn(
          "w-full shrink-0 border-b border-[#3AB0FF]/10 bg-[rgba(11,31,58,0.95)]",
          "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r",
          sidebarWidth,
        )}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[#3AB0FF]/10 bg-background/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <Link
              href={logoHref}
              className="text-sm font-black tracking-widest text-gradient-gold uppercase"
            >
              {logoText}
            </Link>
          </div>
        </header>

        <div className="flex-1 space-y-8 p-6 md:p-8">{children}</div>
      </div>
    </div>
  )
}
