"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getCurrentUser,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationData,
  type UserData,
} from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorState } from "@/components/ui/error-state"

function typeChipClass(type: string): string {
  switch (type) {
    case "match_candidate": return "chip chip-violet"
    case "match_company":   return "chip chip-primary"
    default:                return "chip"
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "match_candidate": return "Match — Candidato"
    case "match_company":   return "Match — Empresa"
    default:                return type
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
    await markNotificationRead(id, token)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  async function markAllRead() {
    if (!user) return
    await markAllNotificationsRead(user.id, token)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  if (loading) return <LoadingSpinner />
  if (!token) return (
    <ErrorState
      title="Autenticação necessária"
      message="Faça login para ver suas notificações."
      onRetry={() => window.location.href = "/login"}
      retryLabel="Fazer login"
    />
  )
  if (errorMsg) return <ErrorState message={errorMsg} onRetry={load} />

  const unread = notifications.filter((n) => !n.is_read)

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b px-7 py-4"
        style={{
          background: "rgba(11,31,58,0.85)",
          backdropFilter: "blur(14px)",
          borderColor: "var(--line)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold tracking-[-0.01em] text-foreground">Notificações</h1>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--fg-3)" }}>
              {notifications.length} no total
              {unread.length > 0 ? ` · ${unread.length} não lida${unread.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-[#3AB0FF] transition-all hover:bg-[rgba(58,176,255,0.10)]"
              style={{ borderColor: "rgba(58,176,255,0.25)" }}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card">
            <p className="stat-k">Total</p>
            <p className="stat-v font-data">{notifications.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Não lidas</p>
            <p className="stat-v font-data" style={{ color: unread.length > 0 ? "#3AB0FF" : undefined }}>
              {unread.length}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-k">Lidas</p>
            <p className="stat-v font-data">{notifications.length - unread.length}</p>
          </div>
        </div>

        {/* Section label */}
        <div className="section-label">Todas as notificações</div>

        {notifications.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border py-12 text-center"
            style={{ background: "var(--surface-3)", borderColor: "var(--line)" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
            >
              🔔
            </div>
            <p className="font-semibold text-foreground">Nenhuma notificação</p>
            <p className="text-sm" style={{ color: "var(--fg-3)" }}>
              Você receberá notificações quando houver novos matches.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="card-lift rounded-xl border transition-all"
                style={{
                  background: n.is_read ? "var(--surface-3)" : "var(--surface)",
                  borderColor: n.is_read ? "var(--line-soft)" : "var(--line)",
                }}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Unread indicator */}
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3AB0FF]" />
                  )}
                  <div className={`min-w-0 flex-1 ${n.is_read ? "ml-[18px]" : ""}`}>
                    {/* Type chip + date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={typeChipClass(n.type)}>{typeLabel(n.type)}</span>
                      <span className="font-data text-[11px]" style={{ color: "var(--fg-3)" }}>
                        {formatDate(n.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="mt-2 text-sm font-semibold"
                      style={{ color: n.is_read ? "var(--fg-3)" : "var(--foreground)" }}
                    >
                      {n.title}
                    </h3>

                    {/* Message */}
                    {n.message && (
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: n.is_read ? "rgba(200,213,234,0.35)" : "var(--fg-3)" }}
                      >
                        {n.message}
                      </p>
                    )}

                    {/* Mark as read */}
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="mt-3 text-xs font-medium text-[#3AB0FF] transition-colors hover:text-[#5BC2FF]"
                      >
                        Marcar como lida →
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
