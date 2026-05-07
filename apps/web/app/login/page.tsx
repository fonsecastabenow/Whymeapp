"use client"

import { useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginUser, getCurrentUser, type LoginRequest } from "@/lib/api"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError("Preencha todos os campos"); return }

    setLoading(true)
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
        router.push(`/candidate/${me.id}/dashboard`)
      } else {
        router.push("/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar na sua conta"
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
        />

        <Input
          id="password"
          type="password"
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
