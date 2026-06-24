"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import NeuralTalentMap, { type NeuralSatelliteData } from "@/components/NeuralTalentMap"
import { getCandidateMatchDetails } from "@/lib/api"
import type { MatchDetailItem } from "@/lib/api"
import { DIMENSION_LABELS, DIMENSIONS } from "@whyme/shared"
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/ui"
import { scoreColor } from "@/lib/utils"
import { useAuthGuard } from "@/lib/hooks"

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
    <EmptyState
      title="Nenhuma empresa encontrada ainda"
      description="Complete sua entrevista OCEAN para descobrir quais empresas combinam com seu perfil."
    />
  )

  const sun = { id: candidateId || "me", name: "Meu Perfil", sub: "Perfil OCEAN" }

  const planets = matches.map(m => ({
    id: m.id,
    title: m.company_name,
    sub: m.company_industry || "",
    dept: m.job_title,
  }))

  const satellites = matches.map(m => ({
    id: m.id + "-sat",
    name: m.job_title,
    score: Math.round(m.score * 100),
    planetId: m.id,
    skills: [] as string[],
    experience: 1,
  }))

  function handleSelectSatellite(sat: NeuralSatelliteData) {
    const matchId = sat.id.replace(/-sat$/, "")
    const match = matches.find(m => m.id === matchId)
    if (match) setSelectedMatch(match)
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-6 py-4"
        style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)", borderColor: "var(--line)" }}
      >
        <nav className="mx-auto flex max-w-6xl items-center gap-6 text-sm">
          <span className="text-sm font-black tracking-widest text-gradient-gold uppercase">WHY ME?</span>
          <a href={candidateId ? `/candidate/${candidateId}/profile` : "#"} className="transition-colors hover:text-foreground" style={{ color: "var(--fg-3)" }}>Perfil</a>
          <a href={candidateId ? `/candidate/orbita?candidate_id=${candidateId}` : "#"} className="font-semibold text-[#3AB0FF]">ORBITA</a>
          <a href={candidateId ? `/candidate/${candidateId}/dashboard` : "#"} className="transition-colors hover:text-foreground" style={{ color: "var(--fg-3)" }}>Dashboard</a>
        </nav>
      </header>

      {/* Hero */}
      <div className="pb-4 pt-8 text-center">
        <p className="eyebrow">Visualização</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em]">
          <span className="text-gradient-gold">ORBITA</span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-3)" }}>
          Empresas com melhor compatibilidade com seu perfil
        </p>
      </div>

      {/* Map */}
      <div className="min-h-[600px] flex-1 px-4 pb-8">
        <NeuralTalentMap
          sun={sun}
          planets={planets}
          satellites={satellites}
          onSelectSatellite={handleSelectSatellite}
          height={680}
        />
      </div>

      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </main>
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
        style={{ background: "#0B1F3A", borderColor: "var(--line)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-white/5"
          style={{ color: "var(--fg-3)" }}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Company */}
        <div className="mb-6 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: "rgba(58,176,255,0.10)", color: "#3AB0FF", border: "1px solid rgba(58,176,255,0.20)" }}
          >
            {match.company_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em]">{match.company_name}</h2>
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>{match.company_industry}</p>
          </div>
        </div>

        {/* Score */}
        <div
          className="mb-6 rounded-2xl border p-4 text-center"
          style={{ background: "rgba(58,176,255,0.06)", borderColor: "var(--line)" }}
        >
          <div className="font-data text-3xl font-bold" style={{ color }}>{pct}%</div>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>Compatibilidade OCEAN</p>
        </div>

        {/* Vaga */}
        <div className="mb-6">
          <div className="section-label mb-3">Vaga</div>
          <p className="font-medium text-foreground">{match.job_title}</p>
          {match.job_description && (
            <p className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>{match.job_description}</p>
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
                  <span className="font-data tabular-nums" style={{ color: "var(--fg-3)" }}>{Math.round(val)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, backgroundColor: dimColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
