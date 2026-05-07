import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(16,34,68,0.8)] border border-[#3AB0FF]/10">
          <span className="text-4xl font-bold text-gradient-gold">404</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A página que você procurou não existe ou foi movida.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
          >
            Voltar ao início
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-[#3AB0FF]/15 px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-[#3AB0FF]/40 hover:text-foreground"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </main>
  )
}
