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
} from "@/lib/api"
import type { JobData, CompanyData, UserData, JobCreateRequest, JobUpdateRequest } from "@/lib/api"

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

  const ocean_ideal = Object.fromEntries(
    OCEAN_KEYS.map((k) => [k, sliders[k] / 100]),
  ) as Record<string, number>

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
        }
        saved = await updateJob(editing.id, payload, token)
      } else {
        const payload: JobCreateRequest = {
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          ocean_ideal,
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

          {formError && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{formError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Salvando…" : editing ? "Salvar" : "Criar Vaga"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── job card ─────────────────────────────────────────────────────────────────

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

  const isActive = job.status === "active"

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
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
          <button
            onClick={() => onEdit(job)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-50"
          >
            Editar
          </button>
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-zinc-400">Carregando vagas…</p>
        </div>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-300">
            ⚠
          </div>
          <h1 className="text-xl font-semibold text-zinc-50">Autenticação necessária</h1>
          <p className="text-zinc-400">Você precisa estar logado para gerenciar vagas.</p>
          <a
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Fazer login
          </a>
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
          <p className="text-zinc-400">{error}</p>
        </div>
      </main>
    )
  }

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
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Nova Vaga
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl">
              💼
            </div>
            <h2 className="font-semibold text-zinc-50">Nenhuma vaga cadastrada</h2>
            <p className="mt-1 text-sm text-zinc-500">Crie a primeira vaga para começar a receber candidatos.</p>
            <button
              onClick={openCreate}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Criar Primeira Vaga
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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
