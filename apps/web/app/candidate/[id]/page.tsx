"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/Sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { OceanRadar, type OceanScores } from "@/components/ocean"

type Candidate = {
  id: string
  name: string
  email: string
  bio?: string
  linkedin_url?: string
  resume_url?: string
  skills?: string[]
  ocean?: OceanScores
  interview_status?: "pending" | "completed" | "processing"
}

type Match = {
  id: string
  job_id: string
  job_title: string
  company_name: string
  score: number
  status: string
}

const OCEAN_DIMS = [
  { key: "openness" as const, label: "Abertura à experiência", description: "Curiosidade, criatividade, abertura a novas ideias" },
  { key: "conscientiousness" as const, label: "Conscienciosidade", description: "Organização, disciplina, confiabilidade" },
  { key: "extraversion" as const, label: "Extroversão", description: "Sociabilidade, assertividade, energia social" },
  { key: "agreeableness" as const, label: "Amabilidade", description: "Cooperação, empatia, altruísmo" },
  { key: "neuroticism" as const, label: "Neuroticismo", description: "Instabilidade emocional, ansiedade, reatividade" },
]

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  matched: "info",
  hired: "success",
  rejected: "danger",
}

export default function CandidatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [fetching, setFetching] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const isOwn = user?.id === id

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (!loading && id) {
      Promise.all([
        api.get<Candidate>(`/candidates/${id}`),
        api.get<{ interview_status: string; ocean?: OceanScores }>(`/candidates/${id}/interview`).catch(() => null),
      ])
        .then(([c, interview]) => {
          setCandidate({
            ...c,
            interview_status: interview?.interview_status as Candidate["interview_status"],
            ocean: interview?.ocean ?? c.ocean,
          })
        })
        .finally(() => setFetching(false))

      api.get<{ pdf_url: string }>(`/candidates/${id}/report/pdf`)
        .then((r) => setPdfUrl(r.pdf_url))
        .catch(() => null)
    }
  }, [user, loading, id, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Candidato não encontrado.</p>
      </div>
    )
  }

  const hasOcean = !!candidate.ocean && Object.keys(candidate.ocean).length > 0

  const content = (
    <main className="flex-1 px-8 py-8 space-y-6">
      <div className="flex items-start gap-6">
        <Avatar name={candidate.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-zinc-100">{candidate.name}</h2>
            {candidate.interview_status && (
              <Badge variant={candidate.interview_status === "completed" ? "success" : "warning"}>
                {candidate.interview_status === "completed" ? "Avaliação completa" : "Avaliação pendente"}
              </Badge>
            )}
          </div>
          {candidate.email && <p className="text-sm text-zinc-400 mt-1">{candidate.email}</p>}
          {candidate.bio && <p className="text-sm text-zinc-300 mt-2 max-w-xl leading-relaxed">{candidate.bio}</p>}
          <div className="flex items-center gap-3 mt-3">
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                LinkedIn →
              </a>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Baixar relatório PDF →
              </a>
            )}
            {isOwn && candidate.interview_status !== "completed" && (
              <Link href="/onboarding" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Completar avaliação →
              </Link>
            )}
          </div>
        </div>
      </div>

      {candidate.skills && candidate.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Habilidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <Badge key={skill} variant="default">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil OCEAN</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">Resultado da avaliação de personalidade</p>
          </CardHeader>
          <CardContent>
            {hasOcean ? (
              <div className="flex flex-col items-center gap-6">
                <OceanRadar scores={candidate.ocean!} size={220} />
                <div className="w-full space-y-3">
                  {OCEAN_DIMS.map((dim) => {
                    const val = candidate.ocean![dim.key] ?? 0
                    return (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-zinc-300">{dim.label}</span>
                          <span className="text-zinc-400">{Math.round(val * 100)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${val * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500">{dim.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-zinc-500">Avaliação OCEAN ainda não realizada.</p>
                {isOwn && (
                  <Link href="/onboarding">
                    <Badge variant="info">Fazer avaliação agora →</Badge>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches de vagas</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-sm text-zinc-500 py-8 text-center">
                Nenhum match encontrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {[...matches]
                  .sort((a, b) => b.score - a.score)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3 gap-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/job/${m.job_id}`}
                          className="text-sm font-medium text-zinc-200 hover:text-blue-400 transition-colors truncate block"
                        >
                          {m.job_title}
                        </Link>
                        <p className="text-xs text-zinc-500 truncate">{m.company_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-blue-400">
                          {Math.round(m.score * 100)}%
                        </span>
                        <Badge variant={statusColors[m.status] ?? "default"}>{m.status}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )

  if (user?.role === "candidate") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-100">Whyme</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{user.name}</span>
            <Avatar name={user.name} size="sm" />
          </div>
        </header>
        <div className="flex-1 max-w-4xl mx-auto w-full px-4">{content}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-zinc-100">Perfil do candidato</h1>
        </header>
        {content}
      </div>
    </div>
  )
}
