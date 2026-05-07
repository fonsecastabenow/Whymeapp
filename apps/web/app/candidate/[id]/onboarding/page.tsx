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
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
const labelCls = "block text-sm font-medium text-zinc-400 mb-1.5"

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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-4xl">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Onboarding completo!</h1>
          <p className="text-zinc-400">
            Seus dados foram salvos. Agora vamos descobrir seu perfil profissional com a entrevista OCEAN.
          </p>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="mb-2 text-sm font-medium text-zinc-300">Entrevista OCEAN via Telegram</p>
            <p className="mb-4 text-xs text-zinc-500">
              Responda 8 perguntas de forma natural. Um agente vai interpretar suas respostas e criar seu perfil.
            </p>
            {telegramLink ? (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                💬 Iniciar Entrevista no Telegram
              </a>
            ) : (
              <p className="text-xs text-zinc-600">Link indisponível no momento</p>
            )}
          </div>

          <button
            onClick={() => router.push(`/candidate/${candidateId}/dashboard`)}
            className="text-sm text-zinc-500 underline transition-colors hover:text-zinc-300"
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-lg">
        {/* Page header */}
        <div className="mb-8 text-center">
          <a href="/" className="text-2xl font-bold tracking-tight text-zinc-50">
            Whyme
          </a>
          <p className="mt-2 text-sm text-zinc-500">Configure seu perfil para começar</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-zinc-900 p-6 md:p-8">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-400">
              Passo {step} de {TOTAL_STEPS}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-7 rounded-full transition-colors ${
                    i + 1 <= step ? "bg-blue-500" : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ── Step 1: Formação ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-50">Formação Acadêmica</h2>
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
              <h2 className="text-xl font-bold text-zinc-50">Experiência Profissional</h2>
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
                <h2 className="text-xl font-bold text-zinc-50">Idiomas</h2>
                <button
                  onClick={addLanguage}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                >
                  + Adicionar idioma
                </button>
              </div>
              {form.languages.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">Nenhum idioma adicionado</p>
              ) : (
                <div className="space-y-3">
                  {form.languages.map((lang, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <select
                        value={lang.language}
                        onChange={(e) => updateLanguage(i, "language", e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
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
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                      >
                        {langLevels.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeLanguage(i)}
                        className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-red-400"
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
              <h2 className="text-xl font-bold text-zinc-50">Localização</h2>
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
                <h2 className="text-xl font-bold text-zinc-50">Hard Skills</h2>
                <p className="mt-1 text-sm text-zinc-500">Selecione até 5 habilidades técnicas</p>
              </div>

              {form.hardSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.hardSkills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300"
                    >
                      {skill}
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="text-blue-400 transition-colors hover:text-blue-200"
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
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-800">
                    {filteredSkills.length === 0 ? (
                      <p className="p-4 text-center text-sm text-zinc-500">Nenhuma skill encontrada</p>
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
                                ? "cursor-default text-zinc-600"
                                : "text-zinc-200 hover:bg-zinc-700"
                            }`}
                          >
                            <span>{skill.name}</span>
                            {skill.category && (
                              <span className="text-xs text-zinc-500">{skill.category}</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              <p className="text-xs text-zinc-500">{form.hardSkills.length}/5 selecionadas</p>
            </div>
          )}

          {/* ── Step 6: Pretensões ── */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-50">Pretensões</h2>
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
                className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
