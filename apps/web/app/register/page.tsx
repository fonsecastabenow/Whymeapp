"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerUser, loginUser, getCurrentUser, type RegisterRequest } from "@/lib/api"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState<"candidate" | "company">("candidate")
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      const data: RegisterRequest = { email, password, name, role }
      await registerUser(data)

      const loginRes = await loginUser({ email, password })
      localStorage.setItem("whyme_token", loginRes.access_token)
      localStorage.setItem("whyme_user", JSON.stringify(loginRes.user))

      const me = await getCurrentUser(loginRes.access_token)

      if (role === "company") {
        router.push("/company/onboarding")
      } else {
        router.push(`/candidate/${me.id}/onboarding`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Criar sua conta"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="text-[#3AB0FF] hover:underline">
            Fazer login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          type="text"
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />

        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="password"
            type="password"
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Input
            id="confirm"
            type="password"
            label="Confirmar"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <p className="eyebrow mb-1.5 block">Tipo de conta</p>
          <div className="grid grid-cols-2 gap-2">
            {(["candidate", "company"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  role === r
                    ? "border-[#3AB0FF]/60 bg-[#3AB0FF]/10 text-[#3AB0FF]"
                    : "border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.5)] text-muted-foreground hover:border-[#3AB0FF]/25"
                }`}
              >
                {r === "candidate" ? "Candidato" : "Empresa"}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
