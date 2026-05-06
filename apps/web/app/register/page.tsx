"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerUser, getCurrentUser, type RegisterRequest } from "@/lib/api"

type PageState = "idle" | "loading" | "error"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState<"candidate" | "company">("candidate")
  const [state, setState] = useState<PageState>("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (!name || !email || !password || !confirm) {
      setError("Preencha todos os campos"); return
    }
    if (password !== confirm) {
      setError("Senhas não conferem"); return
    }
    if (password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres"); return
    }

    setState("loading")

    try {
      const data: RegisterRequest = { email, password, name, role }
      const res = await registerUser(data)

      // Auto-login after register
      const { loginUser } = await import("@/lib/api")
      const loginRes = await loginUser({ email, password })
      localStorage.setItem("whyme_token", loginRes.access_token)
      localStorage.setItem("whyme_user", JSON.stringify(loginRes.user))

      const me = await getCurrentUser(loginRes.access_token)

      if (role === "company") {
        router.push(`/company/onboarding`)
      } else {
        router.push(`/candidate/${me.id}/onboarding`)
      }
    } catch (err) {
      setState("error")
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-zinc-50">Whyme</Link>
          <p className="mt-2 text-sm text-zinc-500">Criar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
            <input
              id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1.5">Senha</label>
              <input
                id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-zinc-400 mb-1.5">Confirmar</label>
              <input
                id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo de conta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  role === "candidate"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Candidato
              </button>
              <button
                type="button"
                onClick={() => setRole("company")}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  role === "company"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Empresa
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {state === "loading" ? "Criando conta…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">Fazer login</Link>
        </p>
      </div>
    </main>
  )
}
