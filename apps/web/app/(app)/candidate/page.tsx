"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CandidateIndex() {
  const router = useRouter()

  useEffect(() => {
    const userStr = localStorage.getItem("whyme_user")
    if (!userStr) {
      router.replace("/login")
      return
    }
    try {
      const user = JSON.parse(userStr)
      router.replace(`/candidate/${user.id}/dashboard`)
    } catch {
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}
