"use client"

import { useState } from "react"
import Link from "next/link"

interface FaqItem {
  q: string
  a: string
}

const FAQS: FaqItem[] = [
  {
    q: "Como funciona o modelo OCEAN?",
    a: "OCEAN é um modelo psicológico que mede 5 traços da personalidade: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo. Você responde um questionário de 30 perguntas em formato conversacional (leva cerca de 5 minutos), e nosso sistema calcula seu perfil OCEAN. As empresas definem o perfil ideal para cada vaga, e o Whyme encontra os melhores matches automaticamente."
  },
  {
    q: "Quanto custa?",
    a: "Para candidatos, o Whyme é completamente gratuito. Você cria seu perfil, responde o questionário e fica visível para empresas compatíveis sem pagar nada. Para empresas, oferecemos planos de acesso à base ranqueada de candidatos. Entre em contato para saber mais sobre os planos disponíveis."
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Seguimos a LGPD (Lei Geral de Proteção de Dados) rigorosamente. Seus dados pessoais (nome, email, telefone) nunca são compartilhados com empresas sem sua autorização explícita. As empresas veem apenas seu score OCEAN e as skills que você optou por compartilhar. Você pode solicitar a exclusão dos seus dados a qualquer momento. Veja nossa política de privacidade para mais detalhes."
  },
  {
    q: "Como as empresas usam meu perfil?",
    a: "Quando você completa o questionário OCEAN, seu perfil é comparado com o perfil ideal das vagas abertas. Se houver compatibilidade acima do threshold definido, um match é criado. A empresa vê seu score de compatibilidade e, conforme seu consentimento, pode acessar mais informações suas. O processo é progressivo: primeiro o score, depois o interesse mútuo, e só então os dados completos são compartilhados."
  },
  {
    q: "Posso excluir minha conta?",
    a: "Sim, a qualquer momento. Envie um email para lgpd@whyme.app solicitando a exclusão dos seus dados. Processamos todas as solicitações em até 15 dias úteis, conforme a LGPD. Você também pode solicitar correção, portabilidade ou revogação do consentimento."
  },
  {
    q: "Como as empresas criam o perfil ideal da vaga?",
    a: "As empresas definem o perfil OCEAN ideal para cada vaga através de sliders no dashboard. Cada dimensão (O, C, E, A, N) pode ser ajustada de 0 a 100. Por exemplo, uma vaga de liderança pode priorizar alta Extroversão e baixo Neuroticismo, enquanto uma vaga técnica pode priorizar alta Conscienciosidade. O sistema automaticamente encontra candidatos com perfis compatíveis."
  },
  {
    q: "O que é o ORBITA?",
    a: "ORBITA é a visualização em grafo dos matches. No candidato, as empresas compatíveis orbitam ao redor do seu perfil. Na empresa, os candidatos orbitam ao redor de cada vaga. É uma forma intuitiva de visualizar o ecossistema de matches e explorar conexões."
  },
  {
    q: "Quanto tempo leva o processo?",
    a: "O questionário OCEAN leva cerca de 5 minutos. Após completá-lo, o sistema processa os matches automaticamente e você recebe uma notificação quando encontrar vagas compatíveis. Para empresas, o dashboard mostra os matches em tempo real assim que candidatos completam o questionário."
  },
]

function FaqAccordion({ item, isOpen, onClick }: { item: FaqItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-zinc-900/50"
      >
        <span className="pr-4 text-sm font-medium text-zinc-100">{item.q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">Whyme</Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Entrar</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold">Perguntas Frequentes</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tire suas dúvidas sobre o Whyme, o modelo OCEAN e como funciona o match.
        </p>

        <div className="mt-10 divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/50">
          {FAQS.map((faq, i) => (
            <FaqAccordion
              key={i}
              item={faq}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-400">Ainda tem dúvidas?</p>
          <p className="mt-1 text-sm text-zinc-500">
            Fale conosco pelo email{" "}
            <a href="mailto:lgpd@whyme.app" className="text-blue-400 hover:underline">lgpd@whyme.app</a>
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors">Política de Privacidade</Link>
            <span className="text-zinc-700">·</span>
            <Link href="/register" className="text-blue-400 hover:underline">Criar conta</Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
          <span className="text-sm text-zinc-600">Whyme © 2026</span>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacidade</Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
