"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  getCurrentUser,
  getCompany,
  getCompanyCandidates,
  getCompanyJobs,
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

function ScoreRing({ pct, size = 48 }: { pct: number; size?: number }) {
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
        fontSize={size < 50 ? 9 : 14} fontWeight={800} fill={color}>
        {pct}
      </text>
      <text x={cx} y={cx + (size < 50 ? 9 : 14) * 1} textAnchor="middle" dominantBaseline="central"
        fontSize={(size < 50 ? 9 : 14) * 0.65} fontWeight={600} fill={color} opacity={0.7}>
        %
      </text>
    </svg>
  )
}

// ─── OCEAN mini-strip ────────────────────────────────────────────────────────

function OceanStrip({ breakdown }: { breakdown: Record<string, number> | null | undefined }) {
  if (!breakdown) return <span className="text-[11px]" style={{ color: "rgba(200,213,234,0.4)" }}>—</span>
  return (
    <div className="flex items-center gap-[3px]">
      {OCEAN_DIMS.map((dim) => {
        const val = Math.min(Math.round((breakdown[dim.key] ?? 0) > 1 ? breakdown[dim.key] : (breakdown[dim.key] ?? 0) * 100), 100)
        return (
          <div key={dim.key} title={`${dim.label}: ${val}`}
            className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold"
            style={{ background: `${dim.color}22`, color: dim.color, border: `1px solid ${dim.color}44` }}>
            {val > 0 ? Math.round(val / 10) : "·"}
          </div>
        )
      })}
    </div>
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

// ─── Skill chip ──────────────────────────────────────────────────────────────

function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(58,176,255,0.08)", border: "1px solid rgba(58,176,255,0.18)", color: "rgba(191,224,255,0.75)" }}>
      {label}
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
          { label: "Candidatos", href: `/company/${companyId}/candidates`, icon: "◎", active: true },
          { label: "Matches", href: `/company/${companyId}/matches`, badge: totalMatches, icon: "⟳" },
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

// ─── Card de candidato ───────────────────────────────────────────────────────

function CandidateCard({ candidate }: { candidate: CandidateMatchData }) {
  const pct = Math.round(candidate.score * 100)
  const pal = avatarPalette(candidate.candidate_name)
  const [hovered, setHovered] = useState(false)

  const skills = candidate.candidate_skills
    ? Object.keys(candidate.candidate_skills as Record<string, unknown>).slice(0, 4)
    : []

  return (
    <div
      className="rounded-[16px] p-5 transition-all duration-200"
      style={{
        background: "rgba(16,34,68,0.78)",
        backdropFilter: "blur(20px)",
        border: hovered ? "1px solid rgba(58,176,255,0.28)" : "1px solid rgba(58,176,255,0.12)",
        boxShadow: hovered ? `0 12px 32px -12px ${scoreColor(pct)}44, 0 4px 24px rgba(0,0,0,0.30)` : "0 4px 24px rgba(0,0,0,0.28)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-black"
          style={{ background: pal.bg, color: pal.text }}>
          {initials(candidate.candidate_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold">{candidate.candidate_name}</p>
          {candidate.candidate_headline && (
            <p className="truncate text-[11.5px]" style={{ color: "rgba(200,213,234,0.55)" }}>
              {candidate.candidate_headline}
            </p>
          )}
        </div>
        <ScoreRing pct={pct} size={56} />
      </div>

      {skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {skills.map((s) => <SkillChip key={s} label={s} />)}
        </div>
      )}

      {/* OCEAN bars */}
      <div className="mb-3 space-y-[3px]">
        {OCEAN_DIMS.map((dim) => {
          const val = candidate.ocean_breakdown
            ? Math.min(Math.round((candidate.ocean_breakdown[dim.key] ?? 0) > 1
              ? candidate.ocean_breakdown[dim.key]
              : (candidate.ocean_breakdown[dim.key] ?? 0) * 100), 100)
            : 0
          return (
            <div key={dim.key} className="flex items-center gap-1.5">
              <span className="w-[10px] text-[9px] font-bold" style={{ color: dim.color }}>{dim.label}</span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: dim.color }} />
              </div>
              <span className="w-[18px] text-right font-mono text-[8px]" style={{ color: dim.color }}>{val}</span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(58,176,255,0.08)" }}>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(200,213,234,0.5)" }}>
          <span>{candidate.candidate_experience_years ?? "—"} anos</span>
          <span className="w-1 h-1 rounded-full" style={{ background: "rgba(200,213,234,0.2)" }} />
          <StatusPill status={candidate.status} />
        </div>
        <Link href={`/candidate/${candidate.candidate_id}/profile`}
          className="text-[12px] font-semibold transition-colors hover:underline"
          style={{ color: "#3AB0FF" }}>
          Ver perfil →
        </Link>
      </div>
    </div>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function CompanyCandidatesPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [candidates, setCandidates] = useState<CandidateMatchData[]>([])
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [jobFilter, setJobFilter] = useState("todas")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [sortBy, setSortBy] = useState<"score" | "experiencia" | "nome">("score")

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

  // ── Filtros e ordenação ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...candidates]

    // Filtro por vaga
    if (jobFilter !== "todas") {
      list = list.filter((c) => c.job_id === jobFilter)
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      list = list.filter((c) => c.status === statusFilter)
    }

    // Busca por nome
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.candidate_name.toLowerCase().includes(q))
    }

    // Ordenação
    list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score
      if (sortBy === "experiencia") return (b.candidate_experience_years ?? 0) - (a.candidate_experience_years ?? 0)
      return a.candidate_name.localeCompare(b.candidate_name)
    })

    return list
  }, [candidates, jobFilter, statusFilter, search, sortBy])

  const activeJobCount = jobs.filter((j) => j.status === "active").length

  if (loading) return <LoadingSpinner message="Carregando candidatos…" />
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
        <CompanySidebar company={company} companyId={companyId} user={user} jobCount={activeJobCount} totalMatches={candidates.length} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between min-h-[64px] px-7 border-b"
          style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)", borderColor: "rgba(58,176,255,0.10)" }}>
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.01em]">Candidatos</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: "rgba(200,213,234,0.62)" }}>
              {filtered.length} candidato{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href={`/company/${companyId}/dashboard`}
            className="text-sm font-black tracking-widest text-gradient-gold uppercase">
            WHY ME?
          </Link>
        </header>

        {/* Content */}
        <div className="mx-auto w-full max-w-[1480px] flex-1 p-7 space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] px-5 py-4"
            style={{ background: "rgba(16,34,68,0.6)", border: "1px solid rgba(58,176,255,0.10)" }}>
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar por nome…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[10px] px-4 py-2 text-[13px] outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(58,176,255,0.15)",
                  color: "#e8f0ff",
                }}
              />
            </div>

            {/* Filtro vaga */}
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="rounded-[10px] px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(58,176,255,0.15)",
                color: "#e8f0ff",
              }}
            >
              <option value="todas">Todas as vagas</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            {/* Filtro status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-[10px] px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(58,176,255,0.15)",
                color: "#e8f0ff",
              }}
            >
              <option value="todos">Todos os status</option>
              <option value="pending">Novo</option>
              <option value="accepted">Aceito</option>
              <option value="rejected">Rejeitado</option>
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-[10px] px-3 py-2 text-[13px] outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(58,176,255,0.15)",
                color: "#e8f0ff",
              }}
            >
              <option value="score">Score ↓</option>
              <option value="experiencia">Experiência ↓</option>
              <option value="nome">Nome A-Z</option>
            </select>
          </div>

          {/* Grid de candidatos */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4 opacity-40">◎</span>
              <p className="text-[15px] font-semibold" style={{ color: "rgba(200,213,234,0.6)" }}>
                Nenhum candidato encontrado
              </p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(200,213,234,0.35)" }}>
                {search ? "Tente ajustar os filtros ou a busca." : "Ainda não há matches para sua empresa."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <CandidateCard key={`${c.id}-${c.job_id}`} candidate={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
