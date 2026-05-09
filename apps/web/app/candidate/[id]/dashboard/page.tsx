"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { OceanRadar, OceanBars } from "@/components/ocean/radar"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { scoreColor } from "@/lib/utils"

// ─── Score ring (candidate dashboard) ────────────────────────────────────────

function ScoreRing({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = size * 0.42
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = scoreColor(pct)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }} />
      <text x={cx} y={cx - 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.22} fontWeight={800} fill={color}>{pct}</text>
      <text x={cx} y={cx + size * 0.18} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.14} fontWeight={600} fill={color} opacity={0.7}>%</text>
    </svg>
  )
}
import {
  getCandidateProfile,
  getCandidateMatchDetails,
  type CandidateProfileData,
  type MatchDetailItem,
} from "@/lib/api"
import { useAuthGuard } from "@/lib/hooks"
import InterviewChat from "./InterviewChat"

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  "tech-lead": "Tech Lead",
  specialist: "Especialista",
}

const WORK_MODEL_LABELS: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ""
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function CandidateSidebar({
  candidate,
  candidateId,
  onStartInterview,
}: {
  candidate: CandidateProfileData
  candidateId: string
  onStartInterview: () => void
}) {
  const locationStr = [candidate.city, candidate.state].filter(Boolean).join(", ")

  return (
    <>
      <div className="border-b border-[rgba(58,176,255,0.10)] p-6">
        <Avatar name={candidate.name} size="lg" className="mb-4" />
        <h1 className="text-[17px] font-bold leading-snug tracking-[-0.01em] text-foreground">
          {candidate.name}
        </h1>
        {candidate.headline && (
          <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>{candidate.headline}</p>
        )}
        {locationStr && (
          <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-3)" }}>
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {locationStr}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-5 p-5 text-sm">
        {candidate.professional_level && (
          <div>
            <p className="eyebrow mb-2">Nível</p>
            <span className="chip chip-primary">
              {LEVEL_LABELS[candidate.professional_level] ?? candidate.professional_level}
            </span>
          </div>
        )}

        {candidate.hard_skills && candidate.hard_skills.length > 0 && (
          <div>
            <p className="eyebrow mb-2">Hard Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.hard_skills.map((skill) => (
                <span key={skill} className="chip">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {candidate.education && (candidate.education.course || candidate.education.institution) && (
          <div>
            <p className="eyebrow mb-2">Formação</p>
            {candidate.education.level && (
              <p className="text-xs" style={{ color: "var(--fg-3)" }}>{candidate.education.level}</p>
            )}
            {candidate.education.course && (
              <p style={{ color: "var(--fg-2)" }}>{candidate.education.course}</p>
            )}
            {candidate.education.institution && (
              <p className="text-xs" style={{ color: "var(--fg-3)" }}>{candidate.education.institution}</p>
            )}
          </div>
        )}

        {candidate.languages && candidate.languages.length > 0 && (
          <div>
            <p className="eyebrow mb-2">Idiomas</p>
            <div className="space-y-1.5">
              {candidate.languages.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span style={{ color: "var(--fg-2)" }}>{l.language}</span>
                  <span className="text-xs" style={{ color: "var(--fg-3)" }}>{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(candidate.work_model || candidate.salary_expectation) && (
          <div>
            <p className="eyebrow mb-2">Preferências</p>
            {candidate.work_model && (
              <p style={{ color: "var(--fg-2)" }}>
                {WORK_MODEL_LABELS[candidate.work_model] ?? candidate.work_model}
              </p>
            )}
            {candidate.salary_expectation && (candidate.salary_expectation.min || candidate.salary_expectation.max) && (
              <p className="mt-0.5 font-data text-xs" style={{ color: "var(--fg-3)" }}>
                {formatCurrency(candidate.salary_expectation.min)}
                {candidate.salary_expectation.min && candidate.salary_expectation.max ? " – " : ""}
                {formatCurrency(candidate.salary_expectation.max)}
              </p>
            )}
          </div>
        )}

        {candidate.linkedin_url && (
          <div>
            <p className="eyebrow mb-2">LinkedIn</p>
            <a
              href={candidate.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#3AB0FF] transition-colors hover:text-[#3AB0FF]/80"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              Ver perfil
            </a>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-[rgba(58,176,255,0.10)] p-5">
        <button
          onClick={onStartInterview}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3AB0FF] px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] transition-all hover:bg-[#5BC2FF] hover:shadow-[0_0_20px_rgba(58,176,255,0.35)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Fazer Entrevista
        </button>
        <a
          href={`/candidate/orbita?candidate_id=${candidateId}`}
          className="flex w-full items-center justify-center rounded-xl border border-[rgba(139,92,246,0.30)] bg-[rgba(139,92,246,0.08)] px-4 py-2 text-sm font-medium text-[#DDD0FF] transition-all hover:border-[rgba(139,92,246,0.55)] hover:bg-[rgba(139,92,246,0.15)]"
        >
          Ver ORBITA
        </a>
        <a
          href={`/candidate/${candidateId}/report`}
          className="flex w-full items-center justify-center rounded-xl border border-[rgba(58,176,255,0.15)] px-4 py-2 text-sm font-medium transition-all hover:border-[rgba(58,176,255,0.35)]"
          style={{ color: "var(--fg-2)" }}
        >
          Relatório OCEAN
        </a>
        <a
          href={`/candidate/${candidateId}/profile`}
          className="flex w-full items-center justify-center rounded-xl border border-[rgba(58,176,255,0.10)] px-4 py-2 text-sm font-medium transition-all hover:border-[rgba(58,176,255,0.30)]"
          style={{ color: "var(--fg-3)" }}
        >
          Editar Perfil
        </a>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateDashboardPage() {
  const params = useParams()
  const candidateId = params.id as string
  const { ready } = useAuthGuard()

  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null)
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"matches" | "interview">("matches")

  async function refetchCandidate() {
    try {
      const [candData, matchData] = await Promise.all([
        getCandidateProfile(candidateId),
        getCandidateMatchDetails(candidateId).catch(() => [] as MatchDetailItem[]),
      ])
      setCandidate(candData)
      setMatches(matchData)
      setActiveTab("matches")
    } catch {
      // silently ignore refetch errors
    }
  }

  useEffect(() => {
    if (!candidateId || !ready) return
    let cancelled = false

    async function load() {
      try {
        const [candData, matchData] = await Promise.all([
          getCandidateProfile(candidateId),
          getCandidateMatchDetails(candidateId).catch(() => [] as MatchDetailItem[]),
        ])
        if (cancelled) return
        setCandidate(candData)
        setMatches(matchData)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [candidateId, ready])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!candidate) return null

  const hasOcean = !!candidate.ocean_scores
  const bestScore = matches.length > 0 ? Math.max(...matches.map((m) => Math.round(m.score * 100))) : 0
  const bilateralCount = matches.filter((m) => m.status === "bilateral").length

  return (
    <DashboardLayout
      sidebar={
        <CandidateSidebar
          candidate={candidate}
          candidateId={candidateId}
          onStartInterview={() => setActiveTab("interview")}
        />
      }
      title="Dashboard"
      subtitle="Seu perfil e matches"
    >
      {/* KPI stat-cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <p className="stat-k">Matches</p>
          <p className="stat-v font-data">{matches.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-k">Melhor Score</p>
          <p
            className="stat-v font-data"
            style={{ color: bestScore > 0 ? scoreColor(bestScore) : "var(--fg-3)" }}
          >
            {bestScore > 0 ? `${bestScore}%` : "—"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-k">Entrevista</p>
          <p
            className="mt-1.5 text-sm font-semibold"
            style={{ color: hasOcean ? "#38d391" : "#f5b454" }}
          >
            {hasOcean ? "Completa" : "Pendente"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-k">Bilateral</p>
          <p className="stat-v font-data" style={{ color: bilateralCount > 0 ? "#8B5CF6" : undefined }}>
            {bilateralCount}
          </p>
        </div>
      </div>

      {/* OCEAN section */}
      <section>
        <div className="section-label mb-4">Perfil OCEAN — A Órbita</div>
        {hasOcean ? (
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--line)",
            }}
          >
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="shrink-0">
                <OceanRadar scores={candidate.ocean_scores!} />
              </div>
              <OceanBars scores={candidate.ocean_scores!} />
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border p-8 text-center"
            style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(58,176,255,0.10)", border: "1px solid rgba(58,176,255,0.22)" }}
            >
              <svg className="h-6 w-6 text-[#3AB0FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-foreground">Faça a entrevista OCEAN</p>
              <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
                Responda 8 perguntas e descubra sua órbita de personalidade profissional
              </p>
            </div>
            <button
              onClick={() => setActiveTab("interview")}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#3AB0FF] px-5 py-2.5 text-sm font-semibold text-[#0B1F3A] transition-all hover:bg-[#5BC2FF] hover:shadow-[0_0_20px_rgba(58,176,255,0.35)]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Iniciar Entrevista
            </button>
          </div>
        )}
      </section>

      {/* Tabs: Matches / Entrevista */}
      <section>
        {/* Tab bar */}
        <div
          className="mb-4 flex gap-1 rounded-xl border p-1"
          style={{ background: "rgba(11,31,58,0.6)", borderColor: "var(--line)" }}
        >
          <button
            onClick={() => setActiveTab("matches")}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
            style={
              activeTab === "matches"
                ? { background: "rgba(58,176,255,0.15)", color: "#BFE0FF" }
                : { color: "var(--fg-3)" }
            }
          >
            Matches{matches.length > 0 ? ` (${matches.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
            style={
              activeTab === "interview"
                ? { background: "rgba(58,176,255,0.15)", color: "#BFE0FF" }
                : { color: "var(--fg-3)" }
            }
          >
            Entrevista
          </button>
        </div>

        {activeTab === "matches" && (
          matches.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl border py-12 text-center"
              style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
              >
                ◎
              </div>
              <p className="font-semibold text-foreground">Nenhum match ainda</p>
              <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                Complete sua entrevista OCEAN para começar
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match, i) => {
                const pct = Math.round(match.score * 100)
                const color = scoreColor(pct)
                const isBilateral = match.status === "bilateral"
                const [hovered, setHovered] = useState(false)

                return (
                  <div
                    key={match.id}
                    className="flex flex-col rounded-[18px] p-5 transition-all duration-200"
                    style={{
                      background: "rgba(16,34,68,0.78)",
                      backdropFilter: "blur(20px)",
                      border: hovered ? "1px solid rgba(58,176,255,0.28)" : "1px solid rgba(58,176,255,0.12)",
                      boxShadow: hovered ? `0 16px 40px -16px ${color}55, 0 4px 24px rgba(0,0,0,0.30)` : "0 4px 24px rgba(0,0,0,0.28)",
                      transform: hovered ? "translateY(-2px)" : "none",
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    {/* Rank eyebrow */}
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.55)" }}>
                      #{i + 1} Match
                    </p>

                    {/* Header: avatar + info + score ring */}
                    <div className="mb-3 flex items-start gap-3">
                      <Avatar name={match.company_name ?? "?"} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold leading-snug">{match.job_title}</p>
                        <p className="truncate text-[11.5px]" style={{ color: "rgba(200,213,234,0.50)" }}>{match.company_name}</p>
                      </div>
                      <ScoreRing pct={pct} size={56} />
                    </div>

                    {/* Status */}
                    <div className="mb-3">
                      {isBilateral ? (
                        <span className="bilateral-badge"><span className="bilateral-pulse" />Match!</span>
                      ) : (
                        <StatusBadge status={match.status} />
                      )}
                    </div>

                    {/* OCEAN breakdown (if available) */}
                    {match.ocean_breakdown && (
                      <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.08)" }}>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.45)" }}>Compatibilidade OCEAN</p>
                        {["openness","conscientiousness","extraversion","agreeableness","neuroticism"].map((key, ki) => {
                          const colors = ["#8B5CF6","#3B82F6","#F59E0B","#10B981","#EF4444"]
                          const labels = ["O","C","E","A","N"]
                          const val = Math.min(Math.round((match.ocean_breakdown![key] ?? 0) > 1 ? match.ocean_breakdown![key] : (match.ocean_breakdown![key] ?? 0) * 100), 100)
                          return (
                            <div key={key} className="mb-1 flex items-center gap-1.5">
                              <span className="w-3 text-[9px] font-bold" style={{ color: colors[ki] }}>{labels[ki]}</span>
                              <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div className="h-full rounded-full" style={{ width: `${val}%`, background: colors[ki] }} />
                              </div>
                              <span className="w-5 text-right text-[9px]" style={{ color: colors[ki] }}>{val}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Footer action */}
                    <div className="mt-auto flex gap-2 border-t pt-3" style={{ borderColor: "rgba(58,176,255,0.10)" }}>
                      <button className="flex-1 rounded-[10px] py-2 text-[12px] font-semibold transition-colors"
                        style={{ border: "1px solid rgba(58,176,255,0.20)", color: "#BFE0FF", background: "rgba(58,176,255,0.06)" }}>
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {activeTab === "interview" && (
          <InterviewChat
            candidateId={candidateId}
            hasExistingScores={hasOcean}
            onComplete={refetchCandidate}
          />
        )}
      </section>
    </DashboardLayout>
  )
}
