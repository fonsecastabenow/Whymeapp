"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getAccommodations, updateAccommodations } from "@/lib/api"
import type { AccommodationsData, AccommodationsResponse } from "@/lib/api"

type PageState = "loading" | "ready" | "saving" | "error" | "saved"

const ACCOMMODATION_ITEMS: {
  key: keyof AccommodationsData
  label: string
  description: string
  icon: string
}[] = [
  {
    key: "extra_time",
    label: "Tempo Extra",
    description: "Mais tempo para responder o questionário",
    icon: "⏱️",
  },
  {
    key: "font_size",
    label: "Fonte Ampliada",
    description: "Texto maior e mais legível",
    icon: "🔤",
  },
  {
    key: "high_contrast",
    label: "Alto Contraste",
    description: "Cores de alto contraste para melhor visualização",
    icon: "🎨",
  },
  {
    key: "screen_reader",
    label: "Leitor de Tela",
    description: "Compatível com NVDA, VoiceOver e TalkBack",
    icon: "♿",
  },
  {
    key: "simplified_language",
    label: "Linguagem Simples",
    description: "Perguntas em linguagem mais direta e objetiva",
    icon: "📝",
  },
  {
    key: "reduced_questions",
    label: "Menos Perguntas",
    description: "Versão reduzida do questionário (15 perguntas)",
    icon: "🔢",
  },
]

function AccessibilityContent() {
  const searchParams = useSearchParams()
  const interviewId = searchParams.get("interview_id")
  const candidateId = searchParams.get("candidate_id")

  const [state, setState] = useState<PageState>("loading")
  const [selected, setSelected] = useState<AccommodationsData>({})
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    async function load() {
      try {
        let data: AccommodationsData = {}
        if (candidateId) {
          const res: AccommodationsResponse = await getAccommodations(candidateId)
          data = res.accommodations || {}
        }
        setSelected(data)
        setState("ready")
      } catch {
        setState("ready")
      }
    }
    load()
  }, [candidateId])

  function toggle(key: keyof AccommodationsData) {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        ;(next as Record<string, boolean>)[key] = true
      }
      return next
    })
  }

  async function handleSave() {
    if (!candidateId) return
    setState("saving")
    try {
      await updateAccommodations(candidateId, selected)
      setState("saved")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao salvar")
      setState("error")
    }
  }

  const containerClass =
    "min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center"

  if (state === "loading") {
    return (
      <div className={containerClass}>
        <div className="animate-pulse text-zinc-400 mt-20">Carregando...</div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">♿</div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">
            Acessibilidade
          </h1>
          <p className="text-zinc-400 mt-2">
            Escolha as adaptacoes que tornam o questionario mais confortavel para voce.
          </p>
        </div>

        <div className="grid gap-3 mb-8">
          {ACCOMMODATION_ITEMS.map((item) => {
            const isActive = !!selected[item.key]
            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-zinc-100">{item.label}</div>
                  <div className="text-sm text-zinc-400">{item.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded border-2 mt-1 flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-amber-500 border-amber-500"
                      : "border-zinc-600"
                  }`}
                >
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {state === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        {state === "saved" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg mb-4 text-sm">
            Preferencias salvas!
          </div>
        )}

        <div className="flex gap-3">
          {candidateId && (
            <button
              onClick={handleSave}
              disabled={state === "saving"}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-medium py-3 px-6 rounded-xl transition-all"
            >
              {state === "saving" ? "Salvando..." : "Salvar Preferencias"}
            </button>
          )}
          <Link
            href={interviewId ? `/questionnaire/${interviewId}` : "/"}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-3 px-6 rounded-xl text-center transition-all"
          >
            Voltar ao questionario
          </Link>
        </div>

        {!candidateId && (
          <p className="text-zinc-500 text-sm text-center mt-4">
            Para salvar suas preferencias, acesse esta pagina pelo link do seu questionario.
          </p>
        )}
      </div>
    </div>
  )
}

export default function AccessibilityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center">
        <div className="animate-pulse text-zinc-400 mt-20">Carregando...</div>
      </div>
    }>
      <AccessibilityContent />
    </Suspense>
  )
}
