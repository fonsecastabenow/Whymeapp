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

const OCEAN_COLORS: Record<OceanKey, string> = {
  o: "#8B5CF6",
  c: "#3B82F6",
  e: "#F59E0B",
  a: "#10B981",
  n: "#EF4444",
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
  const cx = 90
  const cy = 90
  const r = 62
  const labelR = 78

  const angles = OCEAN_KEYS.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5)

  const gridPoints = (scale: number) =>
    angles.map((a) => `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`).join(" ")

  const values = OCEAN_KEYS.map((k) => sliders[k] / 100)
  const dataPoints = angles
    .map((a, i) => `${cx + r * values[i] * Math.cos(a)},${cy + r * values[i] * Math.sin(a)}`)
    .join(" ")

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={gridPoints(s)} fill="none" stroke="rgba(58,176,255,0.12)" strokeWidth="1" />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(a)}
          y2={cy + r * Math.sin(a)}
          stroke="rgba(58,176,255,0.12)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={dataPoints}
        fill="rgba(58,176,255,0.15)"
        stroke="#3AB0FF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {angles.map((a, i) => {
        const key = OCEAN_KEYS[i]
        return (
          <g key={key}>
            <circle
              cx={cx + r * values[i] * Math.cos(a)}
              cy={cy + r * values[i] * Math.sin(a)}
              r="3"
              fill={OCEAN_COLORS[key]}
            />
            <text
              x={cx + labelR * Math.cos(a)}
              y={cy + labelR * Math.sin(a)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fill="rgba(200,213,234,0.8)"
              fontWeight="700"
            >
              {key.toUpperCase()}
            </text>
          </g>
        )
      })}
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

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")
  const [sliders, setSliders] = useState<OceanSliders>(DEFAULT_SLIDERS)

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
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(900px 500px at 80% -5%, rgba(58,176,255,0.08), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgba(139,92,246,0.07), transparent 65%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ borderColor: "rgba(58,176,255,0.10)", backgroundColor: "rgba(11,31,58,0.92)", backdropFilter: "blur(14px)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <a
                href={`/company/${companyId}/dashboard`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {company?.name ?? "Empresa"}
              </a>
              <span className="text-xs" style={{ color: "rgba(200,213,234,0.3)" }}>/</span>
              <h1 className="text-sm font-bold text-foreground">Perfil</h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Informações e cultura organizacional</p>
          </div>
          {user && (
            <span className="text-xs font-medium text-muted-foreground">{user.name}</span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-7">

        {/* Company Info Card */}
        <section
          className="rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          style={{ background: "rgba(16,34,68,0.78)", border: "1px solid rgba(58,176,255,0.12)", backdropFilter: "blur(20px)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(58,176,255,0.08)" }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                Empresa
              </p>
              <h2 className="mt-0.5 text-[17px] font-bold text-foreground">Informações da Empresa</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Nome, setor e descrição</p>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>Editar</Button>
            )}
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nome</label>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors"
                  style={{
                    background: "rgba(8,22,46,0.72)",
                    border: "1px solid rgba(58,176,255,0.15)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{company?.name ?? "—"}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Setor</label>
              {editing ? (
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="ex: Tecnologia, Saúde, Educação…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors"
                  style={{
                    background: "rgba(8,22,46,0.72)",
                    border: "1px solid rgba(58,176,255,0.15)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                />
              ) : (
                <p className="text-sm text-foreground">
                  {company?.industry ?? <span className="text-muted-foreground">Não informado</span>}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Descrição</label>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a empresa, missão, valores…"
                  rows={4}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors"
                  style={{
                    background: "rgba(8,22,46,0.72)",
                    border: "1px solid rgba(58,176,255,0.15)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                  {company?.description ?? <span className="text-muted-foreground">Não informado</span>}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* OCEAN Culture Profile */}
        <section
          className="rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
          style={{ background: "rgba(16,34,68,0.78)", border: "1px solid rgba(58,176,255,0.12)", backdropFilter: "blur(20px)" }}
        >
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(58,176,255,0.08)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(58,176,255,0.7)" }}>
              OCEAN
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-foreground">Perfil de Cultura</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Defina os traços de personalidade que refletem a cultura da empresa
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Radar */}
              <div className="flex shrink-0 items-center justify-center">
                <RadarChart sliders={sliders} />
              </div>

              {/* Sliders */}
              <div className="w-full space-y-3.5">
                {OCEAN_KEYS.map((key) => (
                  <div key={key} className="group flex items-center gap-3">
                    <span
                      className="w-5 shrink-0 text-center text-[11px] font-black"
                      style={{ color: OCEAN_COLORS[key] }}
                    >
                      {key.toUpperCase()}
                    </span>
                    <span className="w-32 shrink-0 text-xs text-muted-foreground">{OCEAN_LABELS[key]}</span>
                    <div className="relative flex-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sliders[key]}
                        disabled={!editing}
                        onChange={(e) =>
                          setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-default disabled:opacity-50"
                        style={{ accentColor: OCEAN_COLORS[key], background: "rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <span
                      className="w-9 shrink-0 text-right text-xs font-bold tabular-nums"
                      style={{ color: OCEAN_COLORS[key] }}
                    >
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
          <p
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.10)", color: "#f87171" }}
          >
            {saveError}
          </p>
        )}

        {/* Action buttons */}
        {editing && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCancel} className="flex-1">Cancelar</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">Salvar Alterações</Button>
          </div>
        )}
      </div>
    </div>
  )
}
