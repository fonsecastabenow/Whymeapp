"use client"

import { useEffect, useState, useRef } from "react"
import { getCandidateProfile, getCandidateMatchDetails, getResume, uploadResume, deleteResume, updateCandidateProfile } from "@/lib/api"
import type { CandidateProfileData, MatchDetailItem, OCEANScores, ResumeData } from "@/lib/api"
import { OceanRadar, OCEAN_DIMS } from "@/components/ocean/radar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"
import { useAuthGuard, type AuthState } from "@/lib/hooks"


// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = "loading" | "error" | "ready"

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
  const auth = useAuthGuard("/login")
  const isLoggedIn = auth.ready && !!auth.token
  const [state, setState] = useState<PageState>("loading")
  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null)
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const [errorMsg, setErrorMsg] = useState("")
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ headline: "", location: "", experience_years: "", skills: "" })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

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

        // Load resume data
        const resumeData = await getResume(id).catch(() => null)
        if (!cancelled) setResume(resumeData)

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

  if (state === "loading") return <LoadingSpinner message="Carregando perfil…" />
  if (state === "error") return <ErrorState message={errorMsg} onRetry={() => window.location.reload()} />

  if (!candidate) return null

  const skills = extractSkills(candidate.skills)
  const hasOcean = !!candidate.ocean_scores

  const isOwner = isLoggedIn && auth.userId === candidate.user_id

  function startEditing() {
    setEditForm({
      headline: candidate?.headline ?? "",
      location: candidate?.location ?? "",
      experience_years: candidate?.experience_years != null ? String(candidate.experience_years) : "",
      skills: extractSkills(candidate?.skills ?? null).join(", "),
    })
    setSaveError("")
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setSaveError("")
  }

  async function handleSave() {
    if (!candidate) return
    const token = auth.token
    setSaving(true)
    setSaveError("")
    try {
      const skillsArr = editForm.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const updated = await updateCandidateProfile(
        candidate.id,
        {
          headline: editForm.headline || null,
          location: editForm.location || null,
          experience_years: editForm.experience_years !== "" ? parseFloat(editForm.experience_years) : null,
          skills: skillsArr.length ? { skills: skillsArr } : null,
        },
        token,
      )
      setCandidate(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // ── Resume handlers ──

  async function handleUploadResume(file: File) {
    setResumeError("")
    setUploading(true)
    try {
      const data = await uploadResume(params.id, file)
      setResume(data)
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Erro ao enviar currículo")
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteResume() {
    setResumeError("")
    try {
      await deleteResume(params.id)
      setResume(null)
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Erro ao remover currículo")
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUploadResume(file)
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const userRole = "candidate" as const
  const userName = candidate?.name

  return (
    <>

        {/* ── Candidate header ── */}
        <section className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
            {/* Avatar with photo upload pencil */}
            <div className="relative group shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                {candidate.name.charAt(0).toUpperCase()}
              </div>
              {isOwner && !editing && (
                <button
                  onClick={startEditing}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all group-hover:bg-black/40"
                  aria-label="Alterar foto"
                >
                  <svg
                    className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="group relative text-3xl font-bold tracking-tight">
                    {candidate.name}
                    {isOwner && !editing && (
                      <button
                        onClick={startEditing}
                        className="ml-2 inline-flex items-center text-muted-foreground/40 opacity-0 transition-all hover:text-blue-400 group-hover:opacity-100"
                        aria-label="Editar nome"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    )}
                  </h1>
                {isOwner && !editing && (
                  <Button variant="outline" size="sm" onClick={startEditing}>Editar Perfil</Button>
                )}
              </div>

              {editing ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Headline</label>
                    <input
                      type="text"
                      value={editForm.headline}
                      onChange={(e) => setEditForm((f) => ({ ...f, headline: e.target.value }))}
                      placeholder="Ex: Desenvolvedor Full Stack"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Localização</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Ex: São Paulo, SP"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Anos de experiência</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editForm.experience_years}
                      onChange={(e) => setEditForm((f) => ({ ...f, experience_years: e.target.value }))}
                      placeholder="Ex: 3"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Skills (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={editForm.skills}
                      onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
                      placeholder="Ex: React, TypeScript, Python"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  {saveError && <p className="text-sm text-red-400">{saveError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button loading={saving} onClick={handleSave}>Salvar</Button>
                    <Button variant="secondary" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Currículo ── */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Currículo
          </h2>

          {resumeError && (
            <p className="mb-3 text-sm text-red-400">{resumeError}</p>
          )}

          {resume?.resume_url ? (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={resume.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Visualizar Currículo
              </a>

              <button
                onClick={handleDeleteResume}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Remover
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary ${
                  uploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Enviar Currículo (PDF)
                  </>
                )}
              </label>
              <p className="mt-2 text-xs text-muted-foreground">PDF até 10 MB</p>
            </div>
          )}
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
    </>
  )
}
