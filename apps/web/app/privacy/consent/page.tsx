"use client"

import { useState } from "react"
import Link from "next/link"

interface ConsentItem {
  id: string
  label: string
  description: string
  required: boolean
}

const consentItems: ConsentItem[] = [
  {
    id: "communications",
    label: "Comunicações sobre vagas compatíveis",
    description:
      "Aceito receber notificações por e-mail e/ou na plataforma sobre vagas que sejam compatíveis com o meu perfil OCEAN e habilidades declaradas.",
    required: false,
  },
  {
    id: "ocean_sharing",
    label: "Compartilhamento do score OCEAN com empresas parceiras",
    description:
      "Autorizo que meu score OCEAN (5 dimensões comportamentais) seja utilizado no processo de matching com empresas. Nenhum dado pessoal de identificação (nome, e-mail, telefone) é compartilhado nesta etapa.",
    required: false,
  },
  {
    id: "data_policy",
    label: "Armazenamento de dados conforme a Política de Privacidade",
    description:
      "Compreendo que meus dados serão armazenados por até 2 anos após o último login, ou até que eu solicite a exclusão, conforme descrito na Política de Privacidade.",
    required: true,
  },
]

export default function ConsentPage() {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    communications: false,
    ocean_sharing: false,
    data_policy: false,
  })
  const [saved, setSaved] = useState(false)

  function toggle(id: string, required: boolean) {
    if (required) return
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
  }

  const canSave = consents.data_policy

  return (
    <div className="min-h-screen bg-background text-foreground/85">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-8"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Política de Privacidade
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Privacidade
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Gerenciar Consentimentos
          </h1>
          <p className="text-muted-foreground text-sm">
            Você controla quais dados são usados e compartilhados na plataforma Whyme.
            Altere suas preferências a qualquer momento.
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-8 rounded-xl border border-[#3AB0FF]/20 bg-[#3AB0FF]/5 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-[#3AB0FF] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[#3AB0FF]/80">
              As suas escolhas aqui não afetam a funcionalidade básica da plataforma, apenas
              como e com quem seus dados são compartilhados.
            </p>
          </div>
        </div>

        {/* Consent items */}
        <div className="space-y-4 mb-8">
          {consentItems.map((item) => {
            const checked = consents[item.id]
            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id, item.required)}
                className={[
                  "rounded-xl border p-5 transition-all",
                  item.required
                    ? "border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.4)] cursor-default"
                    : checked
                      ? "border-emerald-500/40 bg-emerald-500/5 cursor-pointer"
                      : "border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.3)] hover:border-[#3AB0FF]/25 cursor-pointer",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div
                    className={[
                      "mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                      item.required
                        ? "border-[#3AB0FF]/20 bg-[#3AB0FF]/10 cursor-not-allowed"
                        : checked
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-[#3AB0FF]/20 bg-transparent",
                    ].join(" ")}
                  >
                    {(checked || item.required) && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${checked || item.required ? "text-foreground" : "text-foreground/80"}`}>
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="rounded-full border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.5)] px-2 py-0.5 text-xs text-muted-foreground/60">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Required notice */}
        <p className="text-xs text-muted-foreground/50 mb-6">
          * O consentimento marcado como <strong className="text-muted-foreground/70">Obrigatório</strong> é
          necessário para o uso da plataforma e não pode ser revogado sem exclusão da conta.
          Para excluir sua conta e dados, entre em contato em{" "}
          <a href="mailto:lgpd@whyme.app" className="text-[#3AB0FF] hover:text-[#3AB0FF]/80 underline underline-offset-2">
            lgpd@whyme.app
          </a>
          .
        </p>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
              canSave
                ? "bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] text-white shadow-lg shadow-[#3AB0FF]/20 hover:opacity-90"
                : "bg-[rgba(16,34,68,0.5)] text-muted-foreground/40 border border-[#3AB0FF]/8 cursor-not-allowed",
            ].join(" ")}
          >
            Salvar preferências
          </button>

          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Preferências salvas
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-12 rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.4)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">Nota</p>
          <p className="text-sm text-muted-foreground/70">
            Esta é uma interface de demonstração. A integração com o backend de persistência
            de consentimentos será implementada em breve. As preferências salvas aqui ainda
            não são persistidas entre sessões.
          </p>
        </div>

      </div>
    </div>
  )
}
