export function LoadingSpinner({ message = "Carregando…" }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#3AB0FF]/20 border-t-[#3AB0FF]" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </main>
  )
}
