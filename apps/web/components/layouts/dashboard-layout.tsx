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
  sidebarWidth = "lg:w-[264px]",
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground lg:flex-row", className)}>
      {/* Sidebar — 264 px sticky, navy gradient */}
      <aside
        className={cn(
          "w-full shrink-0 border-b border-[rgba(58,176,255,0.12)] bg-[rgba(11,31,58,0.95)]",
          "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r",
          sidebarWidth,
        )}
        style={{
          background: "linear-gradient(180deg, rgba(11,31,58,0.97), rgba(11,31,58,0.88))",
        }}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — 64 px, blur 14px */}
        <header
          className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between border-b border-[rgba(58,176,255,0.12)] px-7"
          style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)" }}
        >
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-[12px] text-[rgba(200,213,234,0.62)]">{subtitle}</p>
            )}
          </div>
          <Link
            href={logoHref}
            className="text-sm font-black tracking-widest text-gradient-gold uppercase"
          >
            {logoText}
          </Link>
        </header>

        {/* Content — 28 px padding, max 1480 */}
        <div className="mx-auto w-full max-w-[1480px] flex-1 space-y-6 p-7">{children}</div>
      </div>
    </div>
  )
}
