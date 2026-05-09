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
    if (!t) { router.replace("/login"); return }
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
        if (me.role !== "admin") { router.replace("/"); return }
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
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-7 py-4"
        style={{
          background: "rgba(11,31,58,0.85)",
          backdropFilter: "blur(14px)",
          borderColor: "var(--line)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold tracking-[-0.01em] text-foreground">
              Painel Administrativo
            </h1>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--fg-3)" }}>
              Visão geral da plataforma
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip chip-violet">Sócio</span>
            <span className="text-sm" style={{ color: "var(--fg-2)" }}>{adminName}</span>
            <button
              onClick={() => {
                localStorage.removeItem("whyme_token")
                localStorage.removeItem("whyme_user")
                router.push("/login")
              }}
              className="rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-[rgba(58,176,255,0.30)]"
              style={{ borderColor: "var(--line)", color: "var(--fg-3)" }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">

        {/* Plataforma KPIs */}
        <div className="section-label">Plataforma</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="stat-card">
            <p className="stat-k">Empresas</p>
            <p className="stat-v font-data">{stats.total_companies}</p>
            <p className="stat-delta">cadastradas</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Candidatos</p>
            <p className="stat-v font-data">{stats.total_candidates}</p>
            <p className="stat-delta">na plataforma</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Vagas</p>
            <p className="stat-v font-data" style={{ color: "#3AB0FF" }}>{stats.total_jobs}</p>
            <p className="stat-delta">{stats.active_jobs} ativas</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Matches</p>
            <p className="stat-v font-data">{stats.total_matches}</p>
            <p className="stat-delta">{stats.pending_matches} pendentes</p>
          </div>
        </div>

        {/* Entrevistas KPIs */}
        <div className="section-label">Entrevistas &amp; OCEAN</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="stat-card">
            <p className="stat-k">Iniciadas</p>
            <p className="stat-v font-data">{stats.total_interviews}</p>
            <p className="stat-delta">entrevistas</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Concluídas</p>
            <p className="stat-v font-data" style={{ color: "#38d391" }}>{stats.completed_interviews}</p>
            <p className="stat-delta">{interviewConversion}% conversão</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Perfil OCEAN</p>
            <p className="stat-v font-data" style={{ color: "#8B5CF6" }}>{stats.candidates_with_ocean}</p>
            <p className="stat-delta">{oceanPercent}% dos candidatos</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Vagas Ativas</p>
            <p className="stat-v font-data" style={{ color: "#3AB0FF" }}>{stats.active_jobs}</p>
            <p className="stat-delta">de {stats.total_jobs} cadastradas</p>
          </div>
        </div>

        {/* Recent activity tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Empresas recentes */}
          <section
            className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <div
              className="border-b px-5 py-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="section-label">Empresas Recentes</div>
              <p className="mt-1 text-xs" style={{ color: "var(--fg-3)" }}>
                Últimas 5 empresas cadastradas
              </p>
            </div>
            {stats.recent_companies.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: "var(--fg-3)" }}>
                Nenhuma empresa cadastrada
              </p>
            ) : (
              <div>
                {stats.recent_companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border-b px-5 py-3.5 last:border-b-0 transition-colors hover:bg-[rgba(58,176,255,0.04)]"
                    style={{ borderColor: "var(--line-soft)" }}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      {c.industry && (
                        <p className="text-xs" style={{ color: "var(--fg-3)" }}>{c.industry}</p>
                      )}
                    </div>
                    <span className="font-data text-xs" style={{ color: "var(--fg-3)" }}>
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Candidatos recentes */}
          <section
            className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <div
              className="border-b px-5 py-4"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="section-label">Candidatos Recentes</div>
              <p className="mt-1 text-xs" style={{ color: "var(--fg-3)" }}>
                Últimos 5 candidatos registrados
              </p>
            </div>
            {stats.recent_candidates.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: "var(--fg-3)" }}>
                Nenhum candidato cadastrado
              </p>
            ) : (
              <div>
                {stats.recent_candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border-b px-5 py-3.5 last:border-b-0 transition-colors hover:bg-[rgba(58,176,255,0.04)]"
                    style={{ borderColor: "var(--line-soft)" }}
                  >
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <span
                      className={c.onboarding_completed ? "chip" : "chip"}
                      style={
                        c.onboarding_completed
                          ? { color: "#38d391", borderColor: "rgba(56,211,145,0.30)", background: "rgba(56,211,145,0.08)" }
                          : { color: "#f5b454", borderColor: "rgba(245,180,84,0.30)", background: "rgba(245,180,84,0.08)" }
                      }
                    >
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
