"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  getCurrentUser,
  getUserNotifications,
  type NotificationData,
  type UserData,
} from "@/lib/api"

type PageState = "loading" | "error" | "ready"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function typeLabel(type: string): string {
  switch (type) {
    case "match_candidate": return "Match como Candidato"
    case "match_company": return "Match como Empresa"
    default: return type
  }
}

function typeColor(type: string): string {
  switch (type) {
    case "match_candidate": return "bg-violet-500/15 text-violet-400"
    case "match_company": return "bg-blue-500/15 text-blue-400"
    default: return "bg-zinc-700/50 text-zinc-400"
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

export default function NotificationsPage() {
  const [state, setState] = useState<PageState>("loading")
  const [user, setUser] = useState<UserData | null>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("whyme_token") ?? "" : ""

  const load = useCallback(async () => {
    if (!token) { setState("ready"); return }
    try {
      const me = await getCurrentUser(token)
      setUser(me)
      const notifs = await getUserNotifications(me.id, token)
      setNotifications(notifs)
      setState("ready")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao carregar")
      setState("error")
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function markAsRead(id: string) {
    await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  async function markAllRead() {
    if (!user) return
    await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: user.id }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-zinc-700 border-t-blue-500" />
      </main>
    )
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-zinc-50">Autenticação necessária</h1>
          <p className="text-sm text-zinc-500">Faça login para ver suas notificações.</p>
          <Link href="/login" className="inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Fazer login</Link>
        </div>
      </main>
    )
  }

  const unread = notifications.filter((n) => !n.is_read)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Notificações</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {notifications.length} no total{unread.length > 0 ? ` · ${unread.length} não lida${unread.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 transition-colors">
              Marcar todas como lidas
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl opacity-40">🔔</div>
            <h2 className="text-lg font-semibold text-zinc-400">Nenhuma notificação</h2>
            <p className="mt-1 text-sm text-zinc-600">Você receberá notificações quando houver novos matches.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border transition-colors ${
                  n.is_read
                    ? "border-zinc-800/50 bg-zinc-900/30"
                    : "border-zinc-700 bg-zinc-900"
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
