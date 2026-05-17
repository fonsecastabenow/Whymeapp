"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type AuthState = {
  token: string
  userId: string | null
  ready: boolean
}

export function useAuthGuard(redirectTo = "/login"): AuthState {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({ token: "", userId: null, ready: false })

  useEffect(() => {
    const token = localStorage.getItem("whyme_token")
    if (!token) {
      router.replace(redirectTo)
    } else {
      let userId: string | null = null
      try {
        const user = JSON.parse(localStorage.getItem("whyme_user") ?? "{}")
        userId = user?.id ?? null
      } catch {}
      setState({ token, userId, ready: true })
    }
  }, [router, redirectTo])

  return state
}
