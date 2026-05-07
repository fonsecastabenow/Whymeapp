interface ErrorStateProps {
  message: string
  title?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({ message, title = "Erro ao carregar", onRetry, retryLabel = "Tentar novamente" }: ErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-2xl ring-1 ring-red-500/20">
          ⚠
        </div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </main>
  )
}
