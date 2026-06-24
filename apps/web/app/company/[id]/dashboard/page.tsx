"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  getCurrentUser,
  getCompany,
  getCompanySummary,
  getCompanyJobs,
} from "@/lib/api"
import { OceanRadar, OCEAN_DIMS } from "@/components/ocean/radar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { OCEAN_COLORS, scoreColor } from "@/lib/utils"
import type {
  CompanyData,
  CompanySummaryData,
  JobData,
  UserData,
  TopCandidateItem,
} from "@/lib/api"

// ─── Avatar color by initial ─────────────────────────────────────────────────

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

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ pct, size = 76 }: { pct: number; size?: number }) {
  const r = size * 0.42
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = scoreColor(pct)
  const fontSize = size < 50 ? 9 : 14
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
        fontSize={fontSize} fontWeight={800} fill={color}>
        {pct}
      </text>
      <text x={cx} y={cx + fontSize * 1} textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize * 0.65} fontWeight={600} fill={color} opacity={0.7}>
        %
      </text>
    </svg>
  )
}

// ─── OCEAN mini-bars (horizontal, per dimension) ──────────────────────────────

function OceanBarsCompact({ breakdown }: { breakdown: Record<string, number> | null | undefined }) {
  if (!breakdown) return <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>—</span>
  return (
    <div className="space-y-[3px]">
      {OCEAN_DIMS.map((dim) => {
        const val = Math.min(Math.round((breakdown[dim.key] ?? 0) > 1 ? breakdown[dim.key] : (breakdown[dim.key] ?? 0) * 100), 100)
        return (
          <div key={dim.key} className="flex items-center gap-1.5">
            <span className="w-[10px] text-[9px] font-bold" style={{ color: dim.color }}>{dim.label}</span>
            <div className="h-[4px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)", minWidth: 48 }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: dim.color }} />
            </div>
            <span className="w-[22px] text-right font-mono text-[9px]" style={{ color: dim.color }}>{val}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── OCEAN strip (inline tiny blocks for pipeline table) ─────────────────────

function OceanStrip({ breakdown }: { breakdown: Record<string, number> | null | undefined }) {
  if (!breakdown) return <span style={{ color: "var(--fg-3)" }}>—</span>
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

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_PILLS: Record<string, { label: string; dot: string; style: React.CSSProperties }> = {
  novo:       { label: "Novo",       dot: "#3AB0FF", style: { background: "rgba(58,176,255,0.10)",   border: "1px solid rgba(58,176,255,0.30)",   color: "#BFE0FF" } },
  contatado:  { label: "Contatado",  dot: "#F59E0B", style: { background: "rgba(245,180,84,0.10)",   border: "1px solid rgba(245,180,84,0.30)",   color: "#fde68a" } },
  entrevista: { label: "Entrevista", dot: "#8B5CF6", style: { background: "rgba(139,92,246,0.10)",   border: "1px solid rgba(139,92,246,0.30)",   color: "#DDD0FF" } },
  avancado:   { label: "Avançado",   dot: "#10B981", style: { background: "rgba(16,185,129,0.10)",   border: "1px solid rgba(16,185,129,0.30)",   color: "#a7f3d0" } },
  reciproco:  { label: "Match recíproco", dot: "#8B5CF6", style: { background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", color: "#DDD0FF" } },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILLS[status] ?? STATUS_PILLS.novo
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold" style={cfg.style}>
      <span className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

// ─── Skill chip ───────────────────────────────────────────────────────────────

function SkillChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: "rgba(58,176,255,0.08)", border: "1px solid rgba(58,176,255,0.18)", color: "rgba(191,224,255,0.75)" }}>
      {label}
    </span>
  )
}

// ─── KPI stat card ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="flex-1 min-w-[100px] px-5 py-4" style={{ borderLeft: "1px solid rgba(58,176,255,0.10)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.6)" }}>{label}</p>
      <p className="mt-1 text-[28px] font-black leading-none tracking-[-0.03em]" style={{ color: color ?? "var(--fg-1, #e8f0ff)" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px]" style={{ color: "rgba(56,211,145,0.75)" }}>{sub}</p>}
    </div>
  )
}

// ─── Top-3 podium card ────────────────────────────────────────────────────────

function PodiumCard({ candidate, rank, isFeatured }: { candidate: TopCandidateItem; rank: number; isFeatured?: boolean }) {
  const pct = Math.round(candidate.score * 100)
  const pal = avatarPalette(candidate.candidate_name)
  const [hovered, setHovered] = useState(false)
  const color = scoreColor(pct)

  const skills = ["Python", "AWS", "Docker"].slice(0, 3) // placeholder skills

  return (
    <div
      className="relative flex flex-col rounded-[18px] p-5 transition-all duration-200"
      style={{
        background: "rgba(16,34,68,0.78)",
        backdropFilter: "blur(20px)",
        border: hovered ? `1px solid rgba(58,176,255,0.28)` : "1px solid rgba(58,176,255,0.12)",
        boxShadow: hovered ? `0 16px 40px -16px ${color}55, 0 4px 24px rgba(0,0,0,0.30)` : "0 4px 24px rgba(0,0,0,0.28)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.6)" }}>
          #{rank} Top Match
        </span>
        <button className="text-[13px]" style={{ color: isFeatured ? "#f5b454" : "rgba(200,213,234,0.30)" }}>★</button>
      </div>

      {/* Candidate header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-black"
          style={{ background: pal.bg, color: pal.text }}>
          {initials(candidate.candidate_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-snug">{candidate.candidate_name}</p>
          <p className="truncate text-[11.5px]" style={{ color: "var(--fg-3, rgba(200,213,234,0.55))" }}>
            {candidate.job_title}
          </p>
        </div>
        <ScoreRing pct={pct} size={64} />
      </div>

      {/* Status pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <StatusPill status="reciproco" />
        {rank <= 2 && <StatusPill status="entrevista" />}
        {rank === 3 && <StatusPill status="contatado" />}
      </div>

      {/* Skill chips */}
      <div className="mb-4 flex flex-wrap gap-1">
        {skills.map((s) => <SkillChip key={s} label={s} />)}
      </div>

      {/* OCEAN bars */}
      <div className="mb-4 flex-1">
        <OceanBarsCompact breakdown={candidate.ocean_breakdown} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: "rgba(58,176,255,0.10)" }}>
        <button className="flex-1 rounded-[10px] py-2 text-[12.5px] font-semibold transition-colors"
          style={{ border: "1px solid rgba(58,176,255,0.22)", color: "#BFE0FF", background: "rgba(58,176,255,0.06)" }}>
          Ver perfil
        </button>
        <button className="flex-1 rounded-[10px] py-2 text-[12.5px] font-semibold text-[#06223e] transition-all"
          style={{ background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)", boxShadow: "0 4px 16px -4px rgba(58,176,255,0.50)" }}>
          Convidar
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function CompanySidebar({ company, companyId, user, jobCount, totalMatches }: {
  company: CompanyData | null
  companyId: string
  user: UserData | null
  jobCount: number
  totalMatches: number
}) {
  const pal = avatarPalette(company?.name ?? "E")
  return (
    <div className="flex h-full flex-col px-4 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-black"
          style={{ background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)", color: "#06223e" }}>
          W
        </div>
        <span className="text-[13px] font-black tracking-widest uppercase" style={{ color: "#3AB0FF" }}>WHY ME?</span>
      </div>

      {/* Company identity */}
      <div className="mb-6 flex items-center gap-3 rounded-[14px] px-3 py-3"
        style={{ background: "rgba(58,176,255,0.06)", border: "1px solid rgba(58,176,255,0.10)" }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black"
          style={{ background: pal.bg, color: pal.text }}>
          {initials(company?.name ?? "E")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{company?.name ?? "Empresa"}</p>
          {user && (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(58,176,255,0.55)" }}>
              {company?.industry ?? "RECRUTAMENTO"}
            </p>
          )}
        </div>
      </div>

      {/* Nav — RECRUTAMENTO */}
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.45)" }}>
        Recrutamento
      </p>
      <nav className="mb-6 space-y-0.5">
        {[
          { label: "Dashboard", href: `/company/${companyId}/dashboard`, active: true, icon: "⊞" },
          { label: "Vagas", href: `/company/${companyId}/jobs`, badge: jobCount, icon: "≡" },
          { label: "Candidatos", href: `/company/${companyId}/candidates`, badge: null, icon: "◎" },
          { label: "Matches", href: `/company/${companyId}/matches`, badge: totalMatches, icon: "⟳" },
          { label: "Entrevistas", href: "#", badge: null, icon: "▷" },
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
                style={{ background: "rgba(58,176,255,0.15)", color: "#3AB0FF" }}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Nav — EMPRESA */}
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

      {/* Footer user */}
      {user && (
        <div className="mt-auto pt-4 border-t" style={{ borderColor: "rgba(58,176,255,0.10)" }}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "rgba(58,176,255,0.15)", color: "#3AB0FF" }}>
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold">{user.name}</p>
              <p className="text-[10px]" style={{ color: "rgba(200,213,234,0.40)" }}>Head of Talent · Admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pipeline table row ───────────────────────────────────────────────────────

function PipelineRow({ candidate, rank }: { candidate: TopCandidateItem; rank: number }) {
  const pct = Math.round(candidate.score * 100)
  const pal = avatarPalette(candidate.candidate_name)
  const color = scoreColor(pct)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="grid items-center gap-4 px-5 py-3.5 transition-colors"
      style={{
        gridTemplateColumns: "32px 2fr 1fr 140px 72px 120px 32px",
        borderBottom: "1px solid rgba(58,176,255,0.07)",
        background: hovered ? "rgba(58,176,255,0.04)" : "transparent",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank */}
      <span className="text-[11.5px] font-bold" style={{ color: "rgba(200,213,234,0.35)" }}>#{rank}</span>

      {/* Candidate */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
          style={{ background: pal.bg, color: pal.text }}>
          {initials(candidate.candidate_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{candidate.candidate_name}</p>
          <p className="truncate text-[11px]" style={{ color: "rgba(200,213,234,0.45)" }}>{candidate.job_title}</p>
        </div>
      </div>

      {/* Skills placeholder */}
      <div className="flex flex-wrap gap-1">
        {["Python", "AWS"].map((s) => <SkillChip key={s} label={s} />)}
      </div>

      {/* OCEAN strip */}
      <OceanStrip breakdown={candidate.ocean_breakdown} />

      {/* Match % */}
      <span className="text-right text-[14px] font-black" style={{ color }}>{pct}%</span>

      {/* Status */}
      <StatusPill status={rank % 3 === 0 ? "avancado" : rank % 2 === 0 ? "contatado" : "novo"} />

      {/* Menu */}
      <button className="text-[16px]" style={{ color: "rgba(200,213,234,0.25)" }}>···</button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyDashboardPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [summary, setSummary] = useState<CompanySummaryData | null>(null)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<string>("todos")

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
        const [companyData, summaryData, jobsData] = await Promise.all([
          getCompany(companyId, token),
          getCompanySummary(companyId, token),
          getCompanyJobs(companyId, token),
        ])
        if (cancelled) return
        setCompany(companyData)
        setSummary(summaryData)
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

  if (loading) return <LoadingSpinner message="Carregando painel…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Faça login para continuar." onRetry={() => { window.location.href = "/login" }} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

  const selectedJob = jobs.find((j) => j.status === "active") ?? jobs[0] ?? null
  const top3 = summary?.top_candidates.slice(0, 3) ?? []
  const pipeline = summary?.top_candidates.slice(3) ?? []
  const avgScore = Math.round((summary?.avg_match_score ?? 0) * 100)
  const activeJobCount = jobs.filter((j) => j.status === "active").length
  const totalCandidates = summary?.total_matches ?? 0

  const TABS = ["Todos", "Novos", "Contatados", "Entrevista", "Avançados"]

  // Placeholder job OCEAN (ideal profile)
  const jobOcean = selectedJob
    ? { openness: 75, conscientiousness: 80, extraversion: 60, agreeableness: 65, neuroticism: 30 }
    : null

  return (
    <div
      className="flex min-h-screen text-foreground lg:flex-row"
      style={{
        backgroundImage: "radial-gradient(900px 500px at 80% -5%, rgba(58,176,255,0.07), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgba(139,92,246,0.06), transparent 65%)",
        backgroundAttachment: "fixed",
        background: "var(--bg, #060f1e)",
      }}
    >
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto"
        style={{ background: "linear-gradient(180deg,rgba(11,31,58,0.97),rgba(11,31,58,0.88))", borderRight: "1px solid rgba(58,176,255,0.10)" }}>
        <CompanySidebar company={company} companyId={companyId} user={user} jobCount={activeJobCount} totalMatches={totalCandidates} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top header */}
        <header className="flex items-center justify-between px-7 py-4 border-b"
          style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)", borderColor: "rgba(58,176,255,0.10)" }}>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px]">
            <Link href={`/company/${companyId}/jobs`} className="transition-colors hover:text-[#3AB0FF]" style={{ color: "rgba(200,213,234,0.45)" }}>
              Vagas
            </Link>
            <span style={{ color: "rgba(200,213,234,0.25)" }}>/</span>
            {selectedJob && (
              <>
                <span style={{ color: "rgba(200,213,234,0.45)" }}>{selectedJob.title}</span>
                <span style={{ color: "rgba(200,213,234,0.25)" }}>/</span>
              </>
            )}
            <span className="font-semibold" style={{ color: "rgba(200,213,234,0.85)" }}>Candidatos</span>
          </nav>
          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="rounded-xl px-3 py-1.5 text-[12px]" style={{ border: "1px solid rgba(58,176,255,0.18)", color: "rgba(200,213,234,0.55)" }}>
              🔍 Buscar candidatos…
            </button>
            <button className="text-[18px]" style={{ color: "rgba(200,213,234,0.35)" }}>🔔</button>
          </div>
        </header>

        <div className="flex-1 space-y-6 px-7 py-6">

          {/* ── Job hero ── */}
          {selectedJob && (
            <section className="rounded-[18px] overflow-hidden"
              style={{ background: "rgba(16,34,68,0.78)", backdropFilter: "blur(20px)", border: "1px solid rgba(58,176,255,0.12)", boxShadow: "0 4px 32px rgba(0,0,0,0.30)" }}>
              <div className="flex flex-col gap-6 p-6 lg:flex-row">
                {/* Left: job info */}
                <div className="flex-1 min-w-0">
                  {/* Job title row */}
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[20px] font-black"
                      style={{ background: "linear-gradient(135deg,#2A4A85,#0d2348)", border: "1px solid rgba(58,176,255,0.20)", color: "#BFE0FF" }}>
                      {initials(company?.name ?? "E")}
                    </div>
                    <div>
                      <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em]">{selectedJob.title}</h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "rgba(200,213,234,0.55)" }}>
                        <span>{company?.name}</span>
                        {selectedJob.work_model && <><span>·</span><span>{selectedJob.work_model}</span></>}
                        {selectedJob.location && <><span>·</span><span>📍 {selectedJob.location}</span></>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedJob.work_model && (
                          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: "rgba(58,176,255,0.10)", border: "1px solid rgba(58,176,255,0.22)", color: "#BFE0FF" }}>
                            {selectedJob.work_model}
                          </span>
                        )}
                        <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{ background: "rgba(58,176,255,0.06)", border: "1px solid rgba(58,176,255,0.14)", color: "rgba(191,224,255,0.70)" }}>
                          CLT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedJob.description && (
                    <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "rgba(200,213,234,0.65)" }}>
                      {selectedJob.description}
                    </p>
                  )}

                  {/* Skills */}
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {(selectedJob.hard_skills_required ?? []).slice(0, 8).map((s: string) => (
                      <SkillChip key={s} label={s} />
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold text-[#06223e] transition-all hover:-translate-y-px"
                      style={{ background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)", boxShadow: "0 0 20px rgba(58,176,255,0.28)" }}>
                      + Convidar candidato
                    </button>
                    <Link href={`/company/${companyId}/jobs`}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors"
                      style={{ border: "1px solid rgba(58,176,255,0.22)", color: "#BFE0FF" }}>
                      Editar vaga
                    </Link>
                    <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors"
                      style={{ border: "1px solid rgba(58,176,255,0.14)", color: "rgba(191,224,255,0.60)" }}>
                      Compartilhar link
                    </button>
                  </div>
                </div>

                {/* Right: OCEAN radar + KPIs */}
                <div className="flex flex-col items-center gap-4 lg:items-end">
                  {jobOcean && (
                    <div className="text-center">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.55)" }}>
                        Perfil OCEAN da Vaga
                      </p>
                      <OceanRadar scores={jobOcean} size={180} />
                    </div>
                  )}
                </div>
              </div>

              {/* KPI strip */}
              <div className="flex flex-wrap border-t" style={{ borderColor: "rgba(58,176,255,0.10)" }}>
                <KpiCard label="Candidatos" value={totalCandidates} sub="+12 esta semana" />
                <KpiCard label="Match Recíproco" value={Math.round(totalCandidates * 0.14)} sub="+3" />
                <KpiCard label="Em Entrevista" value={Math.round(totalCandidates * 0.05)} sub="2 hoje" />
                <KpiCard label="Match Médio" value={`${avgScore}%`} sub={`+4`} color={scoreColor(avgScore)} />
              </div>
            </section>
          )}

          {/* ── Filter tabs ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status tabs */}
            <div className="flex items-center rounded-xl p-1" style={{ background: "rgba(8,22,46,0.60)", border: "1px solid rgba(58,176,255,0.10)" }}>
              {TABS.map((tab) => {
                const key = tab.toLowerCase().replace("ç", "c")
                const isActive = activeTab === key
                return (
                  <button key={tab} onClick={() => setActiveTab(key)}
                    className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all"
                    style={isActive
                      ? { background: "rgba(16,34,68,0.85)", border: "1px solid rgba(58,176,255,0.25)", color: "#BFE0FF", boxShadow: "0 2px 8px rgba(0,0,0,0.20)" }
                      : { border: "1px solid transparent", color: "rgba(200,213,234,0.40)" }}>
                    {tab}
                  </button>
                )
              })}
            </div>
            <button className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{ border: "1px solid rgba(58,176,255,0.18)", color: "rgba(191,224,255,0.65)" }}>
              ⚡ Filtros (3)
            </button>
            <button className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{ border: "1px solid rgba(58,176,255,0.14)", color: "rgba(191,224,255,0.50)" }}>
              ⟳ Apenas recíprocos
            </button>
            <div className="ml-auto flex items-center gap-3 text-[12px]" style={{ color: "rgba(200,213,234,0.45)" }}>
              <span>Mostrando <b style={{ color: "rgba(200,213,234,0.75)" }}>{top3.length + pipeline.length}</b> de {top3.length + pipeline.length} candidatos</span>
              <span style={{ color: "rgba(200,213,234,0.25)" }}>|</span>
              <span>↕ Match (alto → baixo)</span>
            </div>
          </div>

          {/* ── TOP 3 PODIUM ── */}
          {top3.length > 0 && (
            <section>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(58,176,255,0.55)" }}>
                Top 3 · Maior Afinidade OCEAN
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {top3.map((c, i) => (
                  <PodiumCard key={c.candidate_id} candidate={c} rank={i + 1} isFeatured={i === 1} />
                ))}
              </div>
            </section>
          )}

          {/* ── PIPELINE TABLE ── */}
          {pipeline.length > 0 && (
            <section className="overflow-hidden rounded-[18px]"
              style={{ background: "rgba(16,34,68,0.78)", border: "1px solid rgba(58,176,255,0.10)" }}>
              {/* Header */}
              <div className="grid items-center gap-4 px-5 py-3"
                style={{
                  gridTemplateColumns: "32px 2fr 1fr 140px 72px 120px 32px",
                  background: "rgba(0,0,0,0.20)",
                  borderBottom: "1px solid rgba(58,176,255,0.10)",
                }}>
                {["#", "Candidato", "Skills", "Perfil OCEAN", "Match", "Status", ""].map((h) => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(200,213,234,0.35)" }}>{h}</span>
                ))}
              </div>

              <p className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.45)", borderBottom: "1px solid rgba(58,176,255,0.07)" }}>
                Pipeline · Todos os candidatos
              </p>

              {pipeline.map((c, i) => (
                <PipelineRow key={c.candidate_id} candidate={c} rank={i + 4} />
              ))}

              {pipeline.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px]" style={{ color: "rgba(200,213,234,0.35)" }}>
                  Nenhum candidato adicional encontrado
                </p>
              )}
            </section>
          )}

          {top3.length === 0 && pipeline.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-[28px]"
                style={{ background: "rgba(58,176,255,0.08)", border: "1px solid rgba(58,176,255,0.15)" }}>◎</div>
              <p className="text-[16px] font-semibold" style={{ color: "rgba(200,213,234,0.60)" }}>Nenhum candidato ainda</p>
              <p className="mt-1 text-[13px]" style={{ color: "rgba(200,213,234,0.35)" }}>Os matches aparecerão aqui quando houver candidatos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
