import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900">
          <span className="text-4xl font-bold text-zinc-600">404</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-50">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          A página que você procurou não existe ou foi movida.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Voltar ao início
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </main>
  )
}
