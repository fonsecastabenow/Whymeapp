"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { getCandidateProfile, getCandidateMatchDetails, API_BASE } from "@/lib/api"
import type { CandidateProfileData, MatchDetailItem } from "@/lib/api"

type PageState = "loading" | "error" | "ready"

const OCEAN_LABELS: Record<string, string> = {
  openness: "Abertura",
  conscientiousness: "Conscienciosidade",
  extraversion: "Extroversão",
  agreeableness: "Amabilidade",
  neuroticism: "Neuroticismo",
}

function OceanBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-zinc-300">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-400">{pct}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "#10B981"
  if (score >= 0.6) return "#3B82F6"
  if (score >= 0.4) return "#F59E0B"
  return "#EF4444"
}

export default function CandidateReportPage({ params }: { params: { id: string } }) {
  const [state, setState] = useState<PageState>("loading")
  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null)
  const [matches, setMatches] = useState<MatchDetailItem[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { id } = params
    if (!id) return
    let cancelled = false

    async function load() {
      try {
        const [cand, matchList] = await Promise.all([
          getCandidateProfile(id),
          getCandidateMatchDetails(id).catch(() => []),
        ])
        if (cancelled) return
        setCandidate(cand)
        setMatches(matchList)
        setState("ready")
      } catch {
        if (!cancelled) setState("error")
      }
    }
    load()
    return () => { cancelled = true }
  }, [params])

  function handlePrint() {
    window.print()
  }

  function handleDownloadPdf() {
    const id = params.id
    window.open(`${API_BASE}/candidates/${encodeURIComponent(id)}/report/pdf`, "_blank")
  }

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600" />
      </main>
    )
  }

  if (state === "error" || !candidate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Erro ao carregar relatório</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">Voltar</Link>
        </div>
      </main>
    )
  }

  const scores = candidate.ocean_scores
  const hasOcean = !!scores

  return (
    <>
      {/* Botões de ação - visíveis só na tela */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <button
          onClick={handleDownloadPdf}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
        >
          📄 Baixar PDF
        </button>
        <button
          onClick={handlePrint}
          className="rounded-xl bg-zinc-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-600 transition-colors"
        >
          🖨️ Imprimir
        </button>
      </div>

      {/* Conteúdo do relatório */}
      <div ref={printRef} className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-3xl px-8 py-12">
          {/* Header */}
          <header className="mb-10 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold">Relatório de Compatibilidade</h1>
            <p className="mt-2 text-sm text-gray-500">
              Whyme — Recrutamento por Valores • {new Date().toLocaleDateString("pt-BR")}
            </p>
          </header>

          {/* Dados do Candidato */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">{candidate.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {candidate.headline && (
                <div>
                  <span className="font-medium text-gray-500">Cargo:</span>
                  <p className="mt-0.5">{candidate.headline}</p>
                </div>
              )}
              {candidate.location && (
                <div>
                  <span className="font-medium text-gray-500">Localização:</span>
                  <p className="mt-0.5">{candidate.location}</p>
                </div>
              )}
              {candidate.experience_years != null && (
                <div>
                  <span className="font-medium text-gray-500">Experiência:</span>
                  <p className="mt-0.5">{candidate.experience_years} anos</p>
                </div>
              )}
            </div>
          </section>

          {/* Perfil OCEAN */}
          {hasOcean && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold">Perfil OCEAN</h2>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                {Object.entries(OCEAN_LABELS).map(([key, label]) => {
                  const val = scores![key as keyof typeof scores] ?? 0
                  const numVal = typeof val === "number" ? val : 0
                  const normalized = numVal > 1 ? numVal / 100 : numVal
                  return (
                    <OceanBar
                      key={key}
                      label={label}
                      value={normalized}
                      color={key === "neuroticism" ? "#EF4444" : "#3B82F6"}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Matches */}
          {matches.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">
                Matches Encontrados ({matches.length})
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left font-medium text-gray-500">Empresa</th>
                    <th className="pb-2 text-left font-medium text-gray-500">Vaga</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Compatibilidade</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium">{m.company_name}</td>
                      <td className="py-3 text-gray-600">{m.job_title}</td>
                      <td className="py-3 text-right">
                        <span
                          className="font-semibold"
                          style={{ color: scoreColor(m.score) }}
                        >
                          {Math.round(m.score * 100)}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-500 capitalize">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {matches.length === 0 && (
            <section className="rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              Nenhum match encontrado até o momento.
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            <p>Whyme — gerado em {new Date().toLocaleString("pt-BR")}</p>
            <p className="mt-1">Este relatório é baseado no perfil OCEAN do candidato e nos matches ativos.</p>
          </footer>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}
