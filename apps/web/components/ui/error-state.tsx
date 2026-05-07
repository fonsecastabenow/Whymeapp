interface ErrorStateProps {
  message: string
  title?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ message, title = "Erro ao carregar", onRetry, retryLabel = "Tentar novamente" }: ErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-300">
          ⚠
        </div>
        <h1 className="text-xl font-semibold text-zinc-50">{title}</h1>
        <p className="text-sm text-zinc-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </main>
  )
}
