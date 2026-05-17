import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
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
      <body className={`${inter.className} ${mono.variable} flex min-h-screen flex-col`}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.classList.add("light")}catch(e){}})()` }} />
        <ThemeProvider>
        <DevNav />
        {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
