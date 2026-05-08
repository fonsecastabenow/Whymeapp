"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { Card } from "@/components/ui/card"
import { SectionLabel } from "@/components/ui/section-label"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { OceanRadar, OceanBars } from "@/components/ocean/radar"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
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
      <div className="border-b border-[#3AB0FF]/10 p-6">
        <Avatar name={candidate.name} size="lg" className="mb-4" />
        <h1 className="text-lg font-bold leading-snug text-foreground">{candidate.name}</h1>
        {candidate.headline && <p className="mt-1 text-sm text-muted-foreground">{candidate.headline}</p>}
        {locationStr && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/70">
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">Nível</p>
            <span className="rounded-full border border-[#3AB0FF]/20 bg-[#3AB0FF]/10 px-2.5 py-0.5 text-xs font-medium text-[#3AB0FF]">
              {LEVEL_LABELS[candidate.professional_level] ?? candidate.professional_level}
            </span>
          </div>
        )}

        {candidate.hard_skills && candidate.hard_skills.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">Hard Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {candidate.hard_skills.map((skill) => (
                <span key={skill} className="rounded-md border border-[#3AB0FF]/15 bg-[#3AB0FF]/5 px-2 py-0.5 text-xs text-foreground/80">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {candidate.education && (candidate.education.course || candidate.education.institution) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">Formação</p>
            {candidate.education.level && <p className="text-xs text-muted-foreground/70">{candidate.education.level}</p>}
            {candidate.education.course && <p className="text-foreground/90">{candidate.education.course}</p>}
            {candidate.education.institution && <p className="text-xs text-muted-foreground/70">{candidate.education.institution}</p>}
          </div>
        )}

        {candidate.languages && candidate.languages.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">Idiomas</p>
            <div className="space-y-1">
              {candidate.languages.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-foreground/90">{l.language}</span>
                  <span className="text-xs text-muted-foreground/70">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(candidate.work_model || candidate.salary_expectation) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">Preferências</p>
            {candidate.work_model && (
              <p className="text-foreground/90">{WORK_MODEL_LABELS[candidate.work_model] ?? candidate.work_model}</p>
            )}
            {candidate.salary_expectation && (candidate.salary_expectation.min || candidate.salary_expectation.max) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatCurrency(candidate.salary_expectation.min)}
                {candidate.salary_expectation.min && candidate.salary_expectation.max ? " – " : ""}
                {formatCurrency(candidate.salary_expectation.max)}
              </p>
            )}
          </div>
        )}

        {candidate.linkedin_url && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#3AB0FF]/70">LinkedIn</p>
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

      <div className="border-t border-[#3AB0FF]/10 p-5 space-y-2">
        <button
          onClick={onStartInterview}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Fazer Entrevista
        </button>
        <a
          href={`/candidate/orbita?candidate_id=${candidateId}`}
          className="flex w-full items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-2 text-sm font-medium text-violet-300 transition-colors hover:border-violet-500/60 hover:bg-violet-500/15"
        >
          Ver ORBITA
        </a>
        <a
          href={`/candidate/${candidateId}/report`}
          className="flex w-full items-center justify-center rounded-xl border border-[#3AB0FF]/15 px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-[#3AB0FF]/35 hover:text-foreground"
        >
          Relatório OCEAN
        </a>
        <a
          href={`/candidate/${candidateId}/profile`}
          className="flex w-full items-center justify-center rounded-xl border border-[#3AB0FF]/10 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-[#3AB0FF]/30 hover:text-foreground"
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
      // silently ignore refetch errors — page already loaded
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
      {/* OCEAN section */}
      <section>
        <SectionLabel>Perfil OCEAN — A Órbita</SectionLabel>
        {hasOcean ? (
          <Card>
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="shrink-0">
                <OceanRadar scores={candidate.ocean_scores!} />
              </div>
              <OceanBars scores={candidate.ocean_scores!} />
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="font-semibold text-zinc-300">Faça a entrevista OCEAN para ver seu perfil</p>
            <p className="text-sm text-zinc-500">Responda 8 perguntas e descubra sua órbita de personalidade profissional</p>
            <button
              onClick={() => setActiveTab("interview")}
              className="mt-1 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
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
        <div className="mb-4 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "matches"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Matches{matches.length > 0 ? ` (${matches.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "interview"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Entrevista
          </button>
        </div>

        {activeTab === "matches" && (
          matches.length === 0 ? (
            <EmptyState
              title="Nenhum match ainda"
              description="Complete sua entrevista OCEAN para começar"
            />
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const pct = Math.round(match.score * 100)
                const barColor = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444"
                return (
                  <div
                    key={match.id}
                    className="flex flex-col gap-4 rounded-2xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.7)] p-4 transition-all hover:border-[#3AB0FF]/25 hover:bg-[rgba(16,34,68,0.9)] sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={match.company_name ?? "?"} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{match.job_title}</div>
                        <div className="truncate text-sm text-muted-foreground/70">{match.company_name}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="w-24 sm:w-36">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted-foreground/70">Compatibilidade</span>
                          <span className="font-semibold tabular-nums text-foreground/90">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                      <StatusBadge status={match.status} />
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
