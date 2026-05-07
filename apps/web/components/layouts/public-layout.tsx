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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#3AB0FF]/10 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-black tracking-widest text-gradient-gold uppercase">
            WHY ME?
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto px-4 py-12", maxWidth, className)}>{children}</main>

      <footer className="border-t border-[#3AB0FF]/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-muted-foreground/50">
          <p>© {year} WHY ME? Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-muted-foreground">Privacidade</Link>
            <Link href="/terms"   className="transition-colors hover:text-muted-foreground">Termos</Link>
            <Link href="/faq"     className="transition-colors hover:text-muted-foreground">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
