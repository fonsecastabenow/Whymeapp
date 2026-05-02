import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Whyme — Recrutamento por Valores",
  description: "Match de candidatos e vagas baseado em perfis OCEAN",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <span className="text-xs text-zinc-600">© 2026 Whyme Tecnologia Ltda.</span>
            <Link
              href="/privacy"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
