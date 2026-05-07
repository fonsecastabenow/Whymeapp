import Link from "next/link"

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-zinc-50">
            Whyme
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-zinc-50">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">{children}</div>

        {footer && <div className="text-center text-sm text-zinc-500">{footer}</div>}
      </div>
    </main>
  )
}
