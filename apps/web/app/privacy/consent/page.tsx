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
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
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

          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 mb-2">
            Gerenciar Consentimentos
          </h1>
          <p className="text-zinc-500 text-sm">
            Você controla quais dados são usados e compartilhados na plataforma Whyme.
            Altere suas preferências a qualquer momento.
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-8 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-300">
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
                className={`
                  rounded-xl border p-5 transition-all
                  ${item.required
                    ? "border-zinc-700 cursor-default"
                    : checked
                      ? "border-emerald-500/40 bg-emerald-500/5 cursor-pointer"
                      : "border-zinc-800 hover:border-zinc-700 cursor-pointer"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div
                    className={`
                      mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors
                      ${item.required
                        ? "border-zinc-600 bg-zinc-700 cursor-not-allowed"
                        : checked
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-zinc-600 bg-transparent"
                      }
                    `}
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
                      <span className={`text-sm font-medium ${checked || item.required ? "text-zinc-100" : "text-zinc-300"}`}>
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Required notice */}
        <p className="text-xs text-zinc-600 mb-6">
          * O consentimento marcado como <strong className="text-zinc-500">Obrigatório</strong> é
          necessário para o uso da plataforma e não pode ser revogado sem exclusão da conta.
          Para excluir sua conta e dados, entre em contato em{" "}
          <a href="mailto:lgpd@whyme.app" className="text-blue-500 hover:text-blue-400">
            lgpd@whyme.app
          </a>
          .
        </p>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`
              inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors
              ${canSave
                ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }
            `}
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
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Nota</p>
          <p className="text-sm text-zinc-500">
            Esta é uma interface de demonstração. A integração com o backend de persistência
            de consentimentos será implementada em breve. As preferências salvas aqui ainda
            não são persistidas entre sessões.
          </p>
        </div>

      </div>
    </div>
  )
}
