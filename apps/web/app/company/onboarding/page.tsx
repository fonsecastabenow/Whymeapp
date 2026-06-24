"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import {
  getCurrentUser,
  updateCompany,
  startAICultureInterview,
  answerAICultureInterview,
  type UserData,
} from "@/lib/api"
import {
  Building2,
  Globe,
  Linkedin,
  Upload,
  Target,
  Eye,
  Heart,
  BarChart3,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Zap,
  Phone,
  ArrowRight,
} from "lucide-react"

// ─── constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { label: "Tecnologia", icon: "💻" },
  { label: "Saúde", icon: "🏥" },
  { label: "Educação", icon: "📚" },
  { label: "Finanças", icon: "💰" },
  { label: "Varejo", icon: "🛍️" },
  { label: "Indústria", icon: "🏭" },
  { label: "Consultoria", icon: "📊" },
  { label: "Marketing", icon: "📢" },
  { label: "Jurídico", icon: "⚖️" },
  { label: "Imobiliário", icon: "🏠" },
  { label: "Outro", icon: "🔧" },
]

const SIZES = [
  { value: "startup", label: "Startup (1-10)" },
  { value: "pme", label: "PME (11-50)" },
  { value: "media", label: "Média (51-200)" },
  { value: "grande", label: "Grande (201-500)" },
  { value: "enterprise", label: "Enterprise (500+)" },
]

const WORK_MODELS = [
  { value: "presencial", label: "Presencial", icon: "🏢" },
  { value: "hibrido", label: "Híbrido", icon: "🔄" },
  { value: "remoto", label: "Remoto", icon: "🌍" },
]

const CANDIDATE_PROFILES = [
  { value: "jovem", label: "Mais Jovem", desc: "Menos experiência, maior potencial" },
  { value: "equilibrado", label: "Equilibrado", desc: "Mistura de perfis" },
  { value: "experiente", label: "Mais Experiente", desc: "Profissionais sêniores" },
]

const MONTHLY_VACANCY_OPTIONS = [
  { value: "1-3", label: "1 a 3 vagas" },
  { value: "4-10", label: "4 a 10 vagas" },
  { value: "11-30", label: "11 a 30 vagas" },
  { value: "30+", label: "Mais de 30 vagas" },
]

const RH_TEAM_SIZE_OPTIONS = [
  { value: "1", label: "Sou eu mesmo(a)" },
  { value: "2-5", label: "2 a 5 pessoas" },
  { value: "6-15", label: "6 a 15 pessoas" },
  { value: "16+", label: "Mais de 15 pessoas" },
]

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
  { n: 3, label: "Contratação" },
  { n: 4, label: "Time" },
  { n: 5, label: "Confirmar" },
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
                className="mb-4 h-px w-8 transition-all sm:w-12"
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

// ─── progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100)
  return (
    <div className="mt-4 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3AB0FF, #8B5CF6)",
            boxShadow: "0 0 8px rgba(58,176,255,0.30)",
          }}
        />
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 text-right">
        {current} de {total} passos
      </p>
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1 – Company data
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [website, setWebsite] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 2 – AI Culture Interview + Mission/Vision/Values
  const [mission, setMission] = useState("")
  const [vision, setVision] = useState("")
  const [values, setValues] = useState("")

  // AI interview state
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStarted, setAiStarted] = useState(false)
  const [aiDone, setAiDone] = useState(false)
  const [aiCultureVector, setAiCultureVector] = useState<Record<string, number> | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Step 3 – Hiring preferences (NEW)
  const [monthlyVacancies, setMonthlyVacancies] = useState("")
  const [candidateProfile, setCandidateProfile] = useState("")
  const [defaultWorkModel, setDefaultWorkModel] = useState("")

  // Step 4 – Recruitment team (NEW)
  const [rhTeamSize, setRhTeamSize] = useState("")
  const [recruiterName, setRecruiterName] = useState("")
  const [recruiterPhone, setRecruiterPhone] = useState("")

  // Step 5 – Confirmation
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [finished, setFinished] = useState(false)

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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages])

  async function handleStartAIInterview() {
    if (!companyId || !token) return
    setAiLoading(true)
    try {
      const res = await startAICultureInterview(companyId, {
        company_name: name,
        industry: industry || null,
        description: null,
      }, token)
      setAiMessages([{ role: "assistant", content: res.question }])
      setAiStarted(true)
      if (res.done && res.culture_vector) {
        setAiDone(true)
        setAiCultureVector(res.culture_vector)
        setAiSummary(res.summary ?? null)
      }
    } catch {
      setAiMessages([{ role: "assistant", content: "Erro ao iniciar entrevista. Tente novamente." }])
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSendAIAnswer() {
    if (!companyId || !token || !aiInput.trim()) return
    const answer = aiInput.trim()
    setAiInput("")
    setAiMessages((prev) => [...prev, { role: "user", content: answer }])
    setAiLoading(true)
    try {
      const res = await answerAICultureInterview(companyId, answer, token)
      if (res.done) {
        setAiDone(true)
        setAiCultureVector(res.culture_vector ?? null)
        setAiSummary(res.summary ?? null)
        setAiMessages((prev) => [...prev, {
          role: "assistant",
          content: res.summary
            ? `✅ Entrevista concluída!\n\n${res.summary}`
            : "✅ Entrevista concluída!",
        }])
      } else {
        setAiMessages((prev) => [...prev, { role: "assistant", content: res.question }])
      }
    } catch {
      setAiMessages((prev) => [...prev, {
        role: "assistant",
        content: "Erro ao processar resposta. Tente novamente.",
      }])
    } finally {
      setAiLoading(false)
    }
  }

  const companyId = user?.company_id

  function handlePrev() { if (step > 1) setStep(step - 1) }
  function handleNext() { if (step < 5) setStep(step + 1) }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleFinish() {
    if (!companyId || !token) return
    setSubmitting(true)
    setSubmitError("")
    try {
      // Build metadata object with all extra onboarding data
      const metadata: Record<string, unknown> = {}

      if (mission || vision || values) {
        metadata.culture = {}
        if (mission) (metadata.culture as Record<string, unknown>).mission = mission
        if (vision) (metadata.culture as Record<string, unknown>).vision = vision
        if (values) (metadata.culture as Record<string, unknown>).values = values
      }

      if (monthlyVacancies || candidateProfile || defaultWorkModel) {
        metadata.hiring_preferences = {}
        if (monthlyVacancies) (metadata.hiring_preferences as Record<string, unknown>).monthly_vacancies = monthlyVacancies
        if (candidateProfile) (metadata.hiring_preferences as Record<string, unknown>).candidate_profile = candidateProfile
        if (defaultWorkModel) (metadata.hiring_preferences as Record<string, unknown>).default_work_model = defaultWorkModel
      }

      if (rhTeamSize || recruiterName || recruiterPhone) {
        metadata.recruitment_team = {}
        if (rhTeamSize) (metadata.recruitment_team as Record<string, unknown>).team_size = rhTeamSize
        if (recruiterName) (metadata.recruitment_team as Record<string, unknown>).recruiter_name = recruiterName
        if (recruiterPhone) (metadata.recruitment_team as Record<string, unknown>).recruiter_phone = recruiterPhone
      }

      if (logoPreview) {
        metadata.logo = logoPreview
      }

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

      setFinished(true)
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

  const nextDisabled =
    (step === 1 && !name.trim()) ||
    (step === 2 && !aiDone) ||
    (step === 5 && false)

  // ── finished / welcome ──────────────────────────────────────────────────────

  if (finished) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6"
        style={{
          backgroundImage:
            "radial-gradient(900px 500px at 75% -10%, rgba(58,176,255,0.09), transparent 60%), radial-gradient(700px 400px at -5% 110%, rgba(139,92,246,0.08), transparent 65%)",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "rgba(56,211,145,0.12)",
                border: "2px solid rgba(56,211,145,0.4)",
                boxShadow: "0 0 40px rgba(56,211,145,0.15)",
              }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: "#38d391" }} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {name ? `${name} está pronta! 🎉` : "Empresa cadastrada! 🎉"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Seu perfil empresarial está completo. Agora você pode criar vagas, encontrar
            candidatos compatíveis e construir um time alinhado aos valores da sua empresa.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push(`/company/${companyId}/dashboard`)}
              className="w-full rounded-xl px-5 py-3 text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg,#3AB0FF,#1a8fdb)",
                color: "#06223e",
                boxShadow: "0 0 24px rgba(58,176,255,0.25)",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Ir para o Painel <ArrowRight className="h-4 w-4" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/company/${companyId}/jobs`)}
              className="w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all"
              style={{
                border: "1px solid rgba(58,176,255,0.20)",
                color: "rgba(200,213,234,0.8)",
                background: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(58,176,255,0.06)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              Criar Primeira Vaga
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: Sparkles, label: "Match por valores", color: "#8B5CF6" },
              { icon: BarChart3, label: "Perfil OCEAN", color: "#3AB0FF" },
              { icon: Zap, label: "RH inteligente", color: "#F59E0B" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.08)" }}
              >
                <Icon className="mx-auto h-5 w-5" style={{ color }} />
                <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const selectedIndustryEmoji = INDUSTRIES.find((i) => i.label === industry)?.icon ?? ""

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
        <div className="mb-5 text-center">
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
            Configure seu perfil completo em 5 passos
          </p>
          <div className="mt-4">
            <StepIndicator current={step} />
          </div>
          <ProgressBar current={step} total={STEPS.length} />
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
              {step === 2 && "Cultura Organizacional"}
              {step === 3 && "Preferências de Contratação"}
              {step === 4 && "Time de Recrutamento"}
              {step === 5 && "Revisar e Confirmar"}
            </h2>
            {step === 2 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Defina sua cultura e responda ao questionário de valores
              </p>
            )}
            {step === 3 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Conte-nos sobre suas necessidades de contratação
              </p>
            )}
            {step === 4 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Quem cuidará do recrutamento na sua empresa
              </p>
            )}
            {step === 5 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Revise os dados antes de finalizar o cadastro
              </p>
            )}
          </div>

          {/* Step body */}
          <div className="px-6 py-5">

            {/* ── Step 1: Dados da Empresa ── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Logo upload */}
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      background: logoPreview ? "transparent" : "rgba(8,22,46,0.72)",
                      border: logoPreview ? "2px solid rgba(58,176,255,0.30)" : "1.5px dashed rgba(58,176,255,0.20)",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    ) : (
                      <Upload className="h-5 w-5" style={{ color: "rgba(58,176,255,0.5)" }} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground/80">Logo da Empresa</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Clique para fazer upload</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Nome da Empresa <span className="text-red-400">*</span>
                  </Label>
                  <StyledInput
                    value={name}
                    onChange={setName}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Setor / Indústria</Label>
                    <StyledSelect value={industry} onChange={setIndustry}>
                      <option value="">Selecione</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.label} value={ind.label}>
                          {ind.icon} {ind.label}
                        </option>
                      ))}
                    </StyledSelect>
                    {industry && (
                      <p className="text-xs mt-1" style={{ color: "rgba(58,176,255,0.6)" }}>
                        {selectedIndustryEmoji} {industry}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Porte da Empresa</Label>
                    <StyledSelect value={size} onChange={setSize}>
                      <option value="">Selecione</option>
                      {SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </StyledSelect>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    <Globe className="mr-1.5 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                    Site
                  </Label>
                  <StyledInput
                    value={website}
                    onChange={setWebsite}
                    placeholder="https://meusite.com.br"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    <Linkedin className="mr-1.5 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                    LinkedIn
                  </Label>
                  <StyledInput
                    value={linkedinUrl}
                    onChange={setLinkedinUrl}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Cultura Organizacional ── */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Mission, Vision, Values (kept as-is) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4" style={{ color: "rgba(58,176,255,0.6)" }} />
                    <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                      Propósito
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Missão</Label>
                    <textarea
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      placeholder="Qual o propósito da sua empresa?"
                      rows={2}
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
                      style={INPUT_STYLE}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      <Eye className="mr-1 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                      Visão
                    </Label>
                    <textarea
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      placeholder="Onde sua empresa quer chegar?"
                      rows={2}
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
                      style={INPUT_STYLE}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      <Heart className="mr-1 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                      Valores
                    </Label>
                    <textarea
                      value={values}
                      onChange={(e) => setValues(e.target.value)}
                      placeholder="Quais os valores que guiam sua empresa? (ex: Inovação, Transparência, Diversidade)"
                      rows={2}
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40"
                      style={INPUT_STYLE}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.55)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,176,255,0.15)" }}
                    />
                  </div>
                </div>

                {/* Separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(58,176,255,0.08)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Entrevista de Cultura com IA
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(58,176,255,0.08)" }} />
                </div>

                {/* AI Chat Interview */}
                {!aiStarted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Sparkles className="h-10 w-10 mb-3" style={{ color: "rgba(58,176,255,0.4)" }} />
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      A IA vai entrevistar você para entender a cultura da sua empresa e definir o perfil OCEAN ideal.
                    </p>
                    <button
                      onClick={handleStartAIInterview}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #3AB0FF, #2563EB)",
                        color: "#fff",
                      }}
                    >
                      {aiLoading ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      {aiLoading ? "Iniciando..." : "Iniciar Entrevista com IA"}
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-[14px] overflow-hidden"
                    style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                  >
                    {/* Chat messages */}
                    <div className="max-h-[280px] overflow-y-auto space-y-3 p-4">
                      {aiMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "text-white"
                                : "text-foreground/90"
                            }`}
                            style={
                              msg.role === "user"
                                ? { background: "linear-gradient(135deg, #3AB0FF, #2563EB)" }
                                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }
                            }
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div
                            className="rounded-2xl px-4 py-2.5"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            <span className="inline-flex gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input area */}
                    {!aiDone && (
                      <div
                        className="flex items-center gap-2 border-t px-4 py-3"
                        style={{ borderColor: "rgba(58,176,255,0.08)" }}
                      >
                        <input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAIAnswer() } }}
                          placeholder="Digite sua resposta..."
                          disabled={aiLoading}
                          className="flex-1 rounded-xl bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        />
                        <button
                          onClick={handleSendAIAnswer}
                          disabled={!aiInput.trim() || aiLoading}
                          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-30"
                          style={{ background: "rgba(58,176,255,0.15)" }}
                        >
                          <ArrowRight className="h-4 w-4" style={{ color: "#3AB0FF" }} />
                        </button>
                      </div>
                    )}

                    {/* Done badge */}
                    {aiDone && aiCultureVector && (
                      <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "rgba(56,211,145,0.15)" }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" style={{ color: "#38d391" }} />
                          <span className="text-xs font-semibold" style={{ color: "#38d391" }}>
                            Perfil cultural mapeado
                          </span>
                        </div>
                        {aiSummary && (
                          <p className="text-xs text-muted-foreground/70">{aiSummary}</p>
                        )}
                        <div className="flex gap-3 text-[11px]">
                          {Object.entries(aiCultureVector).map(([dim, val]) => (
                            <div key={dim} className="flex items-center gap-1">
                              <span className="font-bold uppercase" style={{ color: "rgba(58,176,255,0.7)" }}>{dim}</span>
                              <span className="text-foreground/80">{Math.round(val * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Preferências de Contratação (NEW) ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" style={{ color: "rgba(58,176,255,0.6)" }} />
                    <Label>Vagas por Mês</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mb-1">
                    Quantas vagas pretende abrir mensalmente?
                  </p>
                  <StyledSelect value={monthlyVacancies} onChange={setMonthlyVacancies}>
                    <option value="">Selecione</option>
                    {MONTHLY_VACANCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "rgba(58,176,255,0.6)" }} />
                    <Label>Perfil de Candidato Preferido</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mb-1">
                    Que tipo de profissional sua empresa mais busca?
                  </p>
                  <div className="grid gap-2">
                    {CANDIDATE_PROFILES.map((profile) => {
                      const active = candidateProfile === profile.value
                      return (
                        <button
                          key={profile.value}
                          type="button"
                          onClick={() => setCandidateProfile(profile.value)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                          style={
                            active
                              ? { background: "rgba(58,176,255,0.12)", border: "1.5px solid rgba(58,176,255,0.50)" }
                              : { background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.08)" }
                          }
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              active ? "border-[#3AB0FF]" : "border-zinc-600"
                            }`}
                          >
                            {active && <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#3AB0FF" }} />}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-foreground/70"}`}>
                              {profile.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">{profile.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" style={{ color: "rgba(58,176,255,0.6)" }} />
                    <Label>Modelo de Trabalho Padrão</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mb-1">
                    Qual o formato de trabalho mais comum na sua empresa?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_MODELS.map((wm) => {
                      const active = defaultWorkModel === wm.value
                      return (
                        <button
                          key={wm.value}
                          type="button"
                          onClick={() => setDefaultWorkModel(wm.value)}
                          className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-center transition-all"
                          style={
                            active
                              ? { background: "rgba(58,176,255,0.12)", border: "1.5px solid rgba(58,176,255,0.50)" }
                              : { background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.08)" }
                          }
                        >
                          <span className="text-lg">{wm.icon}</span>
                          <span className={`text-xs font-semibold ${active ? "text-foreground" : "text-foreground/60"}`}>
                            {wm.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Time de Recrutamento (NEW) ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: "rgba(58,176,255,0.6)" }} />
                    <Label>Tamanho do Time de RH</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mb-1">
                    Quantas pessoas atuam na área de recrutamento?
                  </p>
                  <StyledSelect value={rhTeamSize} onChange={setRhTeamSize}>
                    <option value="">Selecione</option>
                    {RH_TEAM_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    <Users className="mr-1.5 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                    Nome do Recrutador Principal
                  </Label>
                  <StyledInput
                    value={recruiterName}
                    onChange={setRecruiterName}
                    placeholder="Nome do responsável por recrutamento"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    <Phone className="mr-1.5 inline-block h-3 w-3" style={{ color: "rgba(58,176,255,0.5)" }} />
                    Telefone de Contato
                  </Label>
                  <StyledInput
                    value={recruiterPhone}
                    onChange={setRecruiterPhone}
                    placeholder="(11) 99999-8888"
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Para entrarmos em contato sobre candidatos compatíveis
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 5: Revisar e Confirmar ── */}
            {step === 5 && (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {/* Company summary */}
                <div
                  className="rounded-[14px] p-4"
                  style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4" style={{ color: "rgba(58,176,255,0.7)" }} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                      Empresa
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Nome", value: name },
                      { label: "Setor", value: industry ? `${selectedIndustryEmoji} ${industry}` : "" },
                      { label: "Porte", value: size ? SIZES.find((s) => s.value === size)?.label ?? size : "" },
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
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4" style={{ color: "rgba(58,176,255,0.7)" }} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                      Cultura
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[22px] font-bold tabular-nums" style={{ color: aiDone ? "#38d391" : "#f06b6b" }}>
                      {aiDone ? "✓" : "✗"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {aiDone ? "Entrevista concluída" : "Não realizada"}
                    </span>
                  </div>
                  {aiSummary && (
                    <p className="text-xs text-muted-foreground/70 mb-3 italic">{aiSummary}</p>
                  )}
                  {aiCultureVector && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {Object.entries(aiCultureVector).map(([dim, val]) => (
                        <div key={dim} className="flex items-center gap-1">
                          <span className="font-bold uppercase" style={{ color: "rgba(58,176,255,0.7)" }}>{dim}</span>
                          <span className="text-foreground/80">{Math.round(val * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5 mt-3">
                    {mission && (
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-16">Missão</span>
                        <span className="text-foreground/70 text-xs truncate">{mission}</span>
                      </div>
                    )}
                    {vision && (
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-16">Visão</span>
                        <span className="text-foreground/70 text-xs truncate">{vision}</span>
                      </div>
                    )}
                    {values && (
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-16">Valores</span>
                        <span className="text-foreground/70 text-xs truncate">{values}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hiring preferences summary */}
                {(monthlyVacancies || candidateProfile || defaultWorkModel) && (
                  <div
                    className="rounded-[14px] p-4"
                    style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4" style={{ color: "rgba(58,176,255,0.7)" }} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                        Contratação
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {monthlyVacancies && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Vagas/mês</span>
                          <span className="text-foreground/85">{MONTHLY_VACANCY_OPTIONS.find((o) => o.value === monthlyVacancies)?.label ?? monthlyVacancies}</span>
                        </div>
                      )}
                      {candidateProfile && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Perfil</span>
                          <span className="text-foreground/85">{CANDIDATE_PROFILES.find((p) => p.value === candidateProfile)?.label ?? candidateProfile}</span>
                        </div>
                      )}
                      {defaultWorkModel && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Modelo</span>
                          <span className="text-foreground/85">{WORK_MODELS.find((w) => w.value === defaultWorkModel)?.label ?? defaultWorkModel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recruitment team summary */}
                {(rhTeamSize || recruiterName || recruiterPhone) && (
                  <div
                    className="rounded-[14px] p-4"
                    style={{ background: "rgba(8,22,46,0.50)", border: "1px solid rgba(58,176,255,0.10)" }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" style={{ color: "rgba(58,176,255,0.7)" }} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(58,176,255,0.7)" }}>
                        Time de RH
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {rhTeamSize && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Tamanho</span>
                          <span className="text-foreground/85">{RH_TEAM_SIZE_OPTIONS.find((o) => o.value === rhTeamSize)?.label ?? rhTeamSize}</span>
                        </div>
                      )}
                      {recruiterName && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Recrutador</span>
                          <span className="text-foreground/85">{recruiterName}</span>
                        </div>
                      )}
                      {recruiterPhone && (
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-24">Telefone</span>
                          <span className="text-foreground/85">{recruiterPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

            {step < 5 ? (
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
