"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/Sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { type OceanScores, OceanRadar } from "@/components/ocean"

type Job = {
  id: string
  title: string
  description: string
  location: string
  remote: boolean
  status: "draft" | "open" | "closed"
  created_at: string
  ocean_weights?: OceanScores
}

type Match = {
  id: string
  candidate_id: string
  candidate_name: string
  score: number
  ocean: OceanScores
  status: "pending" | "matched" | "rejected" | "hired"
}

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  open: "success",
  closed: "danger",
  draft: "warning",
  pending: "warning",
  matched: "info",
  hired: "success",
  rejected: "danger",
}

export default function JobPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [fetching, setFetching] = useState(true)
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (!loading && id) {
      Promise.all([
        api.get<Job>(`/jobs/${id}`),
        api.get<Match[]>(`/matches/job/${id}`),
      ])
        .then(([j, m]) => {
          setJob(j)
          setMatches(m)
        })
        .finally(() => setFetching(false))
    }
  }, [user, loading, id, router])

  async function updateMatchStatus(matchId: string, status: string) {
    setUpdatingMatch(matchId)
    try {
      await api.patch(`/matches/${matchId}/status`, { status })
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: status as Match["status"] } : m))
      )
    } finally {
      setUpdatingMatch(null)
    }
  }

  async function toggleJobStatus() {
    if (!job) return
    const newStatus = job.status === "open" ? "closed" : "open"
    await api.patch(`/jobs/${id}/status`, { status: newStatus })
    setJob((j) => (j ? { ...j, status: newStatus } : j))
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  const avgScore =
    matches.length > 0 ? matches.reduce((acc, m) => acc + m.score, 0) / matches.length : 0

  const avgOcean: OceanScores | null =
    matches.length > 0
      ? {
          openness: matches.reduce((a, m) => a + m.ocean.openness, 0) / matches.length,
          conscientiousness: matches.reduce((a, m) => a + m.ocean.conscientiousness, 0) / matches.length,
          extraversion: matches.reduce((a, m) => a + m.ocean.extraversion, 0) / matches.length,
          agreeableness: matches.reduce((a, m) => a + m.ocean.agreeableness, 0) / matches.length,
          neuroticism: matches.reduce((a, m) => a + m.ocean.neuroticism, 0) / matches.length,
        }
      : null

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100 truncate max-w-[400px]">
                {job?.title ?? "Vaga"}
              </h1>
              {job && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={statusColors[job.status]}>{job.status}</Badge>
                  {job.remote && <Badge variant="info">Remoto</Badge>}
                  {job.location && <span className="text-xs text-zinc-500">{job.location}</span>}
                </div>
              )}
            </div>
          </div>
          {job && (
            <Button variant="secondary" size="sm" onClick={toggleJobStatus}>
              {job.status === "open" ? "Encerrar vaga" : "Reabrir vaga"}
            </Button>
          )}
        </header>

        <main className="flex-1 px-8 py-8 space-y-6">
          {job && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-zinc-400">Candidatos</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{matches.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-zinc-400">Score médio</p>
              <p className="text-3xl font-bold text-violet-400 mt-1">{Math.round(avgScore * 100)}%</p>
            </Card>
            <Card>
              <p className="text-sm text-zinc-400">Contratados</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">
                {matches.filter((m) => m.status === "hired").length}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Candidatos ranqueados</CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-8 text-center">
                      Nenhum candidato ainda para esta vaga.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {[...matches]
                        .sort((a, b) => b.score - a.score)
                        .map((m, rank) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3"
                          >
                            <span className="text-sm font-mono text-zinc-500 w-5">{rank + 1}</span>
                            <Avatar name={m.candidate_name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/candidate/${m.candidate_id}`}
                                className="text-sm font-medium text-zinc-200 hover:text-blue-400 transition-colors truncate block"
                              >
                                {m.candidate_name}
                              </Link>
                              <div className="flex items-center gap-3 mt-0.5">
                                {(["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const).map(
                                  (dim, i) => (
                                    <span key={dim} className="text-xs text-zinc-500">
                                      {["O","C","E","A","N"][i]}:{Math.round((m.ocean?.[dim] ?? 0) * 100)}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-blue-400 w-12 text-right">
                              {Math.round(m.score * 100)}%
                            </span>
                            <Badge variant={statusColors[m.status] ?? "default"}>{m.status}</Badge>
                            <div className="flex gap-1">
                              {m.status !== "hired" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  loading={updatingMatch === m.id}
                                  onClick={() => updateMatchStatus(m.id, "hired")}
                                >
                                  Contratar
                                </Button>
                              )}
                              {m.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  loading={updatingMatch === m.id}
                                  onClick={() => updateMatchStatus(m.id, "rejected")}
                                >
                                  Rejeitar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="flex flex-col items-center">
                <CardHeader className="w-full">
                  <CardTitle>Perfil OCEAN médio</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">dos candidatos desta vaga</p>
                </CardHeader>
                <CardContent>
                  {avgOcean ? (
                    <OceanRadar scores={avgOcean} size={200} />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-sm text-zinc-500">
                      Sem dados
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
