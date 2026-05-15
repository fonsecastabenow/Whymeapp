"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { api, type UserData, type LoginResponse } from "@/lib/api"

type AuthContextType = {
  user: UserData | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserData>
  register: (name: string, email: string, password: string, role: "candidate" | "company") => Promise<UserData>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("whyme_token")
    const savedUser = localStorage.getItem("whyme_user")
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string): Promise<UserData> {
    const data = await api.post<LoginResponse>("/auth/login", { email, password })
    localStorage.setItem("whyme_token", data.access_token)
    localStorage.setItem("whyme_refresh_token", data.refresh_token)
    localStorage.setItem("whyme_user", JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  async function register(
    name: string,
    email: string,
    password: string,
    role: "candidate" | "company"
  ): Promise<UserData> {
    await api.post("/auth/register", { name, email, password, role })
    return login(email, password)
  }

  function logout() {
    localStorage.removeItem("whyme_token")
    localStorage.removeItem("whyme_refresh_token")
    localStorage.removeItem("whyme_user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
