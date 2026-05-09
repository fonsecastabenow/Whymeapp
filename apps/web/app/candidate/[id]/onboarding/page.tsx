"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  getCandidateReferenceData,
  submitCandidateOnboarding,
  updateCandidateProfile,
  startTelegramInterview,
} from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { useAuthGuard } from "@/lib/hooks"

const TOTAL_STEPS = 6

const LANGUAGE_OPTIONS = ["Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Mandarim", "Japonês"]

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

type RefHardSkill = { id: string; name: string; category: string }
type RefEducationLevel = { id: string; name: string }
type ReferenceData = {
  hard_skills: RefHardSkill[]
  education_levels: RefEducationLevel[]
  professional_levels: string[]
  work_models: string[]
  language_levels: string[]
}

type FormData = {
  educationLevel: string
  course: string
  institution: string
  experienceYears: string
  professionalLevel: string
  headline: string
  languages: { language: string; level: string }[]
  city: string
  state: string
  country: string
  phone: string
  hardSkills: string[]
  salaryMin: string
  salaryMax: string
  workModel: string
  linkedinUrl: string
}

const inputCls =
  "w-full rounded-xl border border-[rgba(58,176,255,0.15)] bg-[rgba(16,34,68,0.7)] px-4 py-2.5 text-sm text-foreground placeholder-[rgba(200,213,234,0.35)] focus:border-[rgba(58,176,255,0.50)] focus:outline-none focus:ring-1 focus:ring-[rgba(58,176,255,0.15)]"
const labelCls = "eyebrow mb-2 block"

export default function OnboardingPage() {
  useAuthGuard()
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [step, setStep] = useState(1)
  const [refData, setRefData] = useState<ReferenceData | null>(null)
  const [refError, setRefError] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [stepError, setStepError] = useState("")
  const [skillSearch, setSkillSearch] = useState("")

  const [form, setForm] = useState<FormData>({
    educationLevel: "",
    course: "",
    institution: "",
    experienceYears: "",
    professionalLevel: "",
    headline: "",
    languages: [],
    city: "",
    state: "",
    country: "Brasil",
    phone: "",
    hardSkills: [],
    salaryMin: "",
    salaryMax: "",
    workModel: "",
    linkedinUrl: "",
  })

  useEffect(() => {
    async function loadRef() {
      try {
        const data = await getCandidateReferenceData()
        setRefData(data as unknown as ReferenceData)
      } catch (err) {
        setRefError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        setPageLoading(false)
      }
    }
    loadRef()
  }, [])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addLanguage() {
    const defaultLevel = refData?.language_levels?.[1] ?? "Básico"
    setForm((prev) => ({
      ...prev,
      languages: [...prev.languages, { language: "Inglês", level: defaultLevel }],
    }))
  }

  function removeLanguage(index: number) {
    setForm((prev) => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }))
  }

  function updateLanguage(index: number, key: "language" | "level", value: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.map((l, i) => (i === index ? { ...l, [key]: value } : l)),
    }))
  }

  function toggleSkill(skillName: string) {
    setForm((prev) => {
      const has = prev.hardSkills.includes(skillName)
      if (has) return { ...prev, hardSkills: prev.hardSkills.filter((s) => s !== skillName) }
      if (prev.hardSkills.length >= 5) return prev
      return { ...prev, hardSkills: [...prev.hardSkills, skillName] }
    })
  }

  function validateStep(currentStep: number): string {
    if (currentStep === 2 && !form.professionalLevel) return "Selecione o nível profissional"
    if (currentStep === 4) {
      if (!form.city.trim()) return "Informe a cidade"
      if (!form.state.trim()) return "Informe o estado"
      if (!form.country.trim()) return "Informe o país"
    }
    return ""
  }

  function handleNext() {
    const err = validateStep(step)
    if (err) { setStepError(err); return }
    setStepError("")
    setStep((s) => s + 1)
  }

  function handleBack() {
    setStepError("")
    setSubmitError("")
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!form.workModel) { setStepError("Selecione o modelo de trabalho"); return }
    setStepError("")
    setSubmitting(true)
    setSubmitError("")

    const token = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""

    try {
      await submitCandidateOnboarding(
        candidateId,
        {
          phone: form.phone || null,
          education: {
            level: form.educationLevel || null,
            course: form.course || null,
            institution: form.institution || null,
          },
          languages: form.languages,
          hard_skills: form.hardSkills,
          city: form.city,
          state: form.state,
          country: form.country,
          salary_expectation:
            form.salaryMin || form.salaryMax
              ? {
                  min: form.salaryMin ? parseFloat(form.salaryMin) : null,
                  max: form.salaryMax ? parseFloat(form.salaryMax) : null,
                  currency: "BRL",
                }
              : null,
          work_model: form.workModel,
          linkedin_url: form.linkedinUrl || null,
          professional_level: form.professionalLevel,
        },
        token,
      )

      // Save headline and experience_years (non-critical)
      if (form.headline || form.experienceYears) {
        await updateCandidateProfile(
          candidateId,
          {
            headline: form.headline || null,
            experience_years: form.experienceYears ? parseFloat(form.experienceYears) : null,
          },
          token,
        ).catch(() => {})
      }

      router.push(`/candidate/${candidateId}/dashboard`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar dados")
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Telegram Interview ──────────────────────────────────────────────────────

  const [telegramLink, setTelegramLink] = useState("")
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  async function handleFinalSubmit() {
    await handleSubmit()
    // After onboarding saves, offer the Telegram interview
    if (!submitError) {
      setTelegramLoading(true)
      try {
        const token = localStorage.getItem("whyme_token") ?? ""
        const data = await startTelegramInterview(candidateId, token)
        setTelegramLink(data.telegram_link)
      } catch {
        // Silent — Telegram link is optional
      } finally {
        setTelegramLoading(false)
        setShowSuccess(true)
      }
    }
  }

  if (showSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding completo!</h1>
          <p className="text-muted-foreground">
            Seus dados foram salvos. Agora vamos descobrir seu perfil profissional com a entrevista OCEAN.
          </p>

          <div className="glass-card rounded-2xl p-6">
            <p className="mb-2 text-sm font-medium text-foreground/90">Entrevista OCEAN via Telegram</p>
            <p className="mb-4 text-xs text-muted-foreground/70">
              Responda 8 perguntas de forma natural. Um agente vai interpretar suas respostas e criar seu perfil.
            </p>
            {telegramLink ? (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3AB0FF]/20 transition-opacity hover:opacity-90"
              >
                💬 Iniciar Entrevista no Telegram
              </a>
            ) : (
              <p className="text-xs text-muted-foreground/50">Link indisponível no momento</p>
            )}
          </div>

          <button
            onClick={() => router.push(`/candidate/${candidateId}/dashboard`)}
            className="text-sm text-muted-foreground/70 underline transition-colors hover:text-foreground"
          >
            Pular, quero ir pro Dashboard
          </button>
        </div>
      </main>
    )
  }

  if (pageLoading) return <LoadingSpinner message="Carregando…" />
  if (refError) return <ErrorState message={refError} onRetry={() => window.location.reload()} />

  const levelOptions = refData?.professional_levels ?? ["junior", "pleno", "senior", "tech-lead", "specialist"]
  const langLevels = refData?.language_levels ?? ["Iniciante", "Básico", "Intermediário", "Avançado", "Fluente/Nativo"]
  const workModels = refData?.work_models ?? ["presencial", "hibrido", "remoto"]
  const filteredSkills = (refData?.hard_skills ?? []).filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase())
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Page header */}
        <div className="mb-8 text-center">
          <a href="/" className="text-lg font-black tracking-widest text-gradient-gold uppercase">
            Whyme
          </a>
          <p className="mt-2 text-sm text-muted-foreground/70">Configure seu perfil para começar</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-between">
            <p className="font-data text-xs" style={{ color: "var(--fg-3)" }}>
              Passo {step} de {TOTAL_STEPS}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-7 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-[#3AB0FF]" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── Step 1: Formação ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Formação Acadêmica</h2>
              <div>
                <label className={labelCls}>Nível de Formação</label>
                <select
                  value={form.educationLevel}
                  onChange={(e) => setField("educationLevel", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecionar…</option>
                  {(refData?.education_levels ?? []).map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Curso</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setField("course", e.target.value)}
                  placeholder="Ex: Ciência da Computação"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Instituição</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setField("institution", e.target.value)}
                  placeholder="Ex: USP"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Experiência ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Experiência Profissional</h2>
              <div>
                <label className={labelCls}>Anos de Experiência</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.experienceYears}
                  onChange={(e) => setField("experienceYears", e.target.value)}
                  placeholder="Ex: 3"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Nível Profissional <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.professionalLevel}
                  onChange={(e) => setField("professionalLevel", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecionar…</option>
                  {levelOptions.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l] ?? l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Headline</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setField("headline", e.target.value)}
                  placeholder="Ex: Desenvolvedor Full Stack"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Idiomas ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Idiomas</h2>
                <button
                  onClick={addLanguage}
                  className="rounded-xl border border-[#3AB0FF]/20 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-[#3AB0FF]/50 hover:text-foreground"
                >
                  + Adicionar idioma
                </button>
              </div>
              {form.languages.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground/70">Nenhum idioma adicionado</p>
              ) : (
                <div className="space-y-3">
                  {form.languages.map((lang, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <select
                        value={lang.language}
                        onChange={(e) => updateLanguage(i, "language", e.target.value)}
                        className="flex-1 rounded-xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.7)] px-3 py-2 text-sm text-foreground focus:border-[#3AB0FF]/50 focus:outline-none"
                      >
                        {LANGUAGE_OPTIONS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <select
                        value={lang.level}
                        onChange={(e) => updateLanguage(i, "level", e.target.value)}
                        className="flex-1 rounded-xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.7)] px-3 py-2 text-sm text-foreground focus:border-[#3AB0FF]/50 focus:outline-none"
                      >
                        {langLevels.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeLanguage(i)}
                        className="rounded-lg p-2 text-muted-foreground/50 transition-colors hover:text-red-400"
                        aria-label="Remover idioma"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Localização ── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Localização</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Cidade <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Ex: São Paulo"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Estado <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    placeholder="Ex: SP"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  País <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  placeholder="Ex: Brasil"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Telefone (opcional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── Step 5: Hard Skills ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Hard Skills</h2>
                <p className="mt-1 text-sm text-muted-foreground/70">Selecione até 5 habilidades técnicas</p>
              </div>

              {form.hardSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.hardSkills.map((skill) => (
                    <span key={skill} className="chip chip-primary flex items-center gap-1.5">
                      {skill}
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="opacity-70 transition-opacity hover:opacity-100"
                        aria-label={`Remover ${skill}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {form.hardSkills.length < 5 && (
                <>
                  <input
                    type="text"
                    placeholder="Buscar skill…"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className={inputCls}
                  />
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.8)]">
                    {filteredSkills.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground/70">Nenhuma skill encontrada</p>
                    ) : (
                      filteredSkills.map((skill) => {
                        const selected = form.hardSkills.includes(skill.name)
                        return (
                          <button
                            key={skill.id}
                            onClick={() => !selected && toggleSkill(skill.name)}
                            disabled={selected}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                              selected
                                ? "cursor-default text-muted-foreground/50"
                                : "text-foreground/90 hover:bg-[#3AB0FF]/8"
                            }`}
                          >
                            <span>{skill.name}</span>
                            {skill.category && (
                              <span className="text-xs text-muted-foreground/70">{skill.category}</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              <p className="text-xs text-muted-foreground/70">{form.hardSkills.length}/5 selecionadas</p>
            </div>
          )}

          {/* ── Step 6: Pretensões ── */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Pretensões</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Pretensão mínima (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMin}
                    onChange={(e) => setField("salaryMin", e.target.value)}
                    placeholder="Ex: 5000"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pretensão máxima (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.salaryMax}
                    onChange={(e) => setField("salaryMax", e.target.value)}
                    placeholder="Ex: 8000"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Modelo de Trabalho <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.workModel}
                  onChange={(e) => setField("workModel", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecionar…</option>
                  {workModels.map((m) => (
                    <option key={m} value={m}>
                      {WORK_MODEL_LABELS[m] ?? m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>LinkedIn (opcional)</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setField("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/seuperfil"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Error messages */}
          {(stepError || (step === 6 && submitError)) && (
            <p className="mt-3 text-sm text-red-400">{submitError || stepError}</p>
          )}
          {stepError && step < 6 && (
            <p className="mt-3 text-sm text-red-400">{stepError}</p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={submitting}
                className="rounded-xl border border-[#3AB0FF]/15 px-5 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:border-[#3AB0FF]/40 hover:text-foreground disabled:opacity-50"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="rounded-xl bg-[#3AB0FF] px-5 py-2.5 text-sm font-semibold text-[#0B1F3A] transition-all hover:bg-[#5BC2FF] hover:shadow-[0_0_20px_rgba(58,176,255,0.35)]"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="rounded-xl border border-[rgba(56,211,145,0.35)] bg-[rgba(56,211,145,0.12)] px-5 py-2.5 text-sm font-semibold text-[#38d391] transition-all hover:bg-[rgba(56,211,145,0.20)] disabled:opacity-50"
              >
                {submitting ? "Salvando…" : "Finalizar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
