"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type AuthState = {
  token: string
  ready: boolean
}

export function useAuthGuard(redirectTo = "/login"): AuthState {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({ token: "", ready: false })

  useEffect(() => {
    const token = localStorage.getItem("whyme_token")
    if (!token) {
      router.replace(redirectTo)
    } else {
      setState({ token, ready: true })
    }
  }, [router, redirectTo])

  return state
}
