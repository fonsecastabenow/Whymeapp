"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Dimension = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism"

type Question = {
  id: number
  text: string
  dimension: Dimension
}

const QUESTIONS: Question[] = [
  { id: 1, text: "Gosto de tentar coisas novas e diferentes.", dimension: "openness" },
  { id: 2, text: "Tenho muito interesse em arte, literatura ou música.", dimension: "openness" },
  { id: 3, text: "Sou uma pessoa curiosa que adora aprender.", dimension: "openness" },
  { id: 4, text: "Gosto de imaginar situações e criar histórias mentais.", dimension: "openness" },
  { id: 5, text: "Me interesso por culturas e pontos de vista diferentes dos meus.", dimension: "openness" },
  { id: 6, text: "Prefiro tarefas criativas a tarefas rotineiras.", dimension: "openness" },

  { id: 7, text: "Sou organizado(a) e mantenho minhas coisas em ordem.", dimension: "conscientiousness" },
  { id: 8, text: "Sempre cumpro o que prometo no prazo combinado.", dimension: "conscientiousness" },
  { id: 9, text: "Faço planos antes de agir e os sigo cuidadosamente.", dimension: "conscientiousness" },
  { id: 10, text: "Trabalho duro mesmo quando a tarefa é difícil ou entediante.", dimension: "conscientiousness" },
  { id: 11, text: "Presto atenção aos detalhes para evitar erros.", dimension: "conscientiousness" },
  { id: 12, text: "Tenho autodisciplina e não desisto facilmente.", dimension: "conscientiousness" },

  { id: 13, text: "Gosto muito de estar com muitas pessoas ao mesmo tempo.", dimension: "extraversion" },
  { id: 14, text: "Em festas ou eventos, costumo ser animado(a) e sociável.", dimension: "extraversion" },
  { id: 15, text: "Sinto-me energizado(a) quando converso com outras pessoas.", dimension: "extraversion" },
  { id: 16, text: "Falo bastante e costumo ser eu quem inicia as conversas.", dimension: "extraversion" },
  { id: 17, text: "Me sinto confortável sendo o centro das atenções.", dimension: "extraversion" },
  { id: 18, text: "Prefiro trabalhar em grupo a trabalhar sozinho(a).", dimension: "extraversion" },

  { id: 19, text: "Acredito que a maioria das pessoas tem boas intenções.", dimension: "agreeableness" },
  { id: 20, text: "Me preocupo genuinamente com o bem-estar dos outros.", dimension: "agreeableness" },
  { id: 21, text: "Prefiro ceder do que entrar em conflito com alguém.", dimension: "agreeableness" },
  { id: 22, text: "Sou generoso(a) com meu tempo e recursos.", dimension: "agreeableness" },
  { id: 23, text: "Me esforço para ser simpático(a) e gentil com todos.", dimension: "agreeableness" },
  { id: 24, text: "Fico incomodado(a) quando vejo alguém sendo tratado de forma injusta.", dimension: "agreeableness" },

  { id: 25, text: "Me preocupo frequentemente com o que pode dar errado.", dimension: "neuroticism" },
  { id: 26, text: "Fico estressado(a) ou ansioso(a) com facilidade.", dimension: "neuroticism" },
  { id: 27, text: "Meu humor muda bastante ao longo do dia.", dimension: "neuroticism" },
  { id: 28, text: "Situações de pressão ou prazo me deixam muito nervoso(a).", dimension: "neuroticism" },
  { id: 29, text: "Críticas ou rejeições me afetam emocionalmente por muito tempo.", dimension: "neuroticism" },
  { id: 30, text: "Tenho dificuldade em relaxar quando há problemas por resolver.", dimension: "neuroticism" },
]

const DIMENSION_INFO: Record<Dimension, { label: string; color: string }> = {
  openness: { label: "Abertura", color: "bg-violet-500" },
  conscientiousness: { label: "Conscienciosidade", color: "bg-blue-500" },
  extraversion: { label: "Extroversão", color: "bg-amber-500" },
  agreeableness: { label: "Amabilidade", color: "bg-emerald-500" },
  neuroticism: { label: "Neuroticismo", color: "bg-rose-500" },
}

const LIKERT_LABELS = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"]

function computeScores(answers: Record<number, number>): Record<Dimension, number> {
  const dims: Dimension[] = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
  const result = {} as Record<Dimension, number>
  for (const dim of dims) {
    const qs = QUESTIONS.filter((q) => q.dimension === dim)
    const sum = qs.reduce((acc, q) => acc + (answers[q.id] ?? 3), 0)
    result[dim] = sum / (qs.length * 5)
  }
  return result
}

type Phase = "welcome" | "quiz" | "submitting" | "done"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [phase, setPhase] = useState<Phase>("welcome")
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  const question = QUESTIONS[current]
  const progress = Object.keys(answers).length / QUESTIONS.length
  const currentAnswer = answers[question?.id]
  const isLast = current === QUESTIONS.length - 1

  function selectAnswer(value: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  async function handleNext() {
    if (currentAnswer == null) return
    if (!isLast) {
      setCurrent((c) => c + 1)
      return
    }
    await submit()
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1)
  }

  async function submit() {
    setPhase("submitting")
    setError("")
    try {
      const interview = await api.post<{ id: string }>("/interviews", {
        candidate_id: user!.id,
      })
      const scores = computeScores(answers)
      await api.post(`/interviews/${interview.id}/scores`, {
        scores,
        answers: Object.entries(answers).map(([qId, value]) => ({
          question_id: Number(qId),
          value,
        })),
      })
      setPhase("done")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar respostas")
      setPhase("quiz")
    }
  }

  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white mx-auto">
              W
            </div>
            <h1 className="text-3xl font-bold text-zinc-100">Bem-vindo, {user.name.split(" ")[0]}!</h1>
            <p className="text-zinc-400 leading-relaxed">
              Vamos conhecer seu perfil de personalidade através do modelo OCEAN — uma metodologia
              científica usada para identificar o melhor match entre candidatos e empresas.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(Object.entries(DIMENSION_INFO) as [Dimension, { label: string; color: string }][]).map(
              ([, info]) => (
                <div key={info.label} className="flex flex-col items-center gap-1.5">
                  <div className={cn("h-2 w-full rounded-full", info.color)} />
                  <span className="text-xs text-zinc-400">{info.label}</span>
                </div>
              )
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left space-y-2">
            <p className="text-sm font-medium text-zinc-300">O que esperar:</p>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li className="flex gap-2"><span className="text-blue-400">→</span> 30 perguntas de personalidade</li>
              <li className="flex gap-2"><span className="text-blue-400">→</span> Escala de concordância 1 a 5</li>
              <li className="flex gap-2"><span className="text-blue-400">→</span> Cerca de 5 minutos para completar</li>
              <li className="flex gap-2"><span className="text-blue-400">→</span> Sem respostas certas ou erradas</li>
            </ul>
          </div>

          <Button size="lg" className="w-full" onClick={() => setPhase("quiz")}>
            Começar avaliação
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 mx-auto">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Avaliação concluída!</h2>
          <p className="text-zinc-400">
            Seu perfil OCEAN foi registrado com sucesso. Em breve você receberá sugestões de vagas
            compatíveis com sua personalidade.
          </p>
          <Button size="lg" className="w-full" onClick={() => router.push(`/candidate/${user.id}`)}>
            Ver meu perfil
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-zinc-400">Calculando seu perfil OCEAN…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="w-full bg-zinc-900 border-b border-zinc-800">
        <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  DIMENSION_INFO[question.dimension].color
                )}
              />
              <span className="text-sm text-zinc-400">
                {DIMENSION_INFO[question.dimension].label}
              </span>
            </div>
            <span className="text-sm text-zinc-500">
              {current + 1} / {QUESTIONS.length}
            </span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
            <p className="text-xl font-medium text-zinc-100 leading-relaxed">{question.text}</p>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => selectAnswer(val)}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium transition-all",
                    currentAnswer === val
                      ? "border-blue-500 bg-blue-600/10 text-blue-300"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      currentAnswer === val
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-zinc-600 text-zinc-400"
                    )}
                  >
                    {val}
                  </span>
                  {LIKERT_LABELS[val - 1]}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {current > 0 && (
                <Button variant="secondary" onClick={handleBack} className="flex-1">
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={currentAnswer == null}
                className="flex-1"
              >
                {isLast ? "Finalizar" : "Próxima"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
