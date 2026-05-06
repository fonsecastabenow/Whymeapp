"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://whymeapp.io"

// ─── Types ────────────────────────────────────────────────────────────────────

type EducationData = {
  level?: string | null
  course?: string | null
  institution?: string | null
}

type LanguageData = {
  language: string
  level: string
}

type SalaryExpectation = {
  min?: number | null
  max?: number | null
  currency?: string
}

type CandidateData = {
  id: string
  user_id: string
  name: string
  headline: string | null
  location: string | null
  experience_years: number | null
  ocean_scores: Record<string, number> | null
  phone: string | null
  education: EducationData | null
  languages: LanguageData[] | null
  hard_skills: string[] | null
  city: string | null
  state: string | null
  country: string | null
  salary_expectation: SalaryExpectation | null
  work_model: string | null
  linkedin_url: string | null
  professional_level: string | null
  onboarding_completed: boolean
  created_at: string
}

type MatchItem = {
  id: string
  job_id: string
  job_title: string
  company_id: string
  company_name: string
  company_industry: string | null
  score: number
  status: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OCEAN_DIMS = [
  { key: "openness", label: "O", fullLabel: "Abertura" },
  { key: "conscientiousness", label: "C", fullLabel: "Conscienciosidade" },
  { key: "extraversion", label: "E", fullLabel: "Extroversão" },
  { key: "agreeableness", label: "A", fullLabel: "Amabilidade" },
  { key: "neuroticism", label: "N", fullLabel: "Neuroticismo" },
] as const

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  rejected: "Recusado",
  bilateral: "Match!",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  accepted: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  bilateral: "text-purple-400 bg-purple-400/10 border-purple-400/20",
}

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

// ─── OCEAN Radar SVG ──────────────────────────────────────────────────────────

function normalizeScores(scores: Record<string, number>): Record<string, number> {
  const vals = Object.values(scores)
  if (vals.some((v) => v > 1)) {
    return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v / 100]))
  }
  return scores
}

function OceanRadar({ scores }: { scores: Record<string, number> }) {
  const s = normalizeScores(scores)
  const cx = 125
  const cy = 125
  const R = 88
  const keys = OCEAN_DIMS.map((d) => d.key)
  const angles = keys.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2)

  const pt = (angle: number, ratio: number) => ({
    x: cx + R * ratio * Math.cos(angle),
    y: cy + R * ratio * Math.sin(angle),
  })

  const scorePoints = keys
    .map((k, i) => {
      const v = Math.max(0, Math.min(1, s[k] ?? 0))
      const p = pt(angles[i], v)
      return `${p.x},${p.y}`
    })
    .join(" ")

  return (
    <svg width={250} height={250} viewBox="0 0 250 250" aria-label="Gráfico OCEAN">
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={angles.map((a) => `${pt(a, ratio).x},${pt(a, ratio).y}`).join(" ")}
          fill="none"
          stroke={ratio === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}
          strokeWidth="1"
        />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={pt(a, 1).x}
          y2={pt(a, 1).y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={scorePoints}
        fill="rgba(139,92,246,0.25)"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {keys.map((k, i) => {
        const v = Math.max(0, Math.min(1, s[k] ?? 0))
        const p = pt(angles[i], v)
        return <circle key={k} cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="1" />
      })}
      {angles.map((a, i) => {
        const p = pt(a, 1.22)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight="700"
            fill="rgba(255,255,255,0.65)"
          >
            {OCEAN_DIMS[i].label}
          </text>
        )
      })}
    </svg>
  )
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateDashboardPage() {
  const params = useParams()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateData | null>(null)
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!candidateId) return
    let cancelled = false

    async function load() {
      try {
        const [candRes, matchRes] = await Promise.all([
          fetch(`${API_BASE}/candidates/${candidateId}`),
          fetch(`${API_BASE}/matches/candidate/${candidateId}/details`).catch(() => null),
        ])

        if (!candRes.ok) {
          const body = await candRes.json().catch(() => ({}))
          throw new Error((body as { detail?: string }).detail ?? `Erro ${candRes.status}`)
        }

        const candData: CandidateData = await candRes.json()
        const matchData: MatchItem[] = matchRes?.ok ? await matchRes.json() : []

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
    return () => {
      cancelled = true
    }
  }, [candidateId])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-zinc-400">Carregando…</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-300">
            ⚠
          </div>
          <h1 className="text-xl font-semibold text-zinc-50">Erro ao carregar</h1>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  if (!candidate) return null

  const locationStr = [candidate.city, candidate.state].filter(Boolean).join(", ")
  const hasOcean = !!candidate.ocean_scores

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50 lg:flex-row">
      {/* ── Sidebar ── */}
      <aside className="w-full shrink-0 border-b border-zinc-800 bg-zinc-900 lg:w-72 lg:border-b-0 lg:border-r lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        {/* Candidate header */}
        <div className="border-b border-zinc-800 p-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/20 text-xl font-bold text-blue-300">
            {candidate.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-lg font-bold leading-snug text-zinc-50">{candidate.name}</h1>
          {candidate.headline && (
            <p className="mt-1 text-sm text-zinc-400">{candidate.headline}</p>
          )}
          {locationStr && (
            <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {locationStr}
            </p>
          )}
        </div>

        {/* Info blocks */}
        <div className="flex-1 space-y-5 p-5 text-sm">
          {/* Professional level */}
          {candidate.professional_level && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Nível</p>
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                {LEVEL_LABELS[candidate.professional_level] ?? candidate.professional_level}
              </span>
            </div>
          )}

          {/* Hard Skills */}
          {candidate.hard_skills && candidate.hard_skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Hard Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.hard_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && (candidate.education.course || candidate.education.institution) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Formação</p>
              {candidate.education.level && (
                <p className="text-xs text-zinc-500">{candidate.education.level}</p>
              )}
              {candidate.education.course && (
                <p className="text-zinc-300">{candidate.education.course}</p>
              )}
              {candidate.education.institution && (
                <p className="text-xs text-zinc-500">{candidate.education.institution}</p>
              )}
            </div>
          )}

          {/* Languages */}
          {candidate.languages && candidate.languages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Idiomas</p>
              <div className="space-y-1">
                {candidate.languages.map((l, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-zinc-300">{l.language}</span>
                    <span className="text-xs text-zinc-500">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work model + Salary */}
          {(candidate.work_model || candidate.salary_expectation) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Preferências</p>
              {candidate.work_model && (
                <p className="text-zinc-300">
                  {WORK_MODEL_LABELS[candidate.work_model] ?? candidate.work_model}
                </p>
              )}
              {candidate.salary_expectation &&
                (candidate.salary_expectation.min || candidate.salary_expectation.max) && (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {formatCurrency(candidate.salary_expectation.min)}
                    {candidate.salary_expectation.min && candidate.salary_expectation.max ? " – " : ""}
                    {formatCurrency(candidate.salary_expectation.max)}
                  </p>
                )}
            </div>
          )}

          {/* LinkedIn */}
          {candidate.linkedin_url && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">LinkedIn</p>
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 transition-colors hover:text-blue-300"
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

        {/* Edit profile button */}
        <div className="border-t border-zinc-800 p-5">
          <a
            href={`/candidate/${candidateId}/profile`}
            className="flex w-full items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            Editar Perfil
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-zinc-50">Dashboard</h2>
              <p className="text-xs text-zinc-500">Seu perfil e matches</p>
            </div>
            <a href="/" className="text-lg font-bold tracking-tight text-zinc-50">
              Whyme
            </a>
          </div>
        </header>

        <div className="space-y-8 p-6 md:p-8">
          {/* ── OCEAN section ── */}
          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Perfil OCEAN — A Órbita
            </h3>

            {hasOcean ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex flex-col items-center gap-8 md:flex-row">
                  <div className="shrink-0">
                    <OceanRadar scores={candidate.ocean_scores!} />
                  </div>
                  <div className="w-full space-y-3 md:w-auto md:flex-1">
                    {OCEAN_DIMS.map(({ key, label, fullLabel }) => {
                      const raw = (candidate.ocean_scores as Record<string, number>)[key] ?? 0
                      const pct = raw > 1 ? Math.round(raw) : Math.round(raw * 100)
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-4 text-sm font-bold text-zinc-400">{label}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-violet-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-semibold tabular-nums text-zinc-300">
                            {pct}
                          </span>
                          <span className="hidden w-32 text-xs text-zinc-500 md:block">{fullLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-xl opacity-50">
                  ◎
                </div>
                <p className="font-medium text-zinc-400">Faça a entrevista OCEAN para ver seu perfil</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Conclua o questionário para descobrir sua órbita
                </p>
              </div>
            )}
          </section>

          {/* ── Matches section ── */}
          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Matches{matches.length > 0 ? ` — ${matches.length}` : ""}
            </h3>

            {matches.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-xl opacity-50">
                  ◎
                </div>
                <p className="font-medium text-zinc-400">Nenhum match ainda</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Complete sua entrevista OCEAN para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const pct = Math.round(match.score * 100)
                  const barColor = pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444"
                  const statusLabel = STATUS_LABELS[match.status] ?? match.status
                  const statusColor =
                    STATUS_COLORS[match.status] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"

                  return (
                    <div
                      key={match.id}
                      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 sm:flex-row sm:items-center sm:gap-6"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-300">
                          {match.company_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-100">{match.job_title}</div>
                          <div className="truncate text-sm text-zinc-500">{match.company_name}</div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="w-36">
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-zinc-500">Compatibilidade</span>
                            <span className="font-semibold tabular-nums text-zinc-300">{pct}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
