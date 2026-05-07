"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  getCurrentUser,
  getCompany,
  getCompanyJobs,
  createJob,
  updateJob,
  updateJobStatus,
  getCompanyReferenceData,
  getJobMatchDetails,
  updateMatchStatus,
} from "@/lib/api"
import type { JobData, CompanyData, UserData, JobCreateRequest, JobUpdateRequest, CompanyReferenceData, CandidateMatchData } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

// ─── types ────────────────────────────────────────────────────────────────────

type OceanKey = "o" | "c" | "e" | "a" | "n"
type OceanSliders = Record<OceanKey, number>

const OCEAN_KEYS: OceanKey[] = ["o", "c", "e", "a", "n"]
const OCEAN_LABELS: Record<OceanKey, string> = {
  o: "Abertura",
  c: "Conscienciosidade",
  e: "Extroversão",
  a: "Amabilidade",
  n: "Neuroticismo",
}

const DEFAULT_SLIDERS: OceanSliders = { o: 50, c: 50, e: 50, a: 50, n: 50 }

// ─── radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ ocean }: { ocean: Record<string, number> | null }) {
  const cx = 40
  const cy = 40
  const r = 22
  const labelR = 32

  const angles = OCEAN_KEYS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5)

  const gridPoints = (scale: number) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(" ")

  const values = OCEAN_KEYS.map((k) => ocean?.[k] ?? 0)
  const dataPoints = angles
    .map((a, i) => `${cx + r * values[i] * Math.cos(a)},${cy + r * values[i] * Math.sin(a)}`)
    .join(" ")

  return (
    <svg width={80} height={80} viewBox="0 0 80 80">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={gridPoints(s)} fill="none" stroke="#3f3f46" strokeWidth="0.5" />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(a)}
          y2={cy + r * Math.sin(a)}
          stroke="#3f3f46"
          strokeWidth="0.5"
        />
      ))}
      {ocean && (
        <polygon
          points={dataPoints}
          fill="rgba(59,130,246,0.18)"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {angles.map((a, i) => (
        <text
          key={OCEAN_KEYS[i]}
          x={cx + labelR * Math.cos(a)}
          y={cy + labelR * Math.sin(a)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fill="#71717a"
          fontWeight="600"
        >
          {OCEAN_KEYS[i].toUpperCase()}
        </text>
      ))}
    </svg>
  )
}

// ─── job form modal ───────────────────────────────────────────────────────────

function JobFormModal({
  companyId,
  editing,
  token,
  onClose,
  onSaved,
}: {
  companyId: string
  editing: JobData | null
  token: string
  onClose: () => void
  onSaved: (job: JobData) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [sliders, setSliders] = useState<OceanSliders>(() => {
    if (editing?.ocean_ideal) {
      const o = editing.ocean_ideal as Record<string, number>
      return {
        o: Math.round((o.o ?? 0.5) * 100),
        c: Math.round((o.c ?? 0.5) * 100),
        e: Math.round((o.e ?? 0.5) * 100),
        a: Math.round((o.a ?? 0.5) * 100),
        n: Math.round((o.n ?? 0.5) * 100),
      }
    }
    return DEFAULT_SLIDERS
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [refData, setRefData] = useState<CompanyReferenceData | null>(null)
  const [refDataLoading, setRefDataLoading] = useState(false)
  const [refDataLoaded, setRefDataLoaded] = useState(false)
  const [hardSkillsRequired, setHardSkillsRequired] = useState<string[]>(
    editing?.hard_skills_required ?? [],
  )
  const [hardSkillSearch, setHardSkillSearch] = useState("")
  const [educationLevelMin, setEducationLevelMin] = useState(
    editing?.education_level_min ?? "",
  )
  const [experienceYearsMin, setExperienceYearsMin] = useState<number | "">(
    editing?.experience_years_min ?? "",
  )
  const [workModel, setWorkModel] = useState(editing?.work_model ?? "")
  const [salaryMin, setSalaryMin] = useState<number | "">(editing?.salary_min ?? "")
  const [salaryMax, setSalaryMax] = useState<number | "">(editing?.salary_max ?? "")
  const [location, setLocation] = useState(editing?.location ?? "")

  const ocean_ideal = Object.fromEntries(
    OCEAN_KEYS.map((k) => [k, sliders[k] / 100]),
  ) as Record<string, number>

  // Load reference data once (cached)
  useEffect(() => {
    if (!refDataLoaded && !refDataLoading) {
      setRefDataLoading(true)
      getCompanyReferenceData(token || undefined)
        .then((data) => {
          setRefData(data)
          setRefDataLoaded(true)
        })
        .catch(() => {
          // silently fail, fields will show empty
        })
        .finally(() => setRefDataLoading(false))
    }
  }, [refDataLoaded, refDataLoading, token])

  function toggleHardSkill(id: string) {
    setHardSkillsRequired((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev,
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setFormError("Título é obrigatório")
      return
    }
    setSubmitting(true)
    setFormError("")
    try {
      let saved: JobData
      if (editing) {
        const payload: JobUpdateRequest = {
          title: title.trim(),
          description: description.trim() || null,
          ocean_ideal,
          hard_skills_required: hardSkillsRequired.length > 0 ? hardSkillsRequired : undefined,
          education_level_min: educationLevelMin || null,
          experience_years_min: experienceYearsMin !== "" ? Number(experienceYearsMin) : null,
          work_model: workModel || null,
          salary_min: salaryMin !== "" ? Number(salaryMin) : null,
          salary_max: salaryMax !== "" ? Number(salaryMax) : null,
          location: location.trim() || null,
        }
        saved = await updateJob(editing.id, payload, token)
      } else {
        const payload: JobCreateRequest = {
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          ocean_ideal,
          hard_skills_required: hardSkillsRequired.length > 0 ? hardSkillsRequired : undefined,
          education_level_min: educationLevelMin || null,
          experience_years_min: experienceYearsMin !== "" ? Number(experienceYearsMin) : null,
          work_model: workModel || null,
          salary_min: salaryMin !== "" ? Number(salaryMin) : null,
          salary_max: salaryMax !== "" ? Number(salaryMax) : null,
          location: location.trim() || null,
        }
        saved = await createJob(payload, token)
      }
      onSaved(saved)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar vaga")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="font-semibold text-zinc-50">
            {editing ? "Editar Vaga" : "Nova Vaga"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Desenvolvedor Full Stack"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a vaga, responsabilidades, benefícios..."
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          {/* OCEAN Sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Perfil OCEAN Ideal</label>
              <div className="flex h-10 w-10 items-center justify-center">
                <RadarChart ocean={ocean_ideal} />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
              {OCEAN_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-zinc-500">
                    {key.toUpperCase()}
                  </span>
                  <span className="w-28 shrink-0 text-xs text-zinc-400">{OCEAN_LABELS[key]}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliders[key]}
                    onChange={(e) =>
                      setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-blue-500"
                  />
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-blue-400">
                    {sliders[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hard Skills Required */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Hard Skills Requeridas (máx. 10)
            </label>
            {refDataLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
                <span className="text-xs text-zinc-500">Carregando...</span>
              </div>
            ) : refData ? (
              <>
                <input
                  type="text"
                  value={hardSkillSearch}
                  onChange={(e) => setHardSkillSearch(e.target.value)}
                  placeholder="Buscar habilidades..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
                />
                {hardSkillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {hardSkillsRequired.map((id) => {
                      const skill = refData.hard_skills.find((s) => s.id === id)
                      return skill ? (
                        <span
                          key={id}
                          className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-1 text-xs text-blue-400"
                        >
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => toggleHardSkill(id)}
                            className="ml-0.5 text-blue-300 hover:text-blue-100"
                          >
                            ×
                          </button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-800/40">
                  {refData.hard_skills
                    .filter((s) =>
                      s.name.toLowerCase().includes(hardSkillSearch.toLowerCase()),
                    )
                    .length === 0 ? (
                    <p className="p-3 text-xs text-zinc-500">Nenhuma habilidade encontrada.</p>
                  ) : (
                    refData.hard_skills
                      .filter((s) =>
                        s.name.toLowerCase().includes(hardSkillSearch.toLowerCase()),
                      )
                      .map((skill) => {
                        const active = hardSkillsRequired.includes(skill.id)
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleHardSkill(skill.id)}
                            disabled={!active && hardSkillsRequired.length >= 10}
                            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                              active
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-zinc-400 hover:bg-zinc-800"
                            } disabled:opacity-40`}
                          >
                            <span>{skill.name}</span>
                            <span className="text-zinc-600">{skill.category}</span>
                          </button>
                        )
                      })
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500">Erro ao carregar habilidades.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Nível Formação Mín.</label>
              <select
                value={educationLevelMin}
                onChange={(e) => setEducationLevelMin(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 outline-none transition-colors focus:border-blue-500"
              >
                <option value="">Qualquer</option>
                {refData?.education_levels.map((el) => {
                  const id = typeof el === "string" ? el : el.id
                  const name = typeof el === "string" ? el : el.name
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Anos Exp. Mínimos</label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYearsMin}
                onChange={(e) =>
                  setExperienceYearsMin(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="0"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Modelo de Trabalho</label>
            <select
              value={workModel}
              onChange={(e) => setWorkModel(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 outline-none transition-colors focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {["presencial", "hibrido", "remoto"].map((wm) => (
                <option key={wm} value={wm}>
                  {wm.charAt(0).toUpperCase() + wm.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Salário Mín.</label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) =>
                  setSalaryMin(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="0"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Salário Máx.</label>
              <input
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) =>
                  setSalaryMax(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="0"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Localização</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ex: São Paulo, SP"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{formError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={submitting} className="flex-1">
              {editing ? "Salvar" : "Criar Vaga"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── job card ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pendente",
  accepted:  "Aceito",
  rejected:  "Recusado",
  bilateral: "Bilateral",
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-zinc-700/60 text-zinc-400",
  accepted:  "bg-emerald-500/15 text-emerald-400",
  rejected:  "bg-rose-500/15 text-rose-400",
  bilateral: "bg-purple-500/15 text-purple-400",
}

function JobCard({
  job,
  token,
  onEdit,
  onStatusChanged,
}: {
  job: JobData
  token: string
  onEdit: (job: JobData) => void
  onStatusChanged: (job: JobData) => void
}) {
  const [toggling, setToggling] = useState(false)
  const [showCandidates, setShowCandidates] = useState(false)
  const [candidates, setCandidates] = useState<CandidateMatchData[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [candidatesLoaded, setCandidatesLoaded] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  async function handleToggle() {
    setToggling(true)
    try {
      const nextStatus = job.status === "active" ? "draft" : "active"
      const updated = await updateJobStatus(job.id, nextStatus, token)
      onStatusChanged(updated)
    } catch {
      // silently ignore toggle errors
    } finally {
      setToggling(false)
    }
  }

  async function handleViewCandidates() {
    setShowCandidates((prev) => !prev)
    if (!candidatesLoaded) {
      setLoadingCandidates(true)
      try {
        const data = await getJobMatchDetails(job.id, token)
        setCandidates(data)
        setCandidatesLoaded(true)
      } catch {
        setCandidatesLoaded(true)
      } finally {
        setLoadingCandidates(false)
      }
    }
  }

  async function handleMatchAction(matchId: string, status: "accepted" | "rejected") {
    setActioning(matchId)
    try {
      await updateMatchStatus(matchId, status, token)
      setCandidates((prev) => prev.map((c) => (c.id === matchId ? { ...c, status } : c)))
    } catch {
      // silently fail
    } finally {
      setActioning(null)
    }
  }

  const isActive = job.status === "active"
  const pendingCount = candidates.filter((c) => c.status === "pending").length

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-zinc-50">{job.title}</h3>
            {job.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                {job.description}
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isActive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-700/60 text-zinc-500"
            }`}
          >
            {isActive ? "Ativa" : "Inativa"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadarChart ocean={job.ocean_ideal} />
            {!job.ocean_ideal && (
              <span className="text-xs text-zinc-600">Sem perfil OCEAN</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(job)}>Editar</Button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                isActive
                  ? "border border-rose-800/60 text-rose-400 hover:bg-rose-500/10"
                  : "border border-emerald-800/60 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {toggling ? "…" : isActive ? "Desativar" : "Ativar"}
            </button>
          </div>
        </div>

        <button
          onClick={handleViewCandidates}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <span>
            {showCandidates ? "Ocultar candidatos" : "Ver candidatos"}
            {candidatesLoaded && candidates.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-600/20 px-1.5 py-0.5 text-blue-400">
                {candidates.length}
                {pendingCount > 0 && ` · ${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}`}
              </span>
            )}
          </span>
          <span>{showCandidates ? "▲" : "▼"}</span>
        </button>
      </div>

      {showCandidates && (
        <div className="border-t border-zinc-800">
          {loadingCandidates ? (
            <div className="flex items-center justify-center py-6 text-xs text-zinc-500">Carregando…</div>
          ) : candidates.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-600">Nenhum candidato ainda</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {candidates.map((c) => {
                const pct = Math.round(c.score * 100)
                const isActioning = actioning === c.id
                return (
                  <div key={c.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{c.candidate_name}</p>
                      {c.candidate_headline && (
                        <p className="truncate text-xs text-zinc-500">{c.candidate_headline}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 80 ? "#10B981" : pct >= 60 ? "#3B82F6" : "#F59E0B",
                            }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold tabular-nums text-zinc-400">
                          {pct}%
                        </span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.status] ?? "bg-zinc-700/60 text-zinc-400"}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      {c.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMatchAction(c.id, "accepted")}
                            disabled={!!isActioning}
                            className="rounded px-2 py-1 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:opacity-40"
                          >
                            {isActioning ? "…" : "Aceitar"}
                          </button>
                          <button
                            onClick={() => handleMatchAction(c.id, "rejected")}
                            disabled={!!isActioning}
                            className="rounded px-2 py-1 text-[10px] font-semibold text-rose-400 transition-colors hover:bg-rose-500/15 disabled:opacity-40"
                          >
                            {isActioning ? "…" : "Recusar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function CompanyJobsPage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobData | null>(null)

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const [userData, companyData, jobsData] = await Promise.all([
          getCurrentUser(token),
          getCompany(companyId, token),
          getCompanyJobs(companyId, token),
        ])
        if (cancelled) return
        setUser(userData)
        setCompany(companyData)
        setJobs(jobsData)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, companyId])

  function openCreate() {
    setEditingJob(null)
    setModalOpen(true)
  }

  function openEdit(job: JobData) {
    setEditingJob(job)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingJob(null)
  }

  function handleSaved(saved: JobData) {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    closeModal()
  }

  function handleStatusChanged(updated: JobData) {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))
  }

  // ── states ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Carregando vagas…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Você precisa estar logado para gerenciar vagas." onRetry={() => window.location.href = "/login"} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

  const activeCount = jobs.filter((j) => j.status === "active").length

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`/company/${companyId}/dashboard`}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {company?.name ?? "Empresa"}
              </a>
              <span className="text-xs text-zinc-700">/</span>
              <h1 className="text-sm font-bold text-zinc-50">Vagas</h1>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {jobs.length} vaga{jobs.length !== 1 ? "s" : ""} · {activeCount} ativa{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-zinc-400">{user.name}</span>}
            <Button onClick={openCreate}>+ Nova Vaga</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {jobs.length === 0 ? (
          <EmptyState
            icon="💼"
            title="Nenhuma vaga cadastrada"
            description="Crie a primeira vaga para começar a receber candidatos."
            action={<Button onClick={openCreate}>Criar Primeira Vaga</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                token={token}
                onEdit={openEdit}
                onStatusChanged={handleStatusChanged}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <JobFormModal
          companyId={companyId}
          editing={editingJob}
          token={token}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </main>
  )
}
