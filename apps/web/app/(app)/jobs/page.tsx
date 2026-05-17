"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listPublicJobs } from "@/lib/api"
import type { JobData } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"

const WORK_MODEL_LABELS: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Hibrido",
  remoto: "Remoto",
}

const INDUSTRY_COLORS: Record<string, string> = {
  Tecnologia: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  Saude: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Industria: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  Educacao: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  Varejo: "border-pink-500/30 bg-pink-500/10 text-pink-400",
  Financas: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  Agronegocio: "border-green-500/30 bg-green-500/10 text-green-400",
  Mineracao: "border-orange-500/30 bg-orange-500/10 text-orange-400",
}

function formatSalary(value: number | null | undefined): string {
  if (value == null) return ""
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filterWorkModel, setFilterWorkModel] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await listPublicJobs()
        if (!cancelled) setJobs(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar vagas")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase()
    if (q && !j.title.toLowerCase().includes(q) && !j.company_name?.toLowerCase().includes(q)) return false
    if (filterWorkModel && j.work_model !== filterWorkModel) return false
    return true
  })

  if (loading) return <LoadingSpinner message="Carregando vagas..." />

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-[#3AB0FF]/10 bg-background/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black tracking-widest text-gradient-gold uppercase">WHY ME?</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Vagas</span>
          </div>
          <Link href="/login" className="rounded-lg border border-[#3AB0FF]/20 px-4 py-2 text-sm font-medium text-[#3AB0FF] transition-colors hover:bg-[#3AB0FF]/10">
            Entrar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Vagas disponiveis</h1>
          <p className="mt-2 text-muted-foreground">
            {jobs.length} vaga{jobs.length !== 1 ? "s" : ""} ativa{jobs.length !== 1 ? "s" : ""} -- encontre a oportunidade ideal para seu perfil
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cargo ou empresa..."
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#3AB0FF]/50 focus:outline-none"
          />
          <select
            value={filterWorkModel}
            onChange={(e) => setFilterWorkModel(e.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 focus:border-[#3AB0FF]/50 focus:outline-none"
          >
            <option value="">Todos os modelos</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">hibrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-12 text-center">
            <p className="text-zinc-400">Nenhuma vaga encontrada com esses filtros</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => {
              const indColor = INDUSTRY_COLORS[job.company_industry ?? ""] ?? "border-zinc-600/30 bg-zinc-700/10 text-zinc-400"
              const salary = job.salary_min ? formatSalary(job.salary_min) : ""
              const salaryMax = job.salary_max ? formatSalary(job.salary_max) : ""
              return (
                <Link
                  key={job.id}
                  href={"/jobs/" + job.id}
                  className="group block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-[#3AB0FF]/30 hover:bg-zinc-900/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-zinc-100 group-hover:text-[#3AB0FF] transition-colors">{job.title}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                        <span className="font-medium text-zinc-300">{job.company_name}</span>
                        <span className="text-zinc-600">|</span>
                        <span>{WORK_MODEL_LABELS[job.work_model ?? ""] ?? job.work_model}</span>
                        {job.location && (
                          <>
                            <span className="text-zinc-600">|</span>
                            <span>{job.location}</span>
                          </>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{job.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {job.company_industry && (
                        <span className={"rounded-full border px-2.5 py-0.5 text-xs font-medium " + indColor}>
                          {job.company_industry}
                        </span>
                      )}
                      {salary && (
                        <span className="text-sm font-semibold text-emerald-400">
                          {salary}{salaryMax ? " - " + salaryMax : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
