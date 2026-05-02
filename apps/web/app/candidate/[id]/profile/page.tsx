"use client"

import { useEffect, useState } from "react"
import { getCandidateProfile, getCandidateMatchDetails } from "@/lib/api"
import type { CandidateProfileData, MatchDetailItem, OCEANScores } from "@/lib/api"

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = "loading" | "error" | "ready"

const OCEAN_DIMS: { key: keyof OCEANScores; label: string; fullLabel: string }[] = [
  { key: "openness", label: "O", fullLabel: "Abertura" },
  { key: "conscientiousness", label: "C", fullLabel: "Conscienciosidade" },
  { key: "extraversion", label: "E", fullLabel: "Extroversão" },
  { key: "agreeableness", label: "A", fullLabel: "Amabilidade" },
  { key: "neuroticism", label: "N", fullLabel: "Neuroticismo" },
]

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

// ─── OCEAN Radar SVG ─────────────────────────────────────────────────────────

function normalize(scores: OCEANScores): OCEANScores {
  const vals = Object.values(scores) as number[]
  if (vals.some((v) => v > 1)) {
    return {
      openness: scores.openness / 100,
      conscientiousness: scores.conscientiousness / 100,
      extraversion: scores.extraversion / 100,
      agreeableness: scores.agreeableness / 100,
      neuroticism: scores.neuroticism / 100,
    }
  }
  return scores
}

function OceanRadar({ scores }: { scores: OCEANScores }) {
  const s = normalize(scores)
  const cx = 125
  const cy = 125
  const R = 88
  const dims = OCEAN_DIMS.map((d) => d.key)
  const angles = dims.map((_, i) => (i * 2 * Math.PI) / 5 - Math.PI / 2)

  const pt = (angle: number, ratio: number) => ({
    x: cx + R * ratio * Math.cos(angle),
    y: cy + R * ratio * Math.sin(angle),
  })

  const scorePoints = dims
    .map((d, i) => {
      const v = Math.max(0, Math.min(1, s[d] ?? 0))
      const p = pt(angles[i], v)
      return `${p.x},${p.y}`
    })
    .join(" ")

  return (
    <svg width={250} height={250} viewBox="0 0 250 250" aria-label="Gráfico OCEAN">
      {/* grid pentagons */}
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          points={angles.map((a) => `${pt(a, ratio).x},${pt(a, ratio).y}`).join(" ")}
          fill="none"
          stroke={ratio === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}
          strokeWidth="1"
        />
      ))}

      {/* axis lines */}
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

      {/* score fill */}
      <polygon
        points={scorePoints}
        fill="rgba(139,92,246,0.25)"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* score dots */}
      {dims.map((d, i) => {
        const v = Math.max(0, Math.min(1, s[d] ?? 0))
        const p = pt(angles[i], v)
        return <circle key={d} cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#fff" strokeWidth="1" />
      })}

      {/* dimension labels */}
      {angles.map((a, i) => {
        const p = pt(a, 1.2)
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

// ─── Skill helpers ────────────────────────────────────────────────────────────

function extractSkills(raw: Record<string, unknown> | null): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return (raw as unknown[]).filter((s) => typeof s === "string") as string[]
  if (Array.isArray((raw as { skills?: unknown }).skills)) {
    const arr = (raw as { skills: unknown[] }).skills
    return arr.filter((s) => typeof s === "string") as string[]
  }
  return Object.keys(raw)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const [state, setState] = useState<PageState>("loading")
  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null)
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const { id } = params
    if (!id) return

    let cancelled = false

    async function load() {
      try {
        const [cand, matchList] = await Promise.all([
          getCandidateProfile(id),
          getCandidateMatchDetails(id).catch(() => [] as MatchDetailItem[]),
        ])
        if (cancelled) return
        setCandidate(cand)
        setMatches(matchList)
        setState("ready")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar perfil")
        setState("error")
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [params])

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Carregando perfil…</p>
        </div>
      </main>
    )
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-2xl">
            ⚠
          </div>
          <h1 className="text-xl font-semibold">Erro ao carregar</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  if (!candidate) return null

  const skills = extractSkills(candidate.skills)
  const hasOcean = !!candidate.ocean_scores

  return (
    <main className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="text-xl font-bold tracking-tight">Whyme</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">Perfil</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">

        {/* ── Candidate header ── */}
        <section className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
              {candidate.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>

              {candidate.headline && (
                <p className="mt-1 text-lg text-muted-foreground">{candidate.headline}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {candidate.location && (
                  <span className="flex items-center gap-1.5 rounded-full border px-3 py-1">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {candidate.location}
                  </span>
                )}

                {candidate.experience_years != null && (
                  <span className="flex items-center gap-1.5 rounded-full border px-3 py-1">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                    {candidate.experience_years}{" "}
                    {candidate.experience_years === 1 ? "ano" : "anos"} de experiência
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── OCEAN + Skills ── */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* OCEAN radar */}
          {hasOcean && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Perfil OCEAN
              </h2>

              <div className="flex flex-col items-center gap-5">
                <OceanRadar scores={candidate.ocean_scores!} />

                <div className="grid w-full grid-cols-5 gap-1 text-center">
                  {OCEAN_DIMS.map(({ key, label, fullLabel }) => {
                    const raw = candidate.ocean_scores![key] ?? 0
                    const pct = raw > 1 ? Math.round(raw) : Math.round(raw * 100)
                    return (
                      <div key={key} className="space-y-0.5 px-0.5">
                        <div className="text-sm font-bold text-primary">{label}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{fullLabel}</div>
                        <div className="text-sm font-semibold">{pct}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border bg-muted px-3 py-1 text-sm font-medium text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Matches ── */}
        {matches.length > 0 && (
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Matches &mdash; {matches.length} vaga{matches.length !== 1 ? "s" : ""}
            </h2>

            <div className="space-y-3">
              {matches.map((match) => {
                const pct = Math.round(match.score * 100)
                const barColor =
                  pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444"
                const statusLabel = STATUS_LABELS[match.status] ?? match.status
                const statusColor =
                  STATUS_COLORS[match.status] ?? "text-muted-foreground bg-muted border-border"

                return (
                  <div
                    key={match.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:gap-6"
                  >
                    {/* company + job */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {match.company_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{match.company_name}</div>
                        <div className="truncate text-sm text-muted-foreground">{match.job_title}</div>
                      </div>
                    </div>

                    {/* score + status */}
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="w-36">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted-foreground">Compatibilidade</span>
                          <span className="font-semibold tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* empty state when no matches yet */}
        {matches.length === 0 && (
          <section className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl opacity-40">
              ◎
            </div>
            <p className="text-sm text-muted-foreground">Nenhum match encontrado ainda.</p>
          </section>
        )}
      </div>
    </main>
  )
}
