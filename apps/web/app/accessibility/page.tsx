"use client"

import { useEffect, useState } from "react"
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
    key: "large_text",
    label: "Fonte grande",
    description: "Aumentar o tamanho da fonte em todas as telas do questionário",
    icon: "Aa",
  },
  {
    key: "high_contrast",
    label: "Alto contraste",
    description: "Usar cores de alto contraste para melhorar a legibilidade",
    icon: "◐",
  },
  {
    key: "reduced_animations",
    label: "Reduzir animações",
    description: "Desativar animações e transições visuais",
    icon: "►",
  },
  {
    key: "extra_time",
    label: "Tempo extra",
    description: "Mais tempo para responder cada pergunta do questionário",
    icon: "⏱",
  },
  {
    key: "auditory",
    label: "Apoio auditivo",
    description: "Ativar leitura em voz alta das perguntas e opções de resposta",
    icon: "♪",
  },
  {
    key: "visual",
    label: "Apoio visual",
    description: "Mostrar imagens, ícones e dicas visuais junto com as perguntas",
    icon: "👁",
  },
  {
    key: "motor",
    label: "Suporte motor",
    description: "Aumentar área de clique dos botões e facilitar a navegação",
    icon: "✋",
  },
  {
    key: "cognitive",
    label: "Adaptação cognitiva",
    description: "Simplificar a linguagem e oferecer explicações adicionais",
    icon: "🧠",
  },
]

const DEFAULT_ACCOMMODATIONS: AccommodationsData = {
  visual: false,
  auditory: false,
  motor: false,
  cognitive: false,
  large_text: false,
  high_contrast: false,
  reduced_animations: false,
  extra_time: false,
}

export default function AccessibilityPage() {
  const searchParams = useSearchParams()
  const candidateId = searchParams.get("candidate_id") ?? ""

  const [pageState, setPageState] = useState<PageState>("loading")
  const [accommodations, setAccommodations] = useState<AccommodationsData>(DEFAULT_ACCOMMODATIONS)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (!candidateId) {
      setPageState("ready")
      return
    }

    let cancelled = false

    async function load() {
      try {
        const data = await getAccommodations(candidateId)
        if (!cancelled) {
          if (data.accommodations) {
            setAccommodations({ ...DEFAULT_ACCOMMODATIONS, ...data.accommodations })
          }
          setPageState("ready")
        }
      } catch {
        if (!cancelled) setPageState("ready")
      }
    }

    load()
    return () => { cancelled = true }
  }, [candidateId])

  function toggle(key: keyof AccommodationsData) {
    setAccommodations((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    if (!candidateId) return
    setPageState("saving")
    setSaveError("")
    try {
      await updateAccommodations(candidateId, accommodations)
      setPageState("saved")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar preferências")
      setPageState("error")
    }
  }

  if (pageState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Carregando preferencias...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Whyme
          </Link>
          {candidateId && (
            <Link
              href={`/interview/${candidateId}${searchParams.toString() ? "?" + searchParams.toString() : ""}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar ao questionario
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ♿
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Acessibilidade
          </h1>
          <p className="mt-2 text-muted-foreground">
            Escolha as adaptacoes que tornam o questionario mais confortavel para voce.
            Todas as informacoes sao confidenciais e usadas apenas para personalizar sua experiencia.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold">Preferencias de acesso</h2>
            <p className="text-sm text-muted-foreground">
              Selecione todas as opcoes que voce precisa:
            </p>
          </div>

          <div className="space-y-3">
            {ACCOMMODATION_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-4 rounded-lg border border-input bg-background p-4 transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={accommodations[item.key]}
                  onChange={() => toggle(item.key)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </label>
            ))}
          </div>

          {pageState === "error" && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          {pageState === "saved" && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
              Preferencias salvas com sucesso!
            </div>
          )}

          {candidateId && (
            <button
              onClick={handleSave}
              disabled={pageState === "saving"}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pageState === "saving" ? "Salvando..." : "Salvar preferencias"}
            </button>
          )}
        </div>

        {!candidateId && (
          <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Para salvar suas preferencias, acesse esta pagina pelo link do seu questionario.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
