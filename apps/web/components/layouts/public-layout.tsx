import Link from "next/link"
import { cn } from "@/lib/utils"

interface PublicLayoutProps {
  children: React.ReactNode
  maxWidth?: string
  className?: string
}

export function PublicLayout({ children, maxWidth = "max-w-4xl", className }: PublicLayoutProps) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Whyme
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-zinc-200">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto px-4 py-12", maxWidth, className)}>{children}</main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-zinc-600">
          <p>© {year} Whyme. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-zinc-400">Privacidade</Link>
            <Link href="/terms"   className="transition-colors hover:text-zinc-400">Termos</Link>
            <Link href="/faq"     className="transition-colors hover:text-zinc-400">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
