import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { DevNav } from "@/components/dev-panel/DevNav"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-mono",
})

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
    <html lang="pt-BR" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.classList.add("light")}catch(e){}})()` }} />
      <body className={`${inter.className} ${mono.variable} flex min-h-screen flex-col`}>
        <ThemeProvider>
        <DevNav />
        <main className="flex-1">{children}</main>
        </ThemeProvider>
        <footer className="border-t border-[#3AB0FF]/10 bg-background px-6 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <span className="text-xs text-muted-foreground/50">© 2026 Whyme Tecnologia Ltda.</span>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
