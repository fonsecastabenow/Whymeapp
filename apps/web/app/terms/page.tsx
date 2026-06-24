import Link from "next/link"
import { PublicLayout } from "@/components/layouts/public-layout"

export default function TermsPage() {
  return (
    <PublicLayout>
      <span className="eyebrow">Legal</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight">
        Termos de <span className="text-gradient-gold">Serviço</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: Maio de 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        {[
          {
            title: "1. Aceitação dos Termos",
            content: "Ao acessar ou usar a plataforma WHY ME?, você concorda com estes Termos de Serviço. Se não concordar com qualquer parte, não use nossos serviços.",
          },
          {
            title: "3. Cadastro e Conta",
            content: "Para usar a plataforma, você deve criar uma conta com informações verdadeiras. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades na sua conta. Podemos suspender ou encerrar contas que violem estes termos.",
          },
          {
            title: "4. Uso para Candidatos",
            content: "Candidatos podem criar perfil gratuitamente, responder ao questionário OCEAN e ser encontrados por empresas compatíveis. O candidato controla o que é compartilhado através do consentimento granular. Nenhum dado pessoal é compartilhado sem autorização explícita.",
          },
          {
            title: "5. Uso para Empresas",
            content: "Empresas podem cadastrar vagas, definir perfis OCEAN ideais e visualizar candidatos compatíveis. O acesso aos dados dos candidatos é progressivo e baseado em consentimento. Empresas concordam em não usar os dados para fins diferentes do processo seletivo.",
          },
          {
            title: "6. Propriedade Intelectual",
            content: "O candidato mantém a propriedade dos seus dados pessoais e perfil OCEAN. A empresa mantém a propriedade das suas vagas e descrições. O WHY ME? é proprietário da plataforma, algoritmos de matching e dados anonimizados agregados.",
          },
          {
            title: "7. Limitação de Responsabilidade",
            content: "O WHY ME? atua como plataforma de conexão, não garantindo resultados específicos de contratação. Não nos responsabilizamos por decisões de contratação tomadas com base nos matches. A plataforma é fornecida \"como está\", sem garantias de disponibilidade ininterrupta.",
          },
          {
            title: "8. Cancelamento e Exclusão",
            content: "Você pode cancelar sua conta a qualquer momento. Candidatos podem solicitar exclusão dos dados via lgpd@whyme.app. Após o cancelamento, seus dados serão removidos conforme nossa política de retenção.",
          },
          {
            title: "9. Alterações nos Termos",
            content: "Podemos atualizar estes termos periodicamente. Notificaremos usuários sobre mudanças significativas por email ou na plataforma. O uso continuado após as alterações constitui aceitação.",
          },
        ].map((section) => (
          <section key={section.title} className="glass-card rounded-xl p-6">
            <h2 className="mb-3 text-base font-bold text-foreground">{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}

        <section className="glass-card rounded-xl p-6">
          <h2 className="mb-3 text-base font-bold text-foreground">2. Definições</h2>
          <ul className="space-y-2 pl-4 list-disc">
            <li><strong className="text-foreground">Plataforma:</strong> WHY ME?, serviço de matching baseado em perfil OCEAN.</li>
            <li><strong className="text-foreground">Candidato:</strong> Usuário que cria perfil e busca oportunidades.</li>
            <li><strong className="text-foreground">Empresa:</strong> Usuário que cadastra vagas e busca candidatos.</li>
            <li><strong className="text-foreground">Match:</strong> Compatibilidade identificada entre candidato e vaga.</li>
          </ul>
        </section>

        <section className="glass-card rounded-xl p-6">
          <h2 className="mb-3 text-base font-bold text-foreground">10. Contato</h2>
          <p>
            Dúvidas sobre estes termos:{" "}
            <a href="mailto:lgpd@whyme.app" className="text-[#3AB0FF] hover:underline">lgpd@whyme.app</a>
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}
