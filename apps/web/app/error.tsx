"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-50">Algo deu errado</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-zinc-700 font-mono">Erro: {error.digest}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </main>
  )
}
