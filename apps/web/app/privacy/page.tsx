"use client"

import Link from "next/link"

const sections = [
  {
    id: "introducao",
    title: "1. Introdução",
    content: (
      <>
        <p>
          A <strong className="text-foreground">Whyme</strong> é uma plataforma de recrutamento baseada
          em valores e perfil comportamental (OCEAN), que conecta candidatos a empresas de forma
          ética, transparente e segura.
        </p>
        <p className="mt-3">
          Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos
          os dados pessoais dos nossos usuários, em conformidade com a{" "}
          <strong className="text-foreground">
            Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)
          </strong>
          .
        </p>
        <p className="mt-3">
          Ao utilizar a plataforma Whyme, você confirma que leu, entendeu e concorda com os termos
          desta política. Caso não concorde, não utilize os serviços.
        </p>
      </>
    ),
  },
  {
    id: "dados-coletados",
    title: "2. Dados Coletados",
    content: (
      <>
        <p className="mb-4">
          Os dados coletados variam conforme o perfil do usuário na plataforma:
        </p>

        <div className="rounded-xl border border-[#3AB0FF]/10 overflow-hidden mb-4">
          <div className="bg-[rgba(16,34,68,0.7)] px-5 py-3 border-b border-[#3AB0FF]/10">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Candidatos
            </span>
          </div>
          <div className="divide-y divide-[#3AB0FF]/10">
            {[
              ["Nome completo", "Identificação do titular"],
              ["Endereço de e-mail", "Login, comunicações e notificações"],
              ["Número de telefone", "Contato opcional"],
              ["Currículo / experiências profissionais", "Análise de compatibilidade com vagas"],
              ["Habilidades (skills) declaradas", "Match com requisitos das vagas"],
              ["Respostas ao Questionário OCEAN", "Cálculo do perfil comportamental"],
              ["Score OCEAN (5 dimensões)", "Compatibilidade anônima com empresas"],
              ["Histórico de candidaturas", "Acompanhamento do processo seletivo"],
            ].map(([dado, finalidade]) => (
              <div key={dado} className="grid grid-cols-2 px-5 py-3 text-sm">
                <span className="text-foreground/90">{dado}</span>
                <span className="text-muted-foreground/70">{finalidade}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#3AB0FF]/10 overflow-hidden">
          <div className="bg-[rgba(16,34,68,0.7)] px-5 py-3 border-b border-[#3AB0FF]/10">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Empresas
            </span>
          </div>
          <div className="divide-y divide-[#3AB0FF]/10">
            {[
              ["Razão social e nome fantasia", "Identificação do contratante"],
              ["CNPJ", "Validação legal da empresa"],
              ["E-mail corporativo e senha", "Autenticação na plataforma"],
              ["Dados do responsável (nome, cargo)", "Ponto de contato"],
              ["Descrições de vagas e requisitos", "Matching com candidatos"],
            ].map(([dado, finalidade]) => (
              <div key={dado} className="grid grid-cols-2 px-5 py-3 text-sm">
                <span className="text-foreground/90">{dado}</span>
                <span className="text-muted-foreground/70">{finalidade}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    id: "consentimento",
    title: "3. Consentimento Granular",
    content: (
      <>
        <p>
          A Whyme foi projetada com <strong className="text-foreground">privacidade desde a origem
          (privacy by design)</strong>. O candidato tem controle explícito sobre o que é
          compartilhado:
        </p>

        <ul className="mt-4 space-y-3">
          {[
            {
              label: "O score OCEAN é o único dado comportamental transmitido às empresas.",
              desc: "As respostas brutas ao questionário nunca saem da plataforma.",
            },
            {
              label: "Dados pessoais sensíveis (nome, e-mail, telefone) jamais são revelados à empresa sem autorização explícita.",
              desc: "A empresa só tem acesso à identidade do candidato se ambos manifestarem interesse (match bilateral confirmado).",
            },
            {
              label: "Skills e experiências são compartilhadas somente mediante consentimento.",
              desc: "Você pode configurar quais informações deseja incluir no processo seletivo.",
            },
            {
              label: "Comunicações sobre vagas compatíveis são opcionais.",
              desc: "Você pode ativar ou desativar notificações a qualquer momento.",
            },
          ].map((item) => (
            <li key={item.label} className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <div>
                <span className="text-foreground/90 text-sm font-medium">{item.label}</span>
                <p className="text-muted-foreground/70 text-sm mt-0.5">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted-foreground">
          O gerenciamento de consentimentos está disponível em{" "}
          <Link href="/privacy/consent" className="text-[#3AB0FF] hover:text-[#3AB0FF]/80 underline underline-offset-2">
            Configurações de Privacidade
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "compartilhamento",
    title: "4. Compartilhamento com Empresas",
    content: (
      <>
        <p>
          A Whyme adota um modelo de compartilhamento mínimo e progressivo:
        </p>

        <div className="mt-4 space-y-3">
          {[
            {
              etapa: "Etapa 1 — Triagem",
              cor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
              desc: "A empresa visualiza apenas o score OCEAN e as skills declaradas. Nenhum dado de identificação é transmitido.",
            },
            {
              etapa: "Etapa 2 — Interesse mútuo",
              cor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
              desc: "Quando há match bilateral (candidato e empresa demonstram interesse), a Whyme notifica ambos. O contato ainda é intermediado pela plataforma.",
            },
            {
              etapa: "Etapa 3 — Consentimento explícito",
              cor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
              desc: "O candidato pode, voluntariamente, autorizar o compartilhamento de dados de contato (nome, e-mail) para avançar no processo seletivo.",
            },
          ].map((item) => (
            <div key={item.etapa} className="rounded-xl border border-[#3AB0FF]/10 p-5">
              <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${item.cor} mb-2`}>
                {item.etapa}
              </span>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground/70">
          A Whyme <strong className="text-foreground/85">não vende, não aluga e não cede</strong> dados
          pessoais a terceiros para fins comerciais. Parceiros de infraestrutura (servidores,
          e-mail transacional) têm acesso restrito ao estritamente necessário e estão sujeitos
          a contratos de confidencialidade.
        </p>
      </>
    ),
  },
  {
    id: "retencao",
    title: "5. Retenção de Dados",
    content: (
      <>
        <p>
          Os dados são armazenados pelo período mínimo necessário para a prestação dos serviços:
        </p>

        <div className="mt-4 rounded-xl border border-[#3AB0FF]/10 overflow-hidden">
          <div className="divide-y divide-[#3AB0FF]/10">
            {[
              ["Conta ativa", "Enquanto a conta existir e houver acesso nos últimos 24 meses"],
              ["Inatividade", "2 anos após o último login — dados são anonimizados automaticamente"],
              ["Solicitação de exclusão", "Exclusão em até 15 dias úteis após a solicitação"],
              ["Obrigações legais", "Dados fiscais e contratuais são mantidos conforme exigência legal (5 anos)"],
            ].map(([prazo, descricao]) => (
              <div key={prazo} className="grid grid-cols-2 gap-4 px-5 py-4 text-sm">
                <span className="text-foreground/90 font-medium">{prazo}</span>
                <span className="text-muted-foreground/70">{descricao}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground/70">
          Após o prazo de retenção, os dados são excluídos ou anonimizados de forma irreversível,
          impossibilitando a reidentificação do titular.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "6. Direitos do Titular",
    content: (
      <>
        <p className="mb-4">
          Nos termos da LGPD (Art. 18), você possui os seguintes direitos sobre seus dados pessoais:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              direito: "Acesso",
              desc: "Solicitar confirmação da existência de tratamento e uma cópia dos seus dados.",
              icon: "🔍",
            },
            {
              direito: "Correção",
              desc: "Corrigir dados incompletos, inexatos ou desatualizados.",
              icon: "✏️",
            },
            {
              direito: "Exclusão",
              desc: "Solicitar a eliminação dos dados tratados com base no seu consentimento.",
              icon: "🗑️",
            },
            {
              direito: "Portabilidade",
              desc: "Receber seus dados em formato estruturado e interoperável.",
              icon: "📦",
            },
            {
              direito: "Revogação do consentimento",
              desc: "Retirar o consentimento a qualquer momento, sem custo.",
              icon: "🚫",
            },
            {
              direito: "Oposição",
              desc: "Opor-se ao tratamento realizado com fundamento em interesse legítimo.",
              icon: "✋",
            },
          ].map((item) => (
            <div key={item.direito} className="rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.7)]/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-semibold text-foreground/90">{item.direito}</span>
              </div>
              <p className="text-sm text-muted-foreground/70">{item.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
          <a href="mailto:lgpd@whyme.app" className="text-[#3AB0FF] hover:text-[#3AB0FF]/80 underline underline-offset-2">
            lgpd@whyme.app
          </a>
          . Responderemos em até <strong className="text-foreground/85">15 dias úteis</strong>.
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "7. Segurança",
    content: (
      <>
        <p className="mb-4">
          A Whyme adota medidas técnicas e organizacionais adequadas para proteger seus dados:
        </p>

        <ul className="space-y-2">
          {[
            "Comunicações protegidas por TLS/HTTPS em trânsito",
            "Senhas armazenadas com hash bcrypt — nunca em texto plano",
            "Autenticação via JWT com expiração configurada",
            "Acesso ao banco de dados restrito por lista de controle de acesso (ACL)",
            "Dados sensíveis criptografados em repouso",
            "Auditoria de acessos e logs de eventos críticos",
            "Equipe com acesso mínimo necessário (princípio do menor privilégio)",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm">
              <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-foreground/85">{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted-foreground/70">
          Em caso de incidente de segurança que possa acarretar risco relevante aos titulares,
          comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os usuários afetados
          no prazo estabelecido pela LGPD.
        </p>
      </>
    ),
  },
  {
    id: "contato",
    title: "8. Contato e Encarregado (DPO)",
    content: (
      <>
        <p>
          Para exercer seus direitos, tirar dúvidas ou enviar solicitações relacionadas ao
          tratamento de dados pessoais, entre em contato com nosso Encarregado de Dados (DPO):
        </p>

        <div className="mt-4 rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.7)]/50 p-5 space-y-2 text-sm">
          <div className="flex gap-3">
            <span className="text-muted-foreground/70 w-20 shrink-0">E-mail</span>
            <a href="mailto:lgpd@whyme.app" className="text-[#3AB0FF] hover:text-[#3AB0FF]/80 underline underline-offset-2">
              lgpd@whyme.app
            </a>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground/70 w-20 shrink-0">Empresa</span>
            <span className="text-foreground/90">Whyme Tecnologia Ltda.</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground/70 w-20 shrink-0">Prazo</span>
            <span className="text-foreground/90">Resposta em até 15 dias úteis</span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "atualizacoes",
    title: "9. Atualizações desta Política",
    content: (
      <>
        <p>
          Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças
          nos nossos serviços, na legislação ou nas práticas de tratamento de dados.
        </p>
        <p className="mt-3">
          Sempre que houver alterações relevantes, você será notificado com antecedência adequada
          por e-mail e/ou aviso na plataforma. A data da última atualização sempre estará indicada
          no topo desta página.
        </p>
        <p className="mt-3 text-sm text-muted-foreground/70">
          O uso continuado dos serviços após a vigência das alterações implica concordância com
          a política atualizada.
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground/85">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground/85 transition-colors mb-8"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao início
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-400">
              LGPD
            </span>
            <span className="text-xs text-muted-foreground/50">Lei nº 13.709/2018</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground">
            Última atualização: <span className="text-foreground/85">2 de maio de 2026</span>
          </p>
        </div>

        {/* Índice */}
        <nav className="mb-12 rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.7)]/50 p-5">
          <p className="eyebrow mb-3">Índice</p>
          <ol className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 pb-3 border-b border-[#3AB0FF]/10">
                {s.title}
              </h2>
              <div className="text-muted-foreground leading-relaxed">{s.content}</div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.7)]/50 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Quer revisar ou atualizar suas preferências de privacidade?
          </p>
          <Link
            href="/privacy/consent"
            className="inline-flex items-center gap-2 rounded-lg border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.5)] hover:bg-[#3AB0FF]/10 hover:border-[#3AB0FF]/30 px-5 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            Gerenciar Consentimentos
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  )
}
