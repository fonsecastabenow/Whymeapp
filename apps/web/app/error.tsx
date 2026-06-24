"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Algo deu errado</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/50 font-mono">Erro: {error.digest}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-lg border border-[#3AB0FF]/15 px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-[#3AB0FF]/40 hover:text-foreground"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </main>
  )
}
