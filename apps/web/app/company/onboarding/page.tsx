"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import {
  getCurrentUser,
  getCultureQuestions,
  submitCultureQuestionnaire,
  getCompanyReferenceData,
  createJob,
  updateCompany,
  type CultureQuestionType,
  type CultureAnswer,
  type CompanyReferenceData,
  type UserData,
} from "@/lib/api"

// ─── constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Tecnologia", "Saúde", "Educação", "Finanças", "Varejo",
  "Indústria", "Consultoria", "Marketing", "Jurídico", "Imobiliário", "Outro",
]

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"]
const WORK_MODELS = ["presencial", "hibrido", "remoto"]

const OCEAN_KEYS = ["o", "c", "e", "a", "n"] as const
type OceanKey = (typeof OCEAN_KEYS)[number]

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

const STEPS = [
  { n: 1, label: "Empresa" },
  { n: 2, label: "Cultura" },
  { n: 3, label: "Vaga" },
  { n: 4, label: "Confirmar" },
]

const INPUT_STYLE = {
  background: "rgba(8,22,46,0.72)",
  border: "1px solid rgba(58,176,255,0.15)",
}

// ─── step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const done = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={
                  done
                    ? { background: "rgba(56,211,145,0.15)", border: "1.5px solid rgba(56,211,145,0.6)", color: "#38d391" }
                    : active
                      ? { background: "rgba(58,176,255,0.20)", border: "1.5px solid rgba(58,176,255,0.8)", color: "#3AB0FF", boxShadow: "0 0 14px rgba(58,176,255,0.30)" }
                      : { background: "rgba(8,22,46,0.5)", border: "1.5px solid rgba(58,176,255,0.12)", color: "rgba(200,213,234,0.35)" }
                }
              >
                {done ? "✓" : s.n}
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.10em]"
                style={
                  active
                    ? { color: "rgba(58,176,255,0.9)" }
                    : done
                      ? { color: "rgba(56,211,145,0.7)" }
                      : { color: "rgba(200,213,234,0.25)" }
                }
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mb-4 h-px w-10 transition-all sm:w-14"
                style={{
                  background: done
                    ? "rgba(56,211,145,0.40)"
                    : "rgba(58,176,255,0.10)",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── field helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  )
}

function StyledInput({
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  type?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  min?: number
  max?: number
}) {
  return (
    <input
      type={type}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
      style={INPUT_STYLE}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
    />
  )
}

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
      style={INPUT_STYLE}
    >
      {children}
    </select>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CompanyOnboardingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState("")
  const [user, setUser] = useState<UserData | null>(null)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)

  // Step 1 – Company data
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [website, setWebsite] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")

  // Step 2 – Culture questionnaire
  const [questions, setQuestions] = useState<CultureQuestionType[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Step 3 – First job
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [refData, setRefData] = useState<CompanyReferenceData | null>(null)
  const [refDataLoading, setRefDataLoading] = useState(false)
  const [selectedHardSkills, setSelectedHardSkills] = useState<string[]>([])
  const [hardSkillSearch, setHardSkillSearch] = useState("")
  const [educationLevelMin, setEducationLevelMin] = useState("")
  const [experienceYearsMin, setExperienceYearsMin] = useState<number | "">("")
  const [workModel, setWorkModel] = useState("")
  const [salaryMin, setSalaryMin] = useState<number | "">("")
  const [salaryMax, setSalaryMax] = useState<number | "">("")
  const [location, setLocation] = useState("")
  const [oceanSliders, setOceanSliders] = useState<Record<OceanKey, number>>({
    o: 50, c: 50, e: 50, a: 50, n: 50,
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // ── auth ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
    if (!t) { setLoading(false); return }
    getCurrentUser(t)
      .then((u) => {
        setUser(u)
        if (!u.company_id) setError("Conta sem empresa vinculada. Contate o suporte.")
      })
      .catch(() => setError("Erro ao carregar dados do usuário"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (step === 2 && questions.length === 0 && !questionsLoading) {
      setQuestionsLoading(true)
      getCultureQuestions()
        .then((qs) => setQuestions(qs.sort((a, b) => a.sort_order - b.sort_order)))
        .catch(() => setError("Erro ao carregar perguntas do questionário"))
        .finally(() => setQuestionsLoading(false))
    }
  }, [step, questions.length, questionsLoading])

  useEffect(() => {
    if (step === 3 && !refData && !refDataLoading) {
      setRefDataLoading(true)
      getCompanyReferenceData(token || undefined)
        .then((data) => setRefData(data))
        .catch(() => {/* silently allow step 3 without refData */})
        .finally(() => setRefDataLoading(false))
    }
  }, [step, refData, refDataLoading, token])

  const companyId = user?.company_id

  function handlePrev() { if (step > 1) setStep(step - 1) }
  function handleNext() { if (step < 4) setStep(step + 1) }

  function toggleHardSkill(id: string) {
    setSelectedHardSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 10 ? [...prev, id] : prev,
    )
  }

  function setOceanSlider(key: OceanKey, value: number) {
    setOceanSliders((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFinish() {
    if (!companyId || !token) return
    setSubmitting(true)
    setSubmitError("")
    try {
      await updateCompany(
        companyId,
        {
          name: name.trim() || undefined,
          industry: industry || undefined,
          size: size || undefined,
          website: website.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
        },
        token,
      )

      if (Object.keys(answers).length > 0) {
        const cultureAnswers: CultureAnswer[] = Object.entries(answers).map(
          ([question_id, score]) => ({ question_id, score }),
        )
        await submitCultureQuestionnaire(companyId, cultureAnswers, token)
      }

      const oceanIdeal = Object.fromEntries(
        OCEAN_KEYS.map((k) => [k, oceanSliders[k] / 100]),
      ) as Record<string, number>

      await createJob(
        {
          company_id: companyId,
          title: jobTitle.trim(),
          description: jobDescription.trim() || null,
          ocean_ideal: oceanIdeal,
          hard_skills_required: selectedHardSkills.length > 0 ? selectedHardSkills : undefined,
          education_level_min: educationLevelMin || null,
          experience_years_min: experienceYearsMin !== "" ? Number(experienceYearsMin) : null,
          work_model: workModel || null,
          salary_min: salaryMin !== "" ? Number(salaryMin) : null,
          salary_max: salaryMax !== "" ? Number(salaryMax) : null,
          location: location.trim() || null,
        },
        token,
      )

      router.push(`/company/${companyId}/dashboard`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao finalizar cadastro")
    } finally {
      setSubmitting(false)
    }
  }

  // ── states ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />
  if (error || !token || !user) return (
    <ErrorState
      title={error ? "Erro ao carregar" : "Autenticação necessária"}
      message={error || "Você precisa estar logado para continuar."}
      onRetry={() => router.push("/login")}
      retryLabel="Fazer login"
    />
  )

  const filteredHardSkills =
    refData?.hard_skills.filter((s) =>
      s.name.toLowerCase().includes(hardSkillSearch.toLowerCase()),
    ) ?? []

  const nextDisabled =
    (step === 1 && !name.trim()) ||
    (step === 2 && Object.keys(answers).length === 0) ||
    (step === 3 && !jobTitle.trim())

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6"
      style={{
        backgroundImage:
          "radial-gradient(900px 500px at 75% -10%, rgba(58,176,255,0.09), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgba(139,92,246,0.08), transparent 65%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-7 text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(58,176,255,0.7)" }}
          >
            WHY ME?
          </p>
          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-foreground">
            Configurar Empresa
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure seu perfil e crie a primeira vaga
          </p>
          <div className="mt-5">
            <StepIndicator current={step} />
          </div>
        </div>

        {/* Main card */}
        <div
          className="rounded-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          style={{
            background: "rgba(16,34,68,0.80)",
            border: "1px solid rgba(58,176,255,0.13)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Card header */}
          <div
            className="px-6 pt-6 pb-5"
            style={{ borderBottom: "1px solid rgba(58,176,255,0.08)" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "rgba(58,176,255,0.7)" }}
            >
              Passo {step} de {STEPS.length}
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-foreground">
              {step === 1 && "Dados da Empresa"}
              {step === 2 && "Questionário de Cultura"}
              {step === 3 && "Criar Primeira Vaga"}
              {step === 4 && "Confirmar Dados"}
            </h2>
            {step === 2 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Responda de 1 (Discordo) a 5 (Concordo) para cada afirmação
              </p>
            )}
            {step === 4 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Revise os dados antes de finalizar o cadastro
              </p>
            )}
          </div>

          {/* Step body */}
          <div className="px-6 py-5">

            {/* ── Step 1: Company Data ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <StyledInput
                    value={name}
                    onChange={setName}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Setor</Label>
                    <StyledSelect value={industry} onChange={setIndustry}>
                      <option value="">Selecione um setor</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </StyledSelect>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Porte</Label>
                    <StyledSelect value={size} onChange={setSize}>
                      <option value="">Selecione</option>
                      {SIZES.map((s) => (
                        <option key={s} value={s}>{s} funcionários</option>
                      ))}
                    </StyledSelect>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Site</Label>
                  <StyledInput
                    value={website}
                    onChange={setWebsite}
                    placeholder="https://meusite.com.br"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>LinkedIn</Label>
                  <StyledInput
                    value={linkedinUrl}
                    onChange={setLinkedinUrl}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Culture Questionnaire ── */}
            {step === 2 && (
              <div className="space-y-4">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full" style={{ border: "3px solid rgba(58,176,255,0.12)", borderTopColor: "#3AB0FF" }} />
                  </div>
                ) : questions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma pergunta disponível.</p>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                    {questions.map((q, idx) => {
                      const answered = answers[q.id]
                      return (
                        <div
                          key={q.id}
                          className="rounded-[14px] p-4 transition-all"
                          style={{
                            background: answered
                              ? "rgba(58,176,255,0.05)"
                              : "rgba(8,22,46,0.50)",
                            border: answered
                              ? "1px solid rgba(58,176,255,0.20)"
                              : "1px solid rgba(58,176,255,0.08)",
                          }}
                        >
                          <p className="text-sm leading-snug text-foreground/90">
                            <span className="mr-1.5 font-bold tabular-nums" style={{ color: "rgba(58,176,255,0.6)" }}>
                              {idx + 1}.
                            </span>
                            {q.question_pt}
                          </p>

                          <div className="mt-3 flex gap-2">
                            {[1, 2, 3, 4, 5].map((score) => {
                              const isSelected = (answers[q.id] ?? 0) === score
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: score }))}
                                  className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-center transition-all"
                                  style={
                                    isSelected
                                      ? { background: "rgba(58,176,255,0.22)", border: "1.5px solid rgba(58,176,255,0.70)", color: "#3AB0FF" }
                                      : { background: "rgba(8,22,46,0.6)", border: "1px solid rgba(58,176,255,0.10)", color: "rgba(200,213,234,0.5)" }
                                  }
                                >
                                  <span className="text-sm font-bold">{score}</span>
                                </button>
                              )
                            })}
                          </div>

                          {/* Label row */}
                          <div className="mt-1.5 flex justify-between px-0.5">
                            <span className="text-[10px] text-muted-foreground/50">Discordo</span>
                            <span className="text-[10px] text-muted-foreground/50">Concordo</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Progress counter */}
                {questions.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "rgba(8,22,46,0.5)", border: "1px solid rgba(58,176,255,0.08)" }}>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(answers).length} de {questions.length} respondidas
                    </span>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                          background: "linear-gradient(90deg,#3AB0FF,#1a8fdb)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: First Job ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Título da Vaga *</Label>
                  <StyledInput value={jobTitle} onChange={setJobTitle} placeholder="ex: Desenvolvedor Full Stack" />
                </div>

                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Descreva a vaga, responsabilidades, benefícios..."
                    rows={3}
                    className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
                    style={INPUT_STYLE}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                  />
                </div>

                {/* Hard Skills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Hard Skills Requeridas</Label>
                    <span className="text-[11px] text-muted-foreground/60">{selectedHardSkills.length}/10</span>
                  </div>

                  {refDataLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="h-4 w-4 animate-spin rounded-full" style={{ border: "2px solid rgba(58,176,255,0.12)", borderTopColor: "#3AB0FF" }} />
                      <span className="text-xs text-muted-foreground">Carregando habilidades...</span>
                    </div>
                  ) : refData ? (
                    <>
                      {selectedHardSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedHardSkills.map((id) => {
                            const skill = refData.hard_skills.find((s) => s.id === id)
                            return skill ? (
                              <span
                                key={id}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                                style={{ background: "rgba(58,176,255,0.12)", border: "1px solid rgba(58,176,255,0.30)", color: "#BFE0FF" }}
                              >
                                {skill.name}
                                <button
                                  type="button"
                                  onClick={() => toggleHardSkill(id)}
                                  className="ml-0.5 opacity-70 hover:opacity-100"
                                >×</button>
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                      <StyledInput value={hardSkillSearch} onChange={setHardSkillSearch} placeholder="Buscar habilidades..." />
                      <div
                        className="max-h-36 overflow-y-auto rounded-xl"
                        style={{ background: "rgba(8,22,46,0.5)", border: "1px solid rgba(58,176,255,0.10)" }}
                      >
                        {filteredHardSkills.length === 0 ? (
                          <p className="p-3 text-xs text-muted-foreground/50">Nenhuma habilidade encontrada.</p>
                        ) : (
                          filteredHardSkills.map((skill) => {
                            const active = selectedHardSkills.includes(skill.id)
                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleHardSkill(skill.id)}
                                disabled={!active && selectedHardSkills.length >= 10}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors disabled:opacity-40"
                                style={active ? { background: "rgba(58,176,255,0.10)", color: "#BFE0FF" } : { color: "rgba(200,213,234,0.7)" }}
                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(58,176,255,0.05)" }}
                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "" }}
                              >
                                <span>{skill.name}</span>
                                <span className="text-muted-foreground/40">{skill.category}</span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">Habilidades não disponíveis. Continue sem selecionar.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Formação Mín.</Label>
                    <StyledSelect value={educationLevelMin} onChange={setEducationLevelMin}>
                      <option value="">Qualquer</option>
                      {refData?.education_levels.map((el) => {
                        const id = typeof el === "string" ? el : el.id
                        const elName = typeof el === "string" ? el : el.name
                        return <option key={id} value={id}>{elName}</option>
                      })}
                    </StyledSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Anos Exp. Mín.</Label>
                    <StyledInput
                      type="number"
                      min={0}
                      max={50}
                      value={experienceYearsMin}
                      onChange={(v) => setExperienceYearsMin(v ? Number(v) : "")}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Modelo de Trabalho</Label>
                  <StyledSelect value={workModel} onChange={setWorkModel}>
                    <option value="">Selecione</option>
                    {WORK_MODELS.map((wm) => (
                      <option key={wm} value={wm}>{wm.charAt(0).toUpperCase() + wm.slice(1)}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Salário Mín.</Label>
                    <StyledInput type="number" min={0} value={salaryMin} onChange={(v) => setSalaryMin(v ? Number(v) : "")} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Salário Máx.</Label>
                    <StyledInput type="number" min={0} value={salaryMax} onChange={(v) => setSalaryMax(v ? Number(v) : "")} placeholder="0" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Localização</Label>
                  <StyledInput value={location} onChange={setLocation} placeholder="ex: São Paulo, SP" />
                </div>

                {/* OCEAN Sliders */}
                <div className="space-y-2">
                  <Label>Perfil OCEAN Ideal</Label>
                  <div
                    className="space-y-3.5 rounded-[14px] px-4 py-3.5"
                    style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                  >
                    {OCEAN_KEYS.map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <span
                          className="w-5 shrink-0 text-center text-[11px] font-black"
                          style={{ color: OCEAN_COLORS[key] }}
                        >
                          {key.toUpperCase()}
                        </span>
                        <span className="w-28 shrink-0 text-xs text-muted-foreground">{OCEAN_LABELS[key]}</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={oceanSliders[key]}
                          onChange={(e) => setOceanSlider(key, Number(e.target.value))}
                          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
                          style={{ accentColor: OCEAN_COLORS[key], background: "rgba(255,255,255,0.08)" }}
                        />
                        <span
                          className="w-9 shrink-0 text-right text-xs font-bold tabular-nums"
                          style={{ color: OCEAN_COLORS[key] }}
                        >
                          {oceanSliders[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Confirmation ── */}
            {step === 4 && (
              <div className="space-y-3">
                {/* Company summary */}
                <div
                  className="rounded-[14px] p-4"
                  style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                >
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                    Empresa
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Nome", value: name },
                      { label: "Setor", value: industry },
                      { label: "Porte", value: size ? `${size} funcionários` : "" },
                      { label: "Site", value: website },
                      { label: "LinkedIn", value: linkedinUrl },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-16">{label}</span>
                        <span className="text-foreground/85 truncate">{value || <span className="text-muted-foreground/40">—</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Culture summary */}
                <div
                  className="rounded-[14px] p-4"
                  style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                    Questionário de Cultura
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[22px] font-bold tabular-nums" style={{ color: Object.keys(answers).length > 0 ? "#38d391" : "#f06b6b" }}>
                      {Object.keys(answers).length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      de {questions.length} pergunta{questions.length !== 1 ? "s" : ""} respondida{Object.keys(answers).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Job summary */}
                <div
                  className="rounded-[14px] p-4"
                  style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                >
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                    Primeira Vaga
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Título", value: jobTitle },
                      { label: "Modelo", value: workModel ? workModel.charAt(0).toUpperCase() + workModel.slice(1) : "" },
                      { label: "Local", value: location },
                      ...(salaryMin !== ""
                        ? [{ label: "Salário", value: `R$ ${Number(salaryMin).toLocaleString("pt-BR")}${salaryMax !== "" ? ` — R$ ${Number(salaryMax).toLocaleString("pt-BR")}` : "+"}` }]
                        : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-16">{label}</span>
                        <span className="text-foreground/85 truncate">{value || <span className="text-muted-foreground/40">—</span>}</span>
                      </div>
                    ))}
                    {refData && selectedHardSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedHardSkills.map((id) => {
                          const skill = refData.hard_skills.find((s) => s.id === id)
                          return skill ? (
                            <span
                              key={id}
                              className="rounded-lg px-2 py-0.5 text-[11px] font-medium"
                              style={{ background: "rgba(58,176,255,0.10)", border: "1px solid rgba(58,176,255,0.20)", color: "#BFE0FF" }}
                            >
                              {skill.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {submitError && (
                  <p
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#f87171" }}
                  >
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div
            className="flex gap-3 px-6 pb-6 pt-5"
            style={{ borderTop: "1px solid rgba(58,176,255,0.08)" }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ border: "1px solid rgba(58,176,255,0.20)", color: "rgba(200,213,234,0.8)", background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(58,176,255,0.06)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                Voltar
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={nextDisabled}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)",
                  color: "#06223e",
                  boxShadow: nextDisabled ? "none" : "0 0 24px rgba(58,176,255,0.25)",
                }}
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: submitting ? "rgba(56,211,145,0.3)" : "linear-gradient(135deg,#38d391,#0F9C6F)",
                  color: "#012b1a",
                  boxShadow: submitting ? "none" : "0 0 24px rgba(56,211,145,0.22)",
                }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full" style={{ border: "2px solid rgba(1,43,26,0.3)", borderTopColor: "#012b1a" }} />
                    Finalizando…
                  </span>
                ) : (
                  "Finalizar Cadastro"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-muted-foreground/40">
          WHY ME? · Plataforma de Recrutamento OCEAN · v1.0
        </p>
      </div>
    </div>
  )
}
