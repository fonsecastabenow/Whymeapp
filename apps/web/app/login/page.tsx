"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginUser, getCurrentUser, type LoginRequest } from "@/lib/api"

type PageState = "idle" | "loading" | "error"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<PageState>("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError("Preencha todos os campos"); return }

    setState("loading")
    setError("")

    try {
      const data: LoginRequest = { email, password }
      const res = await loginUser(data)
      localStorage.setItem("whyme_token", res.access_token)
      localStorage.setItem("whyme_user", JSON.stringify(res.user))

      const me = await getCurrentUser(res.access_token)

      if (me.role === "company" && me.company_id) {
        router.push(`/company/${me.company_id}/dashboard`)
      } else if (me.role === "candidate") {
        router.push(`/candidate/${me.id}/profile`)
      } else {
        router.push("/")
      }
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-zinc-50">Whyme</Link>
          <p className="mt-2 text-sm text-zinc-500">Entrar na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {state === "loading" ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Não tem conta?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">Criar conta</Link>
        </p>
      </div>
    </main>
  )
}
