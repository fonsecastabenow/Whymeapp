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

// ─── constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Tecnologia",
  "Saúde",
  "Educação",
  "Finanças",
  "Varejo",
  "Indústria",
  "Consultoria",
  "Marketing",
  "Outro",
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

const INPUT_CLS =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
const SELECT_CLS =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 outline-none transition-colors focus:border-blue-500"

// ─── step dots ─────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i + 1 === current
              ? "bg-blue-500"
              : i + 1 < current
                ? "bg-emerald-500"
                : "bg-zinc-700"
          }`}
        />
      ))}
    </div>
  )
}

// ─── page ──────────────────────────────────────────────────────────────────────

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
    o: 50,
    c: 50,
    e: 50,
    a: 50,
    n: 50,
  })

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // ── auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""
    setToken(t)
    if (!t) {
      setLoading(false)
      return
    }
    getCurrentUser(t)
      .then((u) => {
        setUser(u)
        if (!u.company_id) {
          setError("Conta sem empresa vinculada. Contate o suporte.")
        }
      })
      .catch(() => setError("Erro ao carregar dados do usuário"))
      .finally(() => setLoading(false))
  }, [])

  // ── load step 2 data ─────────────────────────────────────────────────────

  useEffect(() => {
    if (step === 2 && questions.length === 0 && !questionsLoading) {
      setQuestionsLoading(true)
      getCultureQuestions()
        .then((qs) => {
          setQuestions(qs.sort((a, b) => a.sort_order - b.sort_order))
        })
        .catch(() => setError("Erro ao carregar perguntas do questionário"))
        .finally(() => setQuestionsLoading(false))
    }
  }, [step, questions.length, questionsLoading])

  // ── load step 3 data ─────────────────────────────────────────────────────

  useEffect(() => {
    if (step === 3 && !refData && !refDataLoading) {
      setRefDataLoading(true)
      getCompanyReferenceData(token || undefined)
        .then((data) => setRefData(data))
        .catch(() => setError("Erro ao carregar dados de referência"))
        .finally(() => setRefDataLoading(false))
    }
  }, [step, refData, refDataLoading, token])

  // ── handlers ─────────────────────────────────────────────────────────────

  const companyId = user?.company_id

  function handlePrev() {
    if (step > 1) setStep(step - 1)
  }

  function handleNext() {
    if (step < 4) setStep(step + 1)
  }

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
      // 1. Update company
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

      // 2. Submit culture questionnaire
      if (Object.keys(answers).length > 0) {
        const cultureAnswers: CultureAnswer[] = Object.entries(answers).map(
          ([question_id, score]) => ({ question_id, score }),
        )
        await submitCultureQuestionnaire(companyId, cultureAnswers, token)
      }

      // 3. Create first job
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

      // 4. Redirect to dashboard
      router.push(`/company/${companyId}/dashboard`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao finalizar cadastro")
    } finally {
      setSubmitting(false)
    }
  }

  // ── loading / auth states ─────────────────────────────────────────────────

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-zinc-50">Configurar Empresa</h1>
          <p className="mt-1 text-sm text-zinc-500">Passo {step} de 4</p>
          <div className="mt-3">
            <StepDots current={step} total={4} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          {/* Step 1: Company Data */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-50">Dados da Empresa</h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da sua empresa"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Setor</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">Selecione um setor</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Porte</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">Selecione o porte</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} funcionários
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Site</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://meusite.com.br"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">LinkedIn</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className={INPUT_CLS}
                />
              </div>
            </div>
          )}

          {/* Step 2: Culture Questionnaire */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-50">Questionário de Cultura</h2>
              <p className="text-xs text-zinc-500">
                Responda de 1 (Discordo Totalmente) a 5 (Concordo Totalmente) para cada afirmação.
              </p>

              {questionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
                </div>
              ) : questions.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma pergunta disponível.</p>
              ) : (
                <div className="space-y-5">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                      <p className="text-sm text-zinc-50">
                        <span className="text-zinc-500">{idx + 1}.</span> {q.question_pt}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-1">
                        {[1, 2, 3, 4, 5].map((score) => {
                          const labels: Record<number, string> = {
                            1: "Discordo Totalmente",
                            2: "Discordo",
                            3: "Neutro",
                            4: "Concordo",
                            5: "Concordo Totalmente",
                          }
                          const isSelected = (answers[q.id] ?? 0) === score
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: score }))
                              }
                              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] leading-tight transition-colors sm:px-3 ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                              }`}
                            >
                              <span className="text-xs font-bold">{score}</span>
                              <span className="hidden sm:inline">{labels[score]}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Create First Job */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-50">Criar Primeira Vaga</h2>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Título *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="ex: Desenvolvedor Full Stack"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Descrição</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Descreva a vaga, responsabilidades, benefícios..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
                />
              </div>

              {/* Hard Skills */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Hard Skills Requeridas (máx. 10)
                </label>
                {refDataLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
                    <span className="text-xs text-zinc-500">Carregando habilidades...</span>
                  </div>
                ) : refData ? (
                  <>
                    <input
                      type="text"
                      value={hardSkillSearch}
                      onChange={(e) => setHardSkillSearch(e.target.value)}
                      placeholder="Buscar habilidades..."
                      className={INPUT_CLS}
                    />
                    {selectedHardSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHardSkills.map((id) => {
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
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-800/40">
                      {filteredHardSkills.length === 0 ? (
                        <p className="p-3 text-xs text-zinc-500">Nenhuma habilidade encontrada.</p>
                      ) : (
                        filteredHardSkills.map((skill) => {
                          const active = selectedHardSkills.includes(skill.id)
                          return (
                            <button
                              key={skill.id}
                              type="button"
                              onClick={() => toggleHardSkill(skill.id)}
                              disabled={!active && selectedHardSkills.length >= 10}
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
                    className={SELECT_CLS}
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
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Modelo de Trabalho</label>
                <select
                  value={workModel}
                  onChange={(e) => setWorkModel(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">Selecione</option>
                  {WORK_MODELS.map((wm) => (
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
                    className={INPUT_CLS}
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
                    className={INPUT_CLS}
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
                  className={INPUT_CLS}
                />
              </div>

              {/* OCEAN Sliders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">Perfil OCEAN Ideal</label>
                </div>
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-800/40 px-4 py-3">
                  {OCEAN_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-center text-xs font-bold text-zinc-500">
                        {key.toUpperCase()}
                      </span>
                      <span className="w-28 shrink-0 text-xs text-zinc-400">
                        {OCEAN_LABELS[key]}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={oceanSliders[key]}
                        onChange={(e) => setOceanSlider(key, Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-blue-500"
                      />
                      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-blue-400">
                        {oceanSliders[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-50">Confirmar Dados</h2>
              <p className="text-xs text-zinc-500">
                Revise os dados antes de finalizar o cadastro.
              </p>

              <div className="space-y-3">
                {/* Company summary */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Empresa
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-300">
                    <p><span className="text-zinc-500">Nome:</span> {name || "—"}</p>
                    <p><span className="text-zinc-500">Setor:</span> {industry || "—"}</p>
                    <p><span className="text-zinc-500">Porte:</span> {size || "—"}</p>
                    <p><span className="text-zinc-500">Site:</span> {website || "—"}</p>
                    <p><span className="text-zinc-500">LinkedIn:</span> {linkedinUrl || "—"}</p>
                  </div>
                </div>

                {/* Culture summary */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Questionário de Cultura
                  </h3>
                  <p className="text-sm text-zinc-300">
                    {Object.keys(answers).length} pergunta{Object.keys(answers).length !== 1 ? "s" : ""} respondida{Object.keys(answers).length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Job summary */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Primeira Vaga
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-300">
                    <p><span className="text-zinc-500">Título:</span> {jobTitle || "—"}</p>
                    {refData && selectedHardSkills.length > 0 && (
                      <p>
                        <span className="text-zinc-500">Hard Skills:</span>{" "}
                        {selectedHardSkills
                          .map((id) => refData.hard_skills.find((s) => s.id === id)?.name)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <p><span className="text-zinc-500">Modelo:</span> {workModel || "—"}</p>
                    <p><span className="text-zinc-500">Local:</span> {location || "—"}</p>
                    {salaryMin !== "" && (
                      <p>
                        <span className="text-zinc-500">Faixa salarial:</span> R${" "}
                        {Number(salaryMin).toLocaleString("pt-BR")}
                        {salaryMax !== ""
                          ? ` — R$ ${Number(salaryMax).toLocaleString("pt-BR")}`
                          : "+"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex gap-3 border-t border-zinc-800 pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
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
                disabled={
                  (step === 1 && !name.trim()) ||
                  (step === 2 && Object.keys(answers).length === 0) ||
                  (step === 3 && !jobTitle.trim())
                }
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Finalizando…
                  </span>
                ) : (
                  "Finalizar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
