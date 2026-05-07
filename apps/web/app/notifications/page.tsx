"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getCurrentUser,
  getUserNotifications,
  type NotificationData,
  type UserData,
} from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function typeLabel(type: string): string {
  switch (type) {
    case "match_candidate": return "Match como Candidato"
    case "match_company":   return "Match como Empresa"
    default:                return type
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "match_candidate": return "bg-violet-500/15 text-violet-400"
    case "match_company":   return "bg-blue-500/15 text-blue-400"
    default:                return "bg-zinc-700/50 text-zinc-400"
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const me = await getCurrentUser(token)
      setUser(me)
      const notifs = await getUserNotifications(me.id, token)
      setNotifications(notifs)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function markAsRead(id: string) {
    await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    if (!user) return
    await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: user.id }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  if (loading) return <LoadingSpinner />
  if (!token) return <ErrorState title="Autenticação necessária" message="Faça login para ver suas notificações." onRetry={() => window.location.href = "/login"} retryLabel="Fazer login" />
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={load} />

  const unread = notifications.filter((n) => !n.is_read)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Notificações</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {notifications.length} no total
              {unread.length > 0 ? ` · ${unread.length} não lida${unread.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {notifications.length === 0 ? (
          <EmptyState icon="🔔" title="Nenhuma notificação" description="Você receberá notificações quando houver novos matches." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border transition-colors ${
                  n.is_read ? "border-zinc-800/50 bg-zinc-900/30" : "border-zinc-700 bg-zinc-900"
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  <div className={`min-w-0 flex-1 ${n.is_read ? "ml-[18px]" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor(n.type)}`}>
                        {typeLabel(n.type)}
                      </span>
                      <span className="text-[11px] text-zinc-600">{formatDate(n.created_at)}</span>
                    </div>
                    <h3 className={`mt-2 text-sm font-semibold ${n.is_read ? "text-zinc-400" : "text-zinc-50"}`}>
                      {n.title}
                    </h3>
                    {n.message && (
                      <p className={`mt-1 text-sm leading-relaxed ${n.is_read ? "text-zinc-600" : "text-zinc-400"}`}>
                        {n.message}
                      </p>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="mt-3 text-xs font-medium text-blue-400 hover:underline"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
