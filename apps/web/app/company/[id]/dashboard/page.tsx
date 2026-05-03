"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  getCurrentUser,
  getCompany,
  getCompanySummary,
  getCompanyJobs,
  getUserNotifications,
} from "@/lib/api"
import type {
  CompanyData,
  CompanySummaryData,
  JobData,
  NotificationData,
  UserData,
} from "@/lib/api"

// ─── helpers ─────────────────────────────────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 0.85) return "bg-emerald-500"
  if (score >= 0.7) return "bg-blue-500"
  if (score >= 0.55) return "bg-amber-500"
  return "bg-rose-500"
}

function scoreTextColor(score: number): string {
  if (score >= 0.85) return "text-emerald-400"
  if (score >= 0.7) return "text-blue-400"
  if (score >= 0.55) return "text-amber-400"
  return "text-rose-400"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function CompanyDashboardPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [summary, setSummary] = useState<CompanySummaryData | null>(null)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const userData = await getCurrentUser(token)
        if (cancelled) return
        setUser(userData)

        const [companyData, summaryData, jobsData, notifsData] = await Promise.all([
          getCompany(companyId, token),
          getCompanySummary(companyId, token),
          getCompanyJobs(companyId, token),
          getUserNotifications(userData.id, token),
        ])
        if (cancelled) return
        setCompany(companyData)
        setSummary(summaryData)
        setJobs(jobsData)
        setNotifications(notifsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, companyId])

  const activeJobCount = jobs.filter((j) => j.status === "active").length
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-zinc-400">Carregando painel…</p>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-300">
            ⚠
          </div>
          <h1 className="text-xl font-semibold text-zinc-50">Autenticação necessária</h1>
          <p className="text-zinc-400">Você precisa estar logado para acessar o dashboard.</p>
          <a
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Fazer login
          </a>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-300">
            ⚠
          </div>
          <h1 className="text-xl font-semibold text-zinc-50">Erro ao carregar</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </main>
    )
  }

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight">{company?.name ?? "—"}</h1>
              {company?.industry && (
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                  {company.industry}
                </span>
              )}
              <a
                href={`/company/${companyId}/profile`}
                className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                Perfil
              </a>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">Dashboard RH</p>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
              <span>{user.name}</span>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total de Matches"
            value={summary?.total_matches ?? 0}
            sub="candidatos compatíveis"
          />
          <MetricCard
            label="Compatibilidade Média"
            value={`${Math.round((summary?.avg_match_score ?? 0) * 100)}%`}
            sub="score médio OCEAN"
            accent
          />
          <MetricCard
            label="Vagas Ativas"
            value={activeJobCount}
            sub={`de ${jobs.length} vaga${jobs.length !== 1 ? "s" : ""} cadastrada${jobs.length !== 1 ? "s" : ""}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Top Candidates + Jobs */}
          <div className="space-y-6 lg:col-span-2">
            {/* Top Candidates */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-zinc-50">Top Candidatos</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Os 5 candidatos com maior compatibilidade</p>
              </div>
              {!summary || summary.top_candidates.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-zinc-500">Nenhum candidato encontrado</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {summary.top_candidates.map((c, i) => (
                    <div key={c.candidate_id} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="w-5 shrink-0 text-center text-xs font-medium text-zinc-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">{c.candidate_name}</p>
                        <p className="truncate text-xs text-zinc-500">{c.job_title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(c.score)}`}
                            style={{ width: `${Math.round(c.score * 100)}%` }}
                          />
                        </div>
                        <span className={`w-10 text-right text-xs font-semibold tabular-nums ${scoreTextColor(c.score)}`}>
                          {Math.round(c.score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Jobs */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-zinc-50">Vagas</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Matches por vaga</p>
              </div>
              {jobs.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-zinc-500">Nenhuma vaga cadastrada</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {jobs.map((job) => {
                    const count = summary?.matches_by_job[job.id] ?? 0
                    return (
                      <div key={job.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{job.title}</p>
                          <span
                            className={`text-xs ${job.status === "active" ? "text-emerald-400" : "text-zinc-600"}`}
                          >
                            {job.status === "active" ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-0.5 text-xs font-medium text-zinc-300">
                          {count} match{count !== 1 ? "es" : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: Notifications */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-zinc-50">Notificações</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                    {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">Últimas 5 notificações</p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-zinc-500">Sem notificações</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-4 ${n.is_read ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                      <div className="min-w-0 flex-1" style={n.is_read ? { paddingLeft: "10px" } : {}}>
                        <p className={`text-sm font-medium leading-snug ${n.is_read ? "text-zinc-400" : "text-zinc-50"}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                            {n.message}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <NotifTypeBadge type={n.type} />
                          <span className="text-[10px] text-zinc-600">{formatDate(n.created_at)}</span>
                        </div>
                      </div>
                    </div>
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

// ─── sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string | number
  sub: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent ? "text-blue-400" : "text-zinc-50"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-600">{sub}</p>
    </div>
  )
}

function NotifTypeBadge({ type }: { type: string }) {
  const isCandidate = type === "match_candidate"
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isCandidate
          ? "bg-violet-500/15 text-violet-400"
          : "bg-blue-500/15 text-blue-400"
      }`}
    >
      {isCandidate ? "Candidato" : "Empresa"}
    </span>
  )
}
