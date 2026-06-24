"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getInterviewById, updateInterviewStatus, submitQuestionnaire } from "@/lib/api"
import type { OCEANScores, InterviewData } from "@/lib/api"
import { DIMENSION_LABELS } from "@whyme/shared"
import { cn } from "@/lib/utils"

// ─── Questions (hardcoded, in Portuguese) ────────────────────────────────

const DIMENSION_QUESTIONS: Record<string, { id: number; text: string }[]> = {
  openness: [
    { id: 1, text: "Tem uma imaginação ativa e gosta de pensar em novas possibilidades" },
    { id: 2, text: "Tem interesse em aprender coisas novas, mesmo fora da sua área" },
    { id: 3, text: "Prefere tarefas previsíveis e rotineiras" },
    { id: 4, text: "Gosta de explorar diferentes jeitos de resolver um problema" },
    { id: 5, text: "Tem curiosidade intelectual e busca entender o porquê das coisas" },
    { id: 6, text: "Sente-se desconfortável com mudanças repentinas no trabalho" },
  ],
  conscientiousness: [
    { id: 7, text: "Cumpre prazos e compromissos com consistência" },
    { id: 8, text: "Organiza seu trabalho de forma estruturada e planejada" },
    { id: 9, text: "Tende a procrastinar tarefas importantes" },
    { id: 10, text: "Prefere ter objetivos claros e métricas para acompanhar seu progresso" },
    { id: 11, text: "Revisa seu próprio trabalho antes de entregar" },
    { id: 12, text: "Age de forma impulsiva sem pensar nas consequências" },
  ],
  extraversion: [
    { id: 13, text: "Sente-se energizado ao interagir com outras pessoas" },
    { id: 14, text: "Prefere trabalhar em silêncio e sozinho" },
    { id: 15, text: "Toma a iniciativa em conversas e reuniões" },
    { id: 16, text: "Sente-se desconfortável em eventos sociais com muitas pessoas" },
    { id: 17, text: "Gosta de ser o centro das atenções em apresentações" },
    { id: 18, text: "Prefere se comunicar por escrito do que pessoalmente" },
  ],
  agreeableness: [
    { id: 19, text: "Se preocupa genuinamente com o bem-estar dos colegas" },
    { id: 20, text: "Coloca suas próprias necessidades acima das do time" },
    { id: 21, text: "Busca consenso e harmonia em situações de conflito" },
    { id: 22, text: "É direto e objetivo, mesmo que isso soe rude" },
    { id: 23, text: "Oferece ajuda sem esperar nada em troca" },
    { id: 24, text: "Tem dificuldade em dizer não para novas demandas" },
  ],
  neuroticism: [
    { id: 25, text: "Mantém a calma sob pressão e prazos apertados" },
    { id: 26, text: "Costuma se preocupar excessivamente com erros pequenos" },
    { id: 27, text: "Lida bem com críticas e feedbacks construtivos" },
    { id: 28, text: "Sente-se ansioso antes de reuniões importantes" },
    { id: 29, text: "Deixa problemas do trabalho afetarem seu humor fora do expediente" },
    { id: 30, text: "Confia na sua capacidade de resolver problemas inesperados" },
  ],
}

const DIMENSIONS_LIST = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const

const LIKERT_LABELS = [
  { value: 1, label: "Discordo Totalmente", short: "DT" },
  { value: 2, label: "Discordo", short: "D" },
  { value: 3, label: "Neutro", short: "N" },
  { value: 4, label: "Concordo", short: "C" },
  { value: 5, label: "Concordo Totalmente", short: "CT" },
]

const DIMENSION_COLORS: Record<string, string> = {
  openness: "#8B5CF6",
  conscientiousness: "#3B82F6",
  extraversion: "#F59E0B",
  agreeableness: "#10B981",
  neuroticism: "#EF4444",
}

const DIMENSION_BG: Record<string, string> = {
  openness: "bg-purple-950/20 border-purple-900/30",
  conscientiousness: "bg-[rgba(58,176,255,0.05)] border-[#3AB0FF]/15",
  extraversion: "bg-amber-950/20 border-amber-900/30",
  agreeableness: "bg-emerald-950/20 border-emerald-900/30",
  neuroticism: "bg-red-950/20 border-red-900/30",
}

const DIMENSION_ACCENT: Record<string, string> = {
  openness: "text-purple-400",
  conscientiousness: "text-[#3AB0FF]",
  extraversion: "text-amber-400",
  agreeableness: "text-emerald-400",
  neuroticism: "text-red-400",
}

type PageState = "loading" | "ready" | "submitting" | "submitted" | "error"

export default function QuestionnairePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const interviewId = params.id as string
  const token = searchParams.get("token") ?? ""

  const [interview, setInterview] = useState<InterviewData | null>(null)
  const [pageState, setPageState] = useState<PageState>("loading")
  const [error, setError] = useState("")
  const [responses, setResponses] = useState<(number | null)[]>(Array(30).fill(null))
  const [scores, setScores] = useState<OCEANScores | null>(null)

  // Load interview data
  useEffect(() => {
    let cancelled = false

    async function init() {
      setError("")
      try {
        const data = await getInterviewById(interviewId)
        if (cancelled) return
        setInterview(data)

        // If status is "invited", auto-transition to "started"
        if (data.status === "invited") {
          try {
            await updateInterviewStatus(interviewId, "started")
            setInterview((prev) => (prev ? { ...prev, status: "started" } : prev))
          } catch {
            // Non-critical, continue anyway
          }
        }

        setPageState("ready")
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar entrevista")
          setPageState("error")
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [interviewId])

  const answeredCount = responses.filter((r) => r !== null).length
  const allAnswered = answeredCount === 30

  const setResponse = useCallback((questionIndex: number, value: number) => {
    setResponses((prev) => {
      const next = [...prev]
      next[questionIndex] = value
      return next
    })
  }, [])

  async function handleSubmit() {
    if (!allAnswered) return
    setPageState("submitting")
    setError("")

    try {
      const result = await submitQuestionnaire(interviewId, responses as number[])
      setScores(result.ocean_scores)
      setPageState("submitted")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar questionário")
      setPageState("error")
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#3AB0FF]/15 border-t-amber-500" />
          <p className="text-muted-foreground">Carregando questionário...</p>
        </div>
      </main>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────
  if (pageState === "error" && !scores) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-2xl">
            !
          </div>
          <h1 className="text-xl font-semibold text-foreground">Erro</h1>
          <p className="text-muted-foreground">{error || "Não foi possível carregar o questionário."}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    )
  }

  // ─── Results (after submission) ──────────────────────────────────────
  if (pageState === "submitted" && scores) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-[#3AB0FF]/10 px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <span className="text-lg font-black tracking-widest text-amber-500 uppercase">WHY ME?</span>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
              ✓
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Questionário concluído!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Seu perfil OCEAN foi calculado. Veja os resultados abaixo.
            </p>
          </div>

          <div className="mb-10 space-y-5">
            {DIMENSIONS_LIST.map((dim) => {
              const pct = Math.round(scores[dim])
              const color = DIMENSION_COLORS[dim]
              return (
                <div key={dim} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground/90">{DIMENSION_LABELS[dim]}</span>
                    <span className="tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[rgba(11,31,58,0.7)]">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(11,31,58,0.9)] p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Próximo passo
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Crie sua conta gratuita para salvar seu perfil e encontrar as
              melhores oportunidades para você.
            </p>
            <Link
              href={
                token
                  ? `/interview/${interview?.candidate_id ?? interviewId}?token=${encodeURIComponent(token)}`
                  : "/register"
              }
              className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-500 transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ─── Ready — Show Questionnaire ───────────────────────────────────────
  const textSm = "text-sm"
  const textXs = "text-xs"
  const textBase = "text-base"

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#3AB0FF]/10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-black tracking-widest text-amber-500 uppercase">WHY ME?</span>
          <span className={cn("text-muted-foreground/70", textSm)}>
            {answeredCount} / 30
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-[rgba(11,31,58,0.7)]">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${(answeredCount / 30) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Seu Perfil OCEAN
          </h1>
          <p className="mt-1 text-muted-foreground">
            Responda com sinceridade — não existem respostas certas ou erradas.
          </p>
        </div>

        {/* Error message */}
        {pageState === "error" && error && (
          <div className="mb-6 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Questions by dimension */}
        <div className="space-y-8">
          {DIMENSIONS_LIST.map((dim) => (
            <section key={dim} className={cn(
              "rounded-xl border p-5 space-y-5",
              DIMENSION_BG[dim],
            )}>
              <h2 className={cn(
                "font-semibold tracking-tight",
                DIMENSION_ACCENT[dim],
                textBase,
              )}>
                {DIMENSION_LABELS[dim]}
              </h2>

              {DIMENSION_QUESTIONS[dim].map((q) => {
                const idx = q.id - 1
                const selected = responses[idx]
                return (
                  <div key={q.id} className="space-y-2">
                    <p className={cn("leading-relaxed text-foreground/90", textSm)}>
                      {q.id}. {q.text}
                    </p>
                    <div className="flex gap-1.5 sm:gap-2" role="radiogroup" aria-label={`Pergunta ${q.id}`}>
                      {LIKERT_LABELS.map((opt) => {
                        const isSelected = selected === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setResponse(idx, opt.value)}
                            className={cn(
                              "flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-xs font-medium transition-all",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              isSelected
                                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20 scale-105"
                                : "bg-[rgba(11,31,58,0.7)] text-muted-foreground hover:bg-white/10 hover:text-foreground/90",
                            )}
                            aria-label={`${opt.label} para pergunta ${q.id}`}
                          >
                            <span className="text-[10px] leading-none sm:hidden">{opt.short}</span>
                            <span className="hidden sm:inline leading-tight">{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 text-center">
          <button
            type="button"
            disabled={!allAnswered || pageState === "submitting"}
            onClick={handleSubmit}
            className={cn(
              "w-full rounded-xl px-6 py-4 text-base font-semibold transition-all",
              allAnswered && pageState !== "submitting"
                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
                : "bg-[rgba(11,31,58,0.7)] text-muted-foreground/50 cursor-not-allowed",
            )}
          >
            {pageState === "submitting"
              ? "Enviando..."
              : allAnswered
                ? "Enviar questionário"
                : `Responda mais ${30 - answeredCount} pergunta${30 - answeredCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </main>
  )
}
