"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAdminStats, getCurrentUser } from "@/lib/api"
import type { AdminStatsData } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [adminName, setAdminName] = useState("")
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    if (!t) {
      router.replace("/login")
      return
    }
    setToken(t)
  }, [router])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      try {
        const [me, statsData] = await Promise.all([
          getCurrentUser(token),
          getAdminStats(token),
        ])
        if (cancelled) return
        if (me.role !== "admin") {
          router.replace("/")
          return
        }
        setAdminName(me.name)
        setStats(statsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar painel")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [token, router])

  if (loading) return <LoadingSpinner message="Carregando painel administrativo…" />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!stats) return null

  const oceanPercent = stats.total_candidates > 0
    ? Math.round((stats.candidates_with_ocean / stats.total_candidates) * 100)
    : 0

  const interviewConversion = stats.total_interviews > 0
    ? Math.round((stats.completed_interviews / stats.total_interviews) * 100)
    : 0

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-[#3AB0FF]/10 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Painel Administrativo</h1>
            <p className="mt-0.5 text-xs text-zinc-500">Visão geral da plataforma</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              Sócio
            </span>
            <span className="text-sm text-zinc-400">{adminName}</span>
            <button
              onClick={() => {
                localStorage.removeItem("whyme_token")
                localStorage.removeItem("whyme_user")
                router.push("/login")
              }}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Empresas" value={stats.total_companies} sub="cadastradas" />
          <MetricCard label="Candidatos" value={stats.total_candidates} sub="na plataforma" />
          <MetricCard label="Vagas" value={stats.total_jobs} sub={`${stats.active_jobs} ativas`} accent />
          <MetricCard label="Matches" value={stats.total_matches} sub={`${stats.pending_matches} pendentes`} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Entrevistas" value={stats.total_interviews} sub="iniciadas" />
          <MetricCard label="Concluídas" value={stats.completed_interviews} sub={`${interviewConversion}% de conversão`} />
          <MetricCard label="Perfil OCEAN" value={stats.candidates_with_ocean} sub={`${oceanPercent}% dos candidatos`} violet />
          <MetricCard label="Vagas Ativas" value={stats.active_jobs} sub={`de ${stats.total_jobs} cadastradas`} accent />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)]">
            <div className="border-b border-[#3AB0FF]/10 px-5 py-4">
              <h2 className="font-semibold text-zinc-50">Empresas Recentes</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Últimas 5 empresas cadastradas</p>
            </div>
            {stats.recent_companies.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-500">Nenhuma empresa cadastrada</p>
            ) : (
              <div className="divide-y divide-[#3AB0FF]/10">
                {stats.recent_companies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-50">{c.name}</p>
                      {c.industry && (
                        <p className="text-xs text-zinc-500">{c.industry}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-600">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)]">
            <div className="border-b border-[#3AB0FF]/10 px-5 py-4">
              <h2 className="font-semibold text-zinc-50">Candidatos Recentes</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Últimos 5 candidatos registrados</p>
            </div>
            {stats.recent_candidates.length === 0 ? (
              <p className="px-5 py-6 text-sm text-zinc-500">Nenhum candidato cadastrado</p>
            ) : (
              <div className="divide-y divide-[#3AB0FF]/10">
                {stats.recent_candidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-50">{c.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      c.onboarding_completed
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {c.onboarding_completed ? "Perfil completo" : "Cadastro parcial"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>
    </main>
  )
}

function MetricCard({
  label, value, sub, accent = false, violet = false,
}: {
  label: string
  value: number
  sub: string
  accent?: boolean
  violet?: boolean
}) {
  return (
    <div className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)] px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${
        violet ? "text-violet-400" : accent ? "text-[#3AB0FF]" : "text-zinc-50"
      }`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-600">{sub}</p>
    </div>
  )
}
