"use client"

import { useState } from "react"
import Link from "next/link"
import { PublicLayout } from "@/components/layouts/public-layout"

interface FaqItem {
  q: string
  a: string
}

const FAQS: FaqItem[] = [
  {
    q: "Como funciona o modelo OCEAN?",
    a: "OCEAN é um modelo psicológico que mede 5 traços da personalidade: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo. Você responde um questionário de 30 perguntas em formato conversacional (leva cerca de 5 minutos), e nosso sistema calcula seu perfil OCEAN. As empresas definem o perfil ideal para cada vaga, e o WHY ME? encontra os melhores matches automaticamente."
  },
  {
    q: "Quanto custa?",
    a: "Para candidatos, o WHY ME? é completamente gratuito. Você cria seu perfil, responde o questionário e fica visível para empresas compatíveis sem pagar nada. Para empresas, oferecemos planos de acesso à base ranqueada de candidatos. Entre em contato para saber mais sobre os planos disponíveis."
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Seguimos a LGPD (Lei Geral de Proteção de Dados) rigorosamente. Seus dados pessoais (nome, email, telefone) nunca são compartilhados com empresas sem sua autorização explícita. As empresas veem apenas seu score OCEAN e as skills que você optou por compartilhar. Você pode solicitar a exclusão dos seus dados a qualquer momento."
  },
  {
    q: "Como as empresas usam meu perfil?",
    a: "Quando você completa o questionário OCEAN, seu perfil é comparado com o perfil ideal das vagas abertas. Se houver compatibilidade acima do threshold definido, um match é criado. A empresa vê seu score de compatibilidade e, conforme seu consentimento, pode acessar mais informações suas."
  },
  {
    q: "Posso excluir minha conta?",
    a: "Sim, a qualquer momento. Envie um email para lgpd@whyme.app solicitando a exclusão dos seus dados. Processamos todas as solicitações em até 15 dias úteis, conforme a LGPD."
  },
  {
    q: "Como as empresas criam o perfil ideal da vaga?",
    a: "As empresas definem o perfil OCEAN ideal para cada vaga através de sliders no dashboard. Cada dimensão (O, C, E, A, N) pode ser ajustada de 0 a 100. O sistema automaticamente encontra candidatos com perfis compatíveis."
  },
  {
    q: "O que é o ORBITA?",
    a: "ORBITA é a visualização em grafo dos matches. No candidato, as empresas compatíveis orbitam ao redor do seu perfil. Na empresa, os candidatos orbitam ao redor de cada vaga. É uma forma intuitiva de visualizar o ecossistema de matches."
  },
  {
    q: "Quanto tempo leva o processo?",
    a: "O questionário OCEAN leva cerca de 5 minutos. Após completá-lo, o sistema processa os matches automaticamente e você recebe uma notificação quando encontrar vagas compatíveis."
  },
]

function FaqAccordion({ item, isOpen, onClick }: { item: FaqItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-[#3AB0FF]/10 last:border-b-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#3AB0FF]/5"
      >
        <span className="pr-4 text-sm font-medium text-foreground">{item.q}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#3AB0FF] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "400px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
      </div>
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <PublicLayout>
      <div className="mb-10">
        <span className="eyebrow">Suporte</span>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Perguntas <span className="text-gradient-gold">Frequentes</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Tire suas dúvidas sobre o WHY ME?, o modelo OCEAN e como funciona o match.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {FAQS.map((faq, i) => (
          <FaqAccordion
            key={i}
            item={faq}
            isOpen={openIndex === i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      <div className="mt-10 glass-card rounded-2xl p-8 text-center">
        <p className="text-sm font-medium text-foreground">Ainda tem dúvidas?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Fale conosco pelo email{" "}
          <a href="mailto:lgpd@whyme.app" className="text-[#3AB0FF] hover:underline">lgpd@whyme.app</a>
        </p>
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
            Política de Privacidade
          </Link>
          <span className="text-[#3AB0FF]/30">·</span>
          <Link href="/register" className="text-[#3AB0FF] hover:underline">Criar conta</Link>
        </div>
      </div>
    </PublicLayout>
  )
}
