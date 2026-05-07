"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  getCurrentUser,
  getCompany,
  getCompanySummary,
  getCompanyJobs,
  getUserNotifications,
} from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Card } from "@/components/ui/card"
import type {
  CompanyData,
  CompanySummaryData,
  JobData,
  NotificationData,
  UserData,
  SummaryFilters,
} from "@/lib/api"

// ─── OCEAN labels ────────────────────────────────────────────────────────────

const OCEAN_DIMS = [
  { key: "O", label: "Abertura", field: "openness" },
  { key: "C", label: "Conscienciosidade", field: "conscientiousness" },
  { key: "E", label: "Extroversão", field: "extraversion" },
  { key: "A", label: "Amabilidade", field: "agreeableness" },
  { key: "N", label: "Neuroticismo", field: "neuroticism" },
] as const

const OCEAN_COLORS: Record<string, string> = {
  openness: "bg-sky-500",
  conscientiousness: "bg-emerald-500",
  extraversion: "bg-violet-500",
  agreeableness: "bg-amber-500",
  neuroticism: "bg-rose-500",
}

const SORT_OPTIONS = [
  { value: "overall", label: "Score Geral" },
  { value: "openness", label: "Abertura" },
  { value: "conscientiousness", label: "Conscienciosidade" },
  { value: "extraversion", label: "Extroversão" },
  { value: "agreeableness", label: "Amabilidade" },
  { value: "neuroticism", label: "Neuroticismo" },
] as const

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

  // Filter state
  const [filterO, setFilterO] = useState(0)
  const [filterC, setFilterC] = useState(0)
  const [filterE, setFilterE] = useState(0)
  const [filterA, setFilterA] = useState(0)
  const [filterN, setFilterN] = useState(0)
  const [sortBy, setSortBy] = useState<string>("overall")
  const [appliedFilters, setAppliedFilters] = useState<SummaryFilters | null>(null)

  // Derived: any filter active (for visual indicator)
  const filtersActive =
    filterO > 0 || filterC > 0 || filterE > 0 || filterA > 0 || filterN > 0 || sortBy !== "overall"

  const loadSummary = useCallback(async (filters: SummaryFilters | null) => {
    if (!token) return
    try {
      const summaryData = await getCompanySummary(companyId, token, filters ?? undefined)
      return summaryData
    } catch {
      return null
    }
  }, [token, companyId])

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

  const handleApplyFilters = async () => {
    const filters: SummaryFilters = {}
    if (filterO > 0) filters.filter_O_min = filterO
    if (filterC > 0) filters.filter_C_min = filterC
    if (filterE > 0) filters.filter_E_min = filterE
    if (filterA > 0) filters.filter_A_min = filterA
    if (filterN > 0) filters.filter_N_min = filterN
    if (sortBy !== "overall") filters.sort_by = sortBy as SummaryFilters["sort_by"]
    filters.limit = 20
    setAppliedFilters(filters)
    const data = await loadSummary(filters)
    if (data) setSummary(data)
  }

  const handleResetFilters = async () => {
    setFilterO(0)
    setFilterC(0)
    setFilterE(0)
    setFilterA(0)
    setFilterN(0)
    setSortBy("overall")
    setAppliedFilters(null)
    const data = await loadSummary(null)
    if (data) setSummary(data)
  }

  const activeJobCount = jobs.filter((j) => j.status === "active").length
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── loading / error states ─────────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Carregando painel…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Você precisa estar logado para acessar o dashboard." onRetry={() => window.location.href = "/login"} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

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
              <a
                href="/company/orbita"
                className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 transition-colors hover:border-violet-500 hover:text-violet-300"
              >
                Órbita
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

        {/* OCEAN Filters */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-50">Filtros OCEAN</h3>
            {filtersActive && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                Filtros ativos
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {OCEAN_DIMS.map((dim) => {
              const value = dim.key === "O" ? filterO
                : dim.key === "C" ? filterC
                : dim.key === "E" ? filterE
                : dim.key === "A" ? filterA
                : filterN
              const setter = dim.key === "O" ? setFilterO
                : dim.key === "C" ? setFilterC
                : dim.key === "E" ? setFilterE
                : dim.key === "A" ? setFilterA
                : setFilterN
              const color = OCEAN_COLORS[dim.field]
              return (
                <div key={dim.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">
                      {dim.key} — {dim.label}
                    </label>
                    <span className="text-xs tabular-nums text-zinc-500">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="ocean-slider w-full"
                    style={{
                      accentColor: color === "bg-sky-500" ? "#0ea5e9"
                        : color === "bg-emerald-500" ? "#10b981"
                        : color === "bg-violet-500" ? "#8b5cf6"
                        : color === "bg-amber-500" ? "#f59e0b"
                        : "#f43f5e",
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-400">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            >
              Aplicar Filtros
            </button>
            {filtersActive && (
              <button
                onClick={handleResetFilters}
                className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Top Candidates + Jobs */}
          <div className="space-y-6 lg:col-span-2">
            {/* Top Candidates */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="font-semibold text-zinc-50">Top Candidatos</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {filtersActive
                    ? "Ordenados e filtrados por dimensões OCEAN"
                    : "Os candidatos com maior compatibilidade"}
                </p>
              </div>
              {!summary || summary.top_candidates.length === 0 ? (
                <EmptyState title="Nenhum candidato encontrado" className="rounded-none border-0" />
              ) : (
                <div className="divide-y divide-zinc-800">
                  {summary.top_candidates.map((c, i) => (
                    <div key={c.candidate_id} className="flex items-start gap-4 px-5 py-3.5">
                      <span className="mt-1 w-5 shrink-0 text-center text-xs font-medium text-zinc-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div>
                          <p className="truncate text-sm font-medium text-zinc-100">{c.candidate_name}</p>
                          <p className="truncate text-xs text-zinc-500">{c.job_title}</p>
                        </div>
                        {/* OCEAN mini breakdown bars */}
                        {c.ocean_breakdown && (
                          <div className="flex flex-wrap gap-2">
                            {OCEAN_DIMS.map((dim) => {
                              const val = c.ocean_breakdown![dim.field] ?? 0
                              const color = OCEAN_COLORS[dim.field]
                              return (
                                <div key={dim.field} className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-zinc-500">{dim.key}</span>
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                      className={`h-full rounded-full ${color}`}
                                      style={{ width: `${Math.min(val, 100)}%` }}
                                    />
                                  </div>
                                  <span className="w-6 text-right text-[10px] tabular-nums text-zinc-500">
                                    {Math.round(val)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800 sm:w-20">
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
                <EmptyState title="Nenhuma vaga cadastrada" className="rounded-none border-0" />
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
              <EmptyState title="Sem notificações" className="rounded-none border-0" />
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
