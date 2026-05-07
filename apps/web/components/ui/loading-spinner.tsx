export function LoadingSpinner({ message = "Carregando…" }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
        <p className="text-zinc-400">{message}</p>
      </div>
    </main>
  )
}
