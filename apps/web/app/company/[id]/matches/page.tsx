"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  getCurrentUser,
  getCompany,
  getCompanyCandidates,
  getCompanyJobs,
  updateMatchStatus,
} from "@/lib/api"
import { OCEAN_DIMS } from "@/components/ocean/radar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { scoreColor } from "@/lib/utils"
import type {
  CompanyData,
  CandidateMatchData,
  JobData,
  UserData,
} from "@/lib/api"

// ─── Palette ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "linear-gradient(135deg,#3B82F6,#1d4ed8)", text: "#BFE0FF" },
  { bg: "linear-gradient(135deg,#8B5CF6,#6d28d9)", text: "#DDD0FF" },
  { bg: "linear-gradient(135deg,#10B981,#065f46)", text: "#a7f3d0" },
  { bg: "linear-gradient(135deg,#F59E0B,#b45309)", text: "#fde68a" },
  { bg: "linear-gradient(135deg,#EF4444,#991b1b)", text: "#fecaca" },
  { bg: "linear-gradient(135deg,#06B6D4,#0e7490)", text: "#a5f3fc" },
  { bg: "linear-gradient(135deg,#EC4899,#9d174d)", text: "#fbcfe8" },
]

function avatarPalette(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[idx]
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

// ─── Score ring ──────────────────────────────────────────────────────────────

function ScoreRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = size * 0.42
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = scoreColor(pct)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
      <circle
        cx={cx} cy={cx} r={r} fill="none" stroke={color}
        strokeWidth={size * 0.08} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }}
      />
      <text x={cx} y={cx} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={800} fill={color}>{pct}</text>
      <text x={cx} y={cx + 13} textAnchor="middle" dominantBaseline="central"
        fontSize={7} fontWeight={600} fill={color} opacity={0.7}>%</text>
    </svg>
  )
}

// ─── Status pill ─────────────────────────────────────────────────────────────

const STATUS_PILLS: Record<string, { label: string; dot: string; style: React.CSSProperties }> = {
  pending:    { label: "Novo",       dot: "#3AB0FF", style: { background: "rgba(58,176,255,0.10)", border: "1px solid rgba(58,176,255,0.30)", color: "#BFE0FF" } },
  accepted:   { label: "Aceito",     dot: "#10B981", style: { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.30)", color: "#a7f3d0" } },
  rejected:   { label: "Rejeitado",  dot: "#EF4444", style: { background: "rgba(239,68,68,0.10)",  border: "1px solid rgba(239,68,68,0.30)",  color: "#fecaca" } },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILLS[status] ?? STATUS_PILLS.pending
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold" style={cfg.style}>
      <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function CompanySidebar({ company, companyId, user, jobCount, totalMatches }: {
  company: CompanyData | null; companyId: string; user: UserData | null
  jobCount: number; totalMatches: number
}) {
  const pal = avatarPalette(company?.name ?? "E")
  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-black"
          style={{ background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)", color: "#06223e" }}>W</div>
        <span className="text-[13px] font-black tracking-widest uppercase" style={{ color: "#3AB0FF" }}>WHY ME?</span>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-[14px] px-3 py-3"
        style={{ background: "rgba(58,176,255,0.06)", border: "1px solid rgba(58,176,255,0.10)" }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black"
          style={{ background: pal.bg, color: pal.text }}>{initials(company?.name ?? "E")}</div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{company?.name ?? "Empresa"}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(58,176,255,0.55)" }}>
            {company?.industry ?? "RECRUTAMENTO"}
          </p>
        </div>
      </div>

      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.45)" }}>
        Recrutamento
      </p>
      <nav className="mb-6 space-y-0.5">
        {[
          { label: "Dashboard", href: `/company/${companyId}/dashboard`, icon: "⊞" },
          { label: "Vagas", href: `/company/${companyId}/jobs`, badge: jobCount, icon: "≡" },
          { label: "Candidatos", href: `/company/${companyId}/candidates`, icon: "◎" },
          { label: "Matches", href: `/company/${companyId}/matches`, badge: totalMatches, icon: "⟳", active: true },
          { label: "Entrevistas", href: "#", icon: "▷" },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="flex items-center justify-between rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors"
            style={item.active
              ? { background: "rgba(58,176,255,0.12)", color: "#BFE0FF", border: "1px solid rgba(58,176,255,0.20)" }
              : { color: "rgba(200,213,234,0.55)", border: "1px solid transparent" }}>
            <span className="flex items-center gap-2.5">
              <span className="text-[14px]">{item.icon}</span>
              {item.label}
            </span>
            {item.badge != null && item.badge > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(58,176,255,0.15)", color: "#3AB0FF" }}>{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.45)" }}>
        Empresa
      </p>
      <nav className="space-y-0.5">
        {[
          { label: "Perfil & Cultura", href: `/company/${companyId}/profile`, icon: "◈" },
          { label: "Time", href: "#", icon: "⊙" },
          { label: "Configurações", href: "#", icon: "⚙" },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors"
            style={{ color: "rgba(200,213,234,0.50)", border: "1px solid transparent" }}>
            <span className="text-[14px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="mt-auto pt-4 border-t" style={{ borderColor: "rgba(58,176,255,0.10)" }}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "rgba(58,176,255,0.15)", color: "#3AB0FF" }}>
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold">{user.name}</p>
              <p className="text-[10px]" style={{ color: "rgba(200,213,234,0.40)" }}>Admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Match row (dentro de cada vaga) ─────────────────────────────────────────

function MatchRow({
  match,
  onStatusChange,
}: {
  match: CandidateMatchData
  onStatusChange: (matchId: string, newStatus: string) => void
}) {
  const pct = Math.round(match.score * 100)
  const pal = avatarPalette(match.candidate_name)
  const [updating, setUpdating] = useState(false)
  const [localStatus, setLocalStatus] = useState(match.status)

  const handleAction = async (newStatus: string) => {
    if (updating || localStatus === newStatus) return
    setUpdating(true)
    try {
      const token = localStorage.getItem("whyme_token") ?? ""
      await updateMatchStatus(match.id, newStatus, token)
      setLocalStatus(newStatus)
      onStatusChange(match.id, newStatus)
    } catch {
      // silent — feedback visual já é suficiente
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[rgba(58,176,255,0.04)]"
      style={{ borderBottom: "1px solid rgba(58,176,255,0.07)" }}>
      {/* Avatar + nome */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
          style={{ background: pal.bg, color: pal.text }}>
          {initials(match.candidate_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{match.candidate_name}</p>
          {match.candidate_headline && (
            <p className="truncate text-[11px]" style={{ color: "rgba(200,213,234,0.45)" }}>
              {match.candidate_headline}
            </p>
          )}
        </div>
      </div>

      {/* Score */}
      <ScoreRing pct={pct} size={44} />

      {/* Status */}
      <div className="w-[90px]">
        <StatusPill status={localStatus} />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {localStatus !== "accepted" && (
          <button
            onClick={() => handleAction("accepted")}
            disabled={updating}
            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.30)",
              color: "#a7f3d0",
            }}
          >
            Aceitar
          </button>
        )}
        {localStatus !== "rejected" && (
          <button
            onClick={() => handleAction("rejected")}
            disabled={updating}
            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fecaca",
            }}
          >
            Rejeitar
          </button>
        )}
        <Link href={`/candidate/${match.candidate_id}/profile`}
          className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors"
          style={{
            background: "rgba(58,176,255,0.08)",
            border: "1px solid rgba(58,176,255,0.18)",
            color: "#3AB0FF",
          }}>
          Perfil
        </Link>
      </div>
    </div>
  )
}

// ─── Seção de vaga ───────────────────────────────────────────────────────────

function JobSection({
  jobTitle,
  matches,
  onStatusChange,
  defaultOpen,
}: {
  jobTitle: string
  matches: CandidateMatchData[]
  onStatusChange: (matchId: string, newStatus: string) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((a, m) => a + m.score, 0) / matches.length * 100)
    : 0

  return (
    <div className="rounded-[14px] overflow-hidden transition-all"
      style={{ background: "rgba(16,34,68,0.7)", border: "1px solid rgba(58,176,255,0.10)" }}>
      {/* Header da vaga */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-[rgba(58,176,255,0.04)]"
      >
        <div className="flex items-center gap-3">
          <span className="text-[16px] transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }}>
            ▸
          </span>
          <div className="text-left">
            <p className="text-[14px] font-bold">{jobTitle}</p>
            <p className="text-[11px]" style={{ color: "rgba(200,213,234,0.45)" }}>
              {matches.length} candidato{matches.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: "rgba(200,213,234,0.5)" }}>
            Média: {avgScore}%
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              background: scoreColor(avgScore) + "22",
              color: scoreColor(avgScore),
              border: `1px solid ${scoreColor(avgScore)}44`,
            }}>
            {avgScore}%
          </span>
        </div>
      </button>

      {/* Lista de matches */}
      {open && (
        <div>
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function CompanyMatchesPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [candidates, setCandidates] = useState<CandidateMatchData[]>([])
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    let cancelled = false
    async function load() {
      try {
        const userData = await getCurrentUser(token)
        if (cancelled) return
        setUser(userData)
        const [companyData, candidatesData, jobsData] = await Promise.all([
          getCompany(companyId, token),
          getCompanyCandidates(companyId, token),
          getCompanyJobs(companyId, token),
        ])
        if (cancelled) return
        setCompany(companyData)
        setCandidates(candidatesData)
        setJobs(jobsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, companyId])

  // ── Agrupar por vaga ─────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const map = new Map<string, CandidateMatchData[]>()
    const filtered = statusFilter === "todos"
      ? candidates
      : candidates.filter((c) => c.status === statusFilter)

    for (const c of filtered) {
      const list = map.get(c.job_id) ?? []
      list.push(c)
      map.set(c.job_id, list)
    }

    // Ordenar vagas por total de matches (decrescente)
    const sorted = [...jobs]
      .filter((j) => map.has(j.id))
      .sort((a, b) => (map.get(b.id)?.length ?? 0) - (map.get(a.id)?.length ?? 0))

    return sorted.map((j) => ({
      jobId: j.id,
      jobTitle: j.title,
      matches: (map.get(j.id) ?? []).sort((a, b) => b.score - a.score),
    }))
  }, [candidates, jobs, statusFilter])

  const handleStatusChange = (matchId: string, newStatus: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === matchId ? { ...c, status: newStatus } : c))
    )
  }

  const activeJobCount = jobs.filter((j) => j.status === "active").length
  const totalMatches = candidates.length

  if (loading) return <LoadingSpinner message="Carregando matches…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Faça login para continuar." onRetry={() => { window.location.href = "/login" }} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

  return (
    <div
      className="flex min-h-screen text-foreground lg:flex-row"
      style={{ background: "var(--bg, #060f1e)" }}
    >
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
        style={{ background: "linear-gradient(180deg,rgba(11,31,58,0.97),rgba(11,31,58,0.88))", borderRight: "1px solid rgba(58,176,255,0.10)" }}>
        <CompanySidebar company={company} companyId={companyId} user={user} jobCount={activeJobCount} totalMatches={totalMatches} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between min-h-[64px] px-7 border-b"
          style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)", borderColor: "rgba(58,176,255,0.10)" }}>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.01em]">Matches</h2>
              <p className="mt-0.5 text-[12px]" style={{ color: "rgba(200,213,234,0.62)" }}>
                {totalMatches} match{totalMatches !== 1 ? "es" : ""} em {grouped.length} vaga{grouped.length !== 1 ? "s" : ""}
              </p>
            </div>
            {/* Filtro status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-4 rounded-[10px] px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(58,176,255,0.15)",
                color: "#e8f0ff",
              }}
            >
              <option value="todos">Todos</option>
              <option value="pending">Novos</option>
              <option value="accepted">Aceitos</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
          <Link href={`/company/${companyId}/dashboard`}
            className="text-sm font-black tracking-widest text-gradient-gold uppercase">
            WHY ME?
          </Link>
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1200px] flex-1 p-7 space-y-4">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4 opacity-40">⟳</span>
              <p className="text-[15px] font-semibold" style={{ color: "rgba(200,213,234,0.6)" }}>
                Nenhum match encontrado
              </p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(200,213,234,0.35)" }}>
                {statusFilter !== "todos" ? "Tente remover o filtro de status." : "Aguarde candidatos fazerem o onboarding OCEAN."}
              </p>
            </div>
          ) : (
            grouped.map((g, i) => (
              <JobSection
                key={g.jobId}
                jobTitle={g.jobTitle}
                matches={g.matches}
                onStatusChange={handleStatusChange}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
