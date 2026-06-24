"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/Sidebar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { OceanRadar, type OceanScores } from "@/components/OceanRadar"

export const dynamic = "force-dynamic"

type MatchSummary = {
  total_candidates: number
  active_jobs: number
  total_matches: number
  match_rate: number
  top_candidates: Array<{
    id: string
    name: string
    score: number
    ocean: OceanScores
    job_title: string
    status: string
  }>
  avg_ocean: OceanScores
}

type StatCardProps = {
  label: string
  value: string | number
  sub?: string
  color?: string
}

function StatCard({ label, value, sub, color = "text-zinc-100" }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </Card>
  )
}

function statusVariant(s: string): "success" | "warning" | "danger" | "default" {
  if (s === "matched" || s === "hired") return "success"
  if (s === "pending") return "warning"
  if (s === "rejected") return "danger"
  return "default"
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (!loading && user?.role === "candidate") {
      router.push("/onboarding")
      return
    }
    if (user?.role === "company") {
      api
        .get<MatchSummary>(`/matches/company/${user.id}/summary`)
        .then(setSummary)
        .catch(() => setSummary(null))
        .finally(() => setFetching(false))
    }
  }, [user, loading, router])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  const stats = [
    {
      label: "Total de candidatos",
      value: summary?.total_candidates ?? 0,
      color: "text-blue-400",
    },
    {
      label: "Vagas ativas",
      value: summary?.active_jobs ?? 0,
      color: "text-emerald-400",
    },
    {
      label: "Matches",
      value: summary?.total_matches ?? 0,
      color: "text-violet-400",
    },
    {
      label: "Taxa de match",
      value: summary?.match_rate != null ? `${Math.round(summary.match_rate * 100)}%` : "—",
      sub: "candidatos x vagas",
      color: "text-amber-400",
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />

      <div className="flex-1 ml-60 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Painel</h1>
            <p className="text-sm text-zinc-400">Visão geral da sua empresa</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-300 hidden sm:block">{user.name}</span>
            <Avatar name={user.name} size="md" />
          </div>
        </header>

        <main className="flex-1 px-8 py-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Últimos candidatos</CardTitle>
                </CardHeader>
                <CardContent>
                  {!summary?.top_candidates?.length ? (
                    <p className="text-sm text-zinc-500 py-8 text-center">
                      Nenhum candidato ainda. Crie uma vaga para começar.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          {["Candidato", "Vaga", "Score", "O", "C", "E", "A", "N", "Status"].map((h) => (
                            <th key={h} className="pb-3 text-left font-medium text-zinc-400 first:pl-0 px-2">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {summary.top_candidates.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 pr-2">
                              <Link
                                href={`/candidate/${c.id}`}
                                className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                              >
                                <Avatar name={c.name} size="sm" />
                                <span className="font-medium text-zinc-200 truncate max-w-[120px]">{c.name}</span>
                              </Link>
                            </td>
                            <td className="py-3 px-2 text-zinc-400 truncate max-w-[100px]">{c.job_title}</td>
                            <td className="py-3 px-2">
                              <span className="font-semibold text-blue-400">{Math.round(c.score * 100)}%</span>
                            </td>
                            {(["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const).map(
                              (dim) => (
                                <td key={dim} className="py-3 px-2 text-zinc-400">
                                  {Math.round((c.ocean?.[dim] ?? 0) * 100)}
                                </td>
                              )
                            )}
                            <td className="py-3 px-2">
                              <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="flex flex-col items-center">
                <CardHeader className="w-full">
                  <CardTitle>Perfil OCEAN médio</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">dos candidatos da empresa</p>
                </CardHeader>
                <CardContent>
                  {summary?.avg_ocean ? (
                    <>
                      <OceanRadar scores={summary.avg_ocean} size={200} />
                      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs">
                        {(
                          [
                            ["openness", "Abertura"],
                            ["conscientiousness", "Consciência"],
                            ["extraversion", "Extroversão"],
                            ["agreeableness", "Amabilidade"],
                            ["neuroticism", "Neuroticismo"],
                          ] as [keyof OceanScores, string][]
                        ).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <span className="text-zinc-400">{label}</span>
                            <span className="text-zinc-200 font-medium">
                              {Math.round((summary.avg_ocean[key] ?? 0) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-sm text-zinc-500">
                      Sem dados suficientes
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
