"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Briefcase, X } from "lucide-react"
import OrbitaChart from "@/app/components/orbita-chart"
import { getCandidateMatchDetails } from "@/lib/api"
import type { MatchDetailItem, OCEANScores } from "@/lib/api"
import { DIMENSION_LABELS, DIMENSIONS } from "@whyme/shared"
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui"

const DIMENSION_COLORS: Record<string, string> = {
  openness: "#8B5CF6",
  conscientiousness: "#3B82F6",
  extraversion: "#F59E0B",
  agreeableness: "#10B981",
  neuroticism: "#EF4444",
}

type PageState = "loading" | "error" | "empty" | "ready"

export default function CandidateOrbitaPage() {
  const [state, setState] = useState<PageState>("loading")
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchDetailItem | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const candidateId = useMemo(() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    return params.get("candidate_id")
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
  if (state === "empty") return <EmptyState title="Nenhuma empresa encontrada ainda" description="Complete sua entrevista OCEAN para descobrir quais empresas combinam com seu perfil." />

  // Extract base OCEAN from the first match's breakdown
  // (ideally would come from candidate profile)
  const centerScores = matches[0]?.ocean_breakdown
    ? Object.fromEntries(
        DIMENSIONS.map((d) => [d, (matches.reduce((sum, m) => sum + ((m.ocean_breakdown?.[d] ?? 50) / 100), 0) / matches.length)])
      ) as OCEANScores
    : { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 text-sm">
          <span className="text-xl font-bold tracking-tight">Whyme</span>
          <a href={candidateId ? `/candidate/${candidateId}/profile` : "#"} className="text-muted-foreground transition-colors hover:text-foreground">Perfil</a>
          <a href={candidateId ? `/candidate/orbita?candidate_id=${candidateId}` : "#"} className="font-semibold text-foreground">ORBITA</a>
          <a href={candidateId ? `/candidate/${candidateId}/dashboard` : "#"} className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</a>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ORBITA</h1>
          <p className="mt-2 text-muted-foreground">
            Empresas com melhor compatibilidade com seu perfil
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          {/* OCEAN chart */}
          <div className="flex flex-col items-center justify-center">
            <OrbitaChart scores={centerScores} size={280} />
            <p className="mt-3 text-xs text-muted-foreground">Seu perfil OCEAN médio</p>
          </div>

          {/* Company cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
      </div>

      {/* Detail modal */}
      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </main>
  )
}

function CompanyCard({ match, index, onClick }: { match: MatchDetailItem; index: number; onClick: () => void }) {
  const pct = Math.round(match.score * 100)
  const initial = match.company_name?.charAt(0).toUpperCase() ?? "?"

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{match.company_name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{match.company_industry}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" />
          <span className="truncate">{match.job_title}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg font-bold tabular-nums text-primary">{pct}%</div>
        <div className="text-xs text-muted-foreground">match</div>
      </div>
    </button>
  )
}

function MatchModal({ match, onClose }: { match: MatchDetailItem; onClose: () => void }) {
  const pct = Math.round(match.score * 100)
  const breakdown = match.ocean_breakdown ?? {}
  const candidateScores: OCEANScores = {
    openness: ((breakdown.openness ?? 50)) / 100,
    conscientiousness: ((breakdown.conscientiousness ?? 50)) / 100,
    extraversion: ((breakdown.extraversion ?? 50)) / 100,
    agreeableness: ((breakdown.agreeableness ?? 50)) / 100,
    neuroticism: ((breakdown.neuroticism ?? 50)) / 100,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l bg-card p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {match.company_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{match.company_name}</h2>
            <p className="text-sm text-muted-foreground">{match.company_industry}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-primary/5 p-4 text-center">
          <div className="text-3xl font-bold text-primary">{pct}%</div>
          <p className="text-sm text-muted-foreground">Compatibilidade OCEAN</p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vaga</h3>
          <p className="font-medium">{match.job_title}</p>
          {match.job_description && (
            <p className="mt-1 text-sm text-muted-foreground">{match.job_description}</p>
          )}
        </div>

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Compatibilidade por dimensão
        </h3>
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const val = breakdown[dim] ?? 50
            return (
              <div key={dim} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{DIMENSION_LABELS[dim]}</span>
                  <span className="tablular-nums text-muted-foreground">{Math.round(val)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${val}%`, backgroundColor: DIMENSION_COLORS[dim] }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {match.job_ocean_ideal && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Perfil OCEAN ideal da vaga
            </h3>
            <div className="flex justify-center">
              <OrbitaChart scores={match.job_ocean_ideal} size={200} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

