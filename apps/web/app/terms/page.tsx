import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">Whyme</Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Entrar</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold">Termos de Serviço</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: Maio de 2026</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar a plataforma Whyme, você concorda com estes Termos de Serviço. 
              Se não concordar com qualquer parte, não use nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">2. Definições</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong className="text-zinc-300">Plataforma:</strong> Whyme, serviço de matching de candidatos e vagas baseado em perfil OCEAN.</li>
              <li><strong className="text-zinc-300">Candidato:</strong> Usuário que cria perfil e busca oportunidades.</li>
              <li><strong className="text-zinc-300">Empresa:</strong> Usuário que cadastra vagas e busca candidatos.</li>
              <li><strong className="text-zinc-300">Match:</strong> Compatibilidade identificada entre candidato e vaga.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">3. Cadastro e Conta</h2>
            <p>Para usar a plataforma, você deve criar uma conta com informações verdadeiras. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades na sua conta. Podemos suspender ou encerrar contas que violem estes termos.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">4. Uso para Candidatos</h2>
            <p>
              Candidatos podem criar perfil gratuitamente, responder ao questionário OCEAN e ser encontrados 
              por empresas compatíveis. O candidato controla o que é compartilhado com empresas através 
              do consentimento granular. Nenhum dado pessoal é compartilhado sem autorização explícita.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">5. Uso para Empresas</h2>
            <p>
              Empresas podem cadastrar vagas, definir perfis OCEAN ideais e visualizar candidatos compatíveis. 
              O acesso aos dados dos candidatos é progressivo e baseado em consentimento. 
              Empresas concordam em não usar os dados para fins diferentes do processo seletivo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">6. Propriedade Intelectual</h2>
            <p>
              O candidato mantém a propriedade dos seus dados pessoais e perfil OCEAN. 
              A empresa mantém a propriedade das suas vagas e descrições. 
              A Whyme é proprietária da plataforma, algoritmos de matching e dados anonimizados agregados.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">7. Limitação de Responsabilidade</h2>
            <p>
              A Whyme atua como plataforma de conexão, não garantindo resultados específicos de contratação. 
              Não nos responsabilizamos por decisões de contratação tomadas com base nos matches. 
              A plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">8. Cancelamento e Exclusão</h2>
            <p>
              Você pode cancelar sua conta a qualquer momento. Candidatos podem solicitar exclusão 
              dos dados via lgpd@whyme.app. Após o cancelamento, seus dados serão removidos 
              conforme nossa política de retenção.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">9. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes termos periodicamente. Notificaremos usuários sobre mudanças 
              significativas por email ou na plataforma. O uso continuado após as alterações constitui aceitação.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-zinc-100">10. Contato</h2>
            <p>
              Dúvidas sobre estes termos: <a href="mailto:lgpd@whyme.app" className="text-blue-400 hover:underline">lgpd@whyme.app</a>
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
          <span className="text-sm text-zinc-600">Whyme © 2026</span>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacidade</Link>
            <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
