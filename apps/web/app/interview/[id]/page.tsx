"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import OrbitaChart from "@/app/components/orbita-chart"
import { validateToken, getCandidateInterview, convertCandidate, getAccommodations } from "@/lib/api"
import type { OCEANScores, InterviewData, AccommodationsData } from "@/lib/api"
import { DIMENSION_LABELS, DIMENSIONS } from "@whyme/shared"
import { cn } from "@/lib/utils"

const DIMENSION_COLORS: Record<string, string> = {
  openness: "#8B5CF6",
  conscientiousness: "#3B82F6",
  extraversion: "#F59E0B",
  agreeableness: "#10B981",
  neuroticism: "#EF4444",
}

const DIMENSION_DESCRIPTIONS: Record<string, { high: string; low: string }> = {
  openness: {
    high: "Voce e criativo, curioso e aberto a novas experiencias.",
    low: "Voce prefere rotinas e abordagens praticas e concretas.",
  },
  conscientiousness: {
    high: "Voce e organizado, disciplinado e muito confiavel.",
    low: "Voce e flexivel, espontaneo e adapta bem a mudancas.",
  },
  extraversion: {
    high: "Voce e sociável, energetico e se sente bem em grupo.",
    low: "Voce e reservado e prefere ambientes mais tranquilos.",
  },
  agreeableness: {
    high: "Voce e cooperativo, empatico e facil de trabalhar.",
    low: "Voce e direto, analitico e orientado a resultados.",
  },
  neuroticism: {
    high: "Voce sente as emocoes com intensidade e sensibilidade.",
    low: "Voce e emocionalmente estavel e resiliente sob pressao.",
  },
}

const DIMENSION_DESCRIPTIONS_SIMPLE: Record<string, { high: string; low: string }> = {
  openness: {
    high: "Voce gosta de novidades e de criar coisas novas.",
    low: "Voce prefere fazer as coisas do jeito que ja conhece.",
  },
  conscientiousness: {
    high: "Voce e organizado e faz tudo no prazo.",
    low: "Voce e flexivel e se adapta facil as mudancas.",
  },
  extraversion: {
    high: "Voce gosta de estar com outras pessoas.",
    low: "Voce prefere ambientes calmos e com poucas pessoas.",
  },
  agreeableness: {
    high: "Voce se importa com os outros e gosta de ajudar.",
    low: "Voce e direto e foca em resultados.",
  },
  neuroticism: {
    high: "Voce sente as emocoes de forma intensa.",
    low: "Voce e calmo e lida bem com situacoes dificeis.",
  },
}

type PageState = "loading" | "invalid" | "ready" | "submitting" | "error" | "success"

export default function InterviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const candidateId = params.id as string
  const token = searchParams.get("token") ?? ""

  const [pageState, setPageState] = useState<PageState>("loading")
  const [interview, setInterview] = useState<InterviewData | null>(null)
  const [submitError, setSubmitError] = useState("")
  const [accommodations, setAccommodations] = useState<AccommodationsData | null>(null)

  const [name, setName] = useState("Anonymous")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formErrors, setFormErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({})
  const [ttsPlaying, setTtsPlaying] = useState<string | null>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!token) {
      setPageState("invalid")
      return
    }

    let cancelled = false

    async function init() {
      try {
        await validateToken(token)
        if (cancelled) return

        try {
          const data = await getCandidateInterview(candidateId)
          if (!cancelled) {
            setInterview(data)
            // Check if accommodations are already in the interview response
            if (data.accommodations) {
              setAccommodations(data.accommodations as unknown as AccommodationsData)
            }
          }
        } catch {
          // No interview yet — that's fine, show form without scores
        }

        // Also fetch accommodations directly
        try {
          const accData = await getAccommodations(candidateId)
          if (!cancelled && accData.accommodations) {
            setAccommodations(accData.accommodations)
          }
        } catch {
          // Accommodations not available, that's fine
        }

        if (!cancelled) setPageState("ready")
      } catch {
        if (!cancelled) setPageState("invalid")
      }
    }

    init()
    return () => {
      cancelled = true
      if (speechSynthRef.current) {
        window.speechSynthesis.cancel()
      }
    }
  }, [token, candidateId])

  // Accessibility CSS class composition
  const pageClasses = cn(
    "min-h-screen bg-background",
    accommodations?.high_contrast && "high-contrast-mode",
    accommodations?.large_text && "large-text-mode",
    accommodations?.reduced_animations && "reduced-animations-mode",
  )

  const buttonClasses = cn(
    "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
    accommodations?.motor && "min-h-14 py-3.5 px-6 text-base",
  )

  const inputClasses = (hasError: boolean) =>
    cn(
      "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      hasError ? "border-destructive" : "border-input",
      accommodations?.large_text && "py-3 text-base",
      accommodations?.motor && "min-h-12 py-3 px-4",
    )

  const containerClasses = cn(
    "mx-auto max-w-4xl px-4 py-12",
    accommodations?.large_text && "max-w-5xl",
  )

  function validateForm(): boolean {
    const errors: typeof formErrors = {}
    if (!name.trim()) errors.name = "Nome e obrigatorio"
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Email invalido"
    if (password.length < 6) errors.password = "Senha deve ter pelo menos 6 caracteres"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
    setPageState("submitting")
    setSubmitError("")
    try {
      await convertCandidate({ candidate_id: candidateId, token, email, password, name })
      setPageState("success")
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao criar conta")
      setPageState("error")
    }
  }

  function handleTTS(text: string, label: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    if (ttsPlaying === label) {
      window.speechSynthesis.cancel()
      setTtsPlaying(null)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "pt-BR"
    utterance.rate = 0.9
    utterance.onend = () => setTtsPlaying(null)
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setTtsPlaying(label)
  }

  if (pageState === "loading") return <LoadingState accommodations={accommodations} />
  if (pageState === "invalid") return <InvalidState accommodations={accommodations} />
  if (pageState === "success") return <SuccessState accommodations={accommodations} />

  const oceanScores = interview?.ocean_scores ?? null
  const descriptions = accommodations?.cognitive ? DIMENSION_DESCRIPTIONS_SIMPLE : DIMENSION_DESCRIPTIONS

  return (
    <main className={pageClasses}>
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className={cn("text-xl font-bold tracking-tight", accommodations?.large_text && "text-2xl")}>
            Whyme
          </span>
          <Link
            href={`/accessibility?candidate_id=${encodeURIComponent(candidateId)}&token=${encodeURIComponent(token)}`}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
              accommodations?.motor && "min-h-10 px-4 py-2",
            )}
          >
            <span aria-hidden="true">♿</span>
            Acessibilidade
          </Link>
        </div>
      </header>

      <div className={containerClasses}>
        <div className="mb-10 text-center">
          <h1 className={cn(
            "font-bold tracking-tight",
            accommodations?.large_text ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
          )}>
            {accommodations?.cognitive ? "Seu jeito de ser" : "Seu Perfil OCEAN"}
          </h1>
          <p className={cn(
            "mt-3",
            accommodations?.large_text ? "text-lg" : "text-base",
            "text-muted-foreground",
          )}>
            {accommodations?.cognitive
              ? "Crie sua conta para guardar seu perfil e encontrar vagas."
              : "Crie sua conta para salvar seu perfil e encontrar as melhores oportunidades."}
          </p>

          {/* Auditory support for page description */}
          {accommodations?.auditory && (
            <button
              onClick={() => handleTTS(
                accommodations?.cognitive
                  ? "Crie sua conta para guardar seu perfil e encontrar vagas."
                  : "Crie sua conta para salvar seu perfil e encontrar as melhores oportunidades.",
                "page-desc",
              )}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Ouvir descricao"
            >
              {ttsPlaying === "page-desc" ? "⏹ Parar" : "♪ Ouvir"}
            </button>
          )}
        </div>

        <div className={cn("grid gap-10", accommodations?.large_text ? "lg:grid-cols-1" : "lg:grid-cols-2")}>
          {/* OCEAN results */}
          <div className={cn(accommodations?.large_text && "order-last")}>
            {oceanScores ? (
              <OCEANResults
                scores={oceanScores}
                accommodations={accommodations}
                descriptions={descriptions}
                ttsPlaying={ttsPlaying}
                onTTS={handleTTS}
              />
            ) : (
              <NoScoresPlaceholder accommodations={accommodations} ttsPlaying={ttsPlaying} onTTS={handleTTS} />
            )}
          </div>

          {/* Signup form */}
          <div className={cn(
            "rounded-xl border bg-card p-6 shadow-sm",
            accommodations?.large_text && "p-8",
          )}>
            <h2 className={cn(
              "mb-6 font-semibold",
              accommodations?.large_text ? "text-2xl" : "text-xl",
            )}>
              {accommodations?.cognitive ? "Criar conta" : "Criar conta"}
            </h2>

            {(pageState === "error") && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field
                label="Nome"
                value={name}
                onChange={setName}
                error={formErrors.name}
                placeholder={accommodations?.cognitive ? "Seu nome" : "Seu nome completo"}
                inputClass={inputClasses}
                accommodations={accommodations}
                ttsPlaying={ttsPlaying}
                onTTS={handleTTS}
              />
              <Field
                type="email"
                label="Email"
                value={email}
                onChange={setEmail}
                error={formErrors.email}
                placeholder="voce@exemplo.com"
                inputClass={inputClasses}
                accommodations={accommodations}
                ttsPlaying={ttsPlaying}
                onTTS={handleTTS}
              />
              <Field
                type="password"
                label={accommodations?.cognitive ? "Senha" : "Senha"}
                value={password}
                onChange={setPassword}
                error={formErrors.password}
                placeholder={accommodations?.cognitive ? "Minimo 6" : "Minimo 6 caracteres"}
                inputClass={inputClasses}
                accommodations={accommodations}
                ttsPlaying={ttsPlaying}
                onTTS={handleTTS}
              />
              <button
                type="submit"
                disabled={pageState === "submitting"}
                className={buttonClasses}
              >
                {pageState === "submitting" ? "Criando conta..." : accommodations?.cognitive ? "Criar conta" : "Criar conta gratuita"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

function OCEANResults({
  scores,
  accommodations,
  descriptions,
  ttsPlaying,
  onTTS,
}: {
  scores: OCEANScores
  accommodations: AccommodationsData | null
  descriptions: Record<string, { high: string; low: string }>
  ttsPlaying: string | null
  onTTS: (text: string, label: string) => void
}) {
  return (
    <>
      <div className="flex justify-center">
        <OrbitaChart scores={scores} size={accommodations?.large_text ? 360 : 300} />
      </div>
      <div className="space-y-5">
        {DIMENSIONS.map((dim) => {
          const pct = Math.round(scores[dim] * 100)
          const desc = scores[dim] >= 0.5
            ? descriptions[dim].high
            : descriptions[dim].low
          return (
            <div key={dim} className="space-y-1.5">
              <div className={cn(
                "flex items-center justify-between",
                accommodations?.large_text ? "text-base" : "text-sm",
              )}>
                <span className="font-medium">{DIMENSION_LABELS[dim]}</span>
                <span className={cn(
                  "tabular-nums text-muted-foreground",
                  accommodations?.large_text && "text-base",
                )}>{pct}%</span>
              </div>
              <div className={cn(
                "w-full overflow-hidden rounded-full bg-muted",
                accommodations?.reduced_animations ? "h-3" : "h-2",
              )}>
                <div
                  className={cn(
                    "h-full rounded-full",
                    accommodations?.reduced_animations ? "" : "transition-all duration-700",
                  )}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: DIMENSION_COLORS[dim],
                  }}
                />
              </div>
              <p className={cn(
                "text-muted-foreground",
                accommodations?.large_text ? "text-sm" : "text-xs",
              )}>
                {desc}
                {accommodations?.auditory && (
                  <button
                    onClick={() => onTTS(desc, `dim-${dim}`)}
                    className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent transition-colors"
                    aria-label={`Ouvir descricao de ${DIMENSION_LABELS[dim]}`}
                  >
                    {ttsPlaying === `dim-${dim}` ? "⏹" : "♪"}
                  </button>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  inputClass,
  accommodations,
  ttsPlaying,
  onTTS,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  inputClass: (hasError: boolean) => string
  accommodations: AccommodationsData | null
  ttsPlaying: string | null
  onTTS: (text: string, label: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className={cn(
          "font-medium",
          accommodations?.large_text ? "text-base" : "text-sm",
        )}>{label}</label>
        {accommodations?.auditory && (
          <button
            onClick={() => onTTS(label, `field-${label}`)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent transition-colors"
            aria-label={`Ouvir: ${label}`}
          >
            {ttsPlaying === `field-${label}` ? "⏹" : "♪"}
          </button>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass(!!error)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function LoadingState({ accommodations }: { accommodations: AccommodationsData | null }) {
  return (
    <main className={cn(
      "flex min-h-screen items-center justify-center",
      accommodations?.high_contrast && "high-contrast-mode",
      accommodations?.large_text && "large-text-mode",
    )}>
      <div className="space-y-4 text-center">
        <div className={cn(
          "mx-auto rounded-full border-4 border-muted border-t-primary",
          accommodations?.reduced_animations ? "h-12 w-12" : "mx-auto h-12 w-12 animate-spin",
        )} />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </main>
  )
}

function InvalidState({ accommodations }: { accommodations: AccommodationsData | null }) {
  return (
    <main className={cn(
      "flex min-h-screen items-center justify-center p-4",
      accommodations?.high_contrast && "high-contrast-mode",
      accommodations?.large_text && "large-text-mode",
    )}>
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-2xl">
          {accommodations?.large_text ? "!" : "⚠"}
        </div>
        <h1 className={cn("font-semibold", accommodations?.large_text ? "text-2xl" : "text-xl")}>
          {accommodations?.cognitive ? "Link invalido" : "Link expirado ou invalido"}
        </h1>
        <p className="text-muted-foreground">
          {accommodations?.cognitive
            ? "Este link nao funciona mais. Peca um novo link para continuar."
            : "Este link de entrevista nao e valido ou ja expirou. Solicite um novo link para continuar."}
        </p>
      </div>
    </main>
  )
}

function SuccessState({ accommodations }: { accommodations: AccommodationsData | null }) {
  return (
    <main className={cn(
      "flex min-h-screen items-center justify-center p-4",
      accommodations?.high_contrast && "high-contrast-mode",
      accommodations?.large_text && "large-text-mode",
    )}>
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-2xl">
          ✓
        </div>
        <h1 className={cn(
          "font-semibold",
          accommodations?.large_text ? "text-2xl" : "text-xl",
        )}>
          {accommodations?.cognitive ? "Conta criada!" : "Conta criada com sucesso!"}
        </h1>
        <p className="text-muted-foreground">
          {accommodations?.cognitive
            ? "Seu perfil foi salvo. Entre para ver tudo."
            : "Seu perfil foi salvo. Faca login para acessar seu painel completo."}
        </p>
        <a
          href="/login"
          className={cn(
            "inline-flex w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90",
            accommodations?.motor ? "min-h-14 py-3.5 px-6 text-base" : "px-4 py-2.5",
          )}
        >
          {accommodations?.cognitive ? "Entrar" : "Fazer login"}
        </a>
      </div>
    </main>
  )
}

function NoScoresPlaceholder({
  accommodations,
  ttsPlaying,
  onTTS,
}: {
  accommodations: AccommodationsData | null
  ttsPlaying: string | null
  onTTS: (text: string, label: string) => void
}) {
  const placeholderText = accommodations?.cognitive
    ? "Complete a entrevista para ver seu perfil."
    : "Complete a entrevista para visualizar seu perfil de personalidade."

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center",
      accommodations?.large_text && "p-16",
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl opacity-40">
        ◎
      </div>
      <div>
        <p className="font-medium">
          {accommodations?.cognitive ? "Perfil ainda nao disponivel" : "Perfil OCEAN ainda nao disponivel"}
        </p>
        <p className={cn(
          "mt-1 text-muted-foreground",
          accommodations?.large_text ? "text-sm" : "text-sm",
        )}>
          {placeholderText}
          {accommodations?.auditory && (
            <button
              onClick={() => onTTS(placeholderText, "placeholder")}
              className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-accent transition-colors"
              aria-label="Ouvir mensagem"
            >
              {ttsPlaying === "placeholder" ? "⏹" : "♪"}
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
