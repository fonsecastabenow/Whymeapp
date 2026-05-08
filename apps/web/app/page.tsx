"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DEV_PASSWORD = "Canetabic.97"

export default function AccessGate() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password) { setError("Insira a senha de acesso"); return }

    setLoading(true)
    if (password === DEV_PASSWORD) {
      router.push("/home")
    } else {
      setError("Senha incorreta")
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Acesso restrito"
      subtitle="Plataforma em fase de testes"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="password"
          type="password"
          label="Senha de acesso"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError("") }}
          placeholder="••••••••"
          autoComplete="off"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
