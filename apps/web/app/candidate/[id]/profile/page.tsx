"use client"

import { useEffect, useState, useRef } from "react"
import { getCandidateProfile, getCandidateMatchDetails, getResume, uploadResume, deleteResume, updateCandidateProfile } from "@/lib/api"
import type { CandidateProfileData, MatchDetailItem, ResumeData } from "@/lib/api"
import { OceanRadar, OCEAN_DIMS } from "@/components/ocean/radar"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { scoreColor } from "@/lib/utils"
import { useAuthGuard } from "@/lib/hooks"

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
  useAuthGuard()
  const [pageState, setPageState] = useState<"loading" | "error" | "ready">("loading")
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
        const resumeData = await getResume(id).catch(() => null)
        if (!cancelled) setResume(resumeData)
        setPageState("ready")
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar perfil")
        setPageState("error")
      }
    }

    load()
    return () => { cancelled = true }
  }, [params])

  if (pageState === "loading") return <LoadingSpinner message="Carregando perfil…" />
  if (pageState === "error") return <ErrorState message={errorMsg} onRetry={() => window.location.reload()} />
  if (!candidate) return null

  const skills = extractSkills(candidate.skills)
  const hasOcean = !!candidate.ocean_scores
  const storedUser =
    typeof window !== "undefined"
      ? (() => { try { return JSON.parse(localStorage.getItem("whyme_user") ?? "{}") } catch { return {} } })()
      : {}
  const isOwner = storedUser?.id === candidate.user_id

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
    const token = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setSaving(true)
    setSaveError("")
    try {
      const skillsArr = editForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
      const updated = await updateCandidateProfile(candidate.id, {
        headline: editForm.headline || null,
        location: editForm.location || null,
        experience_years: editForm.experience_years !== "" ? parseFloat(editForm.experience_years) : null,
        skills: skillsArr.length ? { skills: skillsArr } : null,
      }, token)
      setCandidate(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

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
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-6 py-4"
        style={{ background: "rgba(11,31,58,0.85)", backdropFilter: "blur(14px)", borderColor: "var(--line)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="text-sm font-black tracking-widest text-gradient-gold uppercase">WHY ME?</span>
          <span style={{ color: "var(--fg-3)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--fg-3)" }}>Perfil</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">

        {/* Candidate header card */}
        <section
          className="rounded-2xl border p-8"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
            <Avatar name={candidate.name} size="lg" className="shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-[-0.02em]">{candidate.name}</h1>
                {isOwner && !editing && (
                  <Button variant="outline" size="sm" onClick={startEditing}>Editar Perfil</Button>
                )}
              </div>

              {editing ? (
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Headline", key: "headline", placeholder: "Ex: Desenvolvedor Full Stack" },
                    { label: "Localização", key: "location", placeholder: "Ex: São Paulo, SP" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="eyebrow mb-1 block">{label}</label>
                      <input
                        type="text"
                        value={editForm[key as keyof typeof editForm]}
                        onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[#3AB0FF]"
                        style={{ borderColor: "var(--line)" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="eyebrow mb-1 block">Anos de experiência</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={editForm.experience_years}
                      onChange={(e) => setEditForm((f) => ({ ...f, experience_years: e.target.value }))}
                      placeholder="Ex: 3"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[#3AB0FF]"
                      style={{ borderColor: "var(--line)" }}
                    />
                  </div>
                  <div>
                    <label className="eyebrow mb-1 block">Skills (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={editForm.skills}
                      onChange={(e) => setEditForm((f) => ({ ...f, skills: e.target.value }))}
                      placeholder="Ex: React, TypeScript, Python"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[#3AB0FF]"
                      style={{ borderColor: "var(--line)" }}
                    />
                  </div>
                  {saveError && <p className="text-sm text-[#f06b6b]">{saveError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button loading={saving} onClick={handleSave}>Salvar</Button>
                    <Button variant="secondary" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  {candidate.headline && (
                    <p className="mt-1.5 text-base" style={{ color: "var(--fg-2)" }}>{candidate.headline}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.location && (
                      <span className="chip">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        {candidate.location}
                      </span>
                    )}
                    {candidate.experience_years != null && (
                      <span className="chip">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                        </svg>
                        {candidate.experience_years}{" "}
                        {candidate.experience_years === 1 ? "ano" : "anos"}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Currículo */}
        <section
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div className="section-label mb-4">Currículo</div>

          {resumeError && <p className="mb-3 text-sm text-[#f06b6b]">{resumeError}</p>}

          {resume?.resume_url ? (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={resume.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="chip chip-primary inline-flex items-center gap-2 px-4 py-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Visualizar Currículo
              </a>
              <button
                onClick={handleDeleteResume}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-[rgba(240,107,107,0.30)] px-4 py-2 text-sm font-medium text-[#f06b6b] transition-colors hover:bg-[rgba(240,107,107,0.08)] disabled:opacity-50"
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
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-colors hover:border-[#3AB0FF]/50 hover:text-[#3AB0FF] ${uploading ? "pointer-events-none opacity-50" : ""}`}
                style={{ borderColor: "var(--line-strong)", color: "var(--fg-3)" }}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.2)] border-t-[#3AB0FF]" />
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
              <p className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>PDF até 10 MB</p>
            </div>
          )}
        </section>

        {/* OCEAN + Skills */}
        <div className="grid gap-6 lg:grid-cols-2">

          {hasOcean && (
            <section
              className="rounded-2xl border p-6"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <div className="section-label mb-4">Perfil OCEAN</div>
              <div className="flex flex-col items-center gap-5">
                <OceanRadar scores={candidate.ocean_scores!} />
                <div className="grid w-full grid-cols-5 gap-1 text-center">
                  {OCEAN_DIMS.map(({ key, label, fullLabel, color }) => {
                    const raw = candidate.ocean_scores![key] ?? 0
                    const pct = raw > 1 ? Math.round(raw) : Math.round(raw * 100)
                    return (
                      <div key={key} className="space-y-0.5 px-0.5">
                        <div className="text-sm font-bold font-data" style={{ color }}>{label}</div>
                        <div className="text-[10px] leading-tight" style={{ color: "var(--fg-3)" }}>{fullLabel}</div>
                        <div className="text-sm font-semibold font-data" style={{ color }}>{pct}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {skills.length > 0 && (
            <section
              className="rounded-2xl border p-6"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }}
            >
              <div className="section-label mb-4">Skills</div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="chip">{skill}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Matches */}
        {matches.length > 0 && (
          <section
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <div className="section-label mb-4">
              Matches — {matches.length} vaga{matches.length !== 1 ? "s" : ""}
            </div>
            <div className="space-y-3">
              {matches.map((match) => {
                const pct = Math.round(match.score * 100)
                const color = scoreColor(pct)
                const isBilateral = match.status === "bilateral"

                return (
                  <div
                    key={match.id}
                    className="card-lift flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-6"
                    style={{ background: "var(--surface-3)", borderColor: "var(--line-soft)" }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={match.company_name ?? "?"} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">{match.company_name}</div>
                        <div className="truncate text-sm" style={{ color: "var(--fg-3)" }}>{match.job_title}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="w-32">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span style={{ color: "var(--fg-3)" }}>Match</span>
                          <span className="font-data font-semibold tabular-nums" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                      {isBilateral ? (
                        <span className="bilateral-badge">
                          <span className="bilateral-pulse" />
                          Match!
                        </span>
                      ) : (
                        <StatusBadge status={match.status} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {matches.length === 0 && (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border py-10 text-center"
            style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}
          >
            <span className="text-2xl opacity-30">◎</span>
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>Nenhum match encontrado ainda.</p>
          </div>
        )}
      </div>
    </main>
  )
}
