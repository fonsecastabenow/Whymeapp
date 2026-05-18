"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { Sidebar } from "@/components/layouts/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const pageTitle = useMemo(() => {
    const path = pathname.toLowerCase()
    if (path.includes("dashboard")) return "Dashboard"
    if (path.includes("profile")) return "Perfil"
    if (path.includes("orbita")) return "Órbita"
    if (path.includes("notifications")) return "Notificações"
    if (path.includes("jobs")) return "Vagas"
    if (path.includes("candidates")) return "Candidatos"
    if (path.includes("onboarding")) return "Onboarding"
    if (path.includes("report")) return "Relatório"
    return ""
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <aside className="flex flex-col border-r border-zinc-800 bg-zinc-900 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:w-[264px]">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between border-b border-zinc-800 bg-zinc-950/85 px-7 backdrop-blur-[14px]">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-zinc-50">
              {pageTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              href="/"
              className="text-sm font-black tracking-widest text-gradient-gold uppercase"
            >
              WHY ME?
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1480px] flex-1 space-y-6 p-7">
          {children}
        </div>
      </div>
    </div>
  )
}
