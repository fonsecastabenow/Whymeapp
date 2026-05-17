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
  indiferente: "Indiferente",
}

const SALARY_LEVELS = [
  { value: "1000-1500", label: "Entre €1.000 e €1.500", min: 1000, max: 1500 },
  { value: "1500-2000", label: "Entre €1.500 e €2.000", min: 1500, max: 2000 },
  { value: "2000-2500", label: "Entre €2.000 e €2.500", min: 2000, max: 2500 },
  { value: "2500-3000", label: "Entre €2.500 e €3.000", min: 2500, max: 3000 },
  { value: "3000+", label: "Acima de €3.000 (sem limite)", min: 3000, max: null },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ""
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
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
  const [autoStartInterview, setAutoStartInterview] = useState(false)

  function goToInterview() {
    setActiveTab("interview")
    setAutoStartInterview(true)
  }

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
    <>
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
              onClick={goToInterview}
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
            onComplete={() => {
              refetchCandidate()
              setAutoStartInterview(false)
            }}
            autoStart={autoStartInterview}
          />
        )}
      </section>
    </>
  )
}
