"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getCurrentUser, getCompany, updateCompany } from "@/lib/api"
import type { CompanyData, UserData } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
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

function parseSliders(cultureVector: string | null): OceanSliders {
  if (!cultureVector) return DEFAULT_SLIDERS
  try {
    const parsed = JSON.parse(cultureVector) as Record<string, number>
    return {
      o: Math.round((parsed.o ?? 0.5) * 100),
      c: Math.round((parsed.c ?? 0.5) * 100),
      e: Math.round((parsed.e ?? 0.5) * 100),
      a: Math.round((parsed.a ?? 0.5) * 100),
      n: Math.round((parsed.n ?? 0.5) * 100),
    }
  } catch {
    return DEFAULT_SLIDERS
  }
}

function slidersToVector(sliders: OceanSliders): string {
  return JSON.stringify(
    Object.fromEntries(OCEAN_KEYS.map((k) => [k, sliders[k] / 100])),
  )
}

// ─── radar chart ─────────────────────────────────────────────────────────────

function RadarChart({ sliders }: { sliders: OceanSliders }) {
  const cx = 80
  const cy = 80
  const r = 55
  const labelR = 68

  const angles = OCEAN_KEYS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5)

  const gridPoints = (scale: number) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(" ")

  const values = OCEAN_KEYS.map((k) => sliders[k] / 100)
  const dataPoints = angles
    .map((a, i) => `${cx + r * values[i] * Math.cos(a)},${cy + r * values[i] * Math.sin(a)}`)
    .join(" ")

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={gridPoints(s)} fill="none" stroke="#3f3f46" strokeWidth="0.8" />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(a)}
          y2={cy + r * Math.sin(a)}
          stroke="#3f3f46"
          strokeWidth="0.8"
        />
      ))}
      <polygon
        points={dataPoints}
        fill="rgba(59,130,246,0.18)"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {angles.map((a, i) => (
        <text
          key={OCEAN_KEYS[i]}
          x={cx + labelR * Math.cos(a)}
          y={cy + labelR * Math.sin(a)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fill="#71717a"
          fontWeight="700"
        >
          {OCEAN_KEYS[i].toUpperCase()}
        </text>
      ))}
    </svg>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function CompanyProfilePage() {
  const params = useParams()
  const companyId = params.id as string

  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // form state
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")
  const [sliders, setSliders] = useState<OceanSliders>(DEFAULT_SLIDERS)

  // saved originals for cancel
  const [origName, setOrigName] = useState("")
  const [origDescription, setOrigDescription] = useState("")
  const [origIndustry, setOrigIndustry] = useState("")
  const [origSliders, setOrigSliders] = useState<OceanSliders>(DEFAULT_SLIDERS)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

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
        const [userData, companyData] = await Promise.all([
          getCurrentUser(token),
          getCompany(companyId, token),
        ])
        if (cancelled) return
        setUser(userData)
        setCompany(companyData)
        const parsed = parseSliders(companyData.culture_vector)
        setName(companyData.name)
        setDescription(companyData.description ?? "")
        setIndustry(companyData.industry ?? "")
        setSliders(parsed)
        setOrigName(companyData.name)
        setOrigDescription(companyData.description ?? "")
        setOrigIndustry(companyData.industry ?? "")
        setOrigSliders(parsed)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, companyId])

  function handleEdit() {
    setEditing(true)
    setSaveError("")
  }

  function handleCancel() {
    setName(origName)
    setDescription(origDescription)
    setIndustry(origIndustry)
    setSliders(origSliders)
    setEditing(false)
    setSaveError("")
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveError("Nome é obrigatório")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      const updated = await updateCompany(
        companyId,
        {
          name: name.trim(),
          description: description.trim() || null,
          industry: industry.trim() || null,
          culture_vector: slidersToVector(sliders),
        },
        token,
      )
      setCompany(updated)
      const parsed = parseSliders(updated.culture_vector)
      setOrigName(updated.name)
      setOrigDescription(updated.description ?? "")
      setOrigIndustry(updated.industry ?? "")
      setOrigSliders(parsed)
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  // ── states ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Carregando perfil…" />
  if (!token) return <ErrorState title="Autenticação necessária" message="Você precisa estar logado para acessar o perfil." onRetry={() => window.location.href = "/login"} retryLabel="Fazer login" />
  if (error) return <ErrorState message={error} />

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-[#3AB0FF]/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`/company/${companyId}/dashboard`}
                className="text-xs text-foreground0 transition-colors hover:text-foreground/85"
              >
                {company?.name ?? "Empresa"}
              </a>
              <span className="text-xs text-muted-foreground/40">/</span>
              <h1 className="text-sm font-bold text-foreground">Perfil</h1>
            </div>
            <p className="mt-0.5 text-xs text-foreground0">Informações e cultura organizacional</p>
          </div>
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Company Info */}
        <section className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)]">
          <div className="flex items-center justify-between border-b border-[#3AB0FF]/10 px-5 py-4">
            <div>
              <h2 className="font-semibold text-foreground">Informações da Empresa</h2>
              <p className="mt-0.5 text-xs text-foreground0">Nome, setor e descrição</p>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>Editar</Button>
            )}
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full rounded-lg border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.6)] px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-colors focus:border-[#3AB0FF]/60"
                />
              ) : (
                <p className="text-sm text-foreground">{company?.name ?? "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Setor</label>
              {editing ? (
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="ex: Tecnologia, Saúde, Educação…"
                  className="w-full rounded-lg border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.6)] px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-colors focus:border-[#3AB0FF]/60"
                />
              ) : (
                <p className="text-sm text-foreground">{company?.industry ?? <span className="text-muted-foreground/50">Não informado</span>}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a empresa, missão, valores…"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.6)] px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-colors focus:border-[#3AB0FF]/60"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {company?.description ?? <span className="text-muted-foreground/50">Não informado</span>}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* OCEAN Culture Profile */}
        <section className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)]">
          <div className="border-b border-[#3AB0FF]/10 px-5 py-4">
            <h2 className="font-semibold text-foreground">Perfil de Cultura OCEAN</h2>
            <p className="mt-0.5 text-xs text-foreground0">
              Defina os traços de personalidade que refletem a cultura da empresa
            </p>
          </div>

          <div className="px-5 py-5">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Radar */}
              <div className="flex shrink-0 items-center justify-center">
                <RadarChart sliders={sliders} />
              </div>

              {/* Sliders */}
              <div className="w-full space-y-3">
                {OCEAN_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 text-center text-xs font-bold text-foreground0">
                      {key.toUpperCase()}
                    </span>
                    <span className="w-32 shrink-0 text-xs text-muted-foreground">{OCEAN_LABELS[key]}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliders[key]}
                      disabled={!editing}
                      onChange={(e) =>
                        setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                      }
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#3AB0FF] disabled:cursor-default disabled:opacity-60"
                    />
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-[#3AB0FF]">
                      {sliders[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save error */}
        {saveError && (
          <p className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{saveError}</p>
        )}

        {/* Action buttons */}
        {editing && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCancel} className="flex-1">Cancelar</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">Salvar</Button>
          </div>
        )}
      </div>
    </main>
  )
}
