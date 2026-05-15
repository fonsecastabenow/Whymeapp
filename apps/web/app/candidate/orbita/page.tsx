"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Briefcase, X } from "lucide-react"
import OrbitaChart from "@/app/components/orbita-chart"
import { getCandidateMatchDetails } from "@/lib/api"
import type { MatchDetailItem, OCEANScores } from "@/lib/api"
import { DIMENSION_LABELS, DIMENSIONS } from "@whyme/shared"
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui"
import { scoreColor } from "@/lib/utils"
import { useAuthGuard } from "@/lib/hooks"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

const DIMENSION_COLORS: Record<string, string> = {
  openness: "#8B5CF6",
  conscientiousness: "#3B82F6",
  extraversion: "#F59E0B",
  agreeableness: "#10B981",
  neuroticism: "#EF4444",
}

export default function CandidateOrbitaPage() {
  useAuthGuard()
  const [state, setState] = useState<"loading" | "error" | "empty" | "ready">("loading")
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchDetailItem | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const candidateId = useMemo(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("candidate_id")
  }, [])

  useEffect(() => {
    if (!candidateId) {
      setErrorMsg("ID do candidato não encontrado")
      setState("error")
      return
    }
    let cancelled = false

    async function load() {
      if (!candidateId) return
      try {
        const data = await getCandidateMatchDetails(candidateId)
        if (cancelled) return
        setMatches(data)
        setState(data.length === 0 ? "empty" : "ready")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar dados")
        setState("error")
      }
    }

    load()
    return () => { cancelled = true }
  }, [candidateId])

  if (state === "loading") return <LoadingSpinner message="Carregando seu ORBITA…" />
  if (state === "error") return <ErrorState message={errorMsg} onRetry={() => window.location.reload()} />
  if (state === "empty") return (
    <DashboardLayout title="Órbita" subtitle="Empresas compatíveis">
      <EmptyState
        title="Nenhuma empresa encontrada ainda"
        description="Complete sua entrevista OCEAN para descobrir quais empresas combinam com seu perfil."
      />
    </DashboardLayout>
  )

  const centerScores = matches[0]?.ocean_breakdown
    ? Object.fromEntries(
        DIMENSIONS.map((d) => [d, (matches.reduce((sum, m) => sum + ((m.ocean_breakdown?.[d] ?? 50) / 100), 0) / matches.length)])
      ) as OCEANScores
    : { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 }

  return (
    <DashboardLayout title="Órbita" subtitle="Empresas com melhor compatibilidade">
      {/* Hero */}
      <div className="mb-8 text-center">
        <p className="eyebrow">Visualização</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em]">
          <span className="text-gradient-gold">ORBITA</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Empresas com melhor compatibilidade com seu perfil
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
        {/* OCEAN chart */}
        <div className="flex flex-col items-center justify-start">
          <OrbitaChart scores={centerScores} size={280} />
          <p className="mt-3 text-xs text-muted-foreground">Seu perfil OCEAN médio</p>
        </div>

        {/* Company cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>{matches.length} empresa{matches.length !== 1 ? "s" : ""} compatível{matches.length !== 1 ? "is" : ""}</span>
          </div>

          {matches.map((match, i) => (
            <CompanyCard
              key={match.id}
              match={match}
              index={i}
              onClick={() => setSelectedMatch(match)}
            />
          ))}
        </div>
      </div>

      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </DashboardLayout>
  )
}

function CompanyCard({ match, index, onClick }: { match: MatchDetailItem; index: number; onClick: () => void }) {
  const pct = Math.round(match.score * 100)
  const color = scoreColor(pct)
  const initial = match.company_name?.charAt(0).toUpperCase() ?? "?"

  return (
    <button
      onClick={onClick}
      className="card-lift group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "var(--primary-soft)", color: "#3AB0FF", border: "1px solid var(--line-strong)" }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">{match.company_name}</span>
          {match.company_industry && (
            <span className="chip shrink-0">{match.company_industry}</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{match.job_title}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-data text-lg font-bold tabular-nums" style={{ color }}>{pct}%</div>
        <div className="text-xs text-muted-foreground">match</div>
      </div>
    </button>
  )
}

function MatchModal({ match, onClose }: { match: MatchDetailItem; onClose: () => void }) {
  const pct = Math.round(match.score * 100)
  const color = scoreColor(pct)
  const breakdown = match.ocean_breakdown ?? {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l p-6 shadow-2xl"
        style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-sidebar-hover"
          style={{ color: "var(--fg-3)" }}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Company */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: "var(--primary-soft)", color: "#3AB0FF", border: "1px solid var(--line-strong)" }}
          >
            {match.company_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em]">{match.company_name}</h2>
            <p className="text-sm text-muted-foreground">{match.company_industry}</p>
          </div>
        </div>

        {/* Score */}
        <div
          className="mb-6 rounded-2xl border p-4 text-center"
          style={{ background: "var(--primary-soft)", borderColor: "var(--line)" }}
        >
          <div className="font-data text-3xl font-bold" style={{ color }}>{pct}%</div>
          <p className="mt-1 text-sm text-muted-foreground">Compatibilidade OCEAN</p>
        </div>

        {/* Vaga */}
        <div className="mb-6">
          <div className="section-label mb-3">Vaga</div>
          <p className="font-medium text-foreground">{match.job_title}</p>
          {match.job_description && (
            <p className="mt-1 text-sm text-muted-foreground">{match.job_description}</p>
          )}
        </div>

        {/* OCEAN dimensions */}
        <div className="section-label mb-4">Compatibilidade por dimensão</div>
        <div className="space-y-3">
          {DIMENSIONS.map((dim) => {
            const val = breakdown[dim] ?? 50
            const dimColor = DIMENSION_COLORS[dim]
            return (
              <div key={dim} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: dimColor }}>{DIMENSION_LABELS[dim]}</span>
                  <span className="font-data tabular-nums text-muted-foreground">{Math.round(val)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, backgroundColor: dimColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {match.job_ocean_ideal && (
          <div className="mt-6">
            <div className="section-label mb-4">Perfil OCEAN ideal da vaga</div>
            <div className="flex justify-center">
              <OrbitaChart scores={match.job_ocean_ideal} size={200} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
