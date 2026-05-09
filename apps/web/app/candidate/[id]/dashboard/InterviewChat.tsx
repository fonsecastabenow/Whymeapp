"use client"

import { useEffect, useRef, useState } from "react"
import { startInterviewChat, submitChatAnswer, scoreChatInterview } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  from: "bot" | "user"
  text: string
}

type Phase = "idle" | "chatting" | "scoring" | "done" | "error"

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3AB0FF] text-xs font-bold text-[#0B1F3A]">
        W
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[rgba(16,34,68,0.9)] border border-[#3AB0FF]/10 px-4 py-2.5 text-sm text-foreground shadow-sm">
        {text}
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white shadow-sm">
        {text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3AB0FF] text-xs font-bold text-[#0B1F3A]">
        W
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[rgba(16,34,68,0.9)] border border-[#3AB0FF]/10 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3AB0FF]/50 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3AB0FF]/50 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3AB0FF]/50 [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  candidateId: string
  hasExistingScores: boolean
  onComplete: () => void
}

export default function InterviewChat({ candidateId, hasExistingScores, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [token, setToken] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(8)
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [allowRetake, setAllowRetake] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isWaiting])

  function getAuthToken(): string {
    return localStorage.getItem("whyme_token") ?? ""
  }

  async function handleStart() {
    setPhase("chatting")
    setMessages([])
    setToken("")
    setIsWaiting(true)
    setErrorMsg("")

    try {
      const res = await startInterviewChat(candidateId, getAuthToken())
      setToken(res.token)
      setTotalQuestions(res.total)
      setQuestionNumber(res.question_number)
      setMessages([
        {
          from: "bot",
          text: "Olá! Vou te fazer 8 perguntas para conhecer melhor o seu perfil profissional. Responda com sinceridade — não há respostas certas ou erradas.",
        },
        { from: "bot", text: res.question },
      ])
    } catch (err) {
      setPhase("error")
      setErrorMsg(err instanceof Error ? err.message : "Erro ao iniciar entrevista")
    } finally {
      setIsWaiting(false)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isWaiting || phase !== "chatting") return

    setInput("")
    setMessages((prev) => [...prev, { from: "user", text }])
    setIsWaiting(true)

    try {
      const res = await submitChatAnswer(token, text)

      if (res.completed) {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Ótimo! Obrigado por responder todas as perguntas. Estou analisando seu perfil..." },
        ])
        setIsWaiting(false)
        await handleScore()
        return
      }

      setQuestionNumber(res.question_number ?? questionNumber + 1)
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: res.question ?? "" },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Houve um erro ao processar sua resposta. Tente novamente." },
      ])
    } finally {
      setIsWaiting(false)
    }
  }

  async function handleScore() {
    setPhase("scoring")
    try {
      await scoreChatInterview(token)
      setPhase("done")
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Seu perfil OCEAN foi gerado com sucesso! Você já pode ver sua órbita no dashboard." },
      ])
      setTimeout(onComplete, 1800)
    } catch (err) {
      setPhase("error")
      setErrorMsg(err instanceof Error ? err.message : "Erro ao calcular perfil OCEAN")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (phase === "idle") {
    if (hasExistingScores && !allowRetake) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.6)] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-400">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Entrevista já concluída</p>
            <p className="mt-1 text-sm text-muted-foreground">Seu perfil OCEAN está disponível no dashboard.</p>
          </div>
          <button
            onClick={() => setAllowRetake(true)}
            className="rounded-xl border border-[#3AB0FF]/20 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-[#3AB0FF]/40 hover:text-foreground"
          >
            Refazer entrevista
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.6)] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3AB0FF]/15">
          <svg className="h-7 w-7 text-[#3AB0FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Entrevista de Perfil OCEAN</p>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Responda 8 perguntas para gerar seu perfil de personalidade profissional. Leva cerca de 5 minutos.
          </p>
        </div>
        <button
          onClick={handleStart}
          className="rounded-xl bg-[#3AB0FF] px-6 py-2.5 text-sm font-semibold text-[#0B1F3A] transition-all hover:opacity-90 shadow-lg shadow-[#3AB0FF]/20"
        >
          Iniciar Entrevista
        </button>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="font-medium text-red-400">Erro: {errorMsg}</p>
        <button
          onClick={() => { setPhase("idle"); setAllowRetake(true) }}
          className="rounded-xl border border-[#3AB0FF]/20 px-4 py-2 text-sm text-foreground/80 hover:border-[#3AB0FF]/40"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // ── Chat state ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.7)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3AB0FF]/12 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3AB0FF] text-xs font-bold text-[#0B1F3A]">
            W
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">WhyMe Bot</p>
            <p className="text-xs text-muted-foreground">
              {phase === "scoring"
                ? "Analisando respostas..."
                : phase === "done"
                ? "Entrevista concluída"
                : `Pergunta ${questionNumber} de ${totalQuestions}`}
            </p>
          </div>
        </div>
        {(phase === "chatting" || phase === "scoring" || phase === "done") && (
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(16,34,68,0.9)]">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: phase === "done" || phase === "scoring"
                  ? "100%"
                  : `${((questionNumber - 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, i) =>
          msg.from === "bot"
            ? <BotBubble key={i} text={msg.text} />
            : <UserBubble key={i} text={msg.text} />
        )}
        {isWaiting && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#3AB0FF]/12 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isWaiting || phase !== "chatting"}
            placeholder={
              phase === "scoring" ? "Analisando respostas..." :
              phase === "done" ? "Entrevista concluída!" :
              "Digite sua resposta..."
            }
            className="flex-1 rounded-xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.8)] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#3AB0FF]/50 focus:outline-none focus:ring-1 focus:ring-[#3AB0FF]/30 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isWaiting || phase !== "chatting"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3AB0FF] text-[#0B1F3A] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
